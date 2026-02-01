import { Place, PlaceCategory, WeekMatch } from "@/lib/types";
import { CATEGORIES } from "@/lib/config/categories";
import { TemplateVersion, WEEKLY_THEMES } from "@/lib/config/weekly-themes";

const WILDER_SYSTEM_PROMPT = `You are a research assistant for Wilder Seasons, a family nature brand that creates weekly adventure guides for families with young children (ages 0-5).

Wilder Seasons values:
- Nature-forward, locally owned, non-chain, non-commercial places
- FREE or very low-cost destinations (under $15/person)
- Safe and accessible for babies, toddlers, and preschoolers
- Genuine community gathering places (libraries, nature centers, farms, trails, gardens)
- Warm, inviting, wonder-filled tone

Hard filters (NEVER suggest):
- Chain restaurants or franchises (McDonald's, Chick-fil-A, Panera, etc.)
- Commercial entertainment chains (Chuck E Cheese, Sky Zone, Urban Air, Main Event, Dave & Buster's, trampoline parks)
- Adult venues (bars, breweries, wineries, nightclubs, casinos)
- Places over $15/person admission
- Large theme parks or commercial attractions
- Movie theaters, bowling alleys, or other franchise entertainment

You MUST only suggest REAL places that actually exist. Do not make up or hallucinate place names. If you're unsure whether a place exists, do not include it. Prefer well-known local landmarks, public parks, libraries, and community institutions that you are confident exist.`;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

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
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.content[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  anthropicKey?: string,
  openaiKey?: string
): Promise<string> {
  if (anthropicKey) {
    try {
      return await callClaude(systemPrompt, userPrompt, anthropicKey);
    } catch (err) {
      console.error("Claude API failed, trying OpenAI fallback:", err);
    }
  }

  if (openaiKey) {
    return await callOpenAI(systemPrompt, userPrompt, openaiKey);
  }

  throw new Error("No AI API keys available");
}

function parseJSONFromResponse<T>(text: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }

  // Try to find array directly
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  // Try to find object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  return JSON.parse(text);
}

function generatePlaceId(name: string, city: string): string {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface AIPlaceResult {
  name: string;
  shortDescription: string;
  whyWeLoveIt: string;
  priceTier: string;
  babyFriendly: boolean;
  toddlerSafe: boolean;
  preschoolPlus: boolean;
  warmWeather: boolean;
  winterSpot: boolean;
  insiderTip: string;
}

export async function aiResearchCategory(
  city: string,
  state: string,
  categoryId: PlaceCategory,
  anthropicKey?: string,
  openaiKey?: string
): Promise<Partial<Place>[]> {
  const config = CATEGORIES.find((c) => c.id === categoryId);
  if (!config) return [];

  const targetCount = config.targetCount + 3;

  const categoryGuidance: Record<PlaceCategory, string> = {
    nature: "Focus on public parks, nature preserves, hiking trails, nature centers, arboretums, lakes, and wildlife areas. Include both large flagship parks and smaller neighborhood gems.",
    farm: "Focus on family farms, petting zoos, u-pick orchards, pumpkin patches, ranches with tours, dairy farms, and agricultural education centers. Prioritize places where kids can interact with animals.",
    library: "Focus on public library branches with strong children's programs, storytimes, maker spaces, summer reading programs. Include the main library and notable branch locations.",
    museum: "Focus on children's museums, science centers, discovery museums, natural history museums, and hands-on educational exhibits. Avoid art-only galleries without kid engagement.",
    indoor_play: "Focus on locally-owned indoor play spaces, art studios, pottery studios, creative cafes, play cafes, gymnastics centers, and maker spaces. NO chains like Sky Zone or Urban Air.",
    garden: "Focus on botanical gardens, community gardens, farmers markets, greenhouses, local bakeries, ice cream shops, and family-friendly local restaurants with garden settings.",
    seasonal: "Focus on annual festivals, holiday events, seasonal markets, community celebrations, light displays, Easter events, harvest festivals, and recurring seasonal traditions in the area.",
  };

  const userPrompt = `Generate a list of exactly ${targetCount} real, family-friendly places in ${city}, ${state} for the "${config.name}" category.

${categoryGuidance[categoryId]}

These places MUST genuinely exist in or very near ${city}, ${state}. Focus on locally-owned, community-oriented destinations that families with young children (0-5 years) would love.

For each place return a JSON object with these exact fields:
- "name": exact real name of the place (as it appears on Google Maps)
- "shortDescription": warm, nature-connected description in Wilder Seasons voice (max 100 characters)
- "whyWeLoveIt": one sentence about why families with young kids will love this place
- "priceTier": one of "FREE", "$5_$10", "$10_$15" (never "$15_plus")
- "babyFriendly": boolean (safe for 0-12 month olds with stroller access)
- "toddlerSafe": boolean (safe for 1-3 year olds)
- "preschoolPlus": boolean (engaging for 3-5 year olds)
- "warmWeather": boolean (primarily outdoor/seasonal)
- "winterSpot": boolean (indoor/year-round or has winter programming)
- "insiderTip": a helpful visiting tip for families (max 100 characters)

Return ONLY a valid JSON array. No explanation text, just the JSON array.`;

  const response = await callAI(
    WILDER_SYSTEM_PROMPT,
    userPrompt,
    anthropicKey,
    openaiKey
  );

  try {
    const parsed = parseJSONFromResponse<AIPlaceResult[]>(response);

    return parsed.map((p) => ({
      id: generatePlaceId(p.name, city),
      name: p.name,
      category: categoryId,
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
      priceTier: (["FREE", "$5_$10", "$10_$15", "$15_plus"].includes(
        p.priceTier
      )
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
      editorialNotes: "AI-discovered",
      weekSuggestions: [],
      sourceUrl: "",
      isChain: false,
      placeTypes: [],
    }));
  } catch (err) {
    console.error(`Failed to parse AI response for ${categoryId}:`, err);
    return [];
  }
}

export async function aiMatchWeeks(
  places: Partial<Place>[],
  templateVersion: TemplateVersion,
  city: string,
  anthropicKey?: string,
  openaiKey?: string
): Promise<WeekMatch[]> {
  const themes = WEEKLY_THEMES[templateVersion];
  if (!themes) return [];

  // Build compact place library for the prompt
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
1. Each place can be used at MOST 2 times across all 52 weeks
2. Match by understanding the INTENT and SPIRIT of each theme, not just keywords
3. Consider seasonality: outdoor places (warm=true) for spring/summer weeks, indoor places (winter=true) for winter weeks
4. Provide an alternate place for each week (different from primary)
5. Keep reasons brief (max 80 characters)
6. Winter = weeks 1-9 and 49-52, Spring = weeks 10-22, Summer = weeks 23-35, Fall = weeks 36-48
7. Reference places in the theme data show the INTENT — find the closest local equivalent
8. Prefer higher-scored places when multiple options fit equally well

PLACE LIBRARY:
${JSON.stringify(placeLibrary)}

WEEKLY THEMES:
${JSON.stringify(themeSummary)}

Return ONLY a valid JSON array. Every week (1-52) MUST have an entry. Format:
[{"week":1,"placeName":"...","reason":"...","alternateName":"...","alternateReason":"..."}, ...]`;

  const response = await callAI(
    WILDER_SYSTEM_PROMPT,
    userPrompt,
    anthropicKey,
    openaiKey
  );

  try {
    const parsed = parseJSONFromResponse<WeekMatch[]>(response);
    return parsed;
  } catch (err) {
    console.error("Failed to parse AI week matching response:", err);
    return [];
  }
}
