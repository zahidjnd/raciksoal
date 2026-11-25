// Koreksi LJK (tahap 2): kunci, skor, nilai, dan daftar siswa tempelan. Tanpa import Next/DB supaya bisa dites
// (npm test) dan dipakai di browser (tampilan langsung) maupun server (nilai disimpan = hitungan server).
import { BOBOT_BAWAAN } from "./prompt.ts";
import type { Soal } from "./soal.ts";
import { HURUF, LJK } from "./ljk.ts";

export type BentukLjk = "PG" | "PGK" | "BS";
/** Satu nomor di LJK. kunci = indeks huruf (A = 0); PGK boleh lebih dari satu. B/S & menjodohkan dijawab huruf A–E
 *  seperti PG (huruf Benar/Salah terserah guru; dari set Racik: A = Benar, B = Salah sesuai lembar soal Word). */
export type ButirKunci = { bentuk: BentukLjk; kunci: number[]; skor: number };

/** Format ASAS MA Al-Fatah (ATURAN-SOAL 3a, surat Kepala MA No. 433/2026): jumlah & skor per bentuk, total 100.
 *  "B/S" di LJK = Benar/Salah atau Menjodohkan gaya lama (dijawab huruf). Untuk kunci yang diisi sendiri. */
export const FORMAT_ASAS = {
  nonEksak: { nama: "Non-eksak (45 soal)", jumlah: { PG: 30, PGK: 5, BS: 5 }, skor: { PG: 1, PGK: 4, BS: 2 }, esai: { jumlah: 5, skor: 8 } },
  eksak: { nama: "Eksak (35 soal)", jumlah: { PG: 20, PGK: 5, BS: 5 }, skor: { PG: 2, PGK: 4, BS: 2 }, esai: { jumlah: 5, skor: 6 } },
} as const;

/** Kunci dari set Racik Soal (Paket A = urutan asli). Nomor LJK = nomor soal di lembar soal Word.
 *  Soal yang tidak dijawab di LJK (isian, uraian, menjodohkan premis) masuk esai. */
export function kunciDariSet(soal: Soal[]): { kunci: ButirKunci[]; esaiMaks: number } | { pesan: string } {
  const kunci: ButirKunci[] = [];
  let esaiMaks = 0;
  for (const [i, s] of soal.entries()) {
    const k = [s.kunci].flat().map((x) => String(x ?? "").trim().toUpperCase());
    const skor = Number(s.skor) || BOBOT_BAWAAN[s.bentuk] || 0;
    let butir: ButirKunci | null = null;
    if (s.bentuk === "PG" || (s.bentuk === "MJ" && !Array.isArray(s.premis) && /^[A-E]$/.test(k[0])))
      butir = { bentuk: "PG", kunci: [HURUF.indexOf(k[0])], skor };
    else if (s.bentuk === "PGK") butir = { bentuk: "PGK", kunci: k.map((h) => HURUF.indexOf(h)).filter((x) => x >= 0).sort(), skor };
    else if (s.bentuk === "BS" && !Array.isArray(s.pernyataan)) butir = { bentuk: "BS", kunci: [k[0] === "BENAR" ? 0 : 1], skor };
    if (!butir) {
      esaiMaks += skor;
      continue;
    }
    if (kunci.length !== i) return { pesan: `Soal nomor ${i + 1} (${s.bentuk}) tidak bisa dijawab di LJK, padahal ada soal pilihan sesudahnya.` };
    if (butir.kunci.some((x) => x < 0) || !butir.kunci.length) return { pesan: `Kunci nomor ${i + 1} tidak terbaca.` };
    kunci.push(butir);
  }
  if (!kunci.length) return { pesan: "Set ini tidak punya soal pilihan (PG, PGK, atau Benar/Salah)." };
  if (kunci.length > LJK.soal) return { pesan: `Set ini punya ${kunci.length} soal pilihan; LJK hanya memuat ${LJK.soal}.` };
  return { kunci, esaiMaks };
}

/** Rapikan kunci kiriman browser (aturan: server tidak percaya isi kiriman). */
export function rapikanKunci(x: unknown): ButirKunci[] | null {
  if (!Array.isArray(x) || !x.length || x.length > LJK.soal) return null;
  const hasil: ButirKunci[] = [];
  for (const b of x) {
    const bentuk = b?.bentuk;
    if (bentuk !== "PG" && bentuk !== "PGK" && bentuk !== "BS") return null;
    const kunci = [...new Set<number>((Array.isArray(b.kunci) ? b.kunci : []).map(Number))].filter((k) => Number.isInteger(k) && k >= 0 && k < LJK.pilihan).sort();
    if (!kunci.length || (bentuk !== "PGK" && kunci.length !== 1)) return null;
    const skor = Number(b.skor);
    if (!(skor >= 0 && skor <= 100)) return null;
    hasil.push({ bentuk, kunci, skor });
  }
  return hasil;
}

/** Jawaban siswa per nomor (indeks huruf), dirapikan. */
export function rapikanJawab(x: unknown, n: number): number[][] | null {
  if (!Array.isArray(x) || x.length !== n) return null;
  return x.map((j) => [...new Set<number>((Array.isArray(j) ? j : []).map(Number))].filter((k) => Number.isInteger(k) && k >= 0 && k < LJK.pilihan).sort());
}

/** Bagian skor satu nomor (0–1). PG & B/S: persis = 1. PG kompleks (keputusan pemilik 26 Nov 2026): tiap kunci yang
 *  dihitamkan = bagian yang sama (2 kunci, benar satu = ½); 0 hanya bila tidak ada yang benar. Supaya menghitamkan
 *  semua bulatan tidak untung, tiap bulatan LEBIH dari jumlah kunci mengurangi satu jawaban benar. */
export function bagianBenar(k: ButirKunci, jawab: number[]): number {
  if (k.bentuk !== "PGK") return jawab.length === 1 && jawab[0] === k.kunci[0] ? 1 : 0;
  const benar = jawab.filter((j) => k.kunci.includes(j)).length;
  const lebih = Math.max(0, jawab.length - k.kunci.length);
  return Math.max(0, benar - lebih) / k.kunci.length;
}

/** Skor objektif + bagian benar tiap nomor (1 = benar, 0 = salah, di antaranya = sebagian). */
export function skorObjektif(kunci: ButirKunci[], jawab: number[][]): { skor: number; bagian: number[] } {
  const bagian = kunci.map((k, i) => bagianBenar(k, jawab[i] ?? []));
  return { skor: bulat(kunci.reduce((s, k, i) => s + k.skor * bagian[i], 0)), bagian };
}

export const totalObjektif = (kunci: ButirKunci[]) => kunci.reduce((s, k) => s + k.skor, 0);
export const bulat = (x: number) => Math.round(x * 10) / 10;
/** Angka gaya Indonesia: 49,5 */
export const angka = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });

/** Nilai akhir = skor objektif + esai (esai belum diisi = 0). */
export const nilaiAkhir = (objektif: number | null, esai: number | null) => (objektif === null && esai === null ? null : bulat((objektif ?? 0) + (esai ?? 0)));

/** Tempelan admin dari Excel TU: tiap baris "Kelas<TAB>Nama" atau "Kelas<TAB>No<TAB>Nama" (kolom No boleh di depan).
 *  Baris judul/kosong dilewati. Nomor absen = kolom No, atau urutan baris di kelasnya. */
export function bacaDaftarSiswa(teks: string): { kelas: string; nomor: number; nama: string }[] | { pesan: string } {
  const hasil: { kelas: string; nomor: number; nama: string }[] = [];
  const urut = new Map<string, number>();
  const sudah = new Set<string>();
  for (const [i, mentah] of teks.split(/\r?\n/).entries()) {
    const kolom = mentah.split(/\t|;|\|/).map((k) => k.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!kolom.length) continue;
    const no = kolom.find((k) => /^\d{1,3}$/.test(k));
    const sisa = kolom.filter((k) => k !== no);
    if (sisa.length < 2) {
      if (i === 0) continue; // baris judul
      return { pesan: `Baris ${i + 1}: perlu kolom Kelas dan Nama ("${mentah.trim().slice(0, 40)}").` };
    }
    const [kelas, nama] = [sisa[0].toUpperCase(), sisa.slice(1).join(" ")];
    if (/^(kelas|rombel)$/i.test(kelas) || /^nama/i.test(nama)) continue; // baris judul
    if (kelas.length > 20 || nama.length > 80) return { pesan: `Baris ${i + 1} terlalu panjang. Pastikan kolomnya Kelas lalu Nama.` };
    const kunci = `${kelas}|${nama.toLowerCase()}`;
    if (sudah.has(kunci)) continue;
    sudah.add(kunci);
    const n = (urut.get(kelas) ?? 0) + 1;
    urut.set(kelas, n);
    hasil.push({ kelas, nomor: no ? Number(no) : n, nama });
  }
  if (!hasil.length) return { pesan: "Belum ada baris siswa. Salin kolom Kelas dan Nama dari Excel, lalu tempel." };
  if (hasil.length > 3000) return { pesan: "Terlalu banyak baris (maksimal 3000 siswa)." };
  return hasil;
}
