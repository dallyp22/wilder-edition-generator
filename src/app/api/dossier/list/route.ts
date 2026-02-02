import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cityDossiers, cities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dossiers = await db
      .select({
        id: cityDossiers.id,
        status: cityDossiers.status,
        version: cityDossiers.version,
        generatedAt: cityDossiers.generatedAt,
        createdAt: cityDossiers.createdAt,
        cityName: cities.name,
        cityState: cities.state,
      })
      .from(cityDossiers)
      .leftJoin(cities, eq(cityDossiers.cityId, cities.id))
      .orderBy(desc(cityDossiers.createdAt));

    return NextResponse.json({ dossiers });
  } catch (error) {
    console.error("[Dossier List] Error:", error);
    return NextResponse.json(
      { error: "Failed to list dossiers" },
      { status: 500 }
    );
  }
}
