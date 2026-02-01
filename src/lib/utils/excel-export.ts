import * as XLSX from "xlsx";
import { Place, PlaceCategory, WeekMatch } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/config/categories";
import { TemplateVersion, WEEKLY_THEMES, TEMPLATE_VERSION_LABELS, getSeason } from "@/lib/config/weekly-themes";

function priceTierDisplay(tier: string): string {
  switch (tier) {
    case "FREE":
      return "FREE";
    case "$5_$10":
      return "$";
    case "$10_$15":
      return "$$";
    case "$15_plus":
      return "$$$";
    default:
      return tier;
  }
}

function findBestMatch(
  theme: { week: number; title: string; referencePlaceNote: string },
  places: Partial<Place>[]
): Partial<Place> | null {
  const title = theme.title.toLowerCase();
  const ref = theme.referencePlaceNote.toLowerCase();

  const scored = places
    .filter((p) => p.validationStatus !== "REJECT")
    .map((p) => {
      let score = 0;
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();

      if (p.weekSuggestions?.includes(theme.week)) score += 100;
      if (title.includes("farm") && cat === "farm") score += 30;
      if (title.includes("garden") && (cat === "garden" || cat === "nature")) score += 30;
      if (title.includes("zoo") && (cat === "farm" || name.includes("zoo"))) score += 30;
      if (title.includes("library") && cat === "library") score += 30;
      if (title.includes("museum") && cat === "museum") score += 30;
      if ((title.includes("craft") || title.includes("art") || title.includes("play")) && cat === "indoor_play") score += 30;
      if (title.includes("nature") || title.includes("trail") || title.includes("prairie")) {
        if (cat === "nature") score += 25;
      }
      if ((title.includes("pumpkin") || title.includes("halloween") || title.includes("christmas")) && cat === "seasonal") score += 30;
      if ((title.includes("spring") || title.includes("bloom") || title.includes("flower")) && (cat === "garden" || cat === "nature")) score += 20;
      if ((title.includes("water") || title.includes("splash") || title.includes("lake")) && cat === "nature") score += 20;

      const nameWords = name.split(/\s+/).filter((w) => w.length > 3);
      for (const word of nameWords) {
        if (ref.includes(word)) score += 10;
      }

      score += (p.brandScore || 0) / 10;
      return { place: p, score };
    })
    .filter((s) => s.score > 5)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.place || null;
}

export function generateExcel(
  places: Partial<Place>[],
  city: string,
  state: string,
  templateVersion?: TemplateVersion,
  weekMatches?: WeekMatch[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Places Master List
  const masterHeaders = [
    "Place Name",
    "Category",
    "Address",
    "City, State ZIP",
    "Website",
    "Phone",
    "Google Rating",
    "Price Tier",
    "Price Details",
    "Baby",
    "Toddler",
    "Preschool",
    "Warm Weather",
    "Winter Spot",
    "Icon String",
    "Short Description",
    "Brand Score",
    "Status",
    "Editorial Notes",
    "Week Suggestions",
  ];

  const masterData = places
    .sort((a, b) => {
      // Sort by category then by brand score descending
      const catCompare = (a.category || "").localeCompare(b.category || "");
      if (catCompare !== 0) return catCompare;
      return (b.brandScore || 0) - (a.brandScore || 0);
    })
    .map((p) => [
      p.name || "",
      CATEGORY_LABELS[p.category || ""] || p.category || "",
      p.address || "",
      `${p.city || city}, ${p.state || state} ${p.zipCode || ""}`.trim(),
      p.website || "",
      p.phone || "",
      p.googleRating
        ? `${p.googleRating} (${p.googleReviewCount || 0} reviews)`
        : "",
      priceTierDisplay(p.priceTier || "FREE"),
      p.priceDetails || "",
      p.babyFriendly ? "✓" : "",
      p.toddlerSafe ? "✓" : "",
      p.preschoolPlus ? "✓" : "",
      p.warmWeather ? "✓" : "",
      p.winterSpot ? "✓" : "",
      p.iconString || "",
      p.shortDescription || "",
      p.brandScore || 0,
      p.validationStatus || "",
      p.editorialNotes || "",
      (p.weekSuggestions || []).join(", "),
    ]);

  const ws1 = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterData]);

  // Set column widths
  ws1["!cols"] = [
    { wch: 30 }, // Place Name
    { wch: 28 }, // Category
    { wch: 30 }, // Address
    { wch: 25 }, // City, State ZIP
    { wch: 35 }, // Website
    { wch: 15 }, // Phone
    { wch: 18 }, // Rating
    { wch: 10 }, // Price Tier
    { wch: 20 }, // Price Details
    { wch: 6 }, // Baby
    { wch: 8 }, // Toddler
    { wch: 10 }, // Preschool
    { wch: 10 }, // Warm
    { wch: 10 }, // Winter
    { wch: 15 }, // Icon String
    { wch: 40 }, // Description
    { wch: 10 }, // Score
    { wch: 15 }, // Status
    { wch: 40 }, // Notes
    { wch: 20 }, // Weeks
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Places Master List");

  // Sheet 2: Category Summary
  const categories = [
    ...new Set(places.map((p) => p.category).filter(Boolean)),
  ] as PlaceCategory[];

  const summaryHeaders = [
    "Category",
    "Total Count",
    "Recommended",
    "Consider",
    "Review",
    "Reject",
    "Avg Score",
    "Free",
    "$5-$10",
    "$10-$15",
  ];

  const summaryData = categories.map((cat) => {
    const catPlaces = places.filter((p) => p.category === cat);
    const scores = catPlaces
      .map((p) => p.brandScore || 0)
      .filter((s) => s > 0);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    return [
      CATEGORY_LABELS[cat] || cat,
      catPlaces.length,
      catPlaces.filter((p) => p.validationStatus === "RECOMMENDED").length,
      catPlaces.filter((p) => p.validationStatus === "CONSIDER").length,
      catPlaces.filter((p) => p.validationStatus === "REVIEW").length,
      catPlaces.filter((p) => p.validationStatus === "REJECT").length,
      avgScore,
      catPlaces.filter((p) => p.priceTier === "FREE").length,
      catPlaces.filter((p) => p.priceTier === "$5_$10").length,
      catPlaces.filter((p) => p.priceTier === "$10_$15").length,
    ];
  });

  const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
  ws2["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Category Summary");

  // Sheet 3: Human Review Queue
  const reviewPlaces = places.filter(
    (p) =>
      p.validationStatus === "CONSIDER" || p.validationStatus === "REVIEW"
  );

  const reviewHeaders = [
    "Place Name",
    "Category",
    "Status",
    "Brand Score",
    "Reason for Review",
    "Website",
    "Price Tier",
  ];

  const reviewData = reviewPlaces.map((p) => [
    p.name || "",
    CATEGORY_LABELS[p.category || ""] || p.category || "",
    p.validationStatus || "",
    p.brandScore || 0,
    p.editorialNotes || "",
    p.website || "",
    priceTierDisplay(p.priceTier || "FREE"),
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([reviewHeaders, ...reviewData]);
  ws3["!cols"] = [
    { wch: 30 },
    { wch: 28 },
    { wch: 15 },
    { wch: 10 },
    { wch: 40 },
    { wch: 35 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Human Review Queue");

  // Sheet 4: Rejection Log
  const rejectedPlaces = places.filter(
    (p) => p.validationStatus === "REJECT"
  );

  const rejectHeaders = [
    "Place Name",
    "Category",
    "Reason",
    "Source URL",
    "Notes",
  ];

  const rejectData = rejectedPlaces.map((p) => [
    p.name || "",
    CATEGORY_LABELS[p.category || ""] || p.category || "",
    p.editorialNotes || "",
    p.sourceUrl || "",
    "",
  ]);

  const ws4 = XLSX.utils.aoa_to_sheet([rejectHeaders, ...rejectData]);
  ws4["!cols"] = [
    { wch: 30 },
    { wch: 28 },
    { wch: 40 },
    { wch: 40 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "Rejection Log");

  // Sheet 5: Weekly Plan (if template version provided)
  if (templateVersion && WEEKLY_THEMES[templateVersion]) {
    const themes = WEEKLY_THEMES[templateVersion];
    const weeklyHeaders = [
      "Week",
      "Season",
      "Theme",
      "Reference Place (from template)",
      "Matched Local Place",
      "Match Reason",
      "Alternate Place",
      "Icons",
      "Brand Score",
      "Status",
    ];

    const weeklyData = themes.map((theme) => {
      const season = getSeason(theme.week);
      const aiMatch = weekMatches?.find((m) => m.week === theme.week);
      const matched = aiMatch
        ? places.find((p) => p.name === aiMatch.placeName) || null
        : findBestMatch(theme, places);
      const alternate = aiMatch
        ? places.find((p) => p.name === aiMatch.alternateName) || null
        : null;
      return [
        theme.week,
        season.charAt(0).toUpperCase() + season.slice(1),
        theme.title,
        theme.referencePlaceNote,
        matched?.name || aiMatch?.placeName || "",
        aiMatch?.reason || "",
        alternate?.name || aiMatch?.alternateName || "",
        matched?.iconString || "",
        matched?.brandScore || "",
        matched?.validationStatus || "",
      ];
    });

    const ws5w = XLSX.utils.aoa_to_sheet([weeklyHeaders, ...weeklyData]);
    ws5w["!cols"] = [
      { wch: 6 },
      { wch: 8 },
      { wch: 25 },
      { wch: 60 },
      { wch: 30 },
      { wch: 40 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      ws5w,
      `Weekly Plan (${TEMPLATE_VERSION_LABELS[templateVersion].split(" — ")[0]})`
    );
  }

  // Sheet 6: Icon Key Reference
  const iconData = [
    ["Icon Key Reference"],
    [],
    ["PRICING"],
    ["🔷", "FREE admission", "No admission cost"],
    ["💲", "$5-$10/person", "Admission $5-$10"],
    ["💲💲", "$10-$15/person", "Admission $10-$15"],
    ["💲💲💲", "$15+/person", "Admission $15+ (flagged for review)"],
    [],
    ["AGE GROUPS"],
    ["👶", "Baby-friendly", "Safe for 0-12 months"],
    ["🧒", "Toddler-safe", "Safe for 1-3 years"],
    ["👦", "Preschool+", "Good for 3-5 years"],
    [],
    ["SEASONALITY"],
    ["☀️", "Warm weather", "Best in warm weather / outdoor"],
    ["❄️", "Winter spot", "Great winter spot / indoor"],
    [],
    ["EXAMPLE COMBINATIONS"],
    ["🔷👶🧒👦☀️❄️", "Free, all ages, year-round"],
    ["🔷👶🧒👦☀️", "Free, all ages, warm weather"],
    ["💲🧒👦❄️", "$5-$10, toddler+, winter"],
  ];

  const ws5 = XLSX.utils.aoa_to_sheet(iconData);
  ws5["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Icon Key Reference");

  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
