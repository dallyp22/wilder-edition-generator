import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cities, cityDossiers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { city, state } = await req.json();
    if (!city || !state) {
      return NextResponse.json(
        { error: "city and state are required" },
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
        .values({ name: city, state, status: "researching" })
        .returning();
      cityRecord = inserted[0];
    }

    // Find user record
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // Create dossier
    const dossier = await db
      .insert(cityDossiers)
      .values({
        cityId: cityRecord.id,
        status: "generating",
        generatedBy: user?.id || null,
      })
      .returning();

    return NextResponse.json({
      dossierId: dossier[0].id,
      cityId: cityRecord.id,
      city,
      state,
    });
  } catch (error) {
    console.error("[Dossier Create] Error:", error);
    return NextResponse.json(
      { error: "Failed to create dossier" },
      { status: 500 }
    );
  }
}
