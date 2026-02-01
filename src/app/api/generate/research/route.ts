import { NextRequest, NextResponse } from "next/server";
import { researchCategory } from "@/lib/agents/research-agent";
import { PlaceCategory } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { city, state, category } = await request.json();
    if (!city || !state || !category) {
      return NextResponse.json(
        { error: "City, state, and category are required" },
        { status: 400 }
      );
    }

    const braveKey = process.env.BRAVE_API_KEY;
    if (!braveKey) {
      return NextResponse.json(
        { error: "BRAVE_API_KEY is not configured" },
        { status: 400 }
      );
    }

    const places = await researchCategory(
      city,
      state,
      category as PlaceCategory,
      braveKey
    );

    return NextResponse.json({ places, category });
  } catch (err) {
    console.error("Research error:", err);
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
