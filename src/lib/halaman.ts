// 0.68.0: pilihan halaman PDF = kumpulan halaman (beberapa bab sekaligus), ditulis seperti kotak cetak: "15-30, 70-85".

/** Halaman a..b (urutan bebas). */
export const rentang = (a: number, b: number) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/** Urut & tanpa kembar. */
export const rapikan = (h: number[]) => [...new Set(h)].sort((a, b) => a - b);

/** "15-30, 70-85, 90" → [15..30, 70..85, 90]; bagian yang bukan angka atau di luar 1..jumlah diabaikan. */
export function bacaRentang(teks: string, jumlah: number): number[] {
  const hasil: number[] = [];
  for (const bagian of teks.split(/[,;]/)) {
    const m = bagian.trim().match(/^(\d+)\s*(?:[-–—]|s\.?d\.?|sampai)?\s*(\d+)?$/i);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    hasil.push(...rentang(a, b).filter((n) => n >= 1 && n <= jumlah));
  }
  return rapikan(hasil);
}

/** [15,16,...,30,70,...,85] → "15–30, 70–85" (pisah "-" untuk kotak isian). */
export function tulisRentang(h: number[], pisah = "–"): string {
  const urut = rapikan(h);
  const bagian: string[] = [];
  for (let i = 0; i < urut.length; ) {
    let j = i;
    while (j + 1 < urut.length && urut[j + 1] === urut[j] + 1) j++;
    bagian.push(i === j ? String(urut[i]) : `${urut[i]}${pisah}${urut[j]}`);
    i = j + 1;
  }
  return bagian.join(", ");
}
