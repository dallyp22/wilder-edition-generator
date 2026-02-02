import { PlaceCategory, BraveSearchResult, RawDiscoveryPlace } from "@/lib/types";
import { CATEGORIES, CATEGORY_GUIDANCE } from "@/lib/config/categories";
import { BRAND_CRITERIA } from "@/lib/config/brand-criteria";
import { normalizeName } from "@/lib/utils/ai-client";

// ── Brave Search (reused from research-agent.ts) ──

function generateSearchQueries(city: string, state: string, category: PlaceCategory): string[] {
  const location = `${city} ${state}`;

  const baseQueries: Record<PlaceCategory, string[]> = {
    nature: [
      `${location} best parks nature trails families toddlers`,
      `${location} playgrounds nature center stroller accessible`,
    ],
    farm: [
      `${location} family farms petting zoo kids`,
      `${location} u-pick orchard pumpkin patch children`,
    ],
    library: [
      `${location} public library children storytime programs`,
      `${location} best libraries kids toddlers`,
    ],
    museum: [
      `${location} children's museum science center kids`,
      `${location} family friendly museums educational activities`,
    ],
    indoor_play: [
      `${location} indoor play space toddlers kids`,
      `${location} art studio play cafe children`,
    ],
    garden: [
      `${location} botanical garden farmers market family`,
      `${location} local ice cream bakery family friendly`,
    ],
    seasonal: [
      `${location} family festivals holiday events children`,
      `${location} seasonal community events kids activities`,
    ],
  };

  return baseQueries[category] || [`${location} family activities`];
}

function isAdultVenue(text: string): boolean {
  const lower = text.toLowerCase();
  return BRAND_CRITERIA.adultVenueKeywords.some((kw) => lower.includes(kw));
}

async function searchBrave(query: string, apiKey: string): Promise<BraveSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results: BraveSearchResult[] = [];

    if (data.web?.results) {
      for (const r of data.web.results) {
        results.push({
          title: r.title || "",
          url: r.url || "",
          description: r.description || "",
        });
      }
    }
    return results;
  } finally {
    clearTimeout(timeout);
  }
}

function extractBravePlaces(
  results: BraveSearchResult[],
  category: PlaceCategory
): RawDiscoveryPlace[] {
  const places: RawDiscoveryPlace[] = [];
  const seenNames = new Set<string>();

  for (const result of results) {
    const combined = `${result.title} ${result.description}`;
    if (isAdultVenue(combined)) continue;

    let name = result.title
      .split(/[-|–—]/)[0]
      .trim()
      .replace(/\d+\s*(best|top|things)/i, "")
      .trim();

    if (/^\d+\s+(best|top|things|places|fun)/i.test(result.title)) continue;
    if (!name || name.length < 3 || name.length > 80) continue;

    const nameKey = normalizeName(name);
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    places.push({
      name,
      source: "brave",
      sourceUrl: result.url,
      snippet: result.description.slice(0, 200),
      category,
    });
  }

  return places;
}

async function discoverViaBrave(
  city: string,
  state: string,
  categoryId: PlaceCategory,
  braveApiKey: string
): Promise<RawDiscoveryPlace[]> {
  const queries = generateSearchQueries(city, state, categoryId);
  const allResults: BraveSearchResult[] = [];

  for (const query of queries) {
    const results = await searchBrave(query, braveApiKey);
    allResults.push(...results);
    await new Promise((r) => setTimeout(r, 300));
  }

  const config = CATEGORIES.find((c) => c.id === categoryId)!;
  return extractBravePlaces(allResults, categoryId).slice(0, config.targetCount + 5);
}

// ── Gemini with Google Search Grounding ──

interface GeminiPlace {
  name: string;
  description: string;
  outdoor: boolean;
  priceTier: string;
}

async function discoverViaGemini(
  city: string,
  state: string,
  categoryId: PlaceCategory,
  geminiApiKey: string
): Promise<RawDiscoveryPlace[]> {
  const config = CATEGORIES.find((c) => c.id === categoryId);
  if (!config) return [];

  const guidance = CATEGORY_GUIDANCE[categoryId] || "";

  const prompt = `Find real, family-friendly places in ${city}, ${state} in the category: "${config.name}".

${guidance}

Search for actual businesses, parks, libraries, farms, and venues that exist today. Focus on:
- Locally owned, non-chain establishments
- Places safe and enjoyable for families with young children (ages 0-9)
- FREE or low-cost destinations (under $20/person)
- Nature-connected, community-oriented spots

For each place you find, provide:
1. The exact name as it would appear on Google Maps
2. A one-sentence description of what it is
3. Whether it's primarily outdoor (true) or indoor (false)
4. Approximate price: FREE, $5_$10, or $10_$15

Return ${config.targetCount + 3} places as a JSON array with fields: name, description, outdoor, priceTier.
Only include places you are confident actually exist. Return ONLY valid JSON array, no other text.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 4096,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    // Parse the JSON response
    let parsed: GeminiPlace[];
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = jsonMatch ? jsonMatch[1].trim() : text;
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(arrayMatch ? arrayMatch[0] : raw);
    } catch {
      console.error("Failed to parse Gemini response for", categoryId);
      return [];
    }

    return parsed.map((p) => {
      // Try to match a grounding URL to this place
      const matchedChunk = groundingChunks.find(
        (c: { web?: { title?: string; uri?: string } }) =>
          c.web?.title?.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );

      return {
        name: p.name,
        source: "gemini" as const,
        sourceUrl: matchedChunk?.web?.uri || "",
        snippet: p.description || "",
        category: categoryId,
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}

// ── Merge + Deduplicate ──

function mergeDiscoveryResults(
  bravePlaces: RawDiscoveryPlace[],
  geminiPlaces: RawDiscoveryPlace[]
): RawDiscoveryPlace[] {
  const merged: RawDiscoveryPlace[] = [];
  const seen = new Set<string>();

  // Gemini results first (grounded by Google Search)
  for (const place of geminiPlaces) {
    const key = normalizeName(place.name);
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(place);
    }
  }

  // Then Brave results
  for (const place of bravePlaces) {
    const key = normalizeName(place.name);
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(place);
    }
  }

  return merged;
}

// ── Main Export ──

export async function discoverCategory(
  city: string,
  state: string,
  categoryId: PlaceCategory,
  braveApiKey?: string,
  geminiApiKey?: string
): Promise<RawDiscoveryPlace[]> {
  const config = CATEGORIES.find((c) => c.id === categoryId);
  if (!config) return [];

  // Fire both sources in parallel
  const [braveResult, geminiResult] = await Promise.allSettled([
    braveApiKey
      ? discoverViaBrave(city, state, categoryId, braveApiKey)
      : Promise.resolve([]),
    geminiApiKey
      ? discoverViaGemini(city, state, categoryId, geminiApiKey)
      : Promise.resolve([]),
  ]);

  const brave = braveResult.status === "fulfilled" ? braveResult.value : [];
  const gemini = geminiResult.status === "fulfilled" ? geminiResult.value : [];

  if (braveResult.status === "rejected") {
    console.error(`Brave discovery failed for ${categoryId}:`, braveResult.reason);
  }
  if (geminiResult.status === "rejected") {
    console.error(`Gemini discovery failed for ${categoryId}:`, geminiResult.reason);
  }

  return mergeDiscoveryResults(brave, gemini);
}
