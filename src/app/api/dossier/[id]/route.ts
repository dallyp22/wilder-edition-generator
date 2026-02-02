import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { cityDossiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const dossier = await db.query.cityDossiers.findFirst({
      where: eq(cityDossiers.id, id),
      with: {
        city: true,
      },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("[Dossier Get] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dossier" },
      { status: 500 }
    );
  }
}
