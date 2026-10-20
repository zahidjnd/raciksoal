import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Tabel sementara dari tes langkah 1. Dibiarkan supaya datanya tidak terhapus.
export const tesData = pgTable("tes_data", {
  id: serial("id").primaryKey(),
  isi: text("isi").notNull(),
  dibuat: timestamp("dibuat").defaultNow().notNull(),
});

// ---- Login (Better Auth). Nama properti (camelCase) harus sama dengan nama field Better Auth. ----
const waktu = (nama: string) => timestamp(nama, { withTimezone: true });

export const pengguna = pgTable("pengguna", {
  id: text("id").primaryKey(),
  name: text("nama").notNull(),
  email: text("email").notNull().unique(), // wajib di Better Auth; diisi otomatis <username>@raciksoal.local
  emailVerified: boolean("email_terverifikasi").default(false).notNull(),
  image: text("gambar"),
  createdAt: waktu("dibuat").defaultNow().notNull(),
  updatedAt: waktu("diubah").defaultNow().notNull(),
  username: text("username").unique(),
  displayUsername: text("username_tampil"),
  role: text("peran"), // "admin" | "user" (guru)
  banned: boolean("nonaktif").default(false),
  banReason: text("alasan_nonaktif"),
  banExpires: waktu("nonaktif_sampai"),
});

export const sesi = pgTable(
  "sesi",
  {
    id: text("id").primaryKey(),
    expiresAt: waktu("berakhir").notNull(),
    token: text("token").notNull().unique(),
    createdAt: waktu("dibuat").defaultNow().notNull(),
    updatedAt: waktu("diubah").notNull(),
    ipAddress: text("ip"),
    userAgent: text("perangkat"),
    userId: text("pengguna_id")
      .notNull()
      .references(() => pengguna.id, { onDelete: "cascade" }),
    impersonatedBy: text("diwakili_oleh"),
  },
  (t) => [index("sesi_pengguna_idx").on(t.userId)],
);

export const akunLogin = pgTable(
  "akun_login",
  {
    id: text("id").primaryKey(),
    accountId: text("akun_id").notNull(),
    providerId: text("penyedia").notNull(),
    userId: text("pengguna_id")
      .notNull()
      .references(() => pengguna.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: waktu("access_token_berakhir"),
    refreshTokenExpiresAt: waktu("refresh_token_berakhir"),
    scope: text("scope"),
    password: text("kata_sandi"), // hash (scrypt), bukan teks asli
    createdAt: waktu("dibuat").defaultNow().notNull(),
    updatedAt: waktu("diubah").notNull(),
  },
  (t) => [index("akun_login_pengguna_idx").on(t.userId)],
);

export const verifikasi = pgTable(
  "verifikasi",
  {
    id: text("id").primaryKey(),
    identifier: text("identitas").notNull(),
    value: text("nilai").notNull(),
    expiresAt: waktu("berakhir").notNull(),
    createdAt: waktu("dibuat").defaultNow().notNull(),
    updatedAt: waktu("diubah").defaultNow().notNull(),
  },
  (t) => [index("verifikasi_identitas_idx").on(t.identifier)],
);

// ---- Soal ----
export const hasilSoal = pgTable(
  "hasil_soal",
  {
    id: serial("id").primaryKey(),
    dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
    // Pemilik set (aturan 3). Kosong hanya untuk set uji coba lama, yang dipindah ke admin saat admin pertama dibuat.
    guruId: text("guru_id").references(() => pengguna.id),
    status: text("status").notNull(), // proses | selesai | gagal
    babId: text("bab_id").notNull(),
    pengaturan: jsonb("pengaturan").notNull(),
    model: text("model"),
    prompt: text("prompt"),
    jawabanAi: text("jawaban_ai"), // JSON array jawaban mentah AI per tahap, untuk perbandingan model (langkah 4)
    soal: jsonb("soal"), // versi terbaru (sudah diedit/diganti guru)
    pesan: text("pesan"),
    jumlahGanti: integer("jumlah_ganti").default(0).notNull(), // berapa kali "ganti satu soal" dipakai pada set ini
    info: jsonb("info"), // data perbandingan model: { detik, tokenMasuk, tokenKeluar, catatan }
    kisi: jsonb("kisi"), // kisi-kisi (BarisKisi[], langkah 6); kosong untuk set lama
    // Salinan data bab saat set dibuat (langkah 8), supaya set tetap utuh walau materi guru diubah/dihapus.
    // Kosong untuk set lama → pakai DAFTAR_BAB[babId].
    bab: jsonb("bab"),
  },
  (t) => [index("hasil_soal_guru_idx").on(t.guruId, t.dibuat)],
);

/** Pengaturan web yang diatur admin sekali (mis. nama madrasah di kop Word). Satu baris per kunci. */
export const pengaturanWeb = pgTable("pengaturan_web", {
  kunci: text("kunci").primaryKey(),
  nilai: jsonb("nilai").notNull(),
  diubah: timestamp("diubah", { withTimezone: true }).defaultNow().notNull(),
});

/** Materi sendiri milik guru (langkah 8). `bab` = data bab (judul, tp, dalil terverifikasi guru, materi). Aturan 3: per guru. */
export const materi = pgTable(
  "materi",
  {
    id: serial("id").primaryKey(),
    guruId: text("guru_id")
      .notNull()
      .references(() => pengguna.id),
    dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
    diubah: timestamp("diubah", { withTimezone: true }).defaultNow().notNull(),
    bab: jsonb("bab").notNull(),
  },
  (t) => [index("materi_guru_idx").on(t.guruId)],
);
