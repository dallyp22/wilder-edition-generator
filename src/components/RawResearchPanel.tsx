"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ThemedResearchResult } from "@/lib/agents/themed-research";

interface RawResearchPanelProps {
  results: ThemedResearchResult[];
}

type SourceFilter = "all" | "grok" | "gemini" | "brave";

export default function RawResearchPanel({ results }: RawResearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSource, setActiveSource] = useState<SourceFilter>("all");

  if (results.length === 0) return null;

  const grokResults = results.filter((r) => r.source === "grok");
  const geminiResults = results.filter((r) => r.source === "gemini");
  const braveResults = results.filter((r) => r.source === "brave");
  const sourceCount = [grokResults.length > 0, geminiResults.length > 0, braveResults.length > 0].filter(Boolean).length;

  const filteredResults = activeSource === "all"
    ? results
    : results.filter((r) => r.source === activeSource);

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
      >
        <span>
          Raw Research Data ({results.length} results from {sourceCount} source{sourceCount !== 1 ? "s" : ""})
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-stone-200 px-5 py-4">
          {/* Source filter tabs */}
          <div className="flex gap-2 mb-4">
            {([
              { key: "all" as const, label: `All (${results.length})` },
              { key: "grok" as const, label: `Grok (${grokResults.length})` },
              { key: "gemini" as const, label: `Gemini (${geminiResults.length})` },
              { key: "brave" as const, label: `Brave (${braveResults.length})` },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSource(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeSource === key
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-stone-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-stone-100">
                <tr>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Wk</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Theme</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Place</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Why It Fits</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Cat</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Cost</th>
                  <th className="text-left px-2 py-1.5 text-stone-500 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, i) => (
                  <tr key={i} className="border-t border-stone-100 hover:bg-white">
                    <td className="px-2 py-1.5 text-stone-400">{r.week || "\u2014"}</td>
                    <td className="px-2 py-1.5 text-stone-600 max-w-[120px] truncate">
                      {r.theme || "\u2014"}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-stone-800 max-w-[160px] truncate">
                      {r.link ? (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          {r.place}
                        </a>
                      ) : (
                        r.place
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-stone-500 max-w-[200px] truncate">
                      {r.whyItFits}
                    </td>
                    <td className="px-2 py-1.5 text-stone-400">{r.category}</td>
                    <td className="px-2 py-1.5 text-stone-400">{r.cost}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.source === "grok"
                            ? "bg-blue-100 text-blue-700"
                            : r.source === "gemini"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-stone-400 mt-2">
            This is the unfiltered research data from all AI sources before Opus curation.
          </p>
        </div>
      )}
    </div>
  );
}
