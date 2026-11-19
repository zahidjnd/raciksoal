/** Angka & sumbu bersama grafik.ts dan geometri.ts (file sendiri supaya kedua file itu tidak saling mengimpor). */

/** Angka gaya Indonesia: "30.000" → 30000, "2,5" → 2.5, "45%" → 45, "Rp 1.500" → 1500. Bukan angka → NaN. */
export function bacaAngka(s: string): number {
  let t = String(s ?? "").replace(/−/g, "-").replace(/[^\d.,-]/g, "").replace(/^[.,]+|[.,]+$/g, "");
  if (!/\d/.test(t)) return NaN;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return Number(t);
}

/** Rentang sumbu Y "rapi" (langkah 1/2/2,5/5 × 10ⁿ, ±8 garis: mudah dibaca siswa). Batang selalu memuat 0. */
export function skala(min: number, max: number, nol: boolean) {
  let lo = nol ? Math.min(0, min) : min;
  let hi = nol ? Math.max(0, max) : max;
  if (hi === lo) {
    const d = Math.abs(hi) * 0.1 || 1;
    if (!nol || lo < 0) lo -= d;
    hi += d;
  }
  const kasar = (hi - lo) / 8;
  const p = 10 ** Math.floor(Math.log10(kasar));
  const f = kasar / p;
  const langkah = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return { a: Math.floor(lo / langkah + 1e-9) * langkah, b: Math.ceil(hi / langkah - 1e-9) * langkah, langkah };
}
