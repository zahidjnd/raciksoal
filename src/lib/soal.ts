// Pemeriksaan hasil AI. Tanpa import "@/..." supaya bisa dites langsung: npm test

export type Bentuk = "PG" | "PGK" | "BS" | "URAIAN";

export type Soal = {
  bentuk: Bentuk;
  dalil_id: string | null;
  pertanyaan: string;
  pilihan?: string[];
  kunci: string | string[];
  rubrik?: { kriteria: string; skor: number }[];
  pembahasan: string;
  level: string;
  tp: string;
  skor: number;
  peringatan?: string[]; // diisi aplikasi, bukan AI
};

export type Bab = {
  id: string;
  judul: string;
  tp: { kode: string; teks: string }[];
  dalil: { id: string; sumber: string; arab: string; terjemah: string; mufradat: { arab: string; arti: string }[] }[];
  materi: string[];
};

const HURUF_ARAB = "؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
// Satu potongan teks Arab: huruf Arab, boleh berisi spasi di tengah.
export const POLA_ARAB = `[${HURUF_ARAB}]+(?:[\\s${HURUF_ARAB}]*[${HURUF_ARAB}])?`;
const rapikan = (s: string) => s.replace(/\s+/g, " ").normalize("NFC");

/** Semua teks Arab terverifikasi milik bab (ayat, hadis, mufradat, materi) dalam satu teks. */
export const korpusArab = (bab: Bab) => rapikan(JSON.stringify(bab));

/** Potongan teks Arab yang TIDAK ada persis (huruf + harakat) di data terverifikasi. Harus kosong. */
export function arabTakTerverifikasi(teks: string, korpus: string): string[] {
  return (teks.match(new RegExp(POLA_ARAB, "g")) ?? []).filter((p) => !korpus.includes(rapikan(p)));
}

/** Beri peringatan pada soal yang bermasalah. Aturan 5: teks Arab hanya boleh dari data terverifikasi. */
export function periksaSoal(soal: Soal[], bab: Bab): Soal[] {
  const korpus = korpusArab(bab);
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  return soal.map((s) => {
    const peringatan: string[] = [];
    const semuaTeks = [s.pertanyaan, ...(s.pilihan ?? []), ...[s.kunci].flat(), s.pembahasan, ...(s.rubrik ?? []).map((r) => r.kriteria)];
    const arabAsing = semuaTeks.flatMap((t) => arabTakTerverifikasi(String(t ?? ""), korpus));
    if (arabAsing.length) peringatan.push(`Teks Arab tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`);
    if (s.dalil_id && !dalilAda.has(s.dalil_id)) peringatan.push(`Dalil "${s.dalil_id}" tidak ada di data bab.`);
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && s.pilihan?.length !== 5) peringatan.push("Jumlah pilihan bukan 5.");
    if (s.bentuk === "PGK" && (!Array.isArray(s.kunci) || s.kunci.length !== 2)) peringatan.push("Kunci PG kompleks bukan 2 jawaban.");
    return { ...s, peringatan };
  });
}

/** Sebar kunci PG merata ke A–E (urutan acak) dengan menukar posisi pilihan. */
export function ratakanKunci(soal: Soal[], acak = Math.random): void {
  const HURUF = "ABCDE";
  const pg = soal.filter((s) => s.bentuk === "PG" && s.pilihan?.length === 5 && typeof s.kunci === "string" && HURUF.includes(s.kunci) && s.kunci.length === 1);
  const target = pg.map((_, i) => i % 5);
  for (let i = target.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [target[i], target[j]] = [target[j], target[i]];
  }
  pg.forEach((s, i) => {
    const p = s.pilihan!;
    const lama = HURUF.indexOf(s.kunci as string);
    const baru = target[i];
    [p[lama], p[baru]] = [p[baru], p[lama]];
    s.kunci = HURUF[baru];
  });
}
