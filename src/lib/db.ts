// src/lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./tables";

const globalForDb = global as unknown as { db?: ReturnType<typeof drizzle> };

export const db =
  globalForDb.db ??
  drizzle(new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  }), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;


