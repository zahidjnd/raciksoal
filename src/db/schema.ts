import { boolean, customType, index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

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
    // Nama set buatan guru (riwayat, judul halaman hasil, nama file Word). Kosong → judul bab.
    nama: text("nama"),
    // Dihapus guru (hapus lunak): tidak tampil dan tidak bisa dibuka siapa pun, tetapi tetap dihitung di jatah harian
    // (supaya hapus tidak mengembalikan jatah) dan bisa dipulihkan admin lewat database (dihapus = null).
    dihapus: timestamp("dihapus", { withTimezone: true }),
  },
  (t) => [index("hasil_soal_guru_idx").on(t.guruId, t.dibuat)],
);

/** Pengaturan web yang diatur admin sekali (mis. nama madrasah di kop Word). Satu baris per kunci. */
/** Preferensi guru (halaman Akun, 0.32.0): satu baris per guru, isi = Preferensi (src/lib/preferensi.ts). Aturan 3. */
export const preferensiGuru = pgTable("preferensi_guru", {
  guruId: text("guru_id")
    .primaryKey()
    .references(() => pengguna.id),
  nilai: jsonb("nilai").notNull(),
  diubah: timestamp("diubah", { withTimezone: true }).defaultNow().notNull(),
});

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

/**
 * Gambar materi/soal (0.30.0): JPEG yang sudah dikecilkan di browser guru (sisi terpanjang <= 1280 px). Aturan 3: per guru,
 * hanya pemilik (dan admin) yang bisa membukanya lewat /api/gambar/[id]. Tidak pernah dihapus (materi/set yang sudah
 * dibuat tetap bisa menampilkan gambarnya); jumlah per guru dibatasi BATAS_GAMBAR.
 */
export const gambar = pgTable(
  "gambar",
  {
    id: serial("id").primaryKey(),
    guruId: text("guru_id")
      .notNull()
      .references(() => pengguna.id),
    dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
    lebar: integer("lebar").notNull(),
    tinggi: integer("tinggi").notNull(),
    data: bytea("data").notNull(),
  },
  (t) => [index("gambar_guru_idx").on(t.guruId)],
);

/**
 * Masukan & saran guru (0.48.0): dari jendela otomatis setelah beberapa set selesai, atau tautan "Kirim masukan" di
 * sidebar. Guru hanya mengirim; yang membaca hanya admin (/admin/masukan). set_id = set yang dikeluhkan (milik guru itu).
 */
export const masukan = pgTable(
  "masukan",
  {
    id: serial("id").primaryKey(),
    guruId: text("guru_id")
      .notNull()
      .references(() => pengguna.id),
    dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
    nilai: integer("nilai"), // 1–5 (wajah), boleh kosong
    isi: text("isi"), // boleh kosong bila nilai diisi
    setId: integer("set_id").references(() => hasilSoal.id),
    otomatis: boolean("otomatis").default(false).notNull(), // true = dari jendela yang muncul sendiri
    versi: text("versi"), // versi aplikasi saat dikirim
  },
  (t) => [index("masukan_dibuat_idx").on(t.dibuat)],
);

// Pemakaian AI di luar pembuatan set (aturan 4): satu baris per Ganti/Ubah/Tambah soal yang berhasil dan per analisa
// materi, untuk batas harian per guru. Hanya dihitung, isinya tidak dipakai untuk hal lain.
export const pemakaianAi = pgTable(
  "pemakaian_ai",
  {
    id: serial("id").primaryKey(),
    guruId: text("guru_id")
      .notNull()
      .references(() => pengguna.id),
    jenis: text("jenis").notNull(), // "ganti" | "ubah" | "tambah" | "analisa"
    waktu: timestamp("waktu", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("pemakaian_ai_guru_idx").on(t.guruId, t.waktu)],
);

// ---- Koreksi LJK (tahap 2) ----

/**
 * Daftar siswa per kelas, ditempel admin sekali dari Excel TU (/admin/siswa). Tempel ulang = nomor/kelas diperbarui,
 * nama yang hilang ditandai `aktif = false` (tidak dihapus: nilai lama tetap menunjuk ke barisnya).
 */
export const siswa = pgTable(
  "siswa",
  {
    id: serial("id").primaryKey(),
    kelas: text("kelas").notNull(),
    nomor: integer("nomor").notNull(), // nomor absen di kelas
    nama: text("nama").notNull(),
    nisn: text("nisn"), // 10 angka (boleh kosong); teks supaya angka 0 di depan tidak hilang
    aktif: boolean("aktif").default(true).notNull(),
    diubah: timestamp("diubah", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("siswa_kelas_nama_idx").on(t.kelas, t.nama)],
);

/** Satu ujian yang dikoreksi = satu kelas. Aturan 3: hanya pemilik (dan admin). `kunci` = ButirKunci[] (lib/koreksi.ts). */
export const ujianLjk = pgTable(
  "ujian_ljk",
  {
    id: serial("id").primaryKey(),
    guruId: text("guru_id")
      .notNull()
      .references(() => pengguna.id),
    dibuat: timestamp("dibuat", { withTimezone: true }).defaultNow().notNull(),
    nama: text("nama").notNull(),
    kelas: text("kelas").notNull(),
    setId: integer("set_id").references(() => hasilSoal.id), // kunci diambil dari set ini (boleh kosong = ketik sendiri)
    kunci: jsonb("kunci").notNull(),
    esaiMaks: real("esai_maks").notNull(), // skor esai maksimal (mis. 5 nomor × 8 = 40)
    dihapus: timestamp("dihapus", { withTimezone: true }),
  },
  (t) => [index("ujian_ljk_guru_idx").on(t.guruId, t.dibuat)],
);

/** Hasil satu siswa di satu ujian. Foto LJK TIDAK disimpan, hanya potongan tulisan nama (JPEG kecil) sebagai bukti. */
export const nilaiLjk = pgTable(
  "nilai_ljk",
  {
    id: serial("id").primaryKey(),
    ujianId: integer("ujian_id")
      .notNull()
      .references(() => ujianLjk.id),
    siswaId: integer("siswa_id")
      .notNull()
      .references(() => siswa.id),
    jawab: jsonb("jawab"), // number[][] pilihan per nomor (sudah dibetulkan guru); kosong = belum dipindai
    objektif: real("objektif"), // skor PG/PGK/BS, dihitung server dari kunci
    esai: real("esai"),
    potongNama: bytea("potong_nama"),
    diubah: timestamp("diubah", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("nilai_ljk_ujian_siswa_idx").on(t.ujianId, t.siswaId)],
);
