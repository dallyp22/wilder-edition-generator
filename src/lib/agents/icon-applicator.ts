import { Place, PriceTier } from "@/lib/types";
import { ICON_KEY } from "@/lib/config/brand-criteria";
import { CATEGORIES } from "@/lib/config/categories";

function getPricingIcon(tier: PriceTier): string {
  return ICON_KEY.pricing[tier]?.icon || "🔷";
}

function determineBabyFriendly(place: Partial<Place>): boolean {
  const combined = [
    place.name || "",
    place.shortDescription || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  // Libraries, parks, gardens are generally baby-friendly
  if (
    place.category === "library" ||
    place.category === "nature" ||
    place.category === "garden"
  ) {
    return true;
  }

  // Check for stroller-friendly indicators
  const babyIndicators = [
    "stroller",
    "baby",
    "infant",
    "nursing",
    "all ages",
    "family",
    "park",
    "garden",
    "trail",
    "library",
  ];
  if (babyIndicators.some((kw) => combined.includes(kw))) return true;

  // Default: most places we list should be accessible
  return true;
}

function determineToddlerSafe(place: Partial<Place>): boolean {
  const combined = [
    place.name || "",
    place.shortDescription || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  // Most family venues are toddler appropriate
  if (
    ["library", "indoor_play", "museum", "farm", "nature"].includes(
      place.category || ""
    )
  ) {
    return true;
  }

  const toddlerIndicators = [
    "toddler",
    "children",
    "kids",
    "family",
    "play",
    "playground",
    "storytime",
    "discovery",
    "hands-on",
  ];
  if (toddlerIndicators.some((kw) => combined.includes(kw))) return true;

  return true;
}

function determinePreschoolPlus(place: Partial<Place>): boolean {
  // Almost everything is suitable for preschool+ ages
  return true;
}

function determineWarmWeather(place: Partial<Place>): boolean {
  const combined = [
    place.name || "",
    place.shortDescription || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  const outdoorIndicators = [
    "park",
    "trail",
    "garden",
    "farm",
    "outdoor",
    "nature",
    "lake",
    "pool",
    "splash",
    "playground",
    "orchard",
    "pumpkin",
    "field",
    "campground",
    "zoo",
  ];

  // Category defaults
  const categoryConfig = CATEGORIES.find((c) => c.id === place.category);
  if (categoryConfig?.defaultSeasonality.includes("warm")) return true;

  if (outdoorIndicators.some((kw) => combined.includes(kw))) return true;

  return false;
}

function determineWinterSpot(place: Partial<Place>): boolean {
  const combined = [
    place.name || "",
    place.shortDescription || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  const indoorIndicators = [
    "museum",
    "library",
    "indoor",
    "center",
    "art",
    "studio",
    "cafe",
    "theatre",
    "theater",
    "aquarium",
    "planetarium",
    "gallery",
  ];

  // Category defaults
  const categoryConfig = CATEGORIES.find((c) => c.id === place.category);
  if (categoryConfig?.defaultSeasonality.includes("winter")) return true;

  if (indoorIndicators.some((kw) => combined.includes(kw))) return true;

  // Place types from Google
  const indoorTypes = [
    "museum",
    "library",
    "art_gallery",
    "shopping_mall",
    "movie_theater",
  ];
  if ((place.placeTypes || []).some((t) => indoorTypes.includes(t)))
    return true;

  return false;
}

function buildIconString(place: Partial<Place>): string {
  const icons: string[] = [];

  // Pricing icon
  icons.push(getPricingIcon(place.priceTier || "FREE"));

  // Age icons
  if (place.babyFriendly) icons.push(ICON_KEY.ageGroups.baby.icon);
  if (place.toddlerSafe) icons.push(ICON_KEY.ageGroups.toddler.icon);
  if (place.preschoolPlus) icons.push(ICON_KEY.ageGroups.preschool.icon);

  // Season icons
  if (place.warmWeather) icons.push(ICON_KEY.seasonality.warm.icon);
  if (place.winterSpot) icons.push(ICON_KEY.seasonality.winter.icon);

  return icons.join("");
}

export function applyIcons(place: Partial<Place>): Partial<Place> {
  const updated = {
    ...place,
    babyFriendly: determineBabyFriendly(place),
    toddlerSafe: determineToddlerSafe(place),
    preschoolPlus: determinePreschoolPlus(place),
    warmWeather: determineWarmWeather(place),
    winterSpot: determineWinterSpot(place),
  };

  updated.iconString = buildIconString(updated);
  return updated;
}

export function applyIconsToAll(places: Partial<Place>[]): Partial<Place>[] {
  return places.map(applyIcons);
}
