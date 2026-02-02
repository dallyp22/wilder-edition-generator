/**
 * Database schema — prepared for Neon PostgreSQL + Drizzle ORM.
 * Not connected until DATABASE_URL is provided in Phase 2.
 *
 * Tables:
 * - users: synced from Clerk via webhook
 * - editions: generated city editions
 * - places: discovered places per edition
 * - dossiers: city dossier research (Phase 2)
 */

// Uncomment and install drizzle-orm + @neondatabase/serverless when ready:
//
// import { pgTable, text, timestamp, integer, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
//
// export const users = pgTable("users", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   clerkId: text("clerk_id").notNull().unique(),
//   email: text("email").notNull(),
//   firstName: text("first_name"),
//   lastName: text("last_name"),
//   role: text("role").default("member").notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export const editions = pgTable("editions", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   userId: uuid("user_id").references(() => users.id),
//   city: text("city").notNull(),
//   state: text("state").notNull(),
//   templateVersion: text("template_version").notNull(),
//   placeCount: integer("place_count").default(0),
//   status: text("status").default("draft").notNull(),
//   metadata: jsonb("metadata"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
//
// export const places = pgTable("places", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   editionId: uuid("edition_id").references(() => editions.id),
//   name: text("name").notNull(),
//   category: text("category").notNull(),
//   shortDescription: text("short_description"),
//   address: text("address"),
//   googlePlaceId: text("google_place_id"),
//   brandScore: integer("brand_score"),
//   validationStatus: text("validation_status").default("REVIEW"),
//   weekAssignments: jsonb("week_assignments"),
//   metadata: jsonb("metadata"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
//
// export const dossiers = pgTable("dossiers", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   editionId: uuid("edition_id").references(() => editions.id),
//   domain: text("domain").notNull(),
//   content: jsonb("content"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

export {};
