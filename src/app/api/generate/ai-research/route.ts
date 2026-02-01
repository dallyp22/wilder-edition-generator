import { aiResearchCategory } from "@/lib/agents/ai-researcher";
import { PlaceCategory } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { city, state, category } = await request.json();
    if (!city || !state || !category) {
      return Response.json(
        { error: "City, state, and category are required" },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!anthropicKey && !openaiKey) {
      return Response.json(
        { error: "No AI API keys configured (need ANTHROPIC_API_KEY or OPENAI_API_KEY)" },
        { status: 400 }
      );
    }

    const places = await aiResearchCategory(
      city,
      state,
      category as PlaceCategory,
      anthropicKey,
      openaiKey
    );

    return Response.json({ places, category });
  } catch (err) {
    console.error("AI research error:", err);
    const message = err instanceof Error ? err.message : "AI research failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
