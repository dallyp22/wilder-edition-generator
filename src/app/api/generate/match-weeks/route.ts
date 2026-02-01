import { matchWeeks } from "@/lib/agents/week-matcher";
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

    const weekMatches = await matchWeeks(
      places,
      templateVersion as TemplateVersion,
      city,
      anthropicKey,
      openaiKey
    );

    return Response.json({ weekMatches });
  } catch (err) {
    console.error("Week matching error:", err);
    const message = err instanceof Error ? err.message : "Week matching failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
