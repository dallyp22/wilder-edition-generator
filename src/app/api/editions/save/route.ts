import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cities, editions, places as placesTable, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Place, WeekMatch } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      city,
      state,
      templateVersion,
      templateSelection,
      places: clientPlaces,
      weekMatches,
      rawResearchCount,
    } = await req.json() as {
      city: string;
      state: string;
      templateVersion: string;
      templateSelection: Record<string, unknown>;
      places: Partial<Place>[];
      weekMatches: WeekMatch[];
      rawResearchCount?: number;
    };

    if (!city || !state || !templateVersion || !clientPlaces?.length) {
      return NextResponse.json(
        { error: "city, state, templateVersion, and places are required" },
        { status: 400 }
      );
    }

    // Find or create city
    let cityRecord = await db.query.cities.findFirst({
      where: and(eq(cities.name, city), eq(cities.state, state)),
    });

    if (!cityRecord) {
      const inserted = await db
        .insert(cities)
        .values({ name: city, state, status: "active" })
        .returning();
      cityRecord = inserted[0];
    }

    // Find user record
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // Compute summary stats
    const recommended = clientPlaces.filter((p) => p.validationStatus === "RECOMMENDED").length;
    const consider = clientPlaces.filter((p) => p.validationStatus === "CONSIDER").length;

    // Insert edition
    const editionRows = await db
      .insert(editions)
      .values({
        cityId: cityRecord.id,
        city,
        state,
        templateVersion,
        placeCount: clientPlaces.length,
        status: "complete",
        templateSelection,
        summary: {
          recommended,
          consider,
          weekMatchCount: weekMatches?.length || 0,
          rawResearchCount: rawResearchCount || 0,
          weekMatches: weekMatches || [],
        },
        createdBy: user?.id || null,
      })
      .returning();

    const edition = editionRows[0];

    // Bulk insert places
    if (clientPlaces.length > 0) {
      const placeRows = clientPlaces.map((p) => ({
        editionId: edition.id,
        name: p.name || "Unknown",
        category: p.category || "nature",
        shortDescription: p.shortDescription || null,
        whyWeLoveIt: p.whyWeLoveIt || null,
        insiderTip: p.insiderTip || null,
        address: p.address || null,
        city: p.city || city,
        state: p.state || state,
        latitude: p.latitude != null ? String(p.latitude) : null,
        longitude: p.longitude != null ? String(p.longitude) : null,
        googleRating: p.googleRating != null ? String(p.googleRating) : null,
        googleReviewCount: p.googleReviewCount ?? null,
        website: p.website || null,
        phone: p.phone || null,
        brandScore: p.brandScore ?? null,
        validationStatus: p.validationStatus || "REVIEW",
        priceTier: p.priceTier || "FREE",
        isChain: p.isChain ?? false,
        babyFriendly: p.babyFriendly ?? null,
        toddlerSafe: p.toddlerSafe ?? null,
        preschoolPlus: p.preschoolPlus ?? null,
        warmWeather: p.warmWeather ?? null,
        winterSpot: p.winterSpot ?? null,
        iconString: p.iconString || null,
        sourceUrl: p.sourceUrl || null,
        weekAssignments: p.weekSuggestions || null,
        metadata: {
          editorialNotes: p.editorialNotes || "",
          placeTypes: p.placeTypes || [],
          priceDetails: p.priceDetails || "",
        },
      }));

      await db.insert(placesTable).values(placeRows);
    }

    return NextResponse.json({
      editionId: edition.id,
      city,
      state,
      placeCount: clientPlaces.length,
    });
  } catch (error) {
    console.error("[Editions Save] Error:", error);
    return NextResponse.json(
      { error: "Failed to save edition" },
      { status: 500 }
    );
  }
}
