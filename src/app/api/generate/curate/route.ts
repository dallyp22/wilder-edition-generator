import { curatePlaces } from "@/lib/agents/curation-agent";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { city, state, rawPlaces } = await request.json();
    if (!city || !state || !rawPlaces || !Array.isArray(rawPlaces)) {
      return Response.json(
        { error: "City, state, and rawPlaces array are required" },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const places = await curatePlaces(
      city,
      state,
      rawPlaces,
      anthropicKey,
      openaiKey
    );

    return Response.json({ places });
  } catch (err) {
    console.error("Curation error:", err);
    const message = err instanceof Error ? err.message : "Curation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
