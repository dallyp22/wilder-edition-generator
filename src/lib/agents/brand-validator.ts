import { Place, ValidationStatus, PriceTier } from "@/lib/types";
import { BRAND_CRITERIA } from "@/lib/config/brand-criteria";

interface ValidationResult {
  brandScore: number;
  validationStatus: ValidationStatus;
  editorialNotes: string;
}

function calculateAccessibilityScore(priceTier: PriceTier): number {
  return BRAND_CRITERIA.accessibilityScoring[priceTier] ?? 50;
}

function calculateNatureScore(place: Partial<Place>): number {
  const combined = [
    place.name || "",
    place.shortDescription || "",
    place.category || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  // Direct nature category bonus
  if (place.category === "nature" || place.category === "farm") {
    score += 40;
  }

  // Nature keyword matches
  const matches = BRAND_CRITERIA.natureKeywords.filter((kw) =>
    combined.includes(kw)
  );
  score += Math.min(matches.length * 12, 60);

  // Google place types that indicate nature
  const natureTypes = [
    "park",
    "natural_feature",
    "campground",
    "zoo",
    "aquarium",
  ];
  const typeMatches = (place.placeTypes || []).filter((t) =>
    natureTypes.includes(t)
  );
  score += typeMatches.length * 15;

  return Math.min(score, 100);
}

function calculateFamilyScore(place: Partial<Place>): number {
  let score = 40; // Base score — most places are somewhat family friendly

  const combined = [
    place.name || "",
    place.shortDescription || "",
    ...(place.placeTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  // Family keyword matches
  const matches = BRAND_CRITERIA.familyKeywords.filter((kw) =>
    combined.includes(kw)
  );
  score += Math.min(matches.length * 10, 30);

  // Category bonuses
  if (place.category === "library") score += 20;
  if (place.category === "indoor_play") score += 25;
  if (place.category === "museum") score += 15;

  // High Google rating indicates family-friendliness
  if (place.googleRating && place.googleRating >= 4.5) score += 10;
  if (place.googleRating && place.googleRating >= 4.0) score += 5;

  // Many reviews = well-established
  if (place.googleReviewCount && place.googleReviewCount >= 100) score += 5;

  return Math.min(score, 100);
}

function calculateLocalScore(place: Partial<Place>): number {
  let score = 50; // Default moderate score

  // Chain detection
  if (place.isChain) {
    score -= 40;
  }

  // Public entities (libraries, parks) score high
  const publicTypes = [
    "library",
    "park",
    "local_government_office",
    "city_hall",
  ];
  const isPublic = (place.placeTypes || []).some((t) =>
    publicTypes.includes(t)
  );
  if (isPublic) score += 30;

  // Libraries and nature are inherently local/community
  if (place.category === "library") score += 25;
  if (place.category === "nature") score += 15;
  if (place.category === "farm") score += 20;

  // Review count as proxy for community engagement
  if (place.googleReviewCount) {
    if (place.googleReviewCount >= 500) score += 10;
    else if (place.googleReviewCount >= 100) score += 15;
    else if (place.googleReviewCount >= 20) score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
}

function checkHardFilters(place: Partial<Place>): string | null {
  // Chain with commercial focus
  if (place.isChain) {
    const combined = (place.name || "").toLowerCase();
    const isCommercial = BRAND_CRITERIA.chainIndicators.some((c) =>
      combined.includes(c)
    );
    if (isCommercial) return "Chain/franchise with primarily commercial focus";
  }

  // Adult venue check
  const combined = [place.name || "", place.shortDescription || ""]
    .join(" ")
    .toLowerCase();
  if (
    BRAND_CRITERIA.adultVenueKeywords.some((kw) => combined.includes(kw))
  ) {
    return "Adult-oriented venue";
  }

  return null;
}

export function validatePlace(place: Partial<Place>): ValidationResult {
  // Check hard filters first
  const hardReject = checkHardFilters(place);
  if (hardReject) {
    return {
      brandScore: 0,
      validationStatus: "REJECT",
      editorialNotes: `Hard filter: ${hardReject}`,
    };
  }

  // Calculate component scores
  const accessScore = calculateAccessibilityScore(place.priceTier || "FREE");
  const natureScore = calculateNatureScore(place);
  const familyScore = calculateFamilyScore(place);
  const localScore = calculateLocalScore(place);

  // Weighted average
  const weights = BRAND_CRITERIA.scoringWeights;
  const brandScore = Math.round(
    accessScore * weights.accessibility +
      natureScore * weights.natureConnection +
      familyScore * weights.familyFriendliness +
      localScore * weights.localAuthenticity
  );

  // Determine status
  let validationStatus: ValidationStatus;
  const notes: string[] = [];

  if (brandScore >= BRAND_CRITERIA.thresholds.autoApprove) {
    validationStatus = "RECOMMENDED";
    notes.push("Auto-approved: high brand alignment");
  } else if (brandScore >= BRAND_CRITERIA.thresholds.consider) {
    validationStatus = "CONSIDER";
    notes.push("Moderate brand alignment - editorial review suggested");
  } else if (brandScore >= BRAND_CRITERIA.thresholds.review) {
    validationStatus = "REVIEW";
    notes.push("Low brand alignment - requires manual review");
  } else {
    validationStatus = "REJECT";
    notes.push("Below minimum brand alignment threshold");
  }

  // Additional flags
  if (place.priceTier === "$10_$15") {
    notes.push("Price approaching $15 limit");
  }
  if (!place.googleRating) {
    notes.push("No Google rating available - verify manually");
  }
  if (
    place.googleReviewCount !== null &&
    place.googleReviewCount !== undefined &&
    place.googleReviewCount < 10
  ) {
    notes.push("Few reviews - new or unverified listing");
  }

  return {
    brandScore,
    validationStatus,
    editorialNotes: notes.join(". "),
  };
}

export function validateAllPlaces(
  places: Partial<Place>[]
): Partial<Place>[] {
  return places.map((place) => {
    const result = validatePlace(place);
    return {
      ...place,
      brandScore: result.brandScore,
      validationStatus: result.validationStatus,
      editorialNotes: result.editorialNotes,
    };
  });
}
