import { aiMatchWeeks } from "@/lib/agents/ai-researcher";
import { TemplateVersion } from "@/lib/config/weekly-themes";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { places, templateVersion, city } = await request.json();
    if (!places || !Array.isArray(places) || !templateVersion || !city) {
      return Response.json(
        { error: "Places array, templateVersion, and city are required" },
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

    const weekMatches = await aiMatchWeeks(
      places,
      templateVersion as TemplateVersion,
      city,
      anthropicKey,
      openaiKey
    );

    return Response.json({ weekMatches });
  } catch (err) {
    console.error("AI week matching error:", err);
    const message = err instanceof Error ? err.message : "AI week matching failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
