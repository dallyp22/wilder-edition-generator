import { NextRequest, NextResponse } from "next/server";
import { selectTemplate } from "@/lib/agents/template-selector";
import { researchAllCategories } from "@/lib/agents/research-agent";
import { enrichAllPlaces } from "@/lib/agents/places-enricher";
import { validateAllPlaces } from "@/lib/agents/brand-validator";
import { applyIconsToAll } from "@/lib/agents/icon-applicator";
import { generateSampleData } from "@/lib/agents/sample-data";
import { Place } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, state, mode } = body;

    if (!city || !state) {
      return NextResponse.json(
        { error: "City and state are required" },
        { status: 400 }
      );
    }

    // Step 1: Template Selection
    const templateSelection = selectTemplate(city, state);

    // Step 2 & 3: Research + Enrichment (or sample data)
    let places: Partial<Place>[];

    if (mode === "demo") {
      // Generate sample data without API keys
      places = generateSampleData(city, state);
    } else {
      const braveKey = process.env.BRAVE_API_KEY;
      const googleKey = process.env.GOOGLE_PLACES_API_KEY;

      if (!braveKey) {
        return NextResponse.json(
          { error: "BRAVE_API_KEY is not configured. Use demo mode or set the environment variable." },
          { status: 400 }
        );
      }

      // Research
      places = await researchAllCategories(city, state, braveKey);

      // Enrich with Google Places if key available
      if (googleKey) {
        places = await enrichAllPlaces(places, googleKey);
      }
    }

    // Step 4: Brand Validation
    places = validateAllPlaces(places);

    // Step 5: Apply Icons
    places = applyIconsToAll(places);

    return NextResponse.json({
      templateSelection,
      places,
      summary: {
        total: places.length,
        recommended: places.filter((p) => p.validationStatus === "RECOMMENDED")
          .length,
        consider: places.filter((p) => p.validationStatus === "CONSIDER")
          .length,
        review: places.filter((p) => p.validationStatus === "REVIEW").length,
        reject: places.filter((p) => p.validationStatus === "REJECT").length,
      },
    });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate edition" },
      { status: 500 }
    );
  }
}
