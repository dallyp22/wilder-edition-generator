// ── Domain Keys ──

export type DossierDomain =
  | "landscape"
  | "animals"
  | "plants"
  | "foodAgriculture"
  | "weather"
  | "localPlaces"
  | "cultureHistory"
  | "sensory"
  | "developmental"
  | "crossMedia";

export const DOSSIER_DOMAINS: DossierDomain[] = [
  "landscape",
  "animals",
  "plants",
  "foodAgriculture",
  "weather",
  "localPlaces",
  "cultureHistory",
  "sensory",
  "developmental",
  "crossMedia",
];

export const DOMAIN_LABELS: Record<DossierDomain, string> = {
  landscape: "Place & Landscape",
  animals: "Native Animals",
  plants: "Native Plants & Trees",
  foodAgriculture: "Local Food & Agriculture",
  weather: "Weather & Seasons",
  localPlaces: "Local Places & Exploration",
  cultureHistory: "History & Culture",
  sensory: "Sensory & Emotional",
  developmental: "Developmental Tie-Ins",
  crossMedia: "Cross-Media Hooks",
};

// API route slug → domain key mapping
export const DOMAIN_SLUGS: Record<string, DossierDomain> = {
  landscape: "landscape",
  animals: "animals",
  plants: "plants",
  "food-agriculture": "foodAgriculture",
  weather: "weather",
  "local-places": "localPlaces",
  "culture-history": "cultureHistory",
  sensory: "sensory",
  developmental: "developmental",
  "cross-media": "crossMedia",
};

// ── Progress Tracking ──

export interface DossierProgress {
  domain: DossierDomain;
  status: "pending" | "researching" | "saving" | "complete" | "error";
  errorMessage?: string;
}

// ── Domain Interfaces ──

export interface LandscapeResearch {
  dominantLandforms: Array<{ type: string; description: string; whereToSee: string }>;
  signatureNaturalFeatures: Array<{ name: string; type: string; kidFriendly: boolean; significance: string }>;
  localEcosystems: Array<{ name: string; status: string; whereToSee: string[] }>;
  seasonalTransformations: Array<{ season: string; description: string; whatKidsNotice: string }>;
  soilTypes: Array<{ type: string; whereFound: string; texture: string }>;
  skyAndWeatherCharacter: Array<{ phenomenon: string; description: string; bestViewing: string }>;
  familyExplorationPotential: {
    walkableAreas: string[];
    strollerAccessibility: "excellent" | "good" | "limited";
    safetyConsiderations: string[];
  };
}

export interface AnimalResearch {
  iconicMammals: Array<{ name: string; whereToSpot: string; bestSeason: string; whatKidsNotice: string; funFact: string; kidScore: number }>;
  commonBirds: Array<{ name: string; isStateBird: boolean; whereFound: string; distinctiveFeature: string; sound: string }>;
  insectsAndPollinators: Array<{ name: string; whereToObserve: string; bestSeason: string; safetyNote: string }>;
  reptilesAmphibians: Array<{ name: string; whereFound: string; seasonalActivity: string }>;
  aquaticLife: Array<{ name: string; waterBody: string; bestViewing: string }>;
  seasonalBehaviors: Array<{ season: string; behaviors: Array<{ animal: string; behavior: string; whereToObserve: string }> }>;
  tracksAndSigns: Array<{ animal: string; signType: string; whereToFind: string; identificationTip: string }>;
}

export interface PlantResearch {
  stateSymbols: {
    stateTree: { name: string; description: string; whereToSee: string };
    stateFlower: { name: string; bloomTime: string; whereToFind: string };
    stateGrass: { name: string; description: string } | null;
  };
  neighborhoodTrees: Array<{ name: string; whereFound: string; kidFeature: string; seasonalChange: string }>;
  wildflowersBySeason: Record<string, Array<{ name: string; description: string; whereToFind: string }>>;
  ediblePlantsAndCrops: Array<{ name: string; type: string; season: string; whereToExperience: string }>;
  seedDispersal: Array<{ plant: string; method: string; activityIdea: string }>;
  pollinatorPlants: Array<{ plant: string; pollinators: string[]; bloomTime: string; whereToFind: string }>;
  traditionalUsePlants: Array<{ plant: string; use: string; culturalNote: string }>;
}

export interface FoodAgricultureResearch {
  signatureCrops: Array<{ crop: string; season: string; whereToSee: string; harvestTime: string }>;
  farmToTableStaples: Array<{ type: string; localSource: string; whereKidsCanExperience: string }>;
  harvestCalendar: Array<{ month: string; crops: string[]; activities: string[] }>;
  culturalFoods: Array<{ food: string; significance: string; whereToTry: string }>;
  childFriendlyRecipes: Array<{ name: string; localIngredient: string; season: string; ageRange: string; messLevel: string; steps: string[] }>;
  farmAnimals: Array<{ animal: string; whereToMeet: string; bestSeason: string; kidActivity: string }>;
  farmVisuals: Array<{ item: string; whereKidsSeeIt: string; teachingMoment: string }>;
}

export interface WeatherResearch {
  typicalSeasonalWeather: Array<{ season: string; avgHighTemp: number; avgLowTemp: number; precipitation: string; typicalConditions: string }>;
  uniqueWeatherPhenomena: Array<{ phenomenon: string; description: string; whenItOccurs: string; safetyNote: string }>;
  dailyLifeImpact: Array<{ weatherType: string; howItAffects: string; familyAdaptation: string }>;
  seasonalSafetyLessons: Array<{ season: string; hazard: string; safePractice: string; ageAppropriateExplanation: string }>;
  animalPlantAdaptations: Array<{ organism: string; adaptation: string; whenToObserve: string }>;
  lightPatterns: Array<{ season: string; sunrise: string; sunset: string; daylightHours: number; activityImplication: string }>;
}

export interface LocalPlacesResearch {
  naturePreservesParks: Array<{ name: string; type: string; cost: string; strollerAccess: string; keyFeatures: string[]; bestSeason: string; address: string }>;
  iconicOutdoorDestinations: Array<{ name: string; description: string; cost: string; bestFor: string }>;
  neighborhoodScalePlaces: Array<{ name: string; type: string; description: string; familyFriendly: string }>;
  kidFriendlyLandmarks: Array<{ name: string; description: string; whatKidsNotice: string }>;
  seasonalPlaces: Record<string, Array<{ name: string; activity: string; cost: string }>>;
  urbanNature: Array<{ type: string; location: string; familyAccessibility: string }>;
}

export interface CultureHistoryResearch {
  indigenousHistory: {
    originalStewards: string[];
    landRelationship: string;
    placeNames: Array<{ name: string; meaning: string }>;
    culturalSites: string[];
    ongoingPresence: string;
  };
  localFolklore: Array<{ story: string; natureConnection: string; ageAppropriateness: string }>;
  historicalLandRelation: Array<{ era: string; howPeopleLived: string; visibleRemains: string }>;
  seasonalTraditions: Array<{ tradition: string; season: string; familyParticipation: string; natureConnection: string }>;
  transportationHistory: Array<{ mode: string; historicalSignificance: string; whereToSee: string }>;
  architecturalFeatures: Array<{ feature: string; whereToSee: string; whatKidsNotice: string }>;
}

export interface SensoryResearch {
  sounds: Array<{ sound: string; where: string; when: string; childReaction: string; activityConnection: string }>;
  smells: Array<{ smell: string; trigger: string; season: string; emotionalResonance: string }>;
  textures: Array<{ texture: string; source: string; safeForAge: string; explorationIdea: string }>;
  colorsBySeason: Array<{ season: string; dominantColors: string[]; whereToSee: string; photographyTip: string }>;
  quietVsBusyPlaces: Array<{ name: string; noiseLevel: string; bestFor: string }>;
  momentsOfStillness: Array<{ place: string; time: string; season: string; description: string }>;
}

export interface DevelopmentalResearch {
  grossMotorOpportunities: Array<{ place: string; activity: string; skills: string[]; ageRange: string }>;
  fineMotorExploration: Array<{ material: string; activity: string; skills: string[]; season: string; whereToFind: string }>;
  curiosityTriggers: Array<{ phenomenon: string; questions: string[]; simpleExplanation: string; followUpActivity: string }>;
  emotionalRegulation: Array<{ setting: string; howItHelps: string; signs: string[]; tips: string[] }>;
  homeConnection: Array<{ localElement: string; homeActivity: string; continuityBenefit: string }>;
  whatToddlersNotice: Array<{ age: string; observations: string[] }>;
}

export interface CrossMediaResearch {
  booksForRegion: Array<{ title: string; author: string; connection: string; bestSeason: string; readAloudTip: string }>;
  songsForLandscape: Array<{ song: string; connection: string; activityPairing: string }>;
  craftsWithLocalMaterials: Array<{ craft: string; materials: string[]; season: string; skillLevel: string; instructions: string[] }>;
  simpleScienceMoments: Array<{ concept: string; localSetting: string; observation: string; question: string; exploration: string }>;
}
