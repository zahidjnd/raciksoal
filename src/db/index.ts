import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// max kecil karena hosting hanya mengizinkan 12 proses serentak.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

export const db = drizzle(pool);

/** Pukul 00.00 WIB hari ini (dasar semua hitungan "hari ini": jatah harian, Kelola guru). */
export const awalHariIni = sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
