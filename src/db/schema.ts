import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Tabel sementara dari tes langkah 1. Dibiarkan supaya datanya tidak terhapus.
export const tesData = pgTable("tes_data", {
  id: serial("id").primaryKey(),
  isi: text("isi").notNull(),
  dibuat: timestamp("dibuat").defaultNow().notNull(),
});

// ponytail: belum ada kolom guru (login baru di langkah 5); saat itu tambahkan guru_id + filter di setiap query.
export const hasilSoal = pgTable("hasil_soal", {
  id: serial("id").primaryKey(),
  dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").notNull(), // proses | selesai | gagal
  babId: text("bab_id").notNull(),
  pengaturan: jsonb("pengaturan").notNull(),
  model: text("model"),
  prompt: text("prompt"),
  jawabanAi: text("jawaban_ai"), // JSON array jawaban mentah AI per tahap, untuk perbandingan model (langkah 4)
  soal: jsonb("soal"), // versi terbaru (sudah diedit/diganti guru)
  pesan: text("pesan"),
  jumlahGanti: integer("jumlah_ganti").default(0).notNull(), // berapa kali "ganti satu soal" dipakai pada set ini
  info: jsonb("info"), // data perbandingan model: { detik, tokenMasuk, tokenKeluar }
});
