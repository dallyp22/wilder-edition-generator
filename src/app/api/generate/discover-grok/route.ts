import { discoverViaGrokChannel, GrokChannel } from "@/lib/agents/grok-discovery";

export const runtime = "edge";

const VALID_CHANNELS: GrokChannel[] = [
  "x_parents", "neighborhoods", "local_blogs", "seasonal",
];

export async function POST(request: Request) {
  try {
    const { city, state, channel } = await request.json();

    if (!city || !state || !channel) {
      return Response.json(
        { error: "City, state, and channel are required" },
        { status: 400 }
      );
    }

    if (!VALID_CHANNELS.includes(channel)) {
      return Response.json(
        { error: `Invalid channel: ${channel}. Valid: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 }
      );
    }

    const xaiApiKey = process.env.XAI_API_KEY;

    // Graceful degradation: return empty if no key
    if (!xaiApiKey) {
      return Response.json({ places: [], channel });
    }

    const result = await discoverViaGrokChannel(
      channel as GrokChannel,
      city,
      state,
      xaiApiKey
    );

    return Response.json({
      places: result.places,
      channel,
      meta: result.meta,
    });
  } catch (err) {
    console.error("[Grok Discovery] Error:", err);
    const message = err instanceof Error ? err.message : "Grok discovery failed";
    return Response.json({ error: message, places: [], channel: "" }, { status: 500 });
  }
}
