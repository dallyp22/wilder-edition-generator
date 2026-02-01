export interface EditionTemplate {
  id: string;
  name: string;
  description: string;
  baseCity: string;
  baseState: string;
  populationRange: [number, number];
  characteristics: string[];
  seasonalEmphasis: "four_season" | "adaptable";
  categoryWeights: Record<string, number>;
}

export const TEMPLATES: EditionTemplate[] = [
  {
    id: "lincoln",
    name: "Lincoln Template",
    description: "Small-medium cities with strong nature focus and community feel",
    baseCity: "Lincoln",
    baseState: "NE",
    populationRange: [50000, 300000],
    characteristics: ["college_town", "nature_access", "community_focused"],
    seasonalEmphasis: "four_season",
    categoryWeights: {
      nature: 1.3,
      farm: 1.2,
      library: 1.0,
      museum: 0.9,
      indoor_play: 0.8,
      garden: 1.1,
      seasonal: 1.0,
    },
  },
  {
    id: "omaha",
    name: "Omaha Template",
    description: "Medium-large metros with suburban family focus",
    baseCity: "Omaha",
    baseState: "NE",
    populationRange: [300000, 1000000],
    characteristics: ["metro_area", "suburban_families", "diverse_activities"],
    seasonalEmphasis: "four_season",
    categoryWeights: {
      nature: 1.0,
      farm: 1.0,
      library: 1.0,
      museum: 1.2,
      indoor_play: 1.1,
      garden: 1.0,
      seasonal: 1.1,
    },
  },
  {
    id: "des_moines",
    name: "Des Moines Template",
    description: "Iowa and medium cities with state capital style",
    baseCity: "Des Moines",
    baseState: "IA",
    populationRange: [150000, 500000],
    characteristics: ["state_capital", "growing_city", "family_oriented"],
    seasonalEmphasis: "four_season",
    categoryWeights: {
      nature: 1.1,
      farm: 1.3,
      library: 1.1,
      museum: 1.0,
      indoor_play: 1.0,
      garden: 1.1,
      seasonal: 1.0,
    },
  },
  {
    id: "usa",
    name: "USA Generic Template",
    description: "Generic framework for any U.S. city",
    baseCity: "Generic",
    baseState: "US",
    populationRange: [0, 10000000],
    characteristics: ["universal", "adaptable"],
    seasonalEmphasis: "adaptable",
    categoryWeights: {
      nature: 1.0,
      farm: 1.0,
      library: 1.0,
      museum: 1.0,
      indoor_play: 1.0,
      garden: 1.0,
      seasonal: 1.0,
    },
  },
];

export const STATE_REGIONS: Record<string, string[]> = {
  midwest: ["NE", "IA", "KS", "MO", "MN", "SD", "ND", "WI", "IL", "IN", "OH", "MI"],
  plains: ["NE", "KS", "SD", "ND", "OK", "TX"],
  mountain: ["CO", "WY", "MT", "ID", "UT", "NV", "AZ", "NM"],
  southeast: ["FL", "GA", "AL", "MS", "SC", "NC", "TN", "KY", "VA", "WV", "LA", "AR"],
  northeast: ["NY", "NJ", "PA", "CT", "MA", "RI", "VT", "NH", "ME", "MD", "DE"],
  west: ["CA", "OR", "WA", "HI", "AK"],
};

export const CLIMATE_ZONES: Record<string, string[]> = {
  cold: ["MN", "WI", "MI", "ND", "SD", "MT", "WY", "VT", "NH", "ME", "AK"],
  moderate: ["NE", "IA", "KS", "MO", "IL", "IN", "OH", "PA", "NY", "NJ", "CT", "MA", "CO", "RI", "ID", "UT", "OR", "WA"],
  warm: ["VA", "NC", "TN", "KY", "WV", "MD", "DE", "AR", "OK", "NM"],
  hot: ["FL", "GA", "AL", "MS", "SC", "LA", "TX", "AZ", "NV", "CA", "HI"],
};
