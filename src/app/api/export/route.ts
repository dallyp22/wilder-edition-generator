import { NextRequest, NextResponse } from "next/server";
import { generateExcel, workbookToBuffer } from "@/lib/utils/excel-export";
import { Place } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { places, city, state, templateVersion } = body;

    if (!places || !city || !state) {
      return NextResponse.json(
        { error: "Places, city, and state are required" },
        { status: 400 }
      );
    }

    const wb = generateExcel(places as Partial<Place>[], city, state, templateVersion);
    const buffer = workbookToBuffer(wb);

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const filename = `WilderSeasons_${city.replace(/\s/g, "")}_${state}_${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to export Excel file" },
      { status: 500 }
    );
  }
}
