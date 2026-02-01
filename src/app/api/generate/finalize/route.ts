import { NextRequest, NextResponse } from "next/server";
import { validateAllPlaces } from "@/lib/agents/brand-validator";
import { applyIconsToAll } from "@/lib/agents/icon-applicator";

export async function POST(request: NextRequest) {
  try {
    const { places } = await request.json();
    if (!places || !Array.isArray(places)) {
      return NextResponse.json(
        { error: "Places array is required" },
        { status: 400 }
      );
    }

    // Validate and apply icons (pure logic, no API calls)
    const validated = validateAllPlaces(places);
    const finalized = applyIconsToAll(validated);

    return NextResponse.json({
      places: finalized,
      summary: {
        total: finalized.length,
        recommended: finalized.filter((p) => p.validationStatus === "RECOMMENDED").length,
        consider: finalized.filter((p) => p.validationStatus === "CONSIDER").length,
        review: finalized.filter((p) => p.validationStatus === "REVIEW").length,
        reject: finalized.filter((p) => p.validationStatus === "REJECT").length,
      },
    });
  } catch (err) {
    console.error("Finalize error:", err);
    return NextResponse.json({ error: "Finalization failed" }, { status: 500 });
  }
}
