import { Place, PlaceCategory, BraveSearchResult } from "@/lib/types";
import { CATEGORIES } from "@/lib/config/categories";
import { BRAND_CRITERIA } from "@/lib/config/brand-criteria";

function generateSearchQueries(
  city: string,
  state: string,
  category: PlaceCategory
): string[] {
  const config = CATEGORIES.find((c) => c.id === category)!;
  const location = `${city} ${state}`;

  // Limited to 2 queries per category to keep each API call under Vercel's 10s timeout
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

  return baseQueries[category] || [`${location} family activities ${config.keywords.join(" ")}`];
}

function isAdultVenue(text: string): boolean {
  const lower = text.toLowerCase();
  return BRAND_CRITERIA.adultVenueKeywords.some((kw) => lower.includes(kw));
}

function isChainLocation(text: string): boolean {
  const lower = text.toLowerCase();
  return BRAND_CRITERIA.chainIndicators.some((chain) => lower.includes(chain));
}

function generatePlaceId(name: string, city: string): string {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function searchBrave(
  query: string,
  apiKey: string
): Promise<BraveSearchResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!res.ok) {
    console.error(`Brave search failed: ${res.status}`);
    return [];
  }

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
}

function extractPlacesFromResults(
  results: BraveSearchResult[],
  category: PlaceCategory,
  city: string,
  state: string
): Partial<Place>[] {
  const places: Partial<Place>[] = [];
  const seenNames = new Set<string>();

  for (const result of results) {
    const combined = `${result.title} ${result.description}`;

    if (isAdultVenue(combined)) continue;

    // Try to extract place names from titles
    // Titles often contain "Place Name - Description" or "Place Name | City"
    let name = result.title
      .split(/[-|–—]/)[0]
      .trim()
      .replace(/\d+\s*(best|top|things)/i, "")
      .trim();

    // Skip list articles and non-place results
    if (/^\d+\s+(best|top|things|places|fun)/i.test(result.title)) {
      continue;
    }

    if (!name || name.length < 3 || name.length > 80) continue;

    const nameKey = name.toLowerCase().replace(/[^a-z]/g, "");
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    places.push({
      id: generatePlaceId(name, city),
      name,
      category,
      address: "",
      city,
      state,
      zipCode: "",
      latitude: null,
      longitude: null,
      website: result.url,
      phone: "",
      googleRating: null,
      googleReviewCount: null,
      priceTier: "FREE",
      priceDetails: "",
      babyFriendly: true,
      toddlerSafe: true,
      preschoolPlus: true,
      warmWeather: true,
      winterSpot: false,
      iconString: "",
      shortDescription: result.description.slice(0, 100),
      whyWeLoveIt: "",
      insiderTip: "",
      brandScore: 0,
      validationStatus: "REVIEW",
      editorialNotes: "",
      weekSuggestions: [],
      sourceUrl: result.url,
      isChain: isChainLocation(name),
      placeTypes: [],
    });
  }

  return places;
}

export async function researchCategory(
  city: string,
  state: string,
  category: PlaceCategory,
  braveApiKey: string
): Promise<Partial<Place>[]> {
  const queries = generateSearchQueries(city, state, category);
  const allResults: BraveSearchResult[] = [];

  for (const query of queries) {
    const results = await searchBrave(query, braveApiKey);
    allResults.push(...results);

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  const places = extractPlacesFromResults(allResults, category, city, state);
  const config = CATEGORIES.find((c) => c.id === category)!;

  // Return up to target count + buffer
  return places.slice(0, config.targetCount + 5);
}

export async function researchAllCategories(
  city: string,
  state: string,
  braveApiKey: string,
  onProgress?: (category: string, count: number) => void
): Promise<Partial<Place>[]> {
  const allPlaces: Partial<Place>[] = [];

  for (const category of CATEGORIES) {
    const places = await researchCategory(
      city,
      state,
      category.id,
      braveApiKey
    );
    allPlaces.push(...places);
    onProgress?.(category.name, places.length);
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return allPlaces.filter((p) => {
    const key = p.name!.toLowerCase().replace(/[^a-z]/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
