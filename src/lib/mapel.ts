// Sifat mapel MA Al-Fatah (2026-11-09, pilihan pemilik): aturan yang berbeda per mapel dikumpulkan di sini.
// Aturan dalil & khilafiyah berlaku untuk SEMUA mapel (instruksi sistem), jadi tidak perlu daftar.
// Ijtimaiyyah, PJOK, dan BK sengaja tidak dimasukkan (keputusan pemilik); guru tetap bisa mengetik mapel lain lewat "Lainnya".

/** Pilihan mapel di form (nama & ejaan MA Al-Fatah). Materi lama dengan nama lain (mis. "Fikih") tetap terbaca. */
export const DAFTAR_MAPEL = [
  "Al-Qur'an Hadis", "Hadis", "Akidah Akhlak", "Tauhid", "Fiqih", "Fiqih Sholat", "Sejarah Kebudayaan Islam", "Al-Quds wal Maqdisiyyah",
  "Bahasa Arab", "Nahwu", "Bahasa Indonesia", "Bahasa Inggris",
  "Matematika", "Fisika", "Kimia", "Biologi", "Ekonomi", "Geografi", "Sosiologi", "Sejarah",
];

/** Teks Arab = isi pelajaran (mode "bahasa"): boleh ditulis AI, hanya yang mirip ayat dijaga. */
export const MAPEL_BAHASA_ARAB = /bahasa\s+arab|nahwu|sharaf|sharf|shorof|balaghah/i;

/**
 * Eksak ASAS MA Al-Fatah (surat Kepala MA 433/P/MA/PP.006/SPb/11/2026): Matematika, Fisika, Kimia, Biologi
 * (pilihan pemilik). "Matematik" (ejaan daftar madrasah) ikut.
 */
export const MAPEL_EKSAK = /^(matematika?|fisika|kimia|biologi)\b/i;

/**
 * Bahasa Inggris (keluhan guru Bahasa Inggris saat uji coba, 2026-11-09): semua yang dibaca siswa berbahasa Inggris,
 * termasuk petunjuk & judul bagian di lembar soal Word. Pembahasan, rubrik, dan kisi-kisi tetap Bahasa Indonesia (guru).
 */
export const MAPEL_INGGRIS = /bahasa\s+inggris|english/i;
