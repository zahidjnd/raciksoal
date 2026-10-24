import { BOBOT_BAWAAN } from "./prompt.ts";
import type { Bentuk } from "./soal.ts";

type PerBentuk = Record<Bentuk, number>;

/**
 * Skor per soal otomatis: BULAT, perbandingan antar bentuk sedekat mungkin dengan `dasar` (bawaan: BOBOT_BAWAAN; tombol "Pas-kan 100" memakai skor buatan guru), dan total
 * sedapat mungkin tepat 100. Bentuk yang jumlahnya 0 tidak dihitung (skornya tetap = dasar).
 * Bila skor bulat tidak bisa pas 100 (mis. 30 PG saja = 3,33/soal), dipilih total terdekat; `pas` = false.
 */
export function skorOtomatis(jumlah: PerBentuk, dasar: PerBentuk = BOBOT_BAWAAN, target = 100): { bobot: PerBentuk; total: number; pas: boolean } {
  const aktif = (Object.keys(jumlah) as Bentuk[]).filter((b) => jumlah[b] > 0);
  const bobot = { ...dasar };
  if (!aktif.length) return { bobot, total: 0, pas: false };

  const k = target / aktif.reduce((n, b) => n + jumlah[b] * Math.max(1, dasar[b]), 0);
  const ideal = (b: Bentuk) => Math.max(1, dasar[b]) * k;
  // Calon tiap bentuk: bilangan bulat di sekitar skor ideal (cukup, dan ruang cari tetap kecil).
  const calon = aktif.map((b) => {
    const lantai = Math.floor(ideal(b));
    const daftar: number[] = [];
    for (let s = Math.max(1, lantai - 3); s <= lantai + 4; s++) daftar.push(s);
    return daftar;
  });

  let terbaik: { s: number[]; selisih: number; biaya: number } | null = null;
  const pilih: number[] = [];
  const cari = (i: number, total: number, biaya: number) => {
    if (i === aktif.length) {
      const selisih = Math.abs(total - target);
      if (!terbaik || selisih < terbaik.selisih || (selisih === terbaik.selisih && biaya < terbaik.biaya)) terbaik = { s: [...pilih], selisih, biaya };
      return;
    }
    for (const s of calon[i]) {
      pilih[i] = s;
      const rel = (s - ideal(aktif[i])) / ideal(aktif[i]);
      cari(i + 1, total + s * jumlah[aktif[i]], biaya + rel * rel);
    }
  };
  cari(0, 0, 0);

  const t = terbaik!;
  aktif.forEach((b, i) => (bobot[b] = t.s[i]));
  const total = aktif.reduce((n, b) => n + jumlah[b] * bobot[b], 0);
  return { bobot, total, pas: total === target };
}
