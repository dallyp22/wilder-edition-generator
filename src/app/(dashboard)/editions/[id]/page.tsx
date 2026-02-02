"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Place, TemplateSelection, WeekMatch } from "@/lib/types";
import { TemplateVersion } from "@/lib/config/weekly-themes";
import TemplateCard from "@/components/TemplateCard";
import SummaryCards from "@/components/SummaryCards";
import ResultsTable from "@/components/ResultsTable";
import WeeklyPlan from "@/components/WeeklyPlan";
import ExportButton from "@/components/ExportButton";
import { ArrowLeft, Loader2 } from "lucide-react";

interface EditionData {
  id: string;
  city: string;
  state: string;
  templateVersion: string;
  templateSelection: TemplateSelection | null;
  placeCount: number;
  status: string;
  createdAt: string;
  places: Partial<Place>[];
  weekMatches: WeekMatch[];
}

export default function EditionViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [edition, setEdition] = useState<EditionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/editions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load edition");
        return res.json();
      })
      .then((data) => setEdition(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <span className="ml-2 text-stone-500">Loading edition...</span>
      </div>
    );
  }

  if (error || !edition) {
    return (
      <div className="space-y-4">
        <Link
          href="/editions"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editions
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error || "Edition not found"}</p>
        </div>
      </div>
    );
  }

  const templateVersion = edition.templateVersion as TemplateVersion;
  const dateStr = new Date(edition.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/editions"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Editions
          </Link>
          <h2 className="text-2xl font-bold text-stone-900">
            {edition.city}, {edition.state}
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            {edition.places.length} places — Generated {dateStr}
          </p>
        </div>
        <ExportButton
          places={edition.places}
          city={edition.city}
          state={edition.state}
          templateVersion={templateVersion}
          weekMatches={edition.weekMatches}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {edition.templateSelection && (
            <TemplateCard template={edition.templateSelection} />
          )}
        </div>
        <div className="lg:col-span-2">
          <SummaryCards places={edition.places} />
        </div>
      </div>

      <WeeklyPlan
        templateVersion={templateVersion}
        places={edition.places}
        city={edition.city}
        weekMatches={edition.weekMatches}
      />

      <ResultsTable places={edition.places} />
    </div>
  );
}
