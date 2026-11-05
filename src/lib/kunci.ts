// Kunci ringkas satu set (tombol "Salin kunci" di halaman hasil), tanpa import Next/DB supaya bisa dites: npm test.
import { NAMA_BENTUK } from "./prompt.ts";
import type { Bentuk, Soal } from "./soal.ts";

/** Kunci satu soal dalam bentuk paling pendek, untuk mencocokkan jawaban siswa dengan cepat. */
export function kunciSatu(s: Soal): string {
  const k = [s.kunci].flat().map((x) => String(x ?? "").trim());
  if (s.bentuk === "URAIAN") return "(uraian, lihat rubrik)";
  if (s.bentuk === "MJ") return k.map((h, i) => `${i + 1}-${h}`).join(" ");
  return k.join(", ");
}

/**
 * Seluruh kunci set, dikelompokkan per bentuk dengan nomor soal global, mis.
 * "Pilihan Ganda: 1. A  2. C  3. B". Pilihan ganda (PG) ditulis sebaris; bentuk lain satu nomor per baris.
 */
export function kunciRingkas(soal: Soal[], judul = ""): string {
  const baris: string[] = judul ? [`Kunci jawaban: ${judul}`, ""] : [];
  for (const b of Object.keys(NAMA_BENTUK) as Bentuk[]) {
    const butir = soal.map((s, i) => ({ s, no: i + 1 })).filter((x) => x.s.bentuk === b);
    if (!butir.length) continue;
    if (b === "PG") baris.push(`${NAMA_BENTUK[b]}: ${butir.map((x) => `${x.no}. ${kunciSatu(x.s)}`).join("  ")}`);
    else baris.push(`${NAMA_BENTUK[b]}:`, ...butir.map((x) => `  ${x.no}. ${kunciSatu(x.s)}`));
  }
  return baris.join("\n");
}
