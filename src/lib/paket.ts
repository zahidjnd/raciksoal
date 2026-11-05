// Paket A/B/C/D (gelombang 2, pilihan pemilik 2026-11-05): isi soal sama, urutan berbeda, untuk mencegah contek.
// Tanpa import Next/DB supaya bisa dites (npm test) dan dipakai di browser (Kunci ringkas) maupun server (Word),
// dengan hasil yang PERSIS sama di keduanya.
import { keFormatAI, kocok, ratakanKunci, susunMenjodohkan, type Soal } from "./soal.ts";

export const PAKET = ["A", "B", "C", "D"] as const;
export type Paket = (typeof PAKET)[number];
export const bacaPaket = (x: unknown): Paket => (PAKET as readonly string[]).includes(String(x)) ? (x as Paket) : "A";

/** Pengacak bilangan tetap (mulberry32): seed sama → urutan sama, jadi Paket B selalu sama setiap diunduh. */
function pengacak(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Susunan satu paket. Paket A = urutan asli (seperti di web). Paket lain:
 * - urutan soal diacak DI DALAM tiap bagian bentuk (urutan bagian di Word baku); soal grup (wacana bersama)
 *   bergerak sebagai satu kesatuan supaya wacananya tidak terpisah;
 * - pilihan PG/PGK diacak dengan `ratakanKunci` (kunci tetap merata; pilihan angka tetap urut kecil → besar);
 *   aman karena pembahasan dilarang menyebut huruf pilihan (prompt.ts);
 * - lajur kanan Menjodohkan diacak ulang (`susunMenjodohkan`, tidak sejajar dengan premis).
 * `asal[i]` = indeks soal ke-i paket ini di urutan asli (Paket A), untuk tabel padanan nomor di lembar kunci.
 */
export function susunPaket(soal: Soal[], setId: number, paket: Paket): { soal: Soal[]; asal: number[] } {
  const k = PAKET.indexOf(paket);
  if (k <= 0) return { soal, asal: soal.map((_, i) => i) };
  const acak = pengacak(setId * 7919 + k * 104729);

  // Unit = satu soal, atau satu rangkaian soal grup yang berurutan.
  const unit: number[][] = [];
  soal.forEach((s, i) => {
    const akhir = unit.at(-1);
    if (akhir && s.grup && soal[akhir[0]].grup === s.grup && soal[akhir[0]].bentuk === s.bentuk) akhir.push(i);
    else unit.push([i]);
  });
  const asal: number[] = [];
  for (let u = 0; u < unit.length; ) {
    const bentuk = soal[unit[u][0]].bentuk;
    const bagian: number[][] = [];
    while (u < unit.length && soal[unit[u][0]].bentuk === bentuk) bagian.push(unit[u++]);
    asal.push(...kocok(bagian, acak).flat());
  }

  const hasil = asal.map((i) => {
    const s = structuredClone(soal[i]);
    return s.bentuk === "MJ" && s.premis && s.jawaban ? susunMenjodohkan(keFormatAI(s) as Soal, acak) : s;
  });
  ratakanKunci(hasil, acak);
  return { soal: hasil, asal };
}
