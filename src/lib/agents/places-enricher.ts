import { Place, PriceTier, GooglePlaceResult } from "@/lib/types";

async function findPlace(
  name: string,
  city: string,
  state: string,
  apiKey: string
): Promise<string | null> {
  const query = encodeURIComponent(`${name} ${city} ${state}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return data.candidates?.[0]?.place_id || null;
}

async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<GooglePlaceResult | null> {
  const fields = [
    "name",
    "formatted_address",
    "geometry",
    "rating",
    "user_ratings_total",
    "website",
    "formatted_phone_number",
    "price_level",
    "types",
    "opening_hours",
  ].join(",");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return data.result || null;
}

function mapPriceLevel(priceLevel: number | undefined): PriceTier {
  if (priceLevel === undefined || priceLevel === 0) return "FREE";
  if (priceLevel === 1) return "$5_$10";
  if (priceLevel === 2) return "$10_$15";
  return "$15_plus";
}

function parseAddress(formatted: string): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  // "123 Main St, City, ST 12345, USA"
  const parts = formatted.split(",").map((s) => s.trim());
  const address = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);

  return {
    address,
    city,
    state: stateMatch?.[1] || "",
    zip: stateMatch?.[2] || "",
  };
}

export async function enrichPlace(
  place: Partial<Place>,
  googleApiKey: string
): Promise<Partial<Place>> {
  try {
    const placeId = await findPlace(
      place.name!,
      place.city!,
      place.state!,
      googleApiKey
    );

    if (!placeId) return place;

    const details = await getPlaceDetails(placeId, googleApiKey);
    if (!details) return place;

    const parsed = parseAddress(details.formatted_address || "");

    return {
      ...place,
      name: details.name || place.name,
      address: parsed.address || place.address,
      city: parsed.city || place.city,
      state: parsed.state || place.state,
      zipCode: parsed.zip || place.zipCode,
      latitude: details.geometry?.location?.lat || place.latitude,
      longitude: details.geometry?.location?.lng || place.longitude,
      website: details.website || place.website,
      phone: details.formatted_phone_number || place.phone,
      googleRating: details.rating || place.googleRating,
      googleReviewCount: details.user_ratings_total || place.googleReviewCount,
      priceTier: mapPriceLevel(details.price_level),
      placeTypes: details.types || place.placeTypes,
    };
  } catch (err) {
    console.error(`Failed to enrich ${place.name}:`, err);
    return place;
  }
}

export async function enrichAllPlaces(
  places: Partial<Place>[],
  googleApiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<Partial<Place>[]> {
  const enriched: Partial<Place>[] = [];

  for (let i = 0; i < places.length; i++) {
    const result = await enrichPlace(places[i], googleApiKey);
    enriched.push(result);
    onProgress?.(i + 1, places.length);

    // Rate limiting for Google API
    await new Promise((r) => setTimeout(r, 200));
  }

  return enriched;
}
