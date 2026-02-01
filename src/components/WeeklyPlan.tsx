"use client";

import { useState } from "react";
import { Place, WeekMatch } from "@/lib/types";
import {
  WeekTheme,
  TemplateVersion,
  WEEKLY_THEMES,
  TEMPLATE_VERSION_LABELS,
  getSeason,
} from "@/lib/config/weekly-themes";
import { Calendar, Snowflake, Sun, Leaf, Flower2, ChevronDown, ChevronUp } from "lucide-react";

interface WeeklyPlanProps {
  templateVersion: TemplateVersion;
  places: Partial<Place>[];
  city: string;
  weekMatches?: WeekMatch[];
}

const SEASON_CONFIG = {
  winter: { label: "Winter", icon: Snowflake, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", weeks: "Weeks 1–9, 49–52" },
  spring: { label: "Spring", icon: Flower2, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", weeks: "Weeks 10–22" },
  summer: { label: "Summer", icon: Sun, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", weeks: "Weeks 23–35" },
  fall: { label: "Fall", icon: Leaf, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", weeks: "Weeks 36–48" },
};

function matchPlaceToWeek(
  weekTheme: WeekTheme,
  places: Partial<Place>[]
): Partial<Place> | null {
  const title = weekTheme.title.toLowerCase();
  const ref = weekTheme.referencePlaceNote.toLowerCase();

  // Score each place by how well it fits this week's theme
  const scored = places
    .filter((p) => p.validationStatus !== "REJECT")
    .map((p) => {
      let score = 0;
      const name = (p.name || "").toLowerCase();
      const desc = (p.shortDescription || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();

      // Direct week suggestion match
      if (p.weekSuggestions?.includes(weekTheme.week)) score += 100;

      // Category matching to theme keywords
      if (title.includes("farm") && cat === "farm") score += 30;
      if (title.includes("garden") && (cat === "garden" || cat === "nature")) score += 30;
      if (title.includes("zoo") && (cat === "farm" || name.includes("zoo"))) score += 30;
      if (title.includes("library") && cat === "library") score += 30;
      if (title.includes("museum") && cat === "museum") score += 30;
      if ((title.includes("craft") || title.includes("art") || title.includes("play")) && cat === "indoor_play") score += 30;
      if (title.includes("nature") || title.includes("trail") || title.includes("prairie")) {
        if (cat === "nature") score += 25;
      }
      if (title.includes("bird") || title.includes("animal") || title.includes("creature")) {
        if (cat === "nature" || cat === "farm") score += 20;
      }
      if ((title.includes("pumpkin") || title.includes("harvest") || title.includes("halloween") || title.includes("christmas") || title.includes("holiday")) && cat === "seasonal") score += 30;
      if ((title.includes("spring") || title.includes("bloom") || title.includes("flower") || title.includes("seed")) && (cat === "garden" || cat === "nature")) score += 20;
      if ((title.includes("water") || title.includes("splash") || title.includes("river") || title.includes("lake")) && cat === "nature") score += 20;
      if ((title.includes("bug") || title.includes("butterfly") || title.includes("insect")) && (cat === "nature" || cat === "garden")) score += 20;
      if (title.includes("cozy") || title.includes("warm") || title.includes("winter") || title.includes("snow") || title.includes("frost")) {
        if (p.winterSpot) score += 15;
      }

      // Name overlap with reference place note
      const nameWords = name.split(/\s+/).filter((w) => w.length > 3);
      for (const word of nameWords) {
        if (ref.includes(word)) score += 10;
      }

      // Brand score bonus
      score += (p.brandScore || 0) / 10;

      return { place: p, score };
    })
    .filter((s) => s.score > 5)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.place || null;
}

export default function WeeklyPlan({
  templateVersion,
  places,
  city,
  weekMatches,
}: WeeklyPlanProps) {
  const [expandedSeason, setExpandedSeason] = useState<string | null>("winter");
  const themes = WEEKLY_THEMES[templateVersion];

  const seasonGroups = [
    { key: "winter", weeks: themes.filter((t) => t.week >= 1 && t.week <= 9) },
    { key: "spring", weeks: themes.filter((t) => t.week >= 10 && t.week <= 22) },
    { key: "summer", weeks: themes.filter((t) => t.week >= 23 && t.week <= 35) },
    { key: "fall", weeks: themes.filter((t) => t.week >= 36 && t.week <= 48) },
    { key: "winter_late", weeks: themes.filter((t) => t.week >= 49 && t.week <= 52) },
  ];

  // Merge late winter into winter
  const displayGroups = [
    { key: "winter", weeks: [...seasonGroups[0].weeks, ...seasonGroups[4].weeks] },
    { key: "spring", weeks: seasonGroups[1].weeks },
    { key: "summer", weeks: seasonGroups[2].weeks },
    { key: "fall", weeks: seasonGroups[3].weeks },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
              52-Week Plan
            </h3>
            <p className="text-xs text-stone-500">
              {TEMPLATE_VERSION_LABELS[templateVersion]} — {city}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {displayGroups.map((group) => {
          const config = SEASON_CONFIG[group.key as keyof typeof SEASON_CONFIG];
          const isOpen = expandedSeason === group.key;
          const SeasonIcon = config.icon;

          return (
            <div key={group.key}>
              <button
                onClick={() => setExpandedSeason(isOpen ? null : group.key)}
                className={`w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                    <SeasonIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-stone-900">
                      {config.label}
                    </span>
                    <span className="text-xs text-stone-400 ml-2">
                      {config.weeks} — {group.weeks.length} weeks
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-4">
                  <div className="space-y-2">
                    {group.weeks.map((theme) => {
                      // Use AI match if available, otherwise fall back to keyword matching
                      const aiMatch = weekMatches?.find((m) => m.week === theme.week);
                      const matched = aiMatch
                        ? places.find((p) => p.name === aiMatch.placeName) || null
                        : matchPlaceToWeek(theme, places);
                      const alternatePlace = aiMatch
                        ? places.find((p) => p.name === aiMatch.alternateName) || null
                        : null;

                      return (
                        <div
                          key={theme.week}
                          className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} ${config.border} border`}
                        >
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-xs font-bold text-stone-600">
                              W{theme.week}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-900">
                              {theme.title}
                            </p>
                            {matched ? (
                              <div>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  <span className="font-medium">{matched.name}</span>
                                  <span className="text-stone-400 ml-1">
                                    {matched.iconString} — Score: {matched.brandScore}
                                  </span>
                                </p>
                                {aiMatch && (
                                  <p className="text-xs text-stone-500 mt-0.5">
                                    {aiMatch.reason}
                                  </p>
                                )}
                                {alternatePlace && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    Alt: <span className="font-medium">{alternatePlace.name}</span>
                                    {aiMatch?.alternateReason ? ` — ${aiMatch.alternateReason}` : ""}
                                  </p>
                                )}
                              </div>
                            ) : aiMatch ? (
                              <div>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  <span className="font-medium">{aiMatch.placeName}</span>
                                </p>
                                <p className="text-xs text-stone-500 mt-0.5">
                                  {aiMatch.reason}
                                </p>
                                {aiMatch.alternateName && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    Alt: {aiMatch.alternateName}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-500 mt-0.5 italic">
                                {theme.referencePlaceNote.length > 80
                                  ? theme.referencePlaceNote.slice(0, 80) + "..."
                                  : theme.referencePlaceNote}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
