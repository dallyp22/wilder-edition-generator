export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  phone: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceTier: PriceTier;
  priceDetails: string;
  babyFriendly: boolean;
  toddlerSafe: boolean;
  preschoolPlus: boolean;
  warmWeather: boolean;
  winterSpot: boolean;
  iconString: string;
  shortDescription: string;
  whyWeLoveIt: string;
  insiderTip: string;
  brandScore: number;
  validationStatus: ValidationStatus;
  editorialNotes: string;
  weekSuggestions: number[];
  sourceUrl: string;
  isChain: boolean;
  placeTypes: string[];
}

export type PlaceCategory =
  | "nature"
  | "farm"
  | "library"
  | "museum"
  | "indoor_play"
  | "garden"
  | "seasonal";

export type PriceTier = "FREE" | "$5_$10" | "$10_$15" | "$15_$20";

export type ValidationStatus =
  | "RECOMMENDED"
  | "CONSIDER"
  | "REVIEW"
  | "REJECT";

export interface TemplateSelection {
  primaryTemplate: string;
  secondaryTemplate: string;
  populationTier: string;
  climateZone: string;
  reasoning: string;
}

export interface CategoryConfig {
  id: PlaceCategory;
  name: string;
  targetCount: number;
  keywords: string[];
  defaultSeasonality: ("warm" | "winter")[];
}

export interface PipelineState {
  status: PipelineStatus;
  currentStep: PipelineStep;
  templateSelection: TemplateSelection | null;
  places: Place[];
  progress: StepProgress[];
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export type PipelineStatus =
  | "idle"
  | "running"
  | "completed"
  | "error";

export type PipelineStep =
  | "template"
  | "discover"
  | "curate"
  | "enrich"
  | "validate"
  | "match"
  | "complete";

export interface WeekMatch {
  week: number;
  placeName: string;
  reason: string;
  alternateName: string;
  alternateReason: string;
}

export type DiscoverySource =
  | "brave"
  | "gemini"
  | "grok_x"
  | "grok_web"
  | "grok_blog"
  | "grok_seasonal";

export interface RawDiscoveryPlace {
  name: string;
  source: DiscoverySource;
  sourceUrl: string;
  snippet: string;
  category: PlaceCategory;
}

export interface StepProgress {
  step: PipelineStep;
  label: string;
  status: "pending" | "running" | "completed" | "error";
  detail?: string;
}

export interface GenerateRequest {
  city: string;
  state: string;
}

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface GooglePlaceResult {
  name: string;
  formatted_address: string;
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  formatted_phone_number?: string;
  price_level?: number;
  types?: string[];
  opening_hours?: { weekday_text?: string[] };
}
