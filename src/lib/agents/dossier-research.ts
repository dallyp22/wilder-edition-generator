import { parseJSONFromResponse } from "@/lib/utils/ai-client";
import type {
  LandscapeResearch,
  AnimalResearch,
  PlantResearch,
  FoodAgricultureResearch,
  WeatherResearch,
  LocalPlacesResearch,
  CultureHistoryResearch,
  SensoryResearch,
  DevelopmentalResearch,
  CrossMediaResearch,
} from "@/lib/types/dossier";

// ── Shared Gemini Caller ──

export async function callGeminiResearch(
  prompt: string,
  geminiApiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 8192 },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

// ── Domain 1: Landscape ──

const LANDSCAPE_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the landscape and natural geography of {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. DOMINANT LANDFORMS: What defines the terrain? Hills, plains, river valleys, bluffs, coastal features, plateaus? Describe type, visual description, and where families can see each.
2. SIGNATURE NATURAL FEATURES: Major rivers, lakes, creeks, bluffs, caves, or rock formations. Note names, types, kid-friendliness, and significance to the region.
3. LOCAL ECOSYSTEMS: Forests, prairies, wetlands, riparian zones present in or near the city. Include conservation status and where families can visit.
4. SEASONAL TRANSFORMATIONS: How does the landscape visibly change each season? What will young children notice -- color shifts, frozen ponds, wildflower blooms, fallen leaves?
5. SOIL TYPES & GROUND TEXTURES: What does the ground feel and look like? Clay, loam, sandy, rocky? Where are different soil types found, and what textures will toddlers encounter?
6. SKY & WEATHER CHARACTER: Dramatic sunsets, big open skies, frequent rainbows, fog patterns, storm formations? Describe phenomena, what they look like, and best viewing conditions.
7. FAMILY EXPLORATION POTENTIAL: Walkable areas for families, stroller accessibility (excellent/good/limited overall), and safety considerations for young children outdoors.

Focus on what is real, specific, and observable for families with babies and toddlers exploring {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "dominantLandforms": [{ "type": string, "description": string, "whereToSee": string }],
  "signatureNaturalFeatures": [{ "name": string, "type": string, "kidFriendly": boolean, "significance": string }],
  "localEcosystems": [{ "name": string, "status": string, "whereToSee": [string] }],
  "seasonalTransformations": [{ "season": string, "description": string, "whatKidsNotice": string }],
  "soilTypes": [{ "type": string, "whereFound": string, "texture": string }],
  "skyAndWeatherCharacter": [{ "phenomenon": string, "description": string, "bestViewing": string }],
  "familyExplorationPotential": { "walkableAreas": [string], "strollerAccessibility": "excellent"|"good"|"limited", "safetyConsiderations": [string] }
}`;

export async function researchLandscape(
  city: string,
  state: string,
  geminiKey: string
): Promise<LandscapeResearch> {
  const prompt = LANDSCAPE_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<LandscapeResearch>(raw);
}

// ── Domain 2: Animals ──

const ANIMALS_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the wildlife and animals of {{CITY}}, {{STATE}}, prioritizing kid-relatable species first.

Investigate these topics thoroughly using current web sources:

1. ICONIC MAMMALS: Mammals kids might actually SEE -- deer, squirrels, rabbits, raccoons, groundhogs, foxes. For each: name, where to spot, best season, what kids notice about it, a fun fact, and a kidScore (1-5, where 5 = most exciting for toddlers).
2. COMMON BIRDS: Songbirds, waterfowl, raptors visible in the area. Identify the state bird and mark it. Include where found, distinctive visual or sound feature, and phonetic sound description.
3. INSECTS & POLLINATORS: Butterflies, fireflies, ladybugs, dragonflies, bees. Where to observe each, best season, and any safety notes for young children.
4. REPTILES & AMPHIBIANS: Turtles, frogs, toads, salamanders, lizards, harmless snakes. Where found and seasonal activity patterns.
5. AQUATIC LIFE: Fish, crayfish, tadpoles, water insects visible in local waterways. Name the water body and best viewing conditions.
6. SEASONAL ANIMAL BEHAVIORS: For each season, what animal behaviors can families observe? Migration, hibernation prep, nesting, baby animals, mating calls.
7. ANIMAL TRACKS & SIGNS: Tracks, nests, burrows, scat, feathers kids can discover. What animal left it, sign type, where to find it, and identification tips.

Focus on species genuinely present in {{CITY}}, {{STATE}} that families with young children can realistically encounter.

Return ONLY valid JSON matching this schema:
{
  "iconicMammals": [{ "name": string, "whereToSpot": string, "bestSeason": string, "whatKidsNotice": string, "funFact": string, "kidScore": number }],
  "commonBirds": [{ "name": string, "isStateBird": boolean, "whereFound": string, "distinctiveFeature": string, "sound": string }],
  "insectsAndPollinators": [{ "name": string, "whereToObserve": string, "bestSeason": string, "safetyNote": string }],
  "reptilesAmphibians": [{ "name": string, "whereFound": string, "seasonalActivity": string }],
  "aquaticLife": [{ "name": string, "waterBody": string, "bestViewing": string }],
  "seasonalBehaviors": [{ "season": string, "behaviors": [{ "animal": string, "behavior": string, "whereToObserve": string }] }],
  "tracksAndSigns": [{ "animal": string, "signType": string, "whereToFind": string, "identificationTip": string }]
}`;

export async function researchAnimals(
  city: string,
  state: string,
  geminiKey: string
): Promise<AnimalResearch> {
  const prompt = ANIMALS_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<AnimalResearch>(raw);
}

// ── Domain 3: Plants & Trees ──

const PLANTS_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the plants, trees, and flora of {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. STATE SYMBOLS: The official state tree (name, description, where to see), state flower (name, bloom time, where to find), and state grass if one exists (name, description) or null.
2. NEIGHBORHOOD TREES: Common trees families see on walks -- oaks, maples, magnolias, pines, etc. For each: name, where found, a kid-friendly feature (big leaves, acorns, peeling bark), and how it changes by season.
3. WILDFLOWERS BY SEASON: Organize wildflowers by season (spring, summer, fall, winter). For each flower: name, visual description, and where to find it locally.
4. EDIBLE PLANTS & CROPS: What grows here that kids can taste or pick? Berry bushes, apple orchards, community garden crops, herbs. Include type, season, and where to experience.
5. SEED DISPERSAL METHODS: Plants with interesting seed dispersal -- dandelion puffs, maple helicopters, acorns, burrs, milkweed pods. Name the plant, describe the method, and suggest a hands-on activity.
6. POLLINATOR PLANTS: Plants that attract butterflies, bees, hummingbirds. Which pollinators visit, bloom time, and where families can see them.
7. PLANTS IN LOCAL TRADITIONS: Plants with cultural significance -- used in Indigenous traditions, folk medicine, holiday customs, or local cuisine. Note cultural context respectfully.

Focus on species genuinely present in {{CITY}}, {{STATE}} that families encounter in parks, neighborhoods, and trails.

Return ONLY valid JSON matching this schema:
{
  "stateSymbols": { "stateTree": { "name": string, "description": string, "whereToSee": string }, "stateFlower": { "name": string, "bloomTime": string, "whereToFind": string }, "stateGrass": { "name": string, "description": string } | null },
  "neighborhoodTrees": [{ "name": string, "whereFound": string, "kidFeature": string, "seasonalChange": string }],
  "wildflowersBySeason": { "spring": [{ "name": string, "description": string, "whereToFind": string }], "summer": [...], "fall": [...], "winter": [...] },
  "ediblePlantsAndCrops": [{ "name": string, "type": string, "season": string, "whereToExperience": string }],
  "seedDispersal": [{ "plant": string, "method": string, "activityIdea": string }],
  "pollinatorPlants": [{ "plant": string, "pollinators": [string], "bloomTime": string, "whereToFind": string }],
  "traditionalUsePlants": [{ "plant": string, "use": string, "culturalNote": string }]
}`;

export async function researchPlants(
  city: string,
  state: string,
  geminiKey: string
): Promise<PlantResearch> {
  const prompt = PLANTS_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<PlantResearch>(raw);
}

// ── Domain 4: Food & Agriculture ──

const FOOD_AGRICULTURE_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the food culture, agriculture, and farm life of {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. SIGNATURE CROPS & GROWING SEASONS: What crops define the region? Include crop name, growing/harvest season, where families can see fields or farms, and harvest timing.
2. FARM-TO-TABLE STAPLES: Local food products families encounter -- honey, dairy, eggs, produce at farmers markets. Type of product, local source, and where kids can experience it.
3. SEASONAL HARVEST CALENDAR: Month-by-month harvest guide. For each month, list what crops are available and family-friendly harvest activities (apple picking, strawberry patches, pumpkin farms).
4. CULTURAL FOODS: Foods with cultural or regional significance -- BBQ traditions, Southern cooking, immigrant cuisine, state fair foods. What makes it special and where families can try it.
5. CHILD-FRIENDLY RECIPES: 3-5 simple recipes using local seasonal ingredients. Each needs: recipe name, key local ingredient, best season, age range (e.g. "2-5"), mess level ("low"/"medium"/"high"), and step-by-step instructions a parent and toddler can do together.
6. FARM ANIMALS: Animals kids can meet at local farms or petting zoos. Where to visit, best season, and a kid-friendly activity at each.
7. FARM VISUALS: Things kids recognize from farm life -- red barns, tractors, hay bales, silos, fences, windmills. Where they can see each and what teaching moment it offers.

Focus on real, specific agricultural traditions and food culture of {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "signatureCrops": [{ "crop": string, "season": string, "whereToSee": string, "harvestTime": string }],
  "farmToTableStaples": [{ "type": string, "localSource": string, "whereKidsCanExperience": string }],
  "harvestCalendar": [{ "month": string, "crops": [string], "activities": [string] }],
  "culturalFoods": [{ "food": string, "significance": string, "whereToTry": string }],
  "childFriendlyRecipes": [{ "name": string, "localIngredient": string, "season": string, "ageRange": string, "messLevel": string, "steps": [string] }],
  "farmAnimals": [{ "animal": string, "whereToMeet": string, "bestSeason": string, "kidActivity": string }],
  "farmVisuals": [{ "item": string, "whereKidsSeeIt": string, "teachingMoment": string }]
}`;

export async function researchFoodAgriculture(
  city: string,
  state: string,
  geminiKey: string
): Promise<FoodAgricultureResearch> {
  const prompt = FOOD_AGRICULTURE_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<FoodAgricultureResearch>(raw);
}

// ── Domain 5: Weather & Seasons ──

const WEATHER_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the weather patterns and seasonal cycles of {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. TYPICAL SEASONAL WEATHER: For each season (spring, summer, fall, winter), provide average high and low temperatures (Fahrenheit), typical precipitation, and general conditions families experience.
2. UNIQUE WEATHER PHENOMENA: Distinctive weather events -- tornado season, ice storms, lake effect snow, monsoons, heat waves, fog, dramatic thunderstorms. Describe each, when it occurs, and age-appropriate safety notes.
3. DAILY LIFE IMPACT: How does weather shape family routines? Mud season, snow days, summer heat advisories, rainy stretches. What weather type, how it affects families, and how local families adapt.
4. SEASONAL SAFETY LESSONS: Age-appropriate weather safety for each season. Identify the hazard, safe practice, and explain it in simple language a 3-year-old could understand.
5. ANIMAL & PLANT WEATHER ADAPTATIONS: How do local organisms respond to weather? Migration, hibernation, leaf drop, blooming triggers, animal shelter behavior. Name the organism, its adaptation, and when to observe.
6. DAYLIGHT PATTERNS: For each season, approximate sunrise and sunset times, total daylight hours, and what this means for family outdoor activity planning.

Focus on accurate, current weather data for {{CITY}}, {{STATE}} presented through the lens of family outdoor exploration.

Return ONLY valid JSON matching this schema:
{
  "typicalSeasonalWeather": [{ "season": string, "avgHighTemp": number, "avgLowTemp": number, "precipitation": string, "typicalConditions": string }],
  "uniqueWeatherPhenomena": [{ "phenomenon": string, "description": string, "whenItOccurs": string, "safetyNote": string }],
  "dailyLifeImpact": [{ "weatherType": string, "howItAffects": string, "familyAdaptation": string }],
  "seasonalSafetyLessons": [{ "season": string, "hazard": string, "safePractice": string, "ageAppropriateExplanation": string }],
  "animalPlantAdaptations": [{ "organism": string, "adaptation": string, "whenToObserve": string }],
  "lightPatterns": [{ "season": string, "sunrise": string, "sunset": string, "daylightHours": number, "activityImplication": string }]
}`;

export async function researchWeather(
  city: string,
  state: string,
  geminiKey: string
): Promise<WeatherResearch> {
  const prompt = WEATHER_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<WeatherResearch>(raw);
}

// ── Domain 6: Local Places & Exploration ──

const LOCAL_PLACES_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research real, specific outdoor and nature-connected places in {{CITY}}, {{STATE}}.

CRITICAL RULE: Every place must cost $15 or less (ideally free). No chain businesses. Only real, locally known destinations.

Investigate these topics thoroughly using current web sources:

1. NATURE PRESERVES & PARKS: Public parks, nature preserves, and green spaces. For each: exact name, type (park/preserve/garden), cost (free or amount), stroller access level, key features families enjoy, best season to visit, and address or location description.
2. ICONIC OUTDOOR DESTINATIONS: The must-visit outdoor spots families talk about. Name, description, cost, and who it is best for (babies/toddlers/preschoolers).
3. NEIGHBORHOOD-SCALE PLACES: Hidden gems -- small creeks, neighborhood ponds, wooded paths, community gardens, secret meadows. Name, type, description, and family-friendliness notes.
4. KID-FRIENDLY LANDMARKS: Bridges, statues, murals, historic trees, gazebos, fountains that kids love to visit. Name, description, and what specifically captures young children's attention.
5. SEASONAL PLACES: Organize by season -- which spots shine in spring, summer, fall, winter? For each: name, seasonal activity, and cost.
6. URBAN NATURE: Nature within the city -- street trees, bird feeders, rain gardens, pollinator patches, green roofs. Type, location, and family accessibility.

All places must be real, verifiable locations in or very near {{CITY}}, {{STATE}}. No chains, no venues over $15.

Return ONLY valid JSON matching this schema:
{
  "naturePreservesParks": [{ "name": string, "type": string, "cost": string, "strollerAccess": string, "keyFeatures": [string], "bestSeason": string, "address": string }],
  "iconicOutdoorDestinations": [{ "name": string, "description": string, "cost": string, "bestFor": string }],
  "neighborhoodScalePlaces": [{ "name": string, "type": string, "description": string, "familyFriendly": string }],
  "kidFriendlyLandmarks": [{ "name": string, "description": string, "whatKidsNotice": string }],
  "seasonalPlaces": { "spring": [{ "name": string, "activity": string, "cost": string }], "summer": [...], "fall": [...], "winter": [...] },
  "urbanNature": [{ "type": string, "location": string, "familyAccessibility": string }]
}`;

export async function researchLocalPlaces(
  city: string,
  state: string,
  geminiKey: string
): Promise<LocalPlacesResearch> {
  const prompt = LOCAL_PLACES_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<LocalPlacesResearch>(raw);
}

// ── Domain 7: History, Culture & Sense of Place ──

const CULTURE_HISTORY_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the history, culture, and sense of place of {{CITY}}, {{STATE}}, focusing specifically on connections to LAND and NATURE.

Investigate these topics thoroughly using current web sources:

1. INDIGENOUS HISTORY: Who are the original stewards of this land? List tribal nations, describe their relationship to the land and its ecosystems, note Indigenous place names and their meanings, identify cultural sites families can respectfully visit, and describe any ongoing presence or cultural events. Approach with deep respect.
2. LOCAL FOLKLORE & NATURE STORIES: Folk tales, legends, or stories tied to local natural features -- haunted hollows, naming stories for rivers or hills, tall tales about animals. Note the nature connection and age-appropriateness.
3. HISTORICAL LAND RELATIONSHIP: How have people related to this land over time? Farming eras, logging history, river trade, railroad routes, mining. For each era, what did daily life look like and what visible remains can families see today?
4. SEASONAL TRADITIONS & FESTIVALS: Community events tied to seasons and nature -- harvest festivals, maple syrup tapping, first frost celebrations, spring planting events. When they happen, how families participate, and the nature connection.
5. TRANSPORTATION & GEOGRAPHY: How did rivers, hills, and geography shape how people moved and built? Historic trails, river crossings, railroad routes, canal systems. What can families still see?
6. ARCHITECTURAL FEATURES KIDS NOTICE: Stone walls, wooden bridges, barn quilts, weather vanes, brick patterns, iron gates, steeples. Where to see them and what captures a toddler's eye.

Focus on how the NATURAL landscape shaped human culture in {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "indigenousHistory": { "originalStewards": [string], "landRelationship": string, "placeNames": [{ "name": string, "meaning": string }], "culturalSites": [string], "ongoingPresence": string },
  "localFolklore": [{ "story": string, "natureConnection": string, "ageAppropriateness": string }],
  "historicalLandRelation": [{ "era": string, "howPeopleLived": string, "visibleRemains": string }],
  "seasonalTraditions": [{ "tradition": string, "season": string, "familyParticipation": string, "natureConnection": string }],
  "transportationHistory": [{ "mode": string, "historicalSignificance": string, "whereToSee": string }],
  "architecturalFeatures": [{ "feature": string, "whereToSee": string, "whatKidsNotice": string }]
}`;

export async function researchCultureHistory(
  city: string,
  state: string,
  geminiKey: string
): Promise<CultureHistoryResearch> {
  const prompt = CULTURE_HISTORY_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<CultureHistoryResearch>(raw);
}

// ── Domain 8: Sensory & Emotional Details ──

const SENSORY_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research the sensory and emotional landscape of {{CITY}}, {{STATE}}. Write with a warm, evocative, wonder-filled Wilder Seasons voice -- like a field journal entry for a parent exploring with their little one.

Investigate these topics thoroughly using current web sources:

1. SOUNDS: The soundscape of {{CITY}} -- wind through specific tree species, water over rocks in named creeks, bird calls by season, cicadas in summer, crunching leaves in fall, quiet snowfall. For each: describe the sound, where to hear it, when (season/time), how young children react, and an activity connection.
2. SMELLS: The scent map -- petrichor on hot pavement, honeysuckle in June, cedar mulch on trails, wood smoke in autumn, fresh-cut grass, agricultural smells. Include the trigger, season, and emotional resonance for families.
3. TEXTURES: What tiny hands will touch -- rough bark of specific local trees, smooth river stones, squelchy mud after rain, fuzzy lamb's ear leaves, cold creek water, warm sand. Source material, age safety, and exploration ideas.
4. COLORS BY SEASON: The color palette of each season in {{CITY}}. Dominant colors, where to see them, and a photography tip for capturing the moment with kids.
5. QUIET VS BUSY PLACES: Sensory contrast -- which local places are hushed and calm (library gardens, early morning trails) vs. energized and stimulating (farmers markets, playgrounds, festivals)? Name, noise level, and what each is best for.
6. MOMENTS OF STILLNESS: Write 4-6 evocative prose descriptions of still, magical moments families experience in {{CITY}} -- dawn mist on a pond, the first snowflake landing on a mitten, watching fireflies from a porch. Include place, time, season, and a warm descriptive paragraph.

Focus on real sensory details specific to {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "sounds": [{ "sound": string, "where": string, "when": string, "childReaction": string, "activityConnection": string }],
  "smells": [{ "smell": string, "trigger": string, "season": string, "emotionalResonance": string }],
  "textures": [{ "texture": string, "source": string, "safeForAge": string, "explorationIdea": string }],
  "colorsBySeason": [{ "season": string, "dominantColors": [string], "whereToSee": string, "photographyTip": string }],
  "quietVsBusyPlaces": [{ "name": string, "noiseLevel": string, "bestFor": string }],
  "momentsOfStillness": [{ "place": string, "time": string, "season": string, "description": string }]
}`;

export async function researchSensory(
  city: string,
  state: string,
  geminiKey: string
): Promise<SensoryResearch> {
  const prompt = SENSORY_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<SensoryResearch>(raw);
}

// ── Domain 9: Developmental Tie-Ins ──

const DEVELOPMENTAL_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research developmental opportunities for young children exploring {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. GROSS MOTOR OPPORTUNITIES: Places and natural features for climbing, running, jumping, balancing, rolling, and splashing. For each: specific place or setting in {{CITY}}, the activity, developmental skills built (list 2-3), and recommended age range.
2. FINE MOTOR EXPLORATION: Natural materials for pinching, grasping, threading, poking, sorting, and peeling. For each: the material (pinecones, pebbles, flower petals, mud), activity, skills developed, best season, and where to find it locally.
3. CURIOSITY & QUESTIONING TRIGGERS: Natural phenomena that spark "why" and "what" questions -- why leaves change color, where water goes, what animal made that hole, why the moon looks different. For each: the phenomenon, likely questions kids ask, a simple honest explanation, and a follow-up activity.
4. EMOTIONAL REGULATION SETTINGS: Natural environments that support calm, focus, and self-regulation -- quiet creek banks, shady groves, gentle walking trails, sensory gardens. For each: the setting, how it helps (calming/focusing/grounding), signs a child is benefiting, and parent tips.
5. HOME CONNECTION ACTIVITIES: Ways to bring outdoor discoveries home -- pressing leaves, growing seeds from local plants, making nature journals, building bird feeders. Link each to a specific local element, a home activity, and the developmental continuity benefit.
6. WHAT TODDLERS NOTICE BY AGE: Observations organized by age band. For each band (0-1, 1-2, 2-3, 3-4, 4-5), list 5-7 specific things children at that age tend to notice and engage with when outdoors in {{CITY}}, {{STATE}}.

Ground everything in real places and natural materials found in {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "grossMotorOpportunities": [{ "place": string, "activity": string, "skills": [string], "ageRange": string }],
  "fineMotorExploration": [{ "material": string, "activity": string, "skills": [string], "season": string, "whereToFind": string }],
  "curiosityTriggers": [{ "phenomenon": string, "questions": [string], "simpleExplanation": string, "followUpActivity": string }],
  "emotionalRegulation": [{ "setting": string, "howItHelps": string, "signs": [string], "tips": [string] }],
  "homeConnection": [{ "localElement": string, "homeActivity": string, "continuityBenefit": string }],
  "whatToddlersNotice": [{ "age": string, "observations": [string] }]
}`;

export async function researchDevelopmental(
  city: string,
  state: string,
  geminiKey: string
): Promise<DevelopmentalResearch> {
  const prompt = DEVELOPMENTAL_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<DevelopmentalResearch>(raw);
}

// ── Domain 10: Cross-Media Hooks ──

const CROSS_MEDIA_PROMPT = `You are a nature researcher for Wilder Seasons, a family nature guide designed for children ages 0-5. Research cross-media resources -- books, songs, crafts, and science activities -- connected to the natural world of {{CITY}}, {{STATE}}.

Investigate these topics thoroughly using current web sources:

1. BOOKS FOR THE REGION: Picture books and board books that feature ecosystems, animals, landscapes, or seasons relevant to {{CITY}}, {{STATE}}. Include books about local wildlife, regional habitats (prairies, forests, rivers), weather patterns, or farm life found in this area. For each: title, author, how it connects to the local environment, best season to pair it with, and a read-aloud tip for young children.
2. SONGS FOR THE LANDSCAPE: Traditional folk songs, children's songs, lullabies, or regional music connected to the land, weather, animals, or seasons of {{CITY}}, {{STATE}}. Include both well-known and regional selections. For each: song title or name, its connection to local nature, and an activity pairing (sing while hiking, play during rain, hum at bedtime).
3. CRAFTS WITH LOCAL MATERIALS: Hands-on craft projects using natural materials found in {{CITY}}, {{STATE}} -- leaf prints, pinecone bird feeders, pressed wildflower cards, stick weaving, mud painting, acorn sorting. For each: craft name, materials list (locally sourced), best season, skill level (beginner/intermediate), and simple step-by-step instructions.
4. SIMPLE SCIENCE MOMENTS: Everyday science observations and mini-experiments tied to local nature -- watching ice melt on a creek, growing a bean from a local farmers market, floating leaves vs stones in a puddle, observing shadows change length. For each: the science concept, local setting, what to observe, a question to ask kids, and how to explore further.

Focus on real, obtainable books (verify they exist), culturally authentic songs, and materials genuinely available in {{CITY}}, {{STATE}}.

Return ONLY valid JSON matching this schema:
{
  "booksForRegion": [{ "title": string, "author": string, "connection": string, "bestSeason": string, "readAloudTip": string }],
  "songsForLandscape": [{ "song": string, "connection": string, "activityPairing": string }],
  "craftsWithLocalMaterials": [{ "craft": string, "materials": [string], "season": string, "skillLevel": string, "instructions": [string] }],
  "simpleScienceMoments": [{ "concept": string, "localSetting": string, "observation": string, "question": string, "exploration": string }]
}`;

export async function researchCrossMedia(
  city: string,
  state: string,
  geminiKey: string
): Promise<CrossMediaResearch> {
  const prompt = CROSS_MEDIA_PROMPT.replace(/\{\{CITY\}\}/g, city).replace(
    /\{\{STATE\}\}/g,
    state
  );
  const raw = await callGeminiResearch(prompt, geminiKey);
  return parseJSONFromResponse<CrossMediaResearch>(raw);
}

// ── Research Functions Map ──

export const RESEARCH_FUNCTIONS: Record<
  string,
  (city: string, state: string, geminiKey: string) => Promise<unknown>
> = {
  landscape: researchLandscape,
  animals: researchAnimals,
  plants: researchPlants,
  foodAgriculture: researchFoodAgriculture,
  weather: researchWeather,
  localPlaces: researchLocalPlaces,
  cultureHistory: researchCultureHistory,
  sensory: researchSensory,
  developmental: researchDevelopmental,
  crossMedia: researchCrossMedia,
};
