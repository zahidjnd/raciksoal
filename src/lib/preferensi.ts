// Preferensi guru (halaman Akun, 0.32.0): nilai bawaan form Set baru, tersimpan di server supaya sama di HP & laptop.
// Tanpa import Next/DB supaya bisa dites: npm test. Disimpan di tabel preferensi_guru, satu baris per guru (aturan 3).
import { KESULITAN, MAKS_CATATAN, WAKTU_BAWAAN } from "./prompt.ts";
import { KELAS } from "./soal.ts";

export type Preferensi = {
  mapel: string[]; // mapel yang diajar: tampil paling atas di pilihan mapel, yang pertama langsung terpilih
  kelas: string; // "" = tidak ada bawaan
  waktu: number; // lama ujian bawaan (menit) di kop Word
  kesulitan: string;
  catatan: string; // catatan tetap untuk AI: mengisi kotak "Catatan untuk AI" setiap set baru (tetap bisa diubah per set)
};

export const PREFERENSI_AWAL: Preferensi = { mapel: [], kelas: "", waktu: WAKTU_BAWAAN, kesulitan: "Sedang", catatan: "" };
export const MAKS_MAPEL_SAYA = 6;
export const MAKS_NAMA = 60;

/** Isian dari browser/database (tidak dipercaya) → preferensi yang sah. Nilai rusak diganti bawaan. */
export function rapikanPreferensi(x: unknown): Preferensi {
  const p = (x ?? {}) as Record<string, unknown>;
  const teks = (v: unknown, maks: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, maks);
  const mapel = [...new Set((Array.isArray(p.mapel) ? p.mapel : []).map((m) => teks(m, 60)).filter(Boolean))].slice(0, MAKS_MAPEL_SAYA);
  const waktu = Math.round(Number(p.waktu));
  return {
    mapel,
    kelas: KELAS.includes(String(p.kelas)) ? String(p.kelas) : "",
    waktu: waktu >= 10 && waktu <= 600 ? waktu : WAKTU_BAWAAN,
    kesulitan: (KESULITAN as readonly string[]).includes(String(p.kesulitan)) ? String(p.kesulitan) : "Sedang",
    // Catatan boleh beberapa baris (sama dengan kotak Catatan untuk AI); kutip tiga dibuang seperti bersihkanPengaturan.
    catatan: String(p.catatan ?? "").replace(/"{3,}/g, '"').trim().slice(0, MAKS_CATATAN),
  };
}

/** Nama tampil yang diketik guru: spasi dirapikan, 3–60 huruf. Kembalian null = tidak sah. */
export function rapikanNama(x: unknown): string | null {
  const n = String(x ?? "").replace(/\s+/g, " ").trim();
  return n.length >= 3 && n.length <= MAKS_NAMA ? n : null;
}
