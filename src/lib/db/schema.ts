import { pgTable, text, timestamp, integer, jsonb, boolean, uuid, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Users (synced from Clerk) ──

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Cities ──

export const cities = pgTable("cities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  population: integer("population"),
  templateType: text("template_type"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("cities_name_state_unique").on(table.name, table.state),
]);

// ── City Dossiers (10-domain research) ──

export const cityDossiers = pgTable("city_dossiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").references(() => cities.id).notNull(),
  version: integer("version").default(1).notNull(),

  // 10 research domains as JSONB
  landscape: jsonb("landscape"),
  animals: jsonb("animals"),
  plants: jsonb("plants"),
  foodAgriculture: jsonb("food_agriculture"),
  weather: jsonb("weather"),
  localPlaces: jsonb("local_places"),
  cultureHistory: jsonb("culture_history"),
  sensory: jsonb("sensory"),
  developmental: jsonb("developmental"),
  crossMedia: jsonb("cross_media"),

  // Metadata
  generatedBy: uuid("generated_by").references(() => users.id),
  status: text("status").default("draft").notNull(),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Editions ──

export const editions = pgTable("editions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").references(() => cities.id).notNull(),
  dossierId: uuid("dossier_id").references(() => cityDossiers.id),

  city: text("city").notNull(),
  state: text("state").notNull(),
  templateVersion: text("template_version").notNull(),

  placeCount: integer("place_count").default(0),
  status: text("status").default("draft").notNull(),

  templateSelection: jsonb("template_selection"),
  summary: jsonb("summary"),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Places ──

export const places = pgTable("places", {
  id: uuid("id").defaultRandom().primaryKey(),
  editionId: uuid("edition_id").references(() => editions.id).notNull(),

  name: text("name").notNull(),
  category: text("category").notNull(),
  shortDescription: text("short_description"),
  whyWeLoveIt: text("why_we_love_it"),
  insiderTip: text("insider_tip"),

  address: text("address"),
  city: text("city"),
  state: text("state"),
  latitude: text("latitude"),
  longitude: text("longitude"),

  googlePlaceId: text("google_place_id"),
  googleRating: text("google_rating"),
  googleReviewCount: integer("google_review_count"),
  website: text("website"),
  phone: text("phone"),

  brandScore: integer("brand_score"),
  validationStatus: text("validation_status").default("REVIEW"),
  priceTier: text("price_tier"),
  isChain: boolean("is_chain").default(false),

  babyFriendly: boolean("baby_friendly"),
  toddlerSafe: boolean("toddler_safe"),
  preschoolPlus: boolean("preschool_plus"),
  warmWeather: boolean("warm_weather"),
  winterSpot: boolean("winter_spot"),

  iconString: text("icon_string"),
  sourceUrl: text("source_url"),
  weekAssignments: jsonb("week_assignments"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ──

export const citiesRelations = relations(cities, ({ many }) => ({
  dossiers: many(cityDossiers),
  editions: many(editions),
}));

export const cityDossiersRelations = relations(cityDossiers, ({ one }) => ({
  city: one(cities, {
    fields: [cityDossiers.cityId],
    references: [cities.id],
  }),
  generatedByUser: one(users, {
    fields: [cityDossiers.generatedBy],
    references: [users.id],
  }),
}));

export const editionsRelations = relations(editions, ({ one, many }) => ({
  city: one(cities, {
    fields: [editions.cityId],
    references: [cities.id],
  }),
  dossier: one(cityDossiers, {
    fields: [editions.dossierId],
    references: [cityDossiers.id],
  }),
  createdByUser: one(users, {
    fields: [editions.createdBy],
    references: [users.id],
  }),
  places: many(places),
}));

export const placesRelations = relations(places, ({ one }) => ({
  edition: one(editions, {
    fields: [places.editionId],
    references: [editions.id],
  }),
}));

// ── Inferred Types ──

export type User = typeof users.$inferSelect;
export type City = typeof cities.$inferSelect;
export type CityDossier = typeof cityDossiers.$inferSelect;
export type Edition = typeof editions.$inferSelect;
export type DbPlace = typeof places.$inferSelect;
