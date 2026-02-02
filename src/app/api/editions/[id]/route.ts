import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { editions, places as placesTable, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Load edition (owned by user)
    const edition = await db.query.editions.findFirst({
      where: and(eq(editions.id, id), eq(editions.createdBy, user.id)),
    });

    if (!edition) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }

    // Load all places for this edition
    const dbPlaces = await db.query.places.findMany({
      where: eq(placesTable.editionId, edition.id),
    });

    // Reconstruct client-side Place shape
    const clientPlaces = dbPlaces.map((p) => {
      const meta = (p.metadata || {}) as Record<string, unknown>;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        address: p.address || "",
        city: p.city || edition.city,
        state: p.state || edition.state,
        zipCode: "",
        latitude: p.latitude ? parseFloat(p.latitude) : null,
        longitude: p.longitude ? parseFloat(p.longitude) : null,
        website: p.website || "",
        phone: p.phone || "",
        googleRating: p.googleRating ? parseFloat(p.googleRating) : null,
        googleReviewCount: p.googleReviewCount ?? null,
        priceTier: p.priceTier || "FREE",
        priceDetails: (meta.priceDetails as string) || "",
        babyFriendly: p.babyFriendly ?? true,
        toddlerSafe: p.toddlerSafe ?? true,
        preschoolPlus: p.preschoolPlus ?? true,
        warmWeather: p.warmWeather ?? false,
        winterSpot: p.winterSpot ?? false,
        iconString: p.iconString || "",
        shortDescription: p.shortDescription || "",
        whyWeLoveIt: p.whyWeLoveIt || "",
        insiderTip: p.insiderTip || "",
        brandScore: p.brandScore ?? 0,
        validationStatus: p.validationStatus || "REVIEW",
        editorialNotes: (meta.editorialNotes as string) || "",
        weekSuggestions: (p.weekAssignments as number[]) || [],
        sourceUrl: p.sourceUrl || "",
        isChain: p.isChain ?? false,
        placeTypes: (meta.placeTypes as string[]) || [],
      };
    });

    // Extract weekMatches from edition summary
    const summary = (edition.summary || {}) as Record<string, unknown>;
    const weekMatches = (summary.weekMatches || []) as Array<{
      week: number;
      placeName: string;
      reason: string;
      alternateName: string;
      alternateReason: string;
    }>;

    return NextResponse.json({
      id: edition.id,
      city: edition.city,
      state: edition.state,
      templateVersion: edition.templateVersion,
      templateSelection: edition.templateSelection,
      placeCount: edition.placeCount,
      status: edition.status,
      createdAt: edition.createdAt.toISOString(),
      places: clientPlaces,
      weekMatches,
      summary: {
        recommended: summary.recommended || 0,
        consider: summary.consider || 0,
      },
    });
  } catch (error) {
    console.error("[Edition Detail] Error:", error);
    return NextResponse.json(
      { error: "Failed to load edition" },
      { status: 500 }
    );
  }
}
