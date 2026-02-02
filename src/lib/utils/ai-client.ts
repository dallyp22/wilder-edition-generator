export async function callClaude(
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
        max_tokens: 8192,
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

export async function callOpenAI(
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
        max_tokens: 8192,
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

export async function callOpus(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-20250514",
        max_tokens: 32768,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Opus API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.content[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAI(
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

export function parseJSONFromResponse<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  return JSON.parse(text);
}

export function generatePlaceId(name: string, city: string): string {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^the/, "");
}
