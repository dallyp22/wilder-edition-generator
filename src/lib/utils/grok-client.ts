// xAI Grok API client — Responses API for agentic search (web_search + x_search)
//
// Uses the Responses API (/v1/responses) which supports full agentic multi-round
// search with domain filters, location hints, and X handle/date filters.
// Requires Vercel Pro (300s serverless limit) for adequate time.

export interface GrokWebSearchConfig {
  allowedDomains?: string[];
  excludedDomains?: string[];
  userLocation?: {
    country: string;
    city: string;
    region: string;
    timezone?: string;
  };
}

export interface GrokXSearchConfig {
  excludedHandles?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface GrokToolConfig {
  webSearch?: GrokWebSearchConfig;
  xSearch?: GrokXSearchConfig;
}

function buildToolsArray(config: GrokToolConfig): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];

  if (config.webSearch) {
    const ws = config.webSearch;
    tools.push({
      type: "web_search",
      ...(ws.allowedDomains && { allowed_domains: ws.allowedDomains }),
      ...(ws.excludedDomains && { excluded_domains: ws.excludedDomains }),
      ...(ws.userLocation && {
        user_location_country: ws.userLocation.country,
        user_location_city: ws.userLocation.city,
        user_location_region: ws.userLocation.region,
        ...(ws.userLocation.timezone && {
          user_location_timezone: ws.userLocation.timezone,
        }),
      }),
    });
  }

  if (config.xSearch) {
    const xs = config.xSearch;
    tools.push({
      type: "x_search",
      ...(xs.excludedHandles && { excluded_x_handles: xs.excludedHandles }),
      ...(xs.fromDate && { from_date: xs.fromDate }),
      ...(xs.toDate && { to_date: xs.toDate }),
    });
  }

  return tools;
}

interface ResponsesOutputItem {
  type: string;
  role?: string;
  content?: string | { type: string; text: string }[];
  text?: string;
}

export async function callGrok(
  systemPrompt: string,
  userPrompt: string,
  xaiApiKey: string,
  tools: GrokToolConfig,
  options?: {
    model?: string;
    timeoutMs?: number;
  }
): Promise<string> {
  const model = options?.model || "grok-4-1-fast";
  const timeoutMs = options?.timeoutMs || 120000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Responses API: full agentic search with web_search + x_search
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: buildToolsArray(tools),
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Grok API error: ${res.status} - ${err}`);
    }

    const data = await res.json();

    // Responses API convenience field
    if (data.output_text) return data.output_text;

    // Fallback: parse output array for assistant message
    if (Array.isArray(data.output)) {
      for (let i = data.output.length - 1; i >= 0; i--) {
        const item: ResponsesOutputItem = data.output[i];
        if (item.type === "message" && item.role === "assistant") {
          if (typeof item.content === "string") return item.content;
          if (Array.isArray(item.content)) {
            const text = item.content
              .filter((p) => p.type === "output_text" || p.type === "text")
              .map((p) => p.text)
              .join("");
            if (text) return text;
          }
        }
      }
    }

    throw new Error("Could not parse Grok Responses API output");
  } finally {
    clearTimeout(timeout);
  }
}
