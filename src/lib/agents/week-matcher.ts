import { Place, WeekMatch } from "@/lib/types";
import { WeekTheme, TemplateVersion, WEEKLY_THEMES } from "@/lib/config/weekly-themes";
import { callAI, parseJSONFromResponse, normalizeName } from "@/lib/utils/ai-client";

const MAX_USES_PER_PLACE = 2;

const MATCHER_SYSTEM_PROMPT = `You are a week-matching specialist for Wilder Seasons, a family nature brand that creates 52-week adventure guides for families with young children (ages 0-9).

Your job is to match real local places to weekly themes, understanding the INTENT and SPIRIT of each theme — not just keyword matching.

Matching principles:
- Consider seasonality: outdoor places for spring/summer, indoor for winter
- Match the theme's mood and activity type to the place's character
- Flagship places (zoos, museums, major parks) can anchor multiple weeks
- Prefer higher-scored places when multiple options fit equally
- Reference places in the theme data show the INTENT — find the closest local equivalent
- Every week MUST have a match, even if the fit isn't perfect`;

// ── AI Matching ──

async function aiSuggestMatches(
  places: Partial<Place>[],
  templateVersion: TemplateVersion,
  city: string,
  anthropicKey?: string,
  openaiKey?: string
): Promise<WeekMatch[]> {
  const themes = WEEKLY_THEMES[templateVersion];
  if (!themes) return [];

  const placeLibrary = places
    .filter((p) => p.validationStatus !== "REJECT")
    .map((p) => ({
      name: p.name,
      category: p.category,
      desc: p.shortDescription,
      warm: p.warmWeather,
      winter: p.winterSpot,
      score: p.brandScore,
    }));

  const themeSummary = themes.map((t) => ({
    week: t.week,
    title: t.title,
    ref: t.referencePlaceNote.slice(0, 120),
  }));

  const userPrompt = `You have a library of ${placeLibrary.length} family-friendly places in ${city}. Match each of the 52 weekly themes to the BEST local place from the library.

RULES:
1. Try to use each place at most 2 times across all 52 weeks (the system will enforce this, but try your best)
2. Match by understanding the INTENT and SPIRIT of each theme
3. Consider seasonality: outdoor places (warm=true) for spring/summer, indoor (winter=true) for winter
4. Provide an alternate place for each week (MUST be different from primary)
5. Keep reasons brief (max 80 characters)
6. Winter = weeks 1-9 and 49-52, Spring = weeks 10-22, Summer = weeks 23-35, Fall = weeks 36-48
7. Prefer higher-scored places when multiple options fit equally

PLACE LIBRARY:
${JSON.stringify(placeLibrary)}

WEEKLY THEMES:
${JSON.stringify(themeSummary)}

Return ONLY a valid JSON array. Every week (1-52) MUST have an entry:
[{"week":1,"placeName":"...","reason":"...","alternateName":"...","alternateReason":"..."}, ...]`;

  const response = await callAI(
    MATCHER_SYSTEM_PROMPT,
    userPrompt,
    anthropicKey,
    openaiKey
  );

  return parseJSONFromResponse<WeekMatch[]>(response);
}

// ── Keyword Scoring (fallback matching) ──

function scorePlace(theme: WeekTheme, place: Partial<Place>): number {
  let score = 0;
  const title = theme.title.toLowerCase();
  const ref = theme.referencePlaceNote.toLowerCase();
  const name = (place.name || "").toLowerCase();
  const cat = (place.category || "").toLowerCase();

  if (place.weekSuggestions?.includes(theme.week)) score += 100;

  if (title.includes("farm") && cat === "farm") score += 30;
  if (title.includes("garden") && (cat === "garden" || cat === "nature")) score += 30;
  if (title.includes("zoo") && (cat === "farm" || name.includes("zoo"))) score += 30;
  if (title.includes("library") && cat === "library") score += 30;
  if (title.includes("museum") && cat === "museum") score += 30;
  if ((title.includes("craft") || title.includes("art") || title.includes("play")) && cat === "indoor_play") score += 30;
  if ((title.includes("nature") || title.includes("trail") || title.includes("prairie")) && cat === "nature") score += 25;
  if ((title.includes("bird") || title.includes("animal") || title.includes("creature")) && (cat === "nature" || cat === "farm")) score += 20;
  if ((title.includes("pumpkin") || title.includes("harvest") || title.includes("halloween") || title.includes("christmas") || title.includes("holiday")) && cat === "seasonal") score += 30;
  if ((title.includes("spring") || title.includes("bloom") || title.includes("flower") || title.includes("seed")) && (cat === "garden" || cat === "nature")) score += 20;
  if ((title.includes("water") || title.includes("splash") || title.includes("river") || title.includes("lake")) && cat === "nature") score += 20;
  if ((title.includes("bug") || title.includes("butterfly") || title.includes("insect")) && (cat === "nature" || cat === "garden")) score += 20;
  if ((title.includes("cozy") || title.includes("warm") || title.includes("winter") || title.includes("snow") || title.includes("frost")) && place.winterSpot) score += 15;

  const nameWords = name.split(/\s+/).filter((w) => w.length > 3);
  for (const word of nameWords) {
    if (ref.includes(word)) score += 10;
  }

  score += (place.brandScore || 0) / 10;
  return score;
}

function findBestAvailable(
  theme: WeekTheme,
  places: Partial<Place>[],
  usageCounts: Map<string, number>,
  excludeName: string
): Partial<Place> | null {
  const excludeKey = normalizeName(excludeName);

  const candidates = places
    .filter((p) => {
      if (p.validationStatus === "REJECT") return false;
      const key = normalizeName(p.name || "");
      if (key === excludeKey) return false;
      if ((usageCounts.get(key) || 0) >= MAX_USES_PER_PLACE) return false;
      return true;
    })
    .map((p) => ({ place: p, score: scorePlace(theme, p) }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.place || null;
}

// ── Anti-Repeat Enforcement ──

export function enforceAntiRepeat(
  aiMatches: WeekMatch[],
  places: Partial<Place>[],
  themes: WeekTheme[]
): WeekMatch[] {
  const usageCounts = new Map<string, number>();
  const result: WeekMatch[] = [];
  const validPlaces = places.filter((p) => p.validationStatus !== "REJECT");

  function canUse(name: string): boolean {
    const key = normalizeName(name);
    return (usageCounts.get(key) || 0) < MAX_USES_PER_PLACE;
  }

  function recordUse(name: string) {
    const key = normalizeName(name);
    usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
  }

  // Process in week order
  for (let week = 1; week <= 52; week++) {
    const aiMatch = aiMatches.find((m) => m.week === week);
    const theme = themes.find((t) => t.week === week);
    if (!theme) continue;

    let primaryName = aiMatch?.placeName || "";
    let primaryReason = aiMatch?.reason || "";
    let altName = aiMatch?.alternateName || "";
    let altReason = aiMatch?.alternateReason || "";

    // Enforce primary constraint
    if (!primaryName || !canUse(primaryName)) {
      const replacement = findBestAvailable(theme, validPlaces, usageCounts, altName);
      if (replacement) {
        primaryName = replacement.name || "";
        primaryReason = `Best available fit for "${theme.title}"`;
      }
    }

    // Enforce alternate constraint (must differ from primary)
    const primaryKey = normalizeName(primaryName);
    const altKey = normalizeName(altName);
    if (!altName || !canUse(altName) || altKey === primaryKey) {
      const replacement = findBestAvailable(theme, validPlaces, usageCounts, primaryName);
      if (replacement) {
        altName = replacement.name || "";
        altReason = "Alternate option";
      }
    }

    // Record usage
    if (primaryName) recordUse(primaryName);
    if (altName) recordUse(altName);

    result.push({
      week,
      placeName: primaryName,
      reason: primaryReason,
      alternateName: altName,
      alternateReason: altReason,
    });
  }

  return result;
}

// ── Main Export ──

export async function matchWeeks(
  places: Partial<Place>[],
  templateVersion: TemplateVersion,
  city: string,
  anthropicKey?: string,
  openaiKey?: string
): Promise<WeekMatch[]> {
  const themes = WEEKLY_THEMES[templateVersion];
  if (!themes) return [];

  let aiMatches: WeekMatch[] = [];

  try {
    aiMatches = await aiSuggestMatches(places, templateVersion, city, anthropicKey, openaiKey);
  } catch (err) {
    console.error("AI week matching failed, using keyword fallback:", err);
    // Build fallback matches from keyword scoring
    const validPlaces = places.filter((p) => p.validationStatus !== "REJECT");
    aiMatches = themes.map((theme) => {
      const scored = validPlaces
        .map((p) => ({ place: p, score: scorePlace(theme, p) }))
        .filter((s) => s.score > 5)
        .sort((a, b) => b.score - a.score);

      return {
        week: theme.week,
        placeName: scored[0]?.place.name || "",
        reason: "Keyword match",
        alternateName: scored[1]?.place.name || "",
        alternateReason: "Keyword match alternate",
      };
    });
  }

  // Enforce anti-repeat constraints in code
  return enforceAntiRepeat(aiMatches, places, themes);
}
