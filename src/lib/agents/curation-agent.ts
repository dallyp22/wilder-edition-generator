import { Place, PlaceCategory, RawDiscoveryPlace } from "@/lib/types";
import { callAI, parseJSONFromResponse, generatePlaceId } from "@/lib/utils/ai-client";

const CURATION_SYSTEM_PROMPT = `You are a curation specialist for Wilder Seasons, a family nature brand for families with children ages 0-5.

Your job is to REVIEW a list of places discovered by web search and determine which ones are genuinely good fits for Wilder Seasons. You are NOT discovering new places — only evaluating the ones provided.

ACCEPT places that are:
- Real, specific venues (not generic descriptions, blog titles, or list articles)
- Family-friendly for ages 0-5
- Locally owned, community-oriented (not chains)
- FREE or under $15/person
- Nature-connected, educational, or community-building

REJECT places that are:
- Chain restaurants or franchises (McDonald's, Starbucks, Chick-fil-A, etc.)
- Commercial entertainment chains (Chuck E Cheese, Sky Zone, Urban Air, Main Event, Dave & Buster's)
- Adult venues (bars, breweries, wineries, nightclubs, casinos)
- Over $15/person admission
- Generic entries that aren't specific places (e.g. "Top 10 Parks in...", "Best Things to Do...")
- Blog posts, articles, or websites (not actual places)
- Places that clearly don't exist or seem fabricated

For each ACCEPTED place, write in the warm, wonder-filled Wilder Seasons voice.`;

interface CuratedPlace {
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
}

interface CurationResult {
  accepted: CuratedPlace[];
  rejected: { name: string; reason: string }[];
}

export async function curatePlaces(
  city: string,
  state: string,
  rawPlaces: RawDiscoveryPlace[],
  anthropicKey?: string,
  openaiKey?: string
): Promise<Partial<Place>[]> {
  if (rawPlaces.length === 0) return [];

  const userPrompt = `Review these ${rawPlaces.length} places discovered for ${city}, ${state}. Accept the ones that fit Wilder Seasons and reject the rest.

DISCOVERED PLACES:
${JSON.stringify(
  rawPlaces.map((p) => ({
    name: p.name,
    source: p.source,
    snippet: p.snippet.slice(0, 150),
    category: p.category,
  })),
  null,
  2
)}

For each ACCEPTED place return:
- "name": exact name from the list above (do not rename)
- "category": one of [nature, farm, library, museum, indoor_play, garden, seasonal]
- "shortDescription": warm, nature-connected description in Wilder Seasons voice (max 100 chars)
- "whyWeLoveIt": one sentence about why families with young kids will love this
- "insiderTip": a helpful visiting tip for families (max 100 chars)
- "priceTier": one of "FREE", "$5_$10", "$10_$15"
- "babyFriendly": boolean (safe for 0-12 months with stroller)
- "toddlerSafe": boolean (safe for 1-3 year olds)
- "preschoolPlus": boolean (engaging for 3-5 year olds)
- "warmWeather": boolean (primarily outdoor/seasonal)
- "winterSpot": boolean (indoor/year-round)

Return a JSON object with two arrays:
{
  "accepted": [ ... ],
  "rejected": [ { "name": "...", "reason": "..." } ]
}

Return ONLY valid JSON. No explanation text.`;

  try {
    const response = await callAI(
      CURATION_SYSTEM_PROMPT,
      userPrompt,
      anthropicKey,
      openaiKey
    );

    const parsed = parseJSONFromResponse<CurationResult>(response);
    const accepted = parsed.accepted || [];

    if (parsed.rejected?.length) {
      console.log(
        `Curation rejected ${parsed.rejected.length} places:`,
        parsed.rejected.map((r) => `${r.name} (${r.reason})`).join(", ")
      );
    }

    // Build source URL lookup from raw places
    const sourceMap = new Map<string, string>();
    for (const raw of rawPlaces) {
      sourceMap.set(raw.name.toLowerCase(), raw.sourceUrl);
    }

    return accepted.map((p) => ({
      id: generatePlaceId(p.name, city),
      name: p.name,
      category: (["nature", "farm", "library", "museum", "indoor_play", "garden", "seasonal"].includes(p.category)
        ? p.category
        : "nature") as PlaceCategory,
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
      priceTier: (["FREE", "$5_$10", "$10_$15"].includes(p.priceTier)
        ? p.priceTier
        : "FREE") as Place["priceTier"],
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
      editorialNotes: "AI-curated from web search",
      weekSuggestions: [],
      sourceUrl: sourceMap.get(p.name.toLowerCase()) || "",
      isChain: false,
      placeTypes: [],
    }));
  } catch (err) {
    console.error("AI curation failed, passing raw places through:", err);
    // Fallback: convert raw places to Partial<Place>[] without curation
    return rawPlaces.map((p) => ({
      id: generatePlaceId(p.name, city),
      name: p.name,
      category: p.category,
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
      priceTier: "FREE" as const,
      priceDetails: "",
      babyFriendly: true,
      toddlerSafe: true,
      preschoolPlus: true,
      warmWeather: false,
      winterSpot: false,
      iconString: "",
      shortDescription: p.snippet.slice(0, 100),
      whyWeLoveIt: "",
      insiderTip: "",
      brandScore: 0,
      validationStatus: "REVIEW" as const,
      editorialNotes: "AI curation unavailable — raw discovery result",
      weekSuggestions: [],
      sourceUrl: p.sourceUrl,
      isChain: false,
      placeTypes: [],
    }));
  }
}
