import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Tabel sementara untuk tes langkah 1 (simpan & baca satu data).
export const tesData = pgTable("tes_data", {
  id: serial("id").primaryKey(),
  isi: text("isi").notNull(),
  dibuat: timestamp("dibuat").defaultNow().notNull(),
});
