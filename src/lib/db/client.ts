import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Provision a Neon database via the Vercel dashboard " +
      "(Storage → Create → Postgres) then run `vercel env pull`."
    );
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy initialization — only connects when first accessed
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Convenience export for direct usage
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
