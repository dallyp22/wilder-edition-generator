import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { editions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user record
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ editions: [] });
    }

    const rows = await db.query.editions.findMany({
      where: eq(editions.createdBy, user.id),
      orderBy: [desc(editions.createdAt)],
    });

    const editionList = rows.map((e) => ({
      id: e.id,
      city: e.city,
      state: e.state,
      templateVersion: e.templateVersion,
      placeCount: e.placeCount,
      status: e.status,
      summary: e.summary,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ editions: editionList });
  } catch (error) {
    console.error("[Editions List] Error:", error);
    return NextResponse.json(
      { error: "Failed to list editions" },
      { status: 500 }
    );
  }
}
