import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// max kecil karena hosting hanya mengizinkan 12 proses serentak.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

export const db = drizzle(pool);
