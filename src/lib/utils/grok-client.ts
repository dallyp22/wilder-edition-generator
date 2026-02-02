// xAI Grok API client — Chat Completions with live_search for fast single-pass search
//
// Note: The Responses API (/v1/responses) supports richer web_search + x_search with
// domain/location filters, but uses agentic multi-round search that exceeds Vercel's
// 60s serverless limit. Chat Completions with live_search is a single fast search pass.

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
  const model = options?.model || "grok-3-fast";
  const timeoutMs = options?.timeoutMs || 45000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Chat Completions with live_search: single-pass search, fast enough for 60s limit.
    // Location/domain context is embedded in the research prompt itself.
    const toolsArray: Record<string, unknown>[] =
      (tools.webSearch || tools.xSearch) ? [{ type: "live_search" }] : [];

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(toolsArray.length > 0 && { tools: toolsArray }),
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Grok API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}
