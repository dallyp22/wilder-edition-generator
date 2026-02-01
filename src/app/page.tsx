"use client";

import { useState } from "react";
import { Place, TemplateSelection, StepProgress, PipelineStep } from "@/lib/types";
import CityInput from "@/components/CityInput";
import PipelineProgress from "@/components/PipelineProgress";
import TemplateCard from "@/components/TemplateCard";
import SummaryCards from "@/components/SummaryCards";
import ResultsTable from "@/components/ResultsTable";
import ExportButton from "@/components/ExportButton";
import { Leaf, RotateCcw } from "lucide-react";

const INITIAL_STEPS: StepProgress[] = [
  { step: "template", label: "Template Selection", status: "pending" },
  { step: "research", label: "Place Discovery", status: "pending" },
  { step: "enrich", label: "Data Enrichment", status: "pending" },
  { step: "validate", label: "Brand Validation", status: "pending" },
  { step: "icons", label: "Icon Assignment", status: "pending" },
  { step: "complete", label: "Compilation", status: "pending" },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<StepProgress[]>(INITIAL_STEPS);
  const [template, setTemplate] = useState<TemplateSelection | null>(null);
  const [places, setPlaces] = useState<Partial<Place>[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const updateStep = (
    step: PipelineStep,
    status: StepProgress["status"],
    detail?: string
  ) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.step === step ? { ...s, status, detail: detail || s.detail } : s
      )
    );
  };

  const handleGenerate = async (
    inputCity: string,
    inputState: string,
    mode: "demo" | "live"
  ) => {
    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setPlaces([]);
    setTemplate(null);
    setCity(inputCity);
    setState(inputState);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending", detail: undefined })));

    try {
      // Animate pipeline steps
      updateStep("template", "running", "Analyzing city characteristics...");
      await delay(400);

      updateStep("template", "completed", "Template selected");
      updateStep("research", "running", `Discovering places in ${inputCity}...`);
      await delay(600);

      updateStep("research", "completed", "Places discovered");
      updateStep(
        "enrich",
        "running",
        mode === "demo"
          ? "Using sample data..."
          : "Enriching with Google Places..."
      );
      await delay(400);

      updateStep("enrich", "completed", "Data enriched");
      updateStep("validate", "running", "Scoring brand alignment...");

      // Make the API call
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: inputCity, state: inputState, mode }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const data = await res.json();

      updateStep("validate", "completed", "Brand validation complete");
      updateStep("icons", "running", "Assigning icons...");
      await delay(300);

      updateStep("icons", "completed", "Icons applied");
      updateStep("complete", "running", "Compiling results...");
      await delay(300);

      updateStep(
        "complete",
        "completed",
        `${data.places.length} places compiled`
      );

      setTemplate(data.templateSelection);
      setPlaces(data.places);
      setShowResults(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);

      // Mark current running step as error
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "error", detail: message } : s
        )
      );
    } finally {
      setIsLoading(false);
    }
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
              <ExportButton places={places} city={city} state={state} />
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
        {/* Input or results */}
        {!showResults ? (
          <div className="space-y-6">
            {/* Hero */}
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
            {/* City header */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {city}, {state}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {places.length} places discovered and evaluated
              </p>
            </div>

            {/* Template + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {template && <TemplateCard template={template} />}
              </div>
              <div className="lg:col-span-2">
                <SummaryCards places={places} />
              </div>
            </div>

            {/* Results table */}
            <ResultsTable places={places} />
          </div>
        )}
      </main>

      {/* Footer */}
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
