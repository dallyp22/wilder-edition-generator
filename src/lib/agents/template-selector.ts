import { TemplateSelection } from "@/lib/types";
import { TEMPLATES, STATE_REGIONS, CLIMATE_ZONES } from "@/lib/config/templates";

const POPULATION_ESTIMATES: Record<string, number> = {
  "New York": 8336817,
  "Los Angeles": 3979576,
  "Chicago": 2693976,
  "Houston": 2320268,
  "Phoenix": 1680992,
  "Philadelphia": 1603797,
  "San Antonio": 1547253,
  "San Diego": 1424116,
  "Dallas": 1343573,
  "San Jose": 1021795,
  "Austin": 978908,
  "Jacksonville": 954614,
  "Fort Worth": 935508,
  "Columbus": 905748,
  "Indianapolis": 887642,
  "Charlotte": 879709,
  "San Francisco": 873965,
  "Seattle": 737015,
  "Denver": 715522,
  "Oklahoma City": 687725,
  "Nashville": 687788,
  "El Paso": 678815,
  "Washington DC": 689545,
  "Boston": 675647,
  "Portland": 641162,
  "Las Vegas": 641903,
  "Memphis": 633104,
  "Louisville": 633045,
  "Baltimore": 585708,
  "Milwaukee": 577222,
  "Albuquerque": 564559,
  "Tucson": 542629,
  "Fresno": 542107,
  "Sacramento": 524943,
  "Kansas City": 508090,
  "Mesa": 504258,
  "Atlanta": 498715,
  "Omaha": 486051,
  "Colorado Springs": 478961,
  "Raleigh": 474069,
  "Long Beach": 466742,
  "Virginia Beach": 459470,
  "Minneapolis": 429954,
  "Tampa": 399700,
  "Arlington": 394266,
  "New Orleans": 383997,
  "Wichita": 397532,
  "Cleveland": 372624,
  "Tulsa": 413066,
  "St. Louis": 301578,
  "Lincoln": 291082,
  "Des Moines": 214133,
  "Boise": 235684,
  "Salt Lake City": 200133,
  "Madison": 269840,
  "Sioux Falls": 195850,
  "Fargo": 125990,
  "Grand Island": 53131,
  "Iowa City": 74828,
};

function getPopulationEstimate(city: string): number {
  const normalized = city.trim();
  if (POPULATION_ESTIMATES[normalized]) {
    return POPULATION_ESTIMATES[normalized];
  }
  // Default to medium city
  return 200000;
}

function getRegion(state: string): string {
  for (const [region, states] of Object.entries(STATE_REGIONS)) {
    if (states.includes(state)) return region;
  }
  return "unknown";
}

function getClimateZone(state: string): string {
  for (const [zone, states] of Object.entries(CLIMATE_ZONES)) {
    if (states.includes(state)) return zone;
  }
  return "moderate";
}

function getPopulationTier(population: number): string {
  if (population < 150000) return "small";
  if (population < 500000) return "medium";
  if (population < 1000000) return "large";
  return "metro";
}

export function selectTemplate(
  city: string,
  state: string
): TemplateSelection {
  const population = getPopulationEstimate(city);
  const region = getRegion(state);
  const climate = getClimateZone(state);
  const popTier = getPopulationTier(population);

  const reasons: string[] = [];
  let primaryId = "usa";
  let secondaryId = "usa";

  // Nebraska cities get Nebraska templates
  if (state === "NE") {
    if (population < 300000) {
      primaryId = "lincoln";
      secondaryId = "omaha";
      reasons.push("Nebraska city, smaller population matches Lincoln template");
    } else {
      primaryId = "omaha";
      secondaryId = "lincoln";
      reasons.push("Nebraska city, larger population matches Omaha template");
    }
  } else if (state === "IA") {
    primaryId = "des_moines";
    secondaryId = "lincoln";
    reasons.push("Iowa city matches Des Moines template");
  } else if (region === "midwest" || region === "plains") {
    // Midwest/Plains states
    if (popTier === "small") {
      primaryId = "lincoln";
      secondaryId = "des_moines";
      reasons.push("Midwest small city, using Lincoln template for community focus");
    } else if (popTier === "medium") {
      primaryId = "des_moines";
      secondaryId = "omaha";
      reasons.push("Midwest medium city, using Des Moines template");
    } else {
      primaryId = "omaha";
      secondaryId = "des_moines";
      reasons.push("Midwest larger city, using Omaha metro template");
    }
  } else {
    // Non-midwest
    if (popTier === "small") {
      primaryId = "lincoln";
      secondaryId = "usa";
      reasons.push("Smaller city, adapting Lincoln template for community focus");
    } else if (popTier === "medium") {
      primaryId = "des_moines";
      secondaryId = "usa";
      reasons.push("Medium city, adapting Des Moines template");
    } else {
      primaryId = "usa";
      secondaryId = "omaha";
      reasons.push("Larger city outside Midwest, using USA generic template");
    }
  }

  reasons.push(`Population tier: ${popTier} (~${population.toLocaleString()})`);
  reasons.push(`Climate zone: ${climate}`);
  reasons.push(`Region: ${region}`);

  const primary = TEMPLATES.find((t) => t.id === primaryId)!;
  const secondary = TEMPLATES.find((t) => t.id === secondaryId)!;

  return {
    primaryTemplate: primary.name,
    secondaryTemplate: secondary.name,
    populationTier: popTier,
    climateZone: climate,
    reasoning: reasons.join(". "),
  };
}
