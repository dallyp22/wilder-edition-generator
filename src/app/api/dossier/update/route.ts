import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cityDossiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DossierDomain } from "@/lib/types/dossier";

const VALID_DOMAINS: DossierDomain[] = [
  "landscape", "animals", "plants", "foodAgriculture", "weather",
  "localPlaces", "cultureHistory", "sensory", "developmental", "crossMedia",
];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dossierId, domain, data } = await req.json();

    if (!dossierId || !domain || !data) {
      return NextResponse.json(
        { error: "dossierId, domain, and data are required" },
        { status: 400 }
      );
    }

    if (!VALID_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: `Invalid domain: ${domain}` },
        { status: 400 }
      );
    }

    await db
      .update(cityDossiers)
      .set({
        [domain]: data,
        updatedAt: new Date(),
      })
      .where(eq(cityDossiers.id, dossierId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dossier Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to update dossier" },
      { status: 500 }
    );
  }
}
