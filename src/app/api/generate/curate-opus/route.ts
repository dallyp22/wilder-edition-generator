// Serverless runtime (NOT edge) — allows 60s timeout for Opus curation
import { NextRequest, NextResponse } from "next/server";
import { callOpus, parseJSONFromResponse, generatePlaceId } from "@/lib/utils/ai-client";
import { Place, PlaceCategory } from "@/lib/types";
import { ThemedResearchResult } from "@/lib/agents/themed-research";

const OPUS_SYSTEM_PROMPT = `You are the senior editor for Wilder Seasons, a nature-based weekly family adventure guide for ages 0-9.

You have research data from MULTIPLE AI sources about places in a specific city matched to our 52 weekly themes. Your job is to review ALL raw research and make the BEST brand-aligned decisions.

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
- Variety is essential: no place should appear more than twice
- Every place must be real and currently operating
- Write in the warm, invitation-based Wilder Seasons voice

YOUR OUTPUT must be a JSON object with:
1. "places" — array of 60-80 unique curated places (the place library)
2. "weekPlan" — array of 52 entries matching each week to a place`;

const VALID_CATEGORIES: PlaceCategory[] = [
  "nature", "farm", "library", "museum", "indoor_play", "garden", "seasonal",
];

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

interface OpusResponse {
  places: OpusCuratedPlace[];
  weekPlan: OpusWeekPlan[];
}

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

    // Build source summary for Opus
    const grokResults = allResults.filter((r) => r.source === "grok");
    const geminiResults = allResults.filter((r) => r.source === "gemini");
    const braveResults = allResults.filter((r) => r.source === "brave");

    const userPrompt = `Review the following research data for ${city}, ${state} and curate the best places for our 52-week guide.

RAW RESEARCH DATA:

=== GROK RESEARCH (${grokResults.length} results — web + social search) ===
${JSON.stringify(grokResults.map((r) => ({
  week: r.week, theme: r.theme, place: r.place, whyItFits: r.whyItFits, category: r.category, cost: r.cost
})), null, 1)}

=== GEMINI RESEARCH (${geminiResults.length} results — Google Search grounded) ===
${JSON.stringify(geminiResults.map((r) => ({
  week: r.week, theme: r.theme, place: r.place, whyItFits: r.whyItFits, category: r.category, cost: r.cost
})), null, 1)}

=== BRAVE SEARCH (${braveResults.length} supplementary places — category sweep) ===
${JSON.stringify(braveResults.map((r) => ({
  place: r.place, category: r.category, whyItFits: r.whyItFits, cost: r.cost
})), null, 1)}

INSTRUCTIONS:
1. Review ALL research across all sources
2. Identify places suggested by MULTIPLE sources (strong signal)
3. Select 60-80 unique places that best fit the Wilder Seasons brand
4. Assign each of the 52 weeks to a place — no place used more than twice
5. Write descriptions in the warm Wilder Seasons voice

Return ONLY valid JSON:
{
  "places": [
    {
      "name": "Exact Place Name",
      "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
      "shortDescription": "Warm 1-sentence description (max 100 chars)",
      "whyWeLoveIt": "Why families with young kids love this",
      "insiderTip": "Practical tip for visiting families (max 100 chars)",
      "priceTier": "FREE|$5_$10|$10_$15|$15_$20",
      "babyFriendly": true,
      "toddlerSafe": true,
      "preschoolPlus": true,
      "warmWeather": true,
      "winterSpot": false,
      "sourceCount": 2
    }
  ],
  "weekPlan": [
    { "week": 1, "theme": "Theme Name", "placeName": "Place Name", "reason": "Why (max 80 chars)" }
  ]
}`;

    const response = await callOpus(OPUS_SYSTEM_PROMPT, userPrompt, anthropicKey);
    const parsed = parseJSONFromResponse<OpusResponse>(response);

    const curatedPlaces: Partial<Place>[] = (parsed.places || []).map((p) => ({
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

    const weekPlan = (parsed.weekPlan || []).map((w) => ({
      week: w.week,
      placeName: w.placeName || "",
      reason: (w.reason || "").slice(0, 80),
      alternateName: "",
      alternateReason: "",
    }));

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
