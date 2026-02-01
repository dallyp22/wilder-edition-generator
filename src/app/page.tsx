"use client";

import { useState, useCallback } from "react";
import { Place, TemplateSelection, StepProgress, PipelineStep } from "@/lib/types";
import { CATEGORIES } from "@/lib/config/categories";
import { TemplateVersion } from "@/lib/config/weekly-themes";
import CityInput from "@/components/CityInput";
import PipelineProgress from "@/components/PipelineProgress";
import TemplateCard from "@/components/TemplateCard";
import SummaryCards from "@/components/SummaryCards";
import ResultsTable from "@/components/ResultsTable";
import WeeklyPlan from "@/components/WeeklyPlan";
import ExportButton from "@/components/ExportButton";
import { Leaf, RotateCcw } from "lucide-react";

const INITIAL_STEPS: StepProgress[] = [
  { step: "template", label: "Template Selection", status: "pending" },
  { step: "research", label: "Place Discovery (7 categories)", status: "pending" },
  { step: "enrich", label: "Google Places Enrichment", status: "pending" },
  { step: "validate", label: "Brand Validation", status: "pending" },
  { step: "icons", label: "Icon Assignment", status: "pending" },
  { step: "complete", label: "Compilation", status: "pending" },
];

async function apiCall(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API call failed: ${res.status}`);
  }
  return res.json();
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<StepProgress[]>(INITIAL_STEPS);
  const [template, setTemplate] = useState<TemplateSelection | null>(null);
  const [places, setPlaces] = useState<Partial<Place>[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateVersion>("omaha");
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const updateStep = useCallback(
    (step: PipelineStep, status: StepProgress["status"], detail?: string) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.step === step ? { ...s, status, detail: detail || s.detail } : s
        )
      );
    },
    []
  );

  const handleGenerate = async (
    inputCity: string,
    inputState: string,
    mode: "demo" | "live",
    templateVersion: TemplateVersion
  ) => {
    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setPlaces([]);
    setTemplate(null);
    setCity(inputCity);
    setState(inputState);
    setSelectedTemplate(templateVersion);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending", detail: undefined })));

    try {
      if (mode === "demo") {
        await runDemoMode(inputCity, inputState);
      } else {
        await runLiveMode(inputCity, inputState);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "error", detail: message } : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const runDemoMode = async (inputCity: string, inputState: string) => {
    // Demo uses the single endpoint (fast, no external APIs)
    updateStep("template", "running", "Analyzing city characteristics...");
    await delay(300);

    const data = await apiCall("/api/generate", {
      city: inputCity,
      state: inputState,
      mode: "demo",
    });

    updateStep("template", "completed");
    updateStep("research", "completed", "Sample data loaded");
    updateStep("enrich", "completed", "Sample data pre-enriched");
    updateStep("validate", "completed", "Brand validation complete");
    updateStep("icons", "completed", "Icons applied");
    updateStep("complete", "completed", `${data.places.length} places compiled`);

    setTemplate(data.templateSelection);
    setPlaces(data.places);
    setShowResults(true);
  };

  const runLiveMode = async (inputCity: string, inputState: string) => {
    // Step 1: Template selection (instant)
    updateStep("template", "running", "Analyzing city characteristics...");
    const templateData = await apiCall("/api/generate/template", {
      city: inputCity,
      state: inputState,
    });
    setTemplate(templateData.templateSelection);
    updateStep("template", "completed", templateData.templateSelection.primaryTemplate);

    // Step 2: Research each category individually
    updateStep("research", "running", "Starting place discovery...");
    let allPlaces: Partial<Place>[] = [];

    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      updateStep(
        "research",
        "running",
        `Searching ${cat.name} (${i + 1}/${CATEGORIES.length})...`
      );

      try {
        const resData = await apiCall("/api/generate/research", {
          city: inputCity,
          state: inputState,
          category: cat.id,
        });
        allPlaces = [...allPlaces, ...(resData.places || [])];
      } catch (err) {
        console.error(`Research failed for ${cat.id}:`, err);
        // Continue with other categories
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    allPlaces = allPlaces.filter((p) => {
      const key = (p.name || "").toLowerCase().replace(/[^a-z]/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    updateStep("research", "completed", `${allPlaces.length} places discovered`);

    // Step 3: Enrich in batches of 3 (fits within 10s timeout)
    updateStep("enrich", "running", "Enriching with Google Places...");
    const BATCH_SIZE = 3;
    const enrichedPlaces: Partial<Place>[] = [];

    for (let i = 0; i < allPlaces.length; i += BATCH_SIZE) {
      const batch = allPlaces.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allPlaces.length / BATCH_SIZE);
      updateStep(
        "enrich",
        "running",
        `Enriching batch ${batchNum}/${totalBatches} (${Math.min(i + BATCH_SIZE, allPlaces.length)}/${allPlaces.length} places)...`
      );

      try {
        const enrichData = await apiCall("/api/generate/enrich", {
          places: batch,
        });
        enrichedPlaces.push(...(enrichData.places || batch));
      } catch (err) {
        console.error(`Enrichment failed for batch ${batchNum}:`, err);
        // Use unenriched data as fallback
        enrichedPlaces.push(...batch);
      }
    }

    updateStep("enrich", "completed", `${enrichedPlaces.length} places enriched`);

    // Step 4 & 5: Validate + Icons (single call, pure logic, instant)
    updateStep("validate", "running", "Scoring brand alignment...");
    const finalData = await apiCall("/api/generate/finalize", {
      places: enrichedPlaces,
    });
    updateStep("validate", "completed", "Brand validation complete");

    updateStep("icons", "completed", "Icons applied");
    updateStep(
      "complete",
      "completed",
      `${finalData.places.length} places — ${finalData.summary.recommended} recommended`
    );

    setPlaces(finalData.places);
    setShowResults(true);
  };

  const handleReset = () => {
    setIsLoading(false);
    setShowResults(false);
    setPlaces([]);
    setTemplate(null);
    setError(null);
    setSteps(INITIAL_STEPS);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-700 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">
                Wilder Seasons
              </h1>
              <p className="text-xs text-stone-500">Edition Generator</p>
            </div>
          </div>

          {showResults && (
            <div className="flex items-center gap-3">
              <ExportButton places={places} city={city} state={state} templateVersion={selectedTemplate} />
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                New Edition
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!showResults ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-3">
                Edition Generator
              </h2>
              <p className="text-stone-600 max-w-lg mx-auto">
                Transform city expansion from months of manual research to
                minutes. Enter a city and get a researched, scored, and
                icon-tagged database of family-friendly places.
              </p>
            </div>

            <CityInput onGenerate={handleGenerate} isLoading={isLoading} />

            {isLoading && <PipelineProgress steps={steps} />}

            {error && (
              <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold">Generation Error</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {city}, {state}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {places.length} places discovered and evaluated
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {template && <TemplateCard template={template} />}
              </div>
              <div className="lg:col-span-2">
                <SummaryCards places={places} />
              </div>
            </div>

            {/* Weekly Plan */}
            <WeeklyPlan
              templateVersion={selectedTemplate}
              places={places}
              city={city}
            />

            {/* Results table */}
            <ResultsTable places={places} />
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-stone-400 text-center">
            Wilder Seasons Edition Generator — Helping families create
            meaningful daily rhythms
          </p>
        </div>
      </footer>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
