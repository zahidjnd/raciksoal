// Teks Al-Qur'an dari data mushaf (langkah 9, aturan 5): ayat TIDAK diketik guru/AI, tapi diambil dari file
// Tanzil "Simple" (public/quran/quran-simple.txt, tanzil.net; teks tidak boleh diubah, sumber wajib dicantumkan).
// Hanya untuk SERVER (membaca file). Tanpa import "@/..." supaya bisa dites: npm test
import { readFileSync } from "node:fs";
import path from "node:path";
import { bacaRujukan, tulisRujukan } from "./surah.ts";

export const SUMBER_MUSHAF = "Teks Al-Qur'an: Tanzil Project (tanzil.net), versi Simple.";

/**
 * Kunci pencocokan satu huruf: harakat, tanda waqaf, spasi, angka dibuang; huruf yang ejaannya berbeda-beda antar
 * mushaf (alif, ya, waw, hamzah: الزنى/الزنا, فاحشة/فٰحشة, الذى/الذي, زكوة/زكاة, إبرٰهـۧم/إبراهيم) juga dibuang,
 * jadi yang dibandingkan kerangka hurufnya. ة→ه.
 */
function kunci(c: string): string {
  if (/[ء-اوىيٱی]/.test(c)) return "";
  if (c === "ة") return "ه";
  if (c === "ک") return "ك";
  return /[ب-غف-ي]/.test(c) ? c : "";
}

/** Teks → huruf kunci + posisi tiap huruf kunci di teks asli. */
function petakan(teks: string) {
  let isi = "";
  const posisi: number[] = [];
  for (let i = 0; i < teks.length; i++) {
    const k = kunci(teks[i]);
    if (k) {
      isi += k;
      posisi.push(i);
    }
  }
  return { isi, posisi };
}

export const normalArab = (t: string) => petakan(t.normalize("NFC")).isi;

/** Minimal huruf kunci agar sebuah potongan dianggap ayat (potongan pendek bisa cocok di mana-mana). */
const MIN_HURUF = 10;
const BASMALAH = normalArab("بسم الله الرحمن الرحيم");

type Surah = { ayat: string[]; mulai: number[]; teks: string; isi: string; posisi?: number[] };
export type HasilAyat = { sumber: string; arab: string };

export function buatMushaf(file: string) {
  const surah: Surah[] = Array.from({ length: 114 }, () => ({ ayat: [], mulai: [], teks: "", isi: "" }));
  for (const baris of file.split(/\r?\n/)) {
    const m = /^(\d+)\|(\d+)\|(.+)$/.exec(baris);
    if (m) surah[Number(m[1]) - 1].ayat[Number(m[2]) - 1] = m[3].normalize("NFC");
  }
  surah.forEach((s, i) => {
    // File Tanzil menaruh basmalah (kepala surah) di depan ayat 1; itu bukan bagian ayat 1 kecuali Al-Fatihah.
    const kata = s.ayat[0].split(" ");
    if (i > 0 && normalArab(kata.slice(0, 4).join(" ")) === BASMALAH) s.ayat[0] = kata.slice(4).join(" ");
  });
  for (const s of surah) {
    let p = 0;
    for (const a of s.ayat) {
      s.mulai.push(p);
      p += a.length + 1;
    }
    s.teks = s.ayat.join(" ");
    s.isi = normalArab(s.teks);
  }

  /** "QS An-Nur: 2-3" → teks resmi. Mengembalikan pesan kalau rujukan tidak dikenal. */
  function ambil(rujukan: string, maksAyat = 20): HasilAyat | string {
    const r = bacaRujukan(rujukan);
    if (!r) return 'Rujukan tidak dikenali. Contoh: "QS An-Nur: 2" atau "An-Nur 2-3" atau "24:2".';
    const s = surah[r.surah - 1];
    if (r.sampai > s.ayat.length) return `${tulisRujukan(r.surah, 1, 1).split(":")[0]} hanya ${s.ayat.length} ayat.`;
    if (r.sampai - r.dari + 1 > maksAyat) return `Maksimal ${maksAyat} ayat sekali ambil.`;
    return { sumber: tulisRujukan(r.surah, r.dari, r.sampai), arab: s.ayat.slice(r.dari - 1, r.sampai).join(" ") };
  }

  /**
   * Cari teks Arab (boleh tanpa harakat, beda ejaan alif, potongan ayat, atau beberapa ayat berurutan) di mushaf.
   * Ketemu → teks RESMI dari mushaf + sumbernya. `petunjuk` = sumber tulisan guru: surah itu dicari lebih dulu.
   */
  function cari(arab: string, petunjuk = ""): HasilAyat | null {
    const q = normalArab(arab);
    if (q.length < MIN_HURUF) return null;
    const p = bacaRujukan(petunjuk);
    const urutan = p ? [p.surah - 1, ...surah.keys()] : [...surah.keys()];
    for (const i of urutan) {
      const s = surah[i];
      // Kalau surahnya disebut guru, utamakan kecocokan di sekitar ayat yang disebut.
      const dari = p && i === p.surah - 1 ? s.isi.indexOf(q, posisiIsi(s, s.mulai[p.dari - 1] ?? 0)) : -1;
      const a = dari >= 0 ? dari : s.isi.indexOf(q);
      if (a < 0) continue;
      s.posisi ??= petakan(s.teks).posisi;
      let awal = s.posisi[a];
      let akhir = s.posisi[a + q.length - 1] + 1;
      // Lengkapi harakat/alif yang menempel di awal dan akhir kata.
      while (awal > 0 && s.teks[awal - 1] !== " " && !kunci(s.teks[awal - 1])) awal--;
      while (akhir < s.teks.length && s.teks[akhir] !== " " && !kunci(s.teks[akhir])) akhir++;
      const ayatKe = (pos: number) => s.mulai.findLastIndex((m) => m <= pos) + 1;
      const [n1, n2] = [ayatKe(awal), ayatKe(akhir - 1)];
      const utuh = awal === s.mulai[n1 - 1] && akhir === s.mulai[n2 - 1] + s.ayat[n2 - 1].length;
      return { sumber: tulisRujukan(i + 1, n1, n2, !utuh), arab: s.teks.slice(awal, akhir) };
    }
    return null;
  }

  /** Posisi di `isi` untuk posisi teks asli (pencarian dimulai dari ayat yang disebut guru). */
  function posisiIsi(s: Surah, posTeks: number) {
    return normalArab(s.teks.slice(0, posTeks)).length;
  }

  const basmalah = (arab: string) => normalArab(arab) === BASMALAH;

  return { ambil, cari, basmalah, jumlahAyat: surah.reduce((n, s) => n + s.ayat.length, 0) };
}

let tersimpan: ReturnType<typeof buatMushaf> | undefined;
/** Mushaf dimuat sekali saat pertama dipakai (±1,3 MB). */
export const mushaf = () => (tersimpan ??= buatMushaf(readFileSync(path.join(process.cwd(), "public", "quran", "quran-simple.txt"), "utf8")));
