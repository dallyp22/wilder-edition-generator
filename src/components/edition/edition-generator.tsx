"use client";

import { useState, useCallback } from "react";
import { Place, TemplateSelection, StepProgress, PipelineStep, WeekMatch } from "@/lib/types";
import { CATEGORIES } from "@/lib/config/categories";
import { TemplateVersion } from "@/lib/config/weekly-themes";
import CityInput from "@/components/CityInput";
import PipelineProgress from "@/components/PipelineProgress";
import TemplateCard from "@/components/TemplateCard";
import SummaryCards from "@/components/SummaryCards";
import ResultsTable from "@/components/ResultsTable";
import WeeklyPlan from "@/components/WeeklyPlan";
import ExportButton from "@/components/ExportButton";
import { RotateCcw } from "lucide-react";

const INITIAL_STEPS: StepProgress[] = [
  { step: "template", label: "Template Selection", status: "pending" },
  { step: "discover", label: "Multi-Source Discovery (Brave + Gemini + Grok)", status: "pending" },
  { step: "curate", label: "AI Curation (Claude reviews places)", status: "pending" },
  { step: "enrich", label: "Google Places Validation", status: "pending" },
  { step: "validate", label: "Brand Scoring + Icons", status: "pending" },
  { step: "match", label: "Week Matching + Anti-Repeat", status: "pending" },
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

export function EditionGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<StepProgress[]>(INITIAL_STEPS);
  const [template, setTemplate] = useState<TemplateSelection | null>(null);
  const [places, setPlaces] = useState<Partial<Place>[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateVersion>("omaha");
  const [error, setError] = useState<string | null>(null);
  const [weekMatches, setWeekMatches] = useState<WeekMatch[]>([]);
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
    setWeekMatches([]);
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
    updateStep("template", "running", "Analyzing city characteristics...");
    await delay(300);

    const data = await apiCall("/api/generate", {
      city: inputCity,
      state: inputState,
      mode: "demo",
    });

    updateStep("template", "completed");
    updateStep("discover", "completed", "Sample data loaded");
    updateStep("curate", "completed", "Sample data pre-curated");
    updateStep("enrich", "completed", "Sample data pre-enriched");
    updateStep("validate", "completed", "Brand scoring complete");
    updateStep("complete", "completed", `${data.places.length} places compiled`);

    setTemplate(data.templateSelection);
    setPlaces(data.places);
    setShowResults(true);
  };

  const runLiveMode = async (inputCity: string, inputState: string) => {
    updateStep("template", "running", "Analyzing city characteristics...");
    const templateData = await apiCall("/api/generate/template", {
      city: inputCity,
      state: inputState,
    });
    setTemplate(templateData.templateSelection);
    updateStep("template", "completed", templateData.templateSelection.primaryTemplate);

    const grokChannels = ["x_parents", "neighborhoods", "local_blogs", "seasonal"] as const;
    const totalSources = CATEGORIES.length + grokChannels.length;
    updateStep("discover", "running", `Searching ${totalSources} sources (Brave + Gemini + Grok)...`);
    let completedSources = 0;

    // Fire 7 category calls (Brave + Gemini) in parallel
    const categoryPromises = CATEGORIES.map(async (cat) => {
      try {
        const resData = await apiCall("/api/generate/discover", {
          city: inputCity,
          state: inputState,
          category: cat.id,
        });
        completedSources++;
        updateStep(
          "discover",
          "running",
          `${completedSources}/${totalSources} sources searched...`
        );
        return resData.places || [];
      } catch (err) {
        console.error(`Discovery failed for ${cat.id}:`, err);
        completedSources++;
        return [];
      }
    });

    // Fire 4 Grok channels in parallel alongside category calls
    const grokPromises = grokChannels.map(async (channel) => {
      try {
        const resData = await apiCall("/api/generate/discover-grok", {
          city: inputCity,
          state: inputState,
          channel,
        });
        completedSources++;
        updateStep(
          "discover",
          "running",
          `${completedSources}/${totalSources} sources searched...`
        );
        return resData.places || [];
      } catch (err) {
        console.error(`Grok discovery failed for ${channel}:`, err);
        completedSources++;
        return [];
      }
    });

    // Wait for all 11 sources
    const [categoryResults, grokResults] = await Promise.all([
      Promise.all(categoryPromises),
      Promise.all(grokPromises),
    ]);
    let rawPlaces = [...categoryResults.flat(), ...grokResults.flat()];

    const seen = new Set<string>();
    rawPlaces = rawPlaces.filter((p: { name?: string }) => {
      const key = (p.name || "").toLowerCase().replace(/[^a-z]/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const grokPlaceCount = grokResults.flat().length;
    const sourceDetail = grokPlaceCount > 0
      ? `${rawPlaces.length} places found (${grokPlaceCount} from Grok)`
      : `${rawPlaces.length} places found from web search`;
    updateStep("discover", "completed", sourceDetail);

    updateStep("curate", "running", `Claude is reviewing ${rawPlaces.length} places...`);
    const CURATION_BATCH_SIZE = 25;
    const curatedPlaces: Partial<Place>[] = [];

    for (let i = 0; i < rawPlaces.length; i += CURATION_BATCH_SIZE) {
      const batch = rawPlaces.slice(i, i + CURATION_BATCH_SIZE);
      const batchNum = Math.floor(i / CURATION_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rawPlaces.length / CURATION_BATCH_SIZE);
      updateStep(
        "curate",
        "running",
        `Claude reviewing batch ${batchNum}/${totalBatches} (${Math.min(i + CURATION_BATCH_SIZE, rawPlaces.length)}/${rawPlaces.length} places)...`
      );

      try {
        const curationData = await apiCall("/api/generate/curate", {
          city: inputCity,
          state: inputState,
          rawPlaces: batch,
        });
        curatedPlaces.push(...(curationData.places || []));
      } catch (err) {
        console.error(`Curation batch ${batchNum} failed:`, err);
        curatedPlaces.push(
          ...batch.map((p: { name: string; category: string; snippet: string; sourceUrl: string }) => ({
            name: p.name,
            category: p.category as Place["category"],
            shortDescription: (p.snippet || "").slice(0, 100),
            city: inputCity,
            state: inputState,
            sourceUrl: p.sourceUrl || "",
            validationStatus: "REVIEW" as const,
          }))
        );
      }
    }

    updateStep("curate", "completed", `${curatedPlaces.length} places accepted by Claude`);

    updateStep("enrich", "running", "Validating with Google Places...");
    const BATCH_SIZE = 3;
    const enrichedPlaces: Partial<Place>[] = [];

    for (let i = 0; i < curatedPlaces.length; i += BATCH_SIZE) {
      const batch = curatedPlaces.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(curatedPlaces.length / BATCH_SIZE);
      updateStep(
        "enrich",
        "running",
        `Validating batch ${batchNum}/${totalBatches} (${Math.min(i + BATCH_SIZE, curatedPlaces.length)}/${curatedPlaces.length})...`
      );

      try {
        const enrichData = await apiCall("/api/generate/enrich", { places: batch });
        enrichedPlaces.push(...(enrichData.places || batch));
      } catch (err) {
        console.error(`Enrichment failed for batch ${batchNum}:`, err);
        enrichedPlaces.push(...batch);
      }
    }

    updateStep("enrich", "completed", `${enrichedPlaces.length} places validated`);

    updateStep("validate", "running", "Scoring brand alignment + applying icons...");
    const finalData = await apiCall("/api/generate/finalize", { places: enrichedPlaces });
    updateStep("validate", "completed", `${finalData.summary.recommended} recommended, ${finalData.summary.consider} consider`);

    setPlaces(finalData.places);

    updateStep("match", "running", "AI matching + enforcing anti-repeat (max 2 uses per place)...");
    try {
      const matchData = await apiCall("/api/generate/match-weeks", {
        places: finalData.places,
        templateVersion: selectedTemplate,
        city: inputCity,
      });
      setWeekMatches(matchData.weekMatches || []);
      updateStep("match", "completed", `52 weeks matched (anti-repeat enforced)`);
    } catch (err) {
      console.error("Week matching failed:", err);
      updateStep("match", "completed", "Week matching skipped (using keyword fallback)");
    }

    updateStep(
      "complete",
      "completed",
      `${finalData.places.length} places — ${finalData.summary.recommended} recommended`
    );

    setShowResults(true);
  };

  const handleReset = () => {
    setIsLoading(false);
    setShowResults(false);
    setPlaces([]);
    setTemplate(null);
    setWeekMatches([]);
    setError(null);
    setSteps(INITIAL_STEPS);
  };

  return (
    <div className="space-y-8">
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {city}, {state}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {places.length} places discovered and evaluated
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton places={places} city={city} state={state} templateVersion={selectedTemplate} weekMatches={weekMatches} />
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                New Edition
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {template && <TemplateCard template={template} />}
            </div>
            <div className="lg:col-span-2">
              <SummaryCards places={places} />
            </div>
          </div>

          <WeeklyPlan
            templateVersion={selectedTemplate}
            places={places}
            city={city}
            weekMatches={weekMatches}
          />

          <ResultsTable places={places} />
        </div>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
