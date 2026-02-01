"use client";

import { useState } from "react";
import { Place, WeekMatch } from "@/lib/types";
import { TemplateVersion } from "@/lib/config/weekly-themes";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  places: Partial<Place>[];
  city: string;
  state: string;
  templateVersion: TemplateVersion;
  weekMatches?: WeekMatch[];
}

export default function ExportButton({
  places,
  city,
  state,
  templateVersion,
  weekMatches,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places, city, state, templateVersion, weekMatches }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      const contentDisposition = res.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download =
        filenameMatch?.[1] || `WilderSeasons_${city}_${state}.xlsx`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || places.length === 0}
      className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {exporting ? "Exporting..." : "Download Excel"}
    </button>
  );
}
