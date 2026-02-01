import { Place, PlaceCategory } from "@/lib/types";

interface SamplePlaceInput {
  name: string;
  category: PlaceCategory;
  address: string;
  zip: string;
  website: string;
  phone: string;
  rating: number;
  reviews: number;
  priceTier: Place["priceTier"];
  priceDetails: string;
  description: string;
  warmWeather: boolean;
  winterSpot: boolean;
}

function buildSamplePlace(
  input: SamplePlaceInput,
  city: string,
  state: string
): Place {
  return {
    id: `${input.name}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    name: input.name,
    category: input.category,
    address: input.address,
    city,
    state,
    zipCode: input.zip,
    latitude: null,
    longitude: null,
    website: input.website,
    phone: input.phone,
    googleRating: input.rating,
    googleReviewCount: input.reviews,
    priceTier: input.priceTier,
    priceDetails: input.priceDetails,
    babyFriendly: true,
    toddlerSafe: true,
    preschoolPlus: true,
    warmWeather: input.warmWeather,
    winterSpot: input.winterSpot,
    iconString: "",
    shortDescription: input.description,
    whyWeLoveIt: "",
    insiderTip: "",
    brandScore: 0,
    validationStatus: "REVIEW",
    editorialNotes: "",
    weekSuggestions: [],
    sourceUrl: input.website,
    isChain: false,
    placeTypes: [],
  };
}

const SAMPLE_PLACES: Record<string, SamplePlaceInput[]> = {
  default: [
    {
      name: "Riverside Nature Trail",
      category: "nature",
      address: "100 River Rd",
      zip: "00001",
      website: "https://example.com/nature-trail",
      phone: "(555) 100-0001",
      rating: 4.7,
      reviews: 342,
      priceTier: "FREE",
      priceDetails: "Free admission, free parking",
      description:
        "Scenic 3-mile paved trail along the river with wildlife viewing areas",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Oakwood Park & Playground",
      category: "nature",
      address: "250 Oak Ave",
      zip: "00002",
      website: "https://example.com/oakwood",
      phone: "(555) 100-0002",
      rating: 4.5,
      reviews: 218,
      priceTier: "FREE",
      priceDetails: "Free admission",
      description:
        "Large park with nature playground, splash pad, and walking trails",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Prairie Wind Nature Preserve",
      category: "nature",
      address: "4200 Prairie Rd",
      zip: "00003",
      website: "https://example.com/prairie-wind",
      phone: "(555) 100-0003",
      rating: 4.8,
      reviews: 156,
      priceTier: "FREE",
      priceDetails: "Free, donations welcome",
      description:
        "200-acre native prairie preserve with interpretive trails and bird watching",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Lakeside Recreation Area",
      category: "nature",
      address: "800 Lake Dr",
      zip: "00004",
      website: "https://example.com/lakeside",
      phone: "(555) 100-0004",
      rating: 4.4,
      reviews: 521,
      priceTier: "FREE",
      priceDetails: "Free entry, $3 paddle boat rental",
      description:
        "Family-friendly lake area with fishing, playgrounds, and picnic shelters",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Wildflower Arboretum",
      category: "nature",
      address: "3100 Botanical Way",
      zip: "00005",
      website: "https://example.com/arboretum",
      phone: "(555) 100-0005",
      rating: 4.6,
      reviews: 289,
      priceTier: "FREE",
      priceDetails: "Free admission",
      description:
        "Beautiful arboretum featuring native wildflowers and sensory gardens",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Green Acres Family Farm",
      category: "farm",
      address: "12500 County Rd 8",
      zip: "00010",
      website: "https://example.com/green-acres",
      phone: "(555) 200-0001",
      rating: 4.6,
      reviews: 187,
      priceTier: "$5_$10",
      priceDetails: "$8/person, under 2 free",
      description:
        "Working family farm with petting zoo, hay rides, and seasonal u-pick",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Sunflower Petting Zoo",
      category: "farm",
      address: "8800 Farm Rd",
      zip: "00011",
      website: "https://example.com/sunflower-zoo",
      phone: "(555) 200-0002",
      rating: 4.4,
      reviews: 134,
      priceTier: "$5_$10",
      priceDetails: "$6/person, under 1 free",
      description:
        "Gentle petting zoo with goats, bunnies, and pony rides for little ones",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Heritage Orchard",
      category: "farm",
      address: "5500 Orchard Ln",
      zip: "00012",
      website: "https://example.com/heritage-orchard",
      phone: "(555) 200-0003",
      rating: 4.7,
      reviews: 298,
      priceTier: "$5_$10",
      priceDetails: "$5 admission includes apple picking bag",
      description:
        "Century-old orchard with u-pick apples, pumpkin patch, and corn maze",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Central Public Library",
      category: "library",
      address: "200 Main St",
      zip: "00020",
      website: "https://example.com/library-central",
      phone: "(555) 300-0001",
      rating: 4.5,
      reviews: 412,
      priceTier: "FREE",
      priceDetails: "Free, library card required for checkout",
      description:
        "Main library branch with dedicated children's wing and weekly storytime",
      warmWeather: true,
      winterSpot: true,
    },
    {
      name: "Westside Branch Library",
      category: "library",
      address: "4500 West Blvd",
      zip: "00021",
      website: "https://example.com/library-west",
      phone: "(555) 300-0002",
      rating: 4.3,
      reviews: 89,
      priceTier: "FREE",
      priceDetails: "Free",
      description:
        "Cozy branch library with toddler play area and monthly craft events",
      warmWeather: true,
      winterSpot: true,
    },
    {
      name: "Discovery Children's Museum",
      category: "museum",
      address: "600 Museum Blvd",
      zip: "00030",
      website: "https://example.com/discovery-museum",
      phone: "(555) 400-0001",
      rating: 4.7,
      reviews: 1243,
      priceTier: "$10_$15",
      priceDetails: "$12/person, under 1 free, family pass $150/year",
      description:
        "Hands-on children's museum with water play, building zone, and art studio",
      warmWeather: true,
      winterSpot: true,
    },
    {
      name: "Nature & Science Center",
      category: "museum",
      address: "1200 Science Dr",
      zip: "00031",
      website: "https://example.com/science-center",
      phone: "(555) 400-0002",
      rating: 4.5,
      reviews: 567,
      priceTier: "$5_$10",
      priceDetails: "$8 adults, $5 children, under 2 free",
      description:
        "Interactive science center with live animal exhibits and planetarium",
      warmWeather: true,
      winterSpot: true,
    },
    {
      name: "Little Explorers Play Cafe",
      category: "indoor_play",
      address: "340 Market St",
      zip: "00040",
      website: "https://example.com/little-explorers",
      phone: "(555) 500-0001",
      rating: 4.8,
      reviews: 167,
      priceTier: "$5_$10",
      priceDetails: "$10/child, adults free, coffee available",
      description:
        "Indoor play cafe with Montessori-inspired play zones for ages 0-5",
      warmWeather: false,
      winterSpot: true,
    },
    {
      name: "Creative Kids Art Studio",
      category: "indoor_play",
      address: "720 Arts Ave",
      zip: "00041",
      website: "https://example.com/creative-kids",
      phone: "(555) 500-0002",
      rating: 4.6,
      reviews: 93,
      priceTier: "$5_$10",
      priceDetails: "$8/session includes materials",
      description:
        "Drop-in art studio with painting, pottery, and sensory play for toddlers",
      warmWeather: false,
      winterSpot: true,
    },
    {
      name: "Botanical Gardens",
      category: "garden",
      address: "1800 Garden Way",
      zip: "00050",
      website: "https://example.com/botanical-gardens",
      phone: "(555) 600-0001",
      rating: 4.8,
      reviews: 892,
      priceTier: "FREE",
      priceDetails: "Free admission year-round",
      description:
        "Stunning botanical gardens with children's discovery garden and butterfly house",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Old Town Farmers Market",
      category: "garden",
      address: "100 Old Town Square",
      zip: "00051",
      website: "https://example.com/farmers-market",
      phone: "(555) 600-0002",
      rating: 4.7,
      reviews: 445,
      priceTier: "FREE",
      priceDetails: "Free to browse, vendors accept cash and card",
      description:
        "Saturday morning farmers market with local produce, live music, and kids activities",
      warmWeather: true,
      winterSpot: false,
    },
    {
      name: "Holiday Lights Festival",
      category: "seasonal",
      address: "Downtown Core",
      zip: "00060",
      website: "https://example.com/holiday-lights",
      phone: "(555) 700-0001",
      rating: 4.6,
      reviews: 678,
      priceTier: "FREE",
      priceDetails: "Free, hot cocoa $3",
      description:
        "Annual holiday lights display with horse-drawn carriages and Santa visits",
      warmWeather: false,
      winterSpot: true,
    },
    {
      name: "Spring Festival at the Park",
      category: "seasonal",
      address: "City Central Park",
      zip: "00061",
      website: "https://example.com/spring-fest",
      phone: "(555) 700-0002",
      rating: 4.5,
      reviews: 234,
      priceTier: "FREE",
      priceDetails: "Free admission, activities $1-$3",
      description:
        "Community spring celebration with egg hunts, live animals, and craft booths",
      warmWeather: true,
      winterSpot: false,
    },
  ],
};

export function generateSampleData(
  city: string,
  state: string
): Place[] {
  const inputs = SAMPLE_PLACES.default;
  return inputs.map((input) => buildSamplePlace(input, city, state));
}
