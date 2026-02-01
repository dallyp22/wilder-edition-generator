export const BRAND_CRITERIA = {
  hardFilters: {
    maxPricePerPerson: 15,
    rejectChainWithCommercialFocus: true,
    rejectAdultVenues: true,
    rejectNotFamilyAppropriate: true,
  },

  scoringWeights: {
    accessibility: 0.3,
    natureConnection: 0.25,
    familyFriendliness: 0.25,
    localAuthenticity: 0.2,
  },

  thresholds: {
    autoApprove: 80,
    consider: 60,
    review: 40,
  },

  accessibilityScoring: {
    FREE: 100,
    "$5_$10": 80,
    "$10_$15": 60,
    "$15_plus": 20,
  },

  natureKeywords: [
    "park",
    "trail",
    "nature",
    "garden",
    "farm",
    "outdoor",
    "wildlife",
    "botanical",
    "arboretum",
    "preserve",
    "lake",
    "creek",
    "forest",
    "prairie",
    "wetland",
  ],

  familyKeywords: [
    "family",
    "children",
    "kids",
    "toddler",
    "baby",
    "playground",
    "storytime",
    "play",
    "education",
    "learning",
  ],

  chainIndicators: [
    "mcdonald",
    "walmart",
    "target",
    "starbucks",
    "chuck e cheese",
    "dave and buster",
    "sky zone",
    "main event",
    "urban air",
    "cinemark",
    "amc",
    "regal",
  ],

  adultVenueKeywords: [
    "bar",
    "brewery",
    "winery",
    "nightclub",
    "casino",
    "tattoo",
    "hookah",
    "vape",
    "liquor",
    "pub",
    "taproom",
  ],
};

export const ICON_KEY = {
  pricing: {
    FREE: { icon: "🔷", label: "FREE admission" },
    "$5_$10": { icon: "💲", label: "$5-$10/person" },
    "$10_$15": { icon: "💲💲", label: "$10-$15/person" },
    "$15_plus": { icon: "💲💲💲", label: "$15+/person" },
  },
  ageGroups: {
    baby: { icon: "👶", label: "Baby-friendly (0-12mo)" },
    toddler: { icon: "🧒", label: "Toddler-safe (1-3yr)" },
    preschool: { icon: "👦", label: "Preschool+ (3-5yr)" },
  },
  seasonality: {
    warm: { icon: "☀️", label: "Warm weather" },
    winter: { icon: "❄️", label: "Winter spot" },
  },
};
