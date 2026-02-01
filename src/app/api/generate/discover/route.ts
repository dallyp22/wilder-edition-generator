import { discoverCategory } from "@/lib/agents/discovery-agent";
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

    const braveKey = process.env.BRAVE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!braveKey && !geminiKey) {
      return Response.json(
        { error: "Need at least one discovery API key (BRAVE_API_KEY or GEMINI_API_KEY)" },
        { status: 400 }
      );
    }

    const places = await discoverCategory(
      city,
      state,
      category as PlaceCategory,
      braveKey,
      geminiKey
    );

    return Response.json({ places, category });
  } catch (err) {
    console.error("Discovery error:", err);
    const message = err instanceof Error ? err.message : "Discovery failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
