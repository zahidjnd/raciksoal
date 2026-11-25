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

// ---------- daftar siswa (impor Excel admin) ----------
export type DataSiswa = { kelas: string; nomor: number; nama: string; nisn: string | null };
export const JUDUL_TEMPLATE = ["No", "Nama", "NISN", "Kelas"];
const MAKS_SISWA = 3000;

export const rapikanKelas = (k: unknown) => String(k ?? "").replace(/\s+/g, " ").trim().toUpperCase();
const rapikanNama = (n: unknown) => String(n ?? "").replace(/\s+/g, " ").trim();
/** NISN dari sel Excel: angka (0 di depan hilang) dikembalikan jadi 10 angka; kosong = null; selain 10 angka = false. */
export function rapikanNisn(v: unknown): string | null | false {
  if (v === null || v === undefined || v === "") return null;
  const t = typeof v === "number" ? String(Math.round(v)).padStart(10, "0") : String(v).replace(/[\s.'-]/g, "");
  return t === "" ? null : /^\d{10}$/.test(t) ? t : false;
}

/**
 * Baris lembar Excel → siswa + daftar masalah (nomor baris Excel). Kolom dikenali dari judulnya (No, Nama, NISN,
 * Kelas; urutan bebas); tanpa baris judul = urutan template. `kelasIni`: impor di halaman satu kelas (kolom Kelas
 * boleh kosong; kelas lain = masalah). Nomor absen kosong = urutan baris di kelasnya.
 */
export function bacaBarisSiswa(lembar: (string | number | null | undefined)[][][], kelasIni?: string): { siswa: DataSiswa[]; masalah: string[] } {
  const siswa: DataSiswa[] = [];
  const masalah: string[] = [];
  const urut = new Map<string, number>();
  const sudah = new Map<string, string>();
  const nisnAda = new Map<string, string>();
  for (const [li, baris] of lembar.entries()) {
    const teks = (v: unknown) => String(v ?? "").trim();
    let kol = { no: 0, nama: 1, nisn: 2, kelas: 3 };
    let mulai = 0;
    const judul = baris.slice(0, 10).findIndex((b) => b.some((v) => /^nama/i.test(teks(v))));
    if (judul >= 0) {
      const j = baris[judul].map(teks);
      const cari = (re: RegExp) => j.findIndex((v) => re.test(v));
      kol = { no: cari(/^(no\b|no\.|nomor|absen)/i), nama: cari(/^nama/i), nisn: cari(/nisn/i), kelas: cari(/^(kelas|rombel)/i) };
      mulai = judul + 1;
    }
    const tempat = (r: number) => (lembar.length > 1 ? `Lembar ${li + 1} baris ${r + 1}` : `Baris ${r + 1}`);
    for (let r = mulai; r < baris.length; r++) {
      const b = baris[r] ?? [];
      if (!b.some((v) => teks(v))) continue;
      const nama = rapikanNama(b[kol.nama]);
      const kelasSel = kol.kelas >= 0 ? rapikanKelas(b[kol.kelas]) : "";
      const kelas = kelasSel || rapikanKelas(kelasIni);
      const nisn = kol.nisn >= 0 ? rapikanNisn(b[kol.nisn]) : null;
      if (!nama) { masalah.push(`${tempat(r)}: nama kosong.`); continue; }
      if (!kelas) { masalah.push(`${tempat(r)}: kelas ${nama} kosong.`); continue; }
      if (kelasIni && kelas !== rapikanKelas(kelasIni)) { masalah.push(`${tempat(r)}: ${nama} tertulis kelas ${kelas}, bukan ${rapikanKelas(kelasIni)}.`); continue; }
      if (nama.length > 80 || kelas.length > 20) { masalah.push(`${tempat(r)}: nama atau kelas terlalu panjang.`); continue; }
      if (nisn === false) { masalah.push(`${tempat(r)}: NISN ${nama} harus 10 angka.`); continue; }
      const kunci = `${kelas}|${nama.toLowerCase()}`;
      if (sudah.has(kunci)) { masalah.push(`${tempat(r)}: ${nama} sudah ada di ${kelas} (${sudah.get(kunci)}).`); continue; }
      if (nisn && nisnAda.has(nisn)) { masalah.push(`${tempat(r)}: NISN ${nisn} sama dengan ${nisnAda.get(nisn)}.`); continue; }
      sudah.set(kunci, tempat(r).toLowerCase());
      if (nisn) nisnAda.set(nisn, nama);
      const no = Number(b[kol.no]);
      const n = (urut.get(kelas) ?? 0) + 1;
      urut.set(kelas, n);
      siswa.push({ kelas, nomor: kol.no >= 0 && Number.isInteger(no) && no >= 1 && no <= 999 ? no : n, nama, nisn });
    }
  }
  if (siswa.length > MAKS_SISWA) return { siswa: [], masalah: [`Terlalu banyak siswa (maksimal ${MAKS_SISWA}).`] };
  return { siswa, masalah };
}

/** Kiriman browser → daftar siswa yang sah (server tidak percaya isi kiriman). */
export function rapikanSiswa(x: unknown): DataSiswa[] | null {
  if (!Array.isArray(x) || !x.length || x.length > MAKS_SISWA) return null;
  const hasil: DataSiswa[] = [];
  for (const s of x) {
    const kelas = rapikanKelas(s?.kelas), nama = rapikanNama(s?.nama), nisn = rapikanNisn(s?.nisn), nomor = Number(s?.nomor);
    if (!kelas || kelas.length > 20 || !nama || nama.length > 80 || nisn === false || !Number.isInteger(nomor) || nomor < 1 || nomor > 999) return null;
    hasil.push({ kelas, nomor, nama, nisn });
  }
  return hasil;
}

// ---------- analisis butir (tahap 4) ----------
export type KategoriP = "Mudah" | "Sedang" | "Sukar";
export type KategoriD = "Baik" | "Cukup" | "Perlu diperbaiki" | "Dibuang";
export type Butir = {
  p: number; // tingkat kesukaran: rata-rata bagian benar (0–1), PGK sebagian ikut dihitung
  kategoriP: KategoriP;
  d: number | null; // daya pembeda (kelompok atas − bawah 27%); null bila siswa < MIN_DAYA_BEDA
  kategoriD: KategoriD | null;
  sebaran: number[]; // banyak siswa memilih A–E (indeks 0–4) + kosong (indeks 5)
  pengecohLemah: number[]; // huruf bukan kunci yang dipilih < 5% siswa
};

export const MIN_DAYA_BEDA = 10;

const kategoriP = (p: number): KategoriP => (p >= 0.7 ? "Mudah" : p >= 0.3 ? "Sedang" : "Sukar");
const kategoriD = (d: number): KategoriD => (d >= 0.4 ? "Baik" : d >= 0.2 ? "Cukup" : d >= 0 ? "Perlu diperbaiki" : "Dibuang");

/** Analisis butir dari lembar yang sudah dipindai. Kelompok atas/bawah diurutkan menurut skor pilihan. */
export function analisisButir(kunci: ButirKunci[], jawaban: number[][][]): Butir[] {
  const n = jawaban.length;
  const bagian = jawaban.map((j) => kunci.map((k, i) => bagianBenar(k, j[i] ?? [])));
  const skor = bagian.map((b) => b.reduce((s, v, i) => s + v * kunci[i].skor, 0));
  const urut = skor.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const g = Math.max(1, Math.round(n * 0.27));
  const [atas, bawah] = [urut.slice(0, g), urut.slice(-g)];
  const rata = (siswa: readonly number[], i: number) => siswa.reduce((s, x) => s + bagian[x][i], 0) / siswa.length;
  return kunci.map((k, i) => {
    const p = n ? bagian.reduce((s, b) => s + b[i], 0) / n : 0;
    const sebaran = [0, 0, 0, 0, 0, 0];
    for (const j of jawaban) {
      const pilih = j[i] ?? [];
      if (!pilih.length) sebaran[5]++;
      for (const h of pilih) sebaran[h]++;
    }
    const d = n >= MIN_DAYA_BEDA ? bulat2(rata(atas, i) - rata(bawah, i)) : null;
    return {
      p: bulat2(p),
      kategoriP: kategoriP(p),
      d,
      kategoriD: d === null ? null : kategoriD(d),
      sebaran,
      pengecohLemah: n ? [0, 1, 2, 3, 4].filter((h) => !k.kunci.includes(h) && sebaran[h] / n < 0.05) : [],
    };
  });
}
const bulat2 = (x: number) => Math.round(x * 100) / 100;
