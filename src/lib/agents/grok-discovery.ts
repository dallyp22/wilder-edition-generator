import { RawDiscoveryPlace, PlaceCategory, DiscoverySource } from "@/lib/types";
import { callGrok, GrokToolConfig } from "@/lib/utils/grok-client";
import { parseJSONFromResponse, normalizeName } from "@/lib/utils/ai-client";

// ── Shared Constants ──

const VALID_CATEGORIES: PlaceCategory[] = [
  "nature", "farm", "library", "museum", "indoor_play", "garden", "seasonal",
];

const GROK_SYSTEM_PROMPT = `You are a local family activities researcher for Wilder Seasons, a nature-based family guide publisher.

Your job is to find AUTHENTIC, LOCALLY-LOVED places for families with children ages 0-9.

WHAT WE WANT:
- Places local parents actually recommend to each other
- Hidden gems that don't show up in typical tourist searches
- Family farms, local bakeries, neighborhood parks with character
- U-pick farms, hayrack rides, old-fashioned ice cream shops
- Free or low-cost destinations ($20 max per person)
- Nature-connected experiences

WHAT WE DON'T WANT:
- Chain restaurants or stores (McDonald's, Starbucks, Chuck E Cheese, etc.)
- Tourist traps or heavily commercialized attractions
- Expensive venues (over $20/person)
- Places that tolerate but don't welcome young kids

When searching:
1. Look for genuine parent conversations and recommendations
2. Find places mentioned multiple times by different people
3. Note specific enthusiasm ("we LOVE this place", "hidden gem")
4. Capture insider tips when shared
5. Verify places are still open and operating

For each place found, return structured JSON as specified in the user prompt.`;

// ── Shared Parser ──

interface GrokPlaceItem {
  name?: string;
  category?: string;
  description?: string;
  whyParentsLoveIt?: string;
  insiderTip?: string;
  cost?: string;
}

function parseGrokPlaces(
  text: string,
  defaultSource: DiscoverySource,
  defaultCategory?: PlaceCategory
): RawDiscoveryPlace[] {
  let items: GrokPlaceItem[];
  try {
    const parsed = parseJSONFromResponse<{ places?: GrokPlaceItem[] } | GrokPlaceItem[]>(text);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.places)) {
      items = parsed.places;
    } else {
      return [];
    }
  } catch {
    console.error(`[Grok] Failed to parse places response for ${defaultSource}`);
    return [];
  }

  const places: RawDiscoveryPlace[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const name = (item.name || "").trim();
    if (!name || name.length < 3) continue;

    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);

    // Validate category
    let category: PlaceCategory = defaultCategory || "nature";
    if (item.category && VALID_CATEGORIES.includes(item.category as PlaceCategory)) {
      category = item.category as PlaceCategory;
    }

    const snippet = (
      item.whyParentsLoveIt || item.description || ""
    ).slice(0, 200);

    places.push({
      name,
      source: defaultSource,
      sourceUrl: "",
      snippet,
      category,
    });
  }

  return places;
}

// ── Channel 1: X Parent Search ──

const X_PARENT_PROMPT = `Search X/Twitter for family activity recommendations in {{CITY}}, {{STATE}}.

Look for:
1. Posts asking "where do you take your kids in {{CITY}}"
2. Posts sharing "favorite spots" or "hidden gems" for families
3. Local mom/parent accounts sharing weekend activities
4. Posts with hashtags like #{{CITY_HASH}}Moms, #{{CITY_HASH}}Kids, #{{CITY_HASH}}Families
5. Replies where parents recommend specific places

Focus on finding:
- Farms with kid activities (hayrack rides, petting zoos, u-pick)
- Local bakeries and ice cream shops families love
- Parks with specific features parents mention
- Free or cheap nature spots
- Seasonal family activities

Return as JSON:
{
  "places": [
    {
      "name": "Place Name",
      "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
      "whyParentsLoveIt": "Why local parents recommend this",
      "insiderTip": "Any tips shared",
      "cost": "free|under $10|under $20"
    }
  ],
  "localParentAccounts": ["@handle1", "@handle2"]
}`;

export async function discoverViaXParents(
  city: string,
  state: string,
  xaiApiKey: string
): Promise<{ places: RawDiscoveryPlace[]; localAccounts: string[] }> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fromDate = sixMonthsAgo.toISOString().split("T")[0];

  const cityHash = city.replace(/\s/g, "");
  const prompt = X_PARENT_PROMPT
    .replace(/\{\{CITY\}\}/g, city)
    .replace(/\{\{STATE\}\}/g, state)
    .replace(/\{\{CITY_HASH\}\}/g, cityHash);

  const tools: GrokToolConfig = {
    xSearch: {
      fromDate,
      excludedHandles: [
        "scarymommy", "motherly", "todaysparent", "parents",
        "parentsmagazine", "babycenter", "whattoexpect",
      ],
    },
  };

  const raw = await callGrok(GROK_SYSTEM_PROMPT, prompt, xaiApiKey, tools);

  // Extract local accounts from response
  let localAccounts: string[] = [];
  try {
    const parsed = parseJSONFromResponse<{ localParentAccounts?: string[] }>(raw);
    if (parsed && Array.isArray(parsed.localParentAccounts)) {
      localAccounts = parsed.localParentAccounts;
    }
  } catch {
    // accounts are optional
  }

  return {
    places: parseGrokPlaces(raw, "grok_x"),
    localAccounts,
  };
}

// ── Channel 2: Neighborhood Search ──

const NEIGHBORHOOD_PROMPT = `Find family-friendly hidden gems in {{CITY}}, {{STATE}} by searching neighborhood by neighborhood.

For each major area/neighborhood of the city, find:
1. The playground or park locals love
2. The local treat spot (bakery, ice cream, donut shop)
3. A nature access point (creek, trail, garden)
4. A rainy-day option (library, indoor play, museum)
5. Any hidden gem unique to that neighborhood

Search for specific places using queries like:
- "best playground [neighborhood] {{CITY}}"
- "[neighborhood] {{CITY}} family bakery"
- "hidden gem [neighborhood] kids"
- "[neighborhood] nature trail stroller"

Return as JSON array:
{
  "places": [
    {
      "name": "Place Name",
      "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
      "description": "What it is and why families love it",
      "insiderTip": "Best time to visit or what to bring",
      "cost": "free|under $10|under $20"
    }
  ]
}`;

export async function discoverViaNeighborhoods(
  city: string,
  state: string,
  xaiApiKey: string
): Promise<RawDiscoveryPlace[]> {
  const prompt = NEIGHBORHOOD_PROMPT
    .replace(/\{\{CITY\}\}/g, city)
    .replace(/\{\{STATE\}\}/g, state);

  const tools: GrokToolConfig = {
    webSearch: {
      excludedDomains: [
        "tripadvisor.com", "yelp.com", "timeout.com", "thrillist.com",
      ],
      userLocation: {
        country: "US",
        city,
        region: state,
      },
    },
  };

  const raw = await callGrok(GROK_SYSTEM_PROMPT, prompt, xaiApiKey, tools);
  return parseGrokPlaces(raw, "grok_web");
}

// ── Channel 3: Local Blog Search (two-step) ──

const BLOG_DISCOVERY_PROMPT = `Find local parenting blogs, mom blogs, and family activity websites specific to {{CITY}}, {{STATE}}.

Search for:
- "{{CITY}} mom blog"
- "{{CITY}} parenting blog"
- "{{CITY}} family activities blog"
- "things to do {{CITY}} kids blog"
- "{{CITY}} moms group website"

Return ONLY a JSON object with domain names for locally-focused family content sites.
Exclude national sites like Scary Mommy, Today's Parent, BabyCenter, etc.

{
  "domains": ["example-city-moms.com", "local-family-blog.com"]
}`;

const BLOG_SEARCH_PROMPT = `Search these local {{CITY}}, {{STATE}} parenting and family sources for activity recommendations.

Look for:
- "Best of {{CITY}}" lists for families
- Seasonal activity guides
- Farm and orchard recommendations
- Park reviews and playground guides
- "Things to do with kids" articles
- Hidden gem roundups

Extract specific places with details. Return as JSON:
{
  "places": [
    {
      "name": "Place Name",
      "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
      "description": "What it is and why it's recommended",
      "insiderTip": "Any tips from the blog",
      "cost": "free|under $10|under $20"
    }
  ]
}`;

export async function discoverViaLocalBlogs(
  city: string,
  state: string,
  xaiApiKey: string
): Promise<RawDiscoveryPlace[]> {
  // Step A: Discover local blog domains (12s timeout)
  const discoveryPrompt = BLOG_DISCOVERY_PROMPT
    .replace(/\{\{CITY\}\}/g, city)
    .replace(/\{\{STATE\}\}/g, state);

  let domains: string[] = [];
  try {
    const discoveryRaw = await callGrok(
      GROK_SYSTEM_PROMPT,
      discoveryPrompt,
      xaiApiKey,
      { webSearch: {} },
      { timeoutMs: 12000 }
    );

    const parsed = parseJSONFromResponse<{ domains?: string[] }>(discoveryRaw);
    if (parsed && Array.isArray(parsed.domains)) {
      domains = parsed.domains
        .filter((d) => typeof d === "string" && d.includes("."))
        .slice(0, 5);
    }
  } catch (err) {
    console.error("[Grok] Blog discovery failed:", err);
    return [];
  }

  if (domains.length === 0) return [];

  // Step B: Search those domains for places (12s timeout)
  const searchPrompt = BLOG_SEARCH_PROMPT
    .replace(/\{\{CITY\}\}/g, city)
    .replace(/\{\{STATE\}\}/g, state);

  const tools: GrokToolConfig = {
    webSearch: {
      allowedDomains: domains,
    },
  };

  try {
    const raw = await callGrok(
      GROK_SYSTEM_PROMPT,
      searchPrompt,
      xaiApiKey,
      tools,
      { timeoutMs: 12000 }
    );
    return parseGrokPlaces(raw, "grok_blog");
  } catch (err) {
    console.error("[Grok] Blog search failed:", err);
    return [];
  }
}

// ── Channel 4: Seasonal Activity Search ──

function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function getSeasonStartDate(season: string): string {
  const year = new Date().getFullYear();
  const starts: Record<string, string> = {
    spring: `${year}-03-01`,
    summer: `${year}-06-01`,
    fall: `${year}-09-01`,
    winter: `${year}-12-01`,
  };
  return starts[season] || `${year}-01-01`;
}

const SEASONAL_KEYWORDS: Record<string, string[]> = {
  spring: [
    "easter egg hunt", "spring festival", "baby animals",
    "tulip festival", "plant sale", "fishing opener",
    "wildflower walk", "nature program",
  ],
  summer: [
    "berry picking", "splash pad", "free outdoor concert",
    "farmers market", "swimming hole", "firefly watching",
    "u-pick farm", "outdoor movie night",
  ],
  fall: [
    "pumpkin patch", "apple orchard", "corn maze",
    "fall festival", "hayride", "cider mill",
    "harvest celebration", "leaf peeping",
  ],
  winter: [
    "christmas tree farm", "holiday lights", "sledding hill",
    "ice skating", "indoor play", "hot cocoa",
    "winter nature walk", "holiday market",
  ],
};

const SEASONAL_PROMPT = `Find {{SEASON}} family activities in {{CITY}}, {{STATE}}.

Search for these specific activities:
{{QUERIES}}

Also search X/Twitter for recent posts about {{SEASON}} activities families are enjoying in {{CITY}}.

For each activity/place found:
- Note the specific dates/season it operates
- Capture any tips for visiting with young kids (ages 0-9)
- Check if reservations are needed
- Note if it sells out or gets crowded

Prioritize LOCAL, family-owned operations over commercial chains.

Return as JSON:
{
  "places": [
    {
      "name": "Place Name",
      "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
      "description": "What it is and when it operates",
      "insiderTip": "Tips for visiting with kids",
      "cost": "free|under $10|under $20"
    }
  ]
}`;

export async function discoverViaSeasonal(
  city: string,
  state: string,
  xaiApiKey: string
): Promise<RawDiscoveryPlace[]> {
  const season = getCurrentSeason();
  const keywords = SEASONAL_KEYWORDS[season] || SEASONAL_KEYWORDS.fall;
  const queries = keywords.map((q) => `- "${q} ${city} ${state}"`).join("\n");

  const prompt = SEASONAL_PROMPT
    .replace(/\{\{CITY\}\}/g, city)
    .replace(/\{\{STATE\}\}/g, state)
    .replace(/\{\{SEASON\}\}/g, season)
    .replace(/\{\{QUERIES\}\}/g, queries);

  const tools: GrokToolConfig = {
    webSearch: {
      excludedDomains: [
        "tripadvisor.com", "yelp.com", "timeout.com", "thrillist.com",
      ],
      userLocation: {
        country: "US",
        city,
        region: state,
      },
    },
    xSearch: {
      fromDate: getSeasonStartDate(season),
    },
  };

  const raw = await callGrok(GROK_SYSTEM_PROMPT, prompt, xaiApiKey, tools);
  return parseGrokPlaces(raw, "grok_seasonal", "seasonal");
}

// ── Channel Dispatch Map ──

export type GrokChannel = "x_parents" | "neighborhoods" | "local_blogs" | "seasonal";

export const GROK_CHANNEL_LABELS: Record<GrokChannel, string> = {
  x_parents: "X Parent Search",
  neighborhoods: "Neighborhood Search",
  local_blogs: "Local Blog Search",
  seasonal: "Seasonal Activities",
};

export async function discoverViaGrokChannel(
  channel: GrokChannel,
  city: string,
  state: string,
  xaiApiKey: string
): Promise<{ places: RawDiscoveryPlace[]; meta?: Record<string, unknown> }> {
  switch (channel) {
    case "x_parents": {
      const result = await discoverViaXParents(city, state, xaiApiKey);
      return {
        places: result.places,
        meta: { localAccounts: result.localAccounts },
      };
    }
    case "neighborhoods":
      return { places: await discoverViaNeighborhoods(city, state, xaiApiKey) };
    case "local_blogs":
      return { places: await discoverViaLocalBlogs(city, state, xaiApiKey) };
    case "seasonal":
      return { places: await discoverViaSeasonal(city, state, xaiApiKey) };
    default:
      return { places: [] };
  }
}
