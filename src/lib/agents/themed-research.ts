import { PlaceCategory, RawDiscoveryPlace } from "@/lib/types";
import { WeekTheme, TemplateVersion, WEEKLY_THEMES } from "@/lib/config/weekly-themes";
import { CATEGORIES } from "@/lib/config/categories";
import { callGrok } from "@/lib/utils/grok-client";
import { parseJSONFromResponse, normalizeName } from "@/lib/utils/ai-client";
import { discoverCategory } from "@/lib/agents/discovery-agent";

// ── Types ──

export interface ThemedResearchResult {
  week: number;
  theme: string;
  place: string;
  whyItFits: string;
  category: PlaceCategory;
  cost: string;
  link: string;
  source: "grok" | "gemini" | "brave";
}

// ── Prompt Builder ──

const VALID_CATEGORIES: PlaceCategory[] = [
  "nature", "farm", "library", "museum", "indoor_play", "garden", "seasonal",
];

function buildThemeTable(themes: WeekTheme[]): string {
  const rows = themes.map(
    (t) => `| ${t.week} | ${t.title} | ${t.referencePlaceNote} |`
  );
  return `| Week | Theme | Example Place (from reference edition) |\n|------|-------|------------------------------------------|\n${rows.join("\n")}`;
}

export function buildThemedResearchPrompt(
  city: string,
  state: string,
  themes: WeekTheme[]
): string {
  return `Using an existing Wilder Seasons edition as a reference, research real places in ${city}, ${state} that would be a great match for each of the 52 weekly themes below.

ABOUT WILDER SEASONS:
Wilder Seasons is a nature-based weekly family adventure guide. Each week has a theme, and families visit a local place that matches that theme. The guide is for families with children ages 0-9. The brand values accessibility, nature connection, local authenticity, and hidden gems over tourist traps.

REFERENCE THEMES (with example places from an existing edition — find LOCAL equivalents for ${city}):
${buildThemeTable(themes)}

REQUIREMENTS:
- Stay on theme for each week — the place must genuinely connect to the weekly theme
- Kid-friendly (ages 0-9) — safe and engaging for young children
- Free or low-cost (under $20 per person)
- Nature-focused, local, and screen-free
- Hidden gems appreciated over tourist traps
- No chain restaurants, stores, or commercial entertainment centers (no McDonald's, Starbucks, Chuck E Cheese, Sky Zone, etc.)
- Include places within 45 minutes of ${city}
- Real places that currently exist and are open to the public

OUTPUT: Return ONLY a valid JSON array with exactly 52 entries (one per week):
[
  {
    "week": 1,
    "theme": "Theme Name",
    "place": "Exact Place Name",
    "whyItFits": "Why this place matches the theme (1-2 sentences)",
    "category": "nature|farm|library|museum|indoor_play|garden|seasonal",
    "cost": "free|under $10|under $20",
    "link": "website URL if found, or empty string"
  }
]

CRITICAL: Prioritize VARIETY. Do not repeat the same place more than twice across all 52 weeks. Each week should feel like a unique adventure. Return ONLY valid JSON, no other text.`;
}

// ── Source 1: Grok (web_search + x_search) ──

const GROK_SYSTEM_PROMPT = `You are a thorough local researcher for Wilder Seasons, a nature-based family guide publisher. Your job is to find the BEST real local places for families with young children (ages 0-9) that match specific weekly themes. Use web search to verify places exist and are currently operating. Use X/Twitter search to find what local parents actually recommend. Prioritize hidden gems and locally-loved spots over tourist attractions.`;

export async function researchViaGrok(
  city: string,
  state: string,
  themes: WeekTheme[],
  xaiApiKey: string
): Promise<ThemedResearchResult[]> {
  const prompt = buildThemedResearchPrompt(city, state, themes);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fromDate = sixMonthsAgo.toISOString().split("T")[0];

  const raw = await callGrok(GROK_SYSTEM_PROMPT, prompt, xaiApiKey, {
    webSearch: {
      excludedDomains: ["tripadvisor.com", "yelp.com", "timeout.com", "thrillist.com"],
      userLocation: { country: "US", city, region: state },
    },
    xSearch: {
      fromDate,
      excludedHandles: ["scarymommy", "motherly", "todaysparent", "parents"],
    },
  }, { timeoutMs: 120000 });

  return parseThemedResults(raw, "grok");
}

// ── Source 2: Gemini (Google Search grounding) ──

export async function researchViaGemini(
  city: string,
  state: string,
  themes: WeekTheme[],
  geminiApiKey: string
): Promise<ThemedResearchResult[]> {
  const prompt = buildThemedResearchPrompt(city, state, themes);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 16384 },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseThemedResults(text, "gemini");
  } finally {
    clearTimeout(timeout);
  }
}

// ── Source 3: Brave (supplementary category sweep) ──

export async function researchViaBrave(
  city: string,
  state: string,
  braveApiKey?: string,
  geminiApiKey?: string
): Promise<ThemedResearchResult[]> {
  if (!braveApiKey && !geminiApiKey) return [];

  // Run all 7 categories in parallel using existing discovery
  const categoryPromises = CATEGORIES.map(async (cat) => {
    try {
      const places = await discoverCategory(city, state, cat.id, braveApiKey, geminiApiKey);
      return places;
    } catch {
      return [];
    }
  });

  const results = await Promise.all(categoryPromises);
  const allPlaces = results.flat();

  // Deduplicate
  const seen = new Set<string>();
  const unique: RawDiscoveryPlace[] = [];
  for (const p of allPlaces) {
    const key = normalizeName(p.name);
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  // Convert to ThemedResearchResult (not theme-matched, week=0 means unassigned)
  return unique.map((p) => ({
    week: 0,
    theme: "",
    place: p.name,
    whyItFits: p.snippet || "Discovered via web search",
    category: p.category,
    cost: "free",
    link: p.sourceUrl || "",
    source: "brave" as const,
  }));
}

// ── Shared Parser ──

interface RawThemedItem {
  week?: number;
  theme?: string;
  place?: string;
  name?: string;
  whyItFits?: string;
  description?: string;
  category?: string;
  cost?: string;
  link?: string;
  url?: string;
}

function parseThemedResults(
  text: string,
  source: "grok" | "gemini"
): ThemedResearchResult[] {
  let items: RawThemedItem[];
  try {
    items = parseJSONFromResponse<RawThemedItem[]>(text);
    if (!Array.isArray(items)) return [];
  } catch {
    console.error(`[ThemedResearch] Failed to parse ${source} response`);
    return [];
  }

  const results: ThemedResearchResult[] = [];

  for (const item of items) {
    const place = (item.place || item.name || "").trim();
    if (!place || place.length < 3) continue;

    let category: PlaceCategory = "nature";
    if (item.category && VALID_CATEGORIES.includes(item.category as PlaceCategory)) {
      category = item.category as PlaceCategory;
    }

    results.push({
      week: item.week || 0,
      theme: item.theme || "",
      place,
      whyItFits: (item.whyItFits || item.description || "").slice(0, 300),
      category,
      cost: item.cost || "free",
      link: item.link || item.url || "",
      source,
    });
  }

  return results;
}

// ── Main Dispatch ──

export type ResearchSource = "grok" | "gemini" | "brave";

export async function runThemedResearch(
  city: string,
  state: string,
  source: ResearchSource,
  templateVersion: TemplateVersion
): Promise<ThemedResearchResult[]> {
  const themes = WEEKLY_THEMES[templateVersion];
  if (!themes) {
    throw new Error(`Unknown template version: ${templateVersion}`);
  }

  switch (source) {
    case "grok": {
      const xaiKey = process.env.XAI_API_KEY;
      if (!xaiKey) return [];
      return researchViaGrok(city, state, themes, xaiKey);
    }
    case "gemini": {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return [];
      return researchViaGemini(city, state, themes, geminiKey);
    }
    case "brave": {
      const braveKey = process.env.BRAVE_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      return researchViaBrave(city, state, braveKey, geminiKey);
    }
    default:
      return [];
  }
}
