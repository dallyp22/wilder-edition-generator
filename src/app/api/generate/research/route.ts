// Serverless runtime (NOT edge) — allows 60s timeout for comprehensive research
import { NextRequest, NextResponse } from "next/server";
import { runThemedResearch, ResearchSource } from "@/lib/agents/themed-research";
import { TemplateVersion } from "@/lib/config/weekly-themes";

const VALID_SOURCES: ResearchSource[] = ["grok", "gemini", "brave"];
const VALID_TEMPLATES: TemplateVersion[] = ["omaha", "lincoln", "des_moines", "usa"];

export async function POST(request: NextRequest) {
  try {
    const { city, state, source, templateVersion } = await request.json();

    if (!city || !state || !source || !templateVersion) {
      return NextResponse.json(
        { error: "city, state, source, and templateVersion are required" },
        { status: 400 }
      );
    }

    if (!VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source: ${source}. Valid: ${VALID_SOURCES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_TEMPLATES.includes(templateVersion)) {
      return NextResponse.json(
        { error: `Invalid template: ${templateVersion}` },
        { status: 400 }
      );
    }

    const results = await runThemedResearch(city, state, source, templateVersion);

    return NextResponse.json({
      results,
      source,
      count: results.length,
    });
  } catch (err) {
    console.error(`[Research] Error:`, err);
    const message = err instanceof Error ? err.message : "Research failed";
    return NextResponse.json(
      { error: message, results: [], source: "" },
      { status: 500 }
    );
  }
}
