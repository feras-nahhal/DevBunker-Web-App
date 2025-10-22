// src/lib/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres"; // node-postgres adapter
import * as schema from "./tables";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
