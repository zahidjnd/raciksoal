// Teks Al-Qur'an dari data mushaf (langkah 9, aturan 5): ayat TIDAK diketik guru/AI, tapi diambil dari file
// Tanzil "Simple" (public/quran/quran-simple.txt, tanzil.net; teks tidak boleh diubah, sumber wajib dicantumkan).
// Hanya untuk SERVER (membaca file). Tanpa import "@/..." supaya bisa dites: npm test
import { readFileSync } from "node:fs";
import path from "node:path";
import { bacaRujukan, tulisRujukan } from "./surah.ts";
import type { Bab } from "./soal.ts";

export const SUMBER_MUSHAF = "Teks Al-Qur'an: Tanzil Project (tanzil.net), versi Simple.";

/**
 * Kunci pencocokan satu huruf: harakat, tanda waqaf, spasi, angka dibuang; huruf yang ejaannya berbeda-beda antar
 * mushaf (alif, ya, waw, hamzah: الزنى/الزنا, فاحشة/فٰحشة, الذى/الذي, زكوة/زكاة, إبرٰهـۧم/إبراهيم) juga dibuang,
 * jadi yang dibandingkan kerangka hurufnya. ة→ه.
 */
export function kunci(c: string): string {
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

/**
 * Buang rujukan yang ditulis buku di samping dalil (0.36.0): "(البقرة/٢: ٤٣)", "(رواه مسلم)", "رواه البخاري" di akhir,
 * "متفق عليه". Dulu ikut dicocokkan sehingga ayat/hadis dari PDF tidak dikenali. Kurung hias ﴿ ﴾ (pembungkus ayat) dibiarkan.
 */
export const buangRujukan = (t: string) =>
  t
    .replace(new RegExp(`[([][^()[\\]]*?(?:${RAWI}|[0-9٠-٩]|/)[^()[\\]]*[)\\]]`, "g"), " ")
    .replace(new RegExp(`(?:^|\\s)(?:${RAWI})(?:\\s[^]*)?$`), " ")
    .trim();

/** Kata Arab dengan harakat/tatwil boleh di antara hurufnya (رَوَاهُ = رواه). */
const longgar = (kata: string) => [...kata].map((c) => `${c === "ا" ? "[اأإآ]" : c}[\\u064B-\\u065F\\u0670\\u0640]*`).join("");
/** "رواه / أخرجه / متفق عليه" (penanda rujukan hadis), tahan harakat. */
export const RAWI = ["رواه", "اخرجه", "متفق عليه"].map(longgar).join("|");

/**
 * Batas potongan `teks` untuk kecocokan kerangka [a, a+n) : dilengkapi harakat/alif yang menempel di awal & akhir kata,
 * plus kata TANPA huruf kunci (يَا, أَيْ, أَوْ) yang ada di awal/akhir `arab` (0.36.0: يَا أَيُّهَا dulu terbaca أَيُّهَا).
 */
function rentang(teks: string, posisi: number[], a: number, n: number, arab: string): [number, number] {
  let awal = posisi[a];
  let akhir = posisi[a + n - 1] + 1;
  while (awal > 0 && teks[awal - 1] !== " " && !kunci(teks[awal - 1])) awal--;
  while (akhir < teks.length && teks[akhir] !== " " && !kunci(teks[akhir])) akhir++;
  const kata = arab.normalize("NFC").trim().split(/\s+/);
  const kosong = (w: string) => !normalArab(w) && /[؀-ۿ]/.test(w);
  for (let i = 0; i < kata.length && kosong(kata[i]); i++) {
    const j = teks.lastIndexOf(" ", awal - 2) + 1;
    if (awal < 2 || teks[awal - 1] !== " " || !kosong(teks.slice(j, awal - 1))) break;
    awal = j;
  }
  for (let i = kata.length - 1; i >= 0 && kosong(kata[i]); i--) {
    const j = teks.indexOf(" ", akhir + 1);
    const k = j < 0 ? teks.length : j;
    if (teks[akhir] !== " " || !kosong(teks.slice(akhir + 1, k))) break;
    akhir = k;
  }
  return [awal, akhir];
}

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
  function cari(teksArab: string, petunjuk = ""): HasilAyat | null {
    const arab = buangRujukan(teksArab);
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
      const [awal, akhir] = rentang(s.teks, s.posisi, a, q.length, arab);
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

/**
 * Potongan `ayat` (teks resmi mushaf) yang kerangka hurufnya sama dengan `arab` (mis. lafal mufradat dari tabel PDF:
 * عَلَقَةً di QS al-Mu'minun 12–14), dengan harakat/alif penempelnya; null kalau tidak ada di ayat itu (0.31.0).
 */
export function potongAyat(ayat: string, arab: string): string | null {
  const q = normalArab(arab);
  if (q.length < 2) return null;
  const { isi, posisi } = petakan(ayat);
  const a = isi.indexOf(q);
  if (a < 0) return null;
  return ayat.slice(...rentang(ayat, posisi, a, q.length, arab));
}

export const SUMBER_TERJEMAH = "Terjemah ayat: Kementerian Agama RI (id.indonesian, tanzil.net).";

/** Terjemah per ayat dari file Tanzil "sura|aya|teks" → "surah|ayat" → teks. */
export function bacaTerjemah(file: string) {
  return new Map(file.split(/\r?\n/).flatMap((b) => {
    const m = /^(\d+)\|(\d+)\|(.+)$/.exec(b);
    return m ? [[`${m[1]}|${m[2]}`, m[3].trim()] as const] : [];
  }));
}

/**
 * Terjemah Kemenag untuk rujukan ayat utuh ("QS. Al-Baqarah [2]: 43", boleh beberapa ayat). Potongan ayat
 * ("(potongan)") atau rujukan tak dikenal → "" (terjemah satu ayat penuh akan menyesatkan untuk potongannya).
 */
export function terjemahAyat(sumber: string, data: Map<string, string> = terjemahKemenag()): string {
  if (/potongan/i.test(sumber)) return "";
  const r = bacaRujukan(sumber);
  if (!r) return "";
  const t: string[] = [];
  for (let a = r.dari; a <= r.sampai; a++) {
    const x = data.get(`${r.surah}|${a}`);
    if (!x) return "";
    t.push(x);
  }
  return t.join(" ");
}

/** Ayat dari mushaf yang terjemahnya kosong (guru tidak menulisnya) diisi terjemah Kemenag (0.42.0, ATURAN-SOAL 5a no. 4). */
export function lengkapiTerjemah(bab: Bab, data?: Map<string, string>): Bab {
  return {
    ...bab,
    dalil: bab.dalil.map((d) => {
      if (!d.mushaf || d.bukan || d.terjemah?.trim()) return d;
      const terjemah = terjemahAyat(d.sumber, data);
      return terjemah ? { ...d, terjemah, terjemahKemenag: true } : d;
    }),
  };
}

let terjemahTersimpan: Map<string, string> | undefined;
/** Data di folder `data/` (bukan public): hanya dibaca server, tidak dibagikan ulang (ketentuan Tanzil). */
const terjemahKemenag = () => (terjemahTersimpan ??= bacaTerjemah(readFileSync(path.join(process.cwd(), "data", "quran", "id.indonesian.txt"), "utf8")));

let tersimpan: ReturnType<typeof buatMushaf> | undefined;
/** Mushaf dimuat sekali saat pertama dipakai (±1,3 MB). */
export const mushaf = () => (tersimpan ??= buatMushaf(readFileSync(path.join(process.cwd(), "public", "quran", "quran-simple.txt"), "utf8")));
