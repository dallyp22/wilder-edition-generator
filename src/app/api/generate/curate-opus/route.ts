// Serverless runtime (NOT edge) — Opus curation needs time for thorough review
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { callOpus, parseJSONFromResponse, generatePlaceId } from "@/lib/utils/ai-client";
import { Place, PlaceCategory } from "@/lib/types";
import { ThemedResearchResult } from "@/lib/agents/themed-research";

// ── System Prompts ──

const PLACES_SYSTEM_PROMPT = `You are the senior editor for Wilder Seasons, a nature-based weekly family adventure guide for ages 0-9.

You have research data from MULTIPLE AI sources about places in a specific city. Your job is to curate the BEST 60-80 unique places for the Wilder Seasons place library.

WILDER SEASONS BRAND VALUES:
- Accessible: Free or under $20/person — preferably free
- Nature-connected: Outdoor, hands-on, sensory-rich experiences
- Locally authentic: Family-owned, community-rooted, hidden gems
- No chains: No McDonald's, Starbucks, Chuck E Cheese, Sky Zone, etc.
- Wonder-filled: Places that spark curiosity in young children
- Screen-free: Real, in-person experiences families share together

CURATION PRINCIPLES:
- If MULTIPLE sources suggest the same place, that's a STRONG signal — prioritize it
- Hidden gems over tourist traps
- Variety across categories (nature, farm, library, museum, indoor_play, garden, seasonal)
- Every place must be real and currently operating
- Write in the warm, inviting Wilder Seasons voice`;

const WEEKS_SYSTEM_PROMPT = `You are the senior editor for Wilder Seasons, a nature-based weekly family adventure guide for ages 0-9.

Given a curated place library and the original themed research, assign the BEST place to each of the 52 weekly themes.

RULES:
- Every week MUST have a place assigned
- No place used more than TWICE across all 52 weeks
- The place must genuinely connect to the weekly theme
- Prioritize variety — spread categories across the year
- Consider seasonality (warm weather places in summer, indoor in winter)`;

const VALID_CATEGORIES: PlaceCategory[] = [
  "nature", "farm", "library", "museum", "indoor_play", "garden", "seasonal",
];

// ── Types ──

interface OpusWeekPlan {
  week: number;
  theme: string;
  placeName: string;
  reason: string;
}

interface OpusCuratedPlace {
  name: string;
  category: string;
  shortDescription: string;
  whyWeLoveIt: string;
  insiderTip: string;
  priceTier: string;
  babyFriendly: boolean;
  toddlerSafe: boolean;
  preschoolPlus: boolean;
  warmWeather: boolean;
  winterSpot: boolean;
  sourceCount: number;
}

// ── Helpers ──

function buildPlacesPrompt(
  city: string,
  state: string,
  allResults: ThemedResearchResult[]
): string {
  const grokResults = allResults.filter((r) => r.source === "grok");
  const geminiResults = allResults.filter((r) => r.source === "gemini");
  const braveResults = allResults.filter((r) => r.source === "brave");

  return `Review the following research data for ${city}, ${state} and curate the best 60-80 unique places.

RAW RESEARCH DATA:

=== GROK (${grokResults.length} results — web + social search) ===
${JSON.stringify(grokResults.map((r) => ({
  week: r.week, theme: r.theme, place: r.place, why: r.whyItFits, cat: r.category, cost: r.cost
})))}

=== GEMINI (${geminiResults.length} results — Google Search grounded) ===
${JSON.stringify(geminiResults.map((r) => ({
  week: r.week, theme: r.theme, place: r.place, why: r.whyItFits, cat: r.category, cost: r.cost
})))}

=== BRAVE (${braveResults.length} supplementary places) ===
${JSON.stringify(braveResults.map((r) => ({
  place: r.place, cat: r.category, why: r.whyItFits, cost: r.cost
})))}

Return ONLY a valid JSON array of 60-80 places:
[
  {
    "name": "Exact Place Name",
    "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
    "shortDescription": "Warm 1-sentence description (max 100 chars)",
    "whyWeLoveIt": "Why families with young kids love this (1-2 sentences)",
    "insiderTip": "Practical tip for visiting (max 100 chars)",
    "priceTier": "FREE|$5_$10|$10_$15|$15_$20",
    "babyFriendly": true,
    "toddlerSafe": true,
    "preschoolPlus": true,
    "warmWeather": true,
    "winterSpot": false,
    "sourceCount": 2
  }
]

CRITICAL: Return ONLY the JSON array. No other text.`;
}

function buildWeeksPrompt(
  city: string,
  places: OpusCuratedPlace[],
  allResults: ThemedResearchResult[]
): string {
  // Include theme hints from Grok/Gemini (they have week assignments)
  const themeHints = allResults
    .filter((r) => r.week > 0 && r.source !== "brave")
    .map((r) => ({ week: r.week, theme: r.theme, place: r.place, source: r.source }));

  const placeNames = places.map((p) => p.name);

  return `Assign each of the 52 weekly themes to a place from the curated library for ${city}.

CURATED PLACE LIBRARY (${places.length} places):
${JSON.stringify(placeNames)}

THEME HINTS FROM RESEARCH (original AI suggestions):
${JSON.stringify(themeHints)}

RULES:
- Assign ALL 52 weeks (week 1-52)
- Use ONLY places from the library above
- No place more than TWICE
- Match the theme to the place — it must make sense

Return ONLY a valid JSON array with exactly 52 entries:
[
  { "week": 1, "theme": "Theme Name", "placeName": "Place Name", "reason": "Why it fits (max 80 chars)" }
]

CRITICAL: Return ONLY the JSON array. No other text.`;
}

function mapPlaces(parsed: OpusCuratedPlace[], city: string, state: string): Partial<Place>[] {
  return parsed.map((p) => ({
    id: generatePlaceId(p.name, city),
    name: p.name,
    category: (VALID_CATEGORIES.includes(p.category as PlaceCategory)
      ? p.category : "nature") as PlaceCategory,
    address: "",
    city,
    state,
    zipCode: "",
    latitude: null,
    longitude: null,
    website: "",
    phone: "",
    googleRating: null,
    googleReviewCount: null,
    priceTier: (["FREE", "$5_$10", "$10_$15", "$15_$20"].includes(p.priceTier)
      ? p.priceTier : "FREE") as Place["priceTier"],
    priceDetails: "",
    babyFriendly: p.babyFriendly ?? true,
    toddlerSafe: p.toddlerSafe ?? true,
    preschoolPlus: p.preschoolPlus ?? true,
    warmWeather: p.warmWeather ?? false,
    winterSpot: p.winterSpot ?? false,
    iconString: "",
    shortDescription: (p.shortDescription || "").slice(0, 100),
    whyWeLoveIt: p.whyWeLoveIt || "",
    insiderTip: (p.insiderTip || "").slice(0, 100),
    brandScore: 0,
    validationStatus: "REVIEW" as const,
    editorialNotes: `Opus-curated (${p.sourceCount || 1} source${(p.sourceCount || 1) > 1 ? "s" : ""})`,
    weekSuggestions: [],
    sourceUrl: "",
    isChain: false,
    placeTypes: [],
  }));
}

// ── Sonnet fallback with curation-appropriate limits ──

async function callSonnetCuration(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Sonnet fallback error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.content[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

// ── AI Call with Sonnet Fallback ──

async function callWithFallback(
  systemPrompt: string,
  userPrompt: string,
  anthropicKey: string,
  label: string
): Promise<string> {
  try {
    return await callOpus(systemPrompt, userPrompt, anthropicKey);
  } catch (err) {
    console.error(`[Opus Curation] ${label} Opus failed, falling back to Sonnet:`, err);
    return await callSonnetCuration(systemPrompt, userPrompt, anthropicKey);
  }
}

// ── Route Handler ──

export async function POST(request: NextRequest) {
  try {
    const { city, state, allResults } = await request.json() as {
      city: string;
      state: string;
      allResults: ThemedResearchResult[];
    };

    if (!city || !state || !allResults?.length) {
      return NextResponse.json(
        { error: "city, state, and allResults are required" },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // ── Call 1: Curate Places Library ──
    console.log(`[Opus Curation] Starting places curation for ${city}, ${state} (${allResults.length} raw results)`);
    const placesPrompt = buildPlacesPrompt(city, state, allResults);
    const placesResponse = await callWithFallback(PLACES_SYSTEM_PROMPT, placesPrompt, anthropicKey, "Places");
    const parsedPlaces = parseJSONFromResponse<OpusCuratedPlace[]>(placesResponse);

    if (!Array.isArray(parsedPlaces) || parsedPlaces.length === 0) {
      throw new Error("Places curation returned empty or invalid result");
    }

    console.log(`[Opus Curation] Got ${parsedPlaces.length} curated places, now assigning weeks...`);

    // ── Call 2: Assign 52 Weeks ──
    const weeksPrompt = buildWeeksPrompt(city, parsedPlaces, allResults);
    const weeksResponse = await callWithFallback(WEEKS_SYSTEM_PROMPT, weeksPrompt, anthropicKey, "Weeks");
    const parsedWeeks = parseJSONFromResponse<OpusWeekPlan[]>(weeksResponse);

    const weekPlan = (Array.isArray(parsedWeeks) ? parsedWeeks : []).map((w) => ({
      week: w.week,
      placeName: w.placeName || "",
      reason: (w.reason || "").slice(0, 80),
      alternateName: "",
      alternateReason: "",
    }));

    const curatedPlaces = mapPlaces(parsedPlaces, city, state);

    console.log(`[Opus Curation] Complete: ${curatedPlaces.length} places, ${weekPlan.length} weeks`);

    return NextResponse.json({
      places: curatedPlaces,
      weekPlan,
      placeCount: curatedPlaces.length,
      weekCount: weekPlan.length,
    });
  } catch (err) {
    console.error("[Opus Curation] Error:", err);
    const message = err instanceof Error ? err.message : "Opus curation failed";
    return NextResponse.json(
      { error: message, places: [], weekPlan: [] },
      { status: 500 }
    );
  }
}
