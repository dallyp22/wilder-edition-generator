import { NextRequest, NextResponse } from "next/server";
import { RESEARCH_FUNCTIONS } from "@/lib/agents/dossier-research";
import { DOMAIN_SLUGS } from "@/lib/types/dossier";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain: slug } = await params;
    const { city, state } = await req.json();

    if (!city || !state) {
      return NextResponse.json(
        { error: "city and state are required" },
        { status: 400 }
      );
    }

    const domainKey = DOMAIN_SLUGS[slug];
    if (!domainKey || !RESEARCH_FUNCTIONS[domainKey]) {
      return NextResponse.json(
        { error: `Unknown domain: ${slug}. Valid: ${Object.keys(DOMAIN_SLUGS).join(", ")}` },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const researchFn = RESEARCH_FUNCTIONS[domainKey];
    const data = await researchFn(city, state, geminiKey);

    return NextResponse.json({ domain: domainKey, data });
  } catch (error) {
    const slug = (await params).domain;
    console.error(`[Dossier Research] ${slug} failed:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 }
    );
  }
}
