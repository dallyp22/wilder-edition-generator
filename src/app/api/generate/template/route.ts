import { NextRequest, NextResponse } from "next/server";
import { selectTemplate } from "@/lib/agents/template-selector";

export async function POST(request: NextRequest) {
  try {
    const { city, state } = await request.json();
    if (!city || !state) {
      return NextResponse.json({ error: "City and state are required" }, { status: 400 });
    }
    const templateSelection = selectTemplate(city, state);
    return NextResponse.json({ templateSelection });
  } catch (err) {
    console.error("Template selection error:", err);
    return NextResponse.json({ error: "Template selection failed" }, { status: 500 });
  }
}
