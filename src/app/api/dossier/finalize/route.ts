import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cityDossiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dossierId } = await req.json();
    if (!dossierId) {
      return NextResponse.json(
        { error: "dossierId is required" },
        { status: 400 }
      );
    }

    await db
      .update(cityDossiers)
      .set({
        status: "complete",
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cityDossiers.id, dossierId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dossier Finalize] Error:", error);
    return NextResponse.json(
      { error: "Failed to finalize dossier" },
      { status: 500 }
    );
  }
}
