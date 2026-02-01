import { NextRequest, NextResponse } from "next/server";
import { enrichPlace } from "@/lib/agents/places-enricher";
import { Place } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { places } = await request.json();
    if (!places || !Array.isArray(places)) {
      return NextResponse.json(
        { error: "Places array is required" },
        { status: 400 }
      );
    }

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!googleKey) {
      // Return places as-is if no Google key
      return NextResponse.json({ places });
    }

    const enriched: Partial<Place>[] = [];
    for (const place of places) {
      const result = await enrichPlace(place, googleKey);
      enriched.push(result);
      // Small delay to stay within rate limits
      await new Promise((r) => setTimeout(r, 150));
    }

    return NextResponse.json({ places: enriched });
  } catch (err) {
    console.error("Enrichment error:", err);
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}
