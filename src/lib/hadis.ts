// Teks hadis dari data 9 kitab (0.36.0, aturan 5): hadis yang ditempel guru / dibaca dari PDF dicocokkan ke data
// (data/hadis/<kitab>.tsv, dibuat scripts/siapkan-hadis.mjs), lalu teks Arab & sumbernya DIAMBIL dari data, seperti ayat
// dari mushaf. Hanya untuk SERVER. Tanpa import "@/..." supaya bisa dites: npm test
import { closeSync, openSync, readFileSync, readSync } from "node:fs";
import path from "node:path";
import { buangRujukan, kunci, mushaf, normalArab, potongAyat, RAWI } from "./mushaf.ts";

export const SUMBER_HADIS =
  "Teks hadis: hadith-api (fawazahmed0) untuk 7 kitab, Hadith-Data-Sets (abdelrahmaan) untuk Musnad Ahmad & Sunan ad-Darimi.";

/** Urutan = prioritas bila hadis ada di beberapa kitab dan guru tidak menyebut kitabnya. */
export const KITAB = [
  // Pola: tulisan Latin guru ("HR. Bukhari") dan Arab buku ("رواه البخاري"; hanya bagian sesudah رواه yang dicek).
  { id: "bukhari", nama: "Bukhari", pola: /bukh[aā]r[iī]|muttafaq|syaikh[aā]n|بخار|متفق|الشيخان/i },
  { id: "muslim", nama: "Muslim", pola: /muslim|muttafaq|syaikh[aā]n|مسلم|متفق|الشيخان/i },
  { id: "abudawud", nama: "Abu Dawud", pola: /d[aā][wu]u?d|داود|داوود/i },
  { id: "tirmidzi", nama: "Tirmidzi", pola: /t[iu]rm[iu]?dz?[iī]|timidz|ترمذ/i },
  { id: "nasai", nama: "Nasa'i", pola: /nas[aā]['`’]?[iī]|نسائ|نساء/i },
  { id: "ibnumajah", nama: "Ibnu Majah", pola: /m[aā]jah|ماجه|ماجة/i },
  { id: "malik", nama: "Malik", pola: /m[aā]lik\b|muwat|مالك|الموطأ/i },
  { id: "ahmad", nama: "Ahmad", pola: /ahmad|أحمد|احمد/i },
  { id: "darimi", nama: "Darimi", pola: /d[aā]rim[iī]|دارمي/i },
] as const;

/** Minimal huruf kunci (sama dengan ayat): potongan pendek bisa cocok di mana-mana. */
const MIN_HURUF = 10;

/**
 * Buang pembuka yang biasa ditulis buku sebelum matan: "عن أبي هريرة رضي الله عنه قال: قال رسول الله ﷺ: ..." →
 * matan saja (sanad di data kitab berbeda, jadi pembuka ini membuat teks guru tidak cocok). Patokan: "صلى الله عليه
 * وسلم"/ﷺ (≤ 20 kata pertama), kalau tidak ada "رضي الله عنه/عنها/عنهما" (≤ 15 kata), lalu "قال/أنه/يقول" sesudahnya.
 */
export function buangPembuka(t: string) {
  const kata = t.split(/\s+/).filter(Boolean);
  const k = kata.map((w) => (/^(ﷺ|صلعم|ص\.?م\.?|saw\.?)$/i.test(w.replace(/[():،,]/g, "")) ? "ﷺ" : normalArab(w)));
  const urutan = (pola: string[], maks: number) => {
    for (let i = 0; i + pola.length <= Math.min(k.length, maks + pola.length); i++) if (pola.every((p, j) => k[i + j] === p)) return i + pola.length;
    return -1;
  };
  let mulai = urutan(["صل", "لله", "عله", "سلم"], 20);
  if (mulai < 0) mulai = urutan(["ﷺ"], 20);
  if (mulai < 0) mulai = ["عنه", "عنهم"].map((x) => urutan(["رض", "لله", x], 15)).find((x) => x >= 0) ?? -1;
  // Tanpa patokan di atas (mis. sanad "حدثني يحيى عن مالك ... أنه كان يقول"): sesudah "قال/يقول" terakhir di 60% awal.
  if (mulai < 0) for (let i = 0; i < k.length * 0.6; i++) if (["قل", "قلت", "يقل"].includes(k[i])) mulai = i + 1;
  if (mulai < 0) return t;
  // Satu kata "قال/قالت/يقول/أنه" (bukan lebih: matan bisa diawali "قُلْ").
  for (let lompat = 0; mulai < k.length && ["قل", "قلت", "يقل", "نه", "فقل", ""].includes(k[mulai]) && (k[mulai] === "" || lompat++ < 1); ) mulai++;
  const sisa = kata.slice(mulai).join(" ").replace(/^[\s:،,"“]+/, "");
  return normalArab(sisa).length >= MIN_HURUF ? sisa : t;
}

/**
 * Jajarkan kata guru ke kata data (kerangka huruf): LCS yang memasangkan tiap kata ke kemunculan paling awal, lalu
 * kelompok pasangan yang rapat (jarak ≤ 6 kata data) dengan huruf terbanyak, disambung kata yang sama di tepinya
 * (mis. "إن الله" yang tadi terpasang ke sanad). Kembalian: [awal, akhir] kata data dan jumlah huruf kunci yang cocok.
 */
function jajar(kata: string[], data: string[]): [number, number, number] {
  const n = kata.length, m = data.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = kata[i] === data[j] ? dp[i + 1][j + 1] + kata[i].length : Math.max(dp[i + 1][j], dp[i][j + 1]);
  type Pasang = { j: number; n: number; i: number }; // kata data ke-j = kata guru ke-i (n huruf kunci)
  const pasang: Pasang[] = [];
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (kata[i] === data[j] && dp[i][j] === dp[i + 1][j + 1] + kata[i].length) {
      pasang.push({ j, n: kata[i].length, i });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const jumlah = (k: Pasang[]) => k.reduce((s, x) => s + x.n, 0);
  let kelompok: Pasang[] = [];
  let terbesar: Pasang[] = [];
  for (const x of pasang) {
    if (kelompok.length && x.j - kelompok[kelompok.length - 1].j > 6) kelompok = [];
    kelompok.push(x);
    if (jumlah(kelompok) > jumlah(terbesar)) terbesar = [...kelompok];
  }
  if (!terbesar.length) return [0, 0, 0];
  let cocok = jumlah(terbesar);
  // Tanda baca data (‏"‏ dsb., tanpa huruf kunci) dilewati.
  let [awal, i0] = [terbesar[0].j, terbesar[0].i];
  for (let j = awal - 1; j >= 0 && i0 > 0; j--) {
    if (!data[j]) continue;
    if (data[j] !== kata[i0 - 1]) break;
    cocok += kata[--i0].length;
    awal = j;
  }
  let [akhir, i1] = [terbesar[terbesar.length - 1].j, terbesar[terbesar.length - 1].i];
  for (let j = akhir + 1; j < m && i1 < n - 1; j++) {
    if (!data[j]) continue;
    if (data[j] !== kata[i1 + 1]) break;
    cocok += kata[++i1].length;
    akhir = j;
  }
  return [awal, akhir, cocok];
}

export type HasilHadis ={ sumber: string; arab: string; kitab: true };
type Baca = (kitab: number, mulai: number, akhir: number) => string;

/**
 * Indeks pencarian: kerangka huruf (mushaf.ts) semua hadis disambung dalam satu teks satu-bita (huruf kunci U+06xx →
 * bita rendahnya; "\n" pemisah hadis), ±10 MB. Teks berharakat tetap di file, dibaca saat ketemu (`baca`).
 */
export function buatHadis(file: (() => Buffer)[], baca: Baca) {
  const kitab: number[] = [];
  const nomor: string[] = [];
  const letak: number[] = []; // [mulai, akhir] bita teks di file, berpasangan
  const mulaiK: number[] = []; // awal hadis di indeks
  const potong: Buffer[] = [];
  let panjang = 0;
  // File dibaca satu per satu (puncak memori = file terbesar, Ahmad ±24 MB, bukan 62 MB sekaligus).
  file.forEach((muat, k) => {
    const buf = muat();
    let p = 0;
    while (p < buf.length) {
      let q = buf.indexOf(10, p);
      if (q < 0) q = buf.length;
      const tab = buf.indexOf(9, p);
      if (tab > p && tab < q) {
        const akhir = buf[q - 1] === 13 ? q - 1 : q;
        const teks = buf.toString("utf8", tab + 1, akhir);
        const b = Buffer.allocUnsafe(teks.length + 1);
        let n = 0;
        for (const c of teks.normalize("NFC")) if (kunci(c)) b[n++] = kunci(c).charCodeAt(0) & 0xff;
        b[n++] = 10;
        kitab.push(k);
        nomor.push(buf.toString("utf8", p, tab));
        letak.push(tab + 1, akhir);
        mulaiK.push(panjang);
        potong.push(b.subarray(0, n));
        panjang += n;
      }
      p = q + 1;
    }
  });
  const indeks = Buffer.concat(potong).toString("latin1");
  potong.length = 0; // ikut terkurung closure di bawah; jangan simpan salinan kedua indeks
  const keIndeks = (isi: string) => [...isi].map((c) => String.fromCharCode(c.charCodeAt(0) & 0xff)).join("");
  /** Hadis ke berapa untuk posisi indeks (cari biner). */
  const hadisDi = (pos: number) => {
    let [lo, hi] = [0, mulaiK.length - 1];
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (mulaiK[m] <= pos) lo = m;
      else hi = m - 1;
    }
    return lo;
  };

  /**
   * Cari teks Arab (boleh tanpa harakat, potongan) di data. Ketemu → potongan berharakat dari data + "HR. Kitab no. N".
   * `petunjuk` = sumber tulisan guru ("HR. Muslim", "HR. Bukhari no. 8"): kitab (dan nomor) itu diutamakan.
   */
  const teksHadis = (h: number) => baca(kitab[h], letak[2 * h], letak[2 * h + 1]).normalize("NFC");
  const sumber = (h: number) => `HR. ${KITAB[kitab[h]].nama} no. ${nomor[h]}`;
  /** Tanda kutip penanda data (‏"‏ ‏.‏, berhuruf RLM) dan tanda baca di ujung potongan dibuang. */
  const rapi = (t: string) =>
    t
      .replace(/‏/g, "")
      .split(" ")
      .filter((w) => !/^["“”'.,،:;]+$/.test(w))
      .join(" ")
      .replace(/^["“”'.,،:;\s]+|["“”'.,،:;\s]+$/g, "");

  /**
   * Cari teks Arab (boleh tanpa harakat, potongan) di data. Ketemu → potongan berharakat dari data + "HR. Kitab no. N".
   * `petunjuk` = sumber tulisan guru ("HR. Muslim", "HR. Bukhari no. 8") atau "رواه مسلم" di teks: kitab (dan nomor) itu
   * diutamakan. Urutan: teks persis → tanpa pembuka buku ("عن أبي هريرة ... قال رسول الله ﷺ") → mirip (`cariMirip`).
   */
  function cari(teksArab: string, petunjuk = ""): HasilHadis | null {
    const rawi = (new RegExp(`(?:${RAWI})\\s*[^)\\]]{0,60}`).exec(teksArab)?.[0] ?? "").replace(/[ً-ٰٟـ]/g, "");
    const disebut = KITAB.flatMap((k, i) => (k.pola.test(`${petunjuk} ${rawi}`) ? [i] : []));
    const no = /\bno\.?\s*(\d+)/i.exec(petunjuk)?.[1];
    const nilai = (h: number) => (disebut.includes(kitab[h]) ? disebut.indexOf(kitab[h]) : disebut.length + kitab[h]) * 2 + (no && nomor[h] === no ? 0 : 1);
    const terbaik = (daftar: Iterable<number>) => [...daftar].reduce((a, b) => (nilai(b) < nilai(a) ? b : a));

    const arab = buangRujukan(teksArab);
    const matan = buangPembuka(arab);
    for (const calon of new Set([arab, matan])) {
      const q = normalArab(calon);
      if (q.length < MIN_HURUF) continue;
      const cocok = new Set<number>();
      const kunciQ = keIndeks(q);
      for (let p = indeks.indexOf(kunciQ); p >= 0 && cocok.size < 500; p = indeks.indexOf(kunciQ, p + 1)) cocok.add(hadisDi(p));
      if (!cocok.size) continue;
      const h = terbaik(cocok);
      const potongan = potongAyat(teksHadis(h), calon);
      if (potongan) return { sumber: sumber(h), arab: rapi(potongan), kitab: true };
    }
    return cariMirip(matan, terbaik, disebut);
  }

  /**
   * Lafal buku sedikit berbeda dengan kitab (mis. "صوم عرفة" vs "صوم يوم عرفة", kata terulang hasil baca PDF): calon
   * hadis dari potongan 3 kata yang sama, lalu kata-kata guru dicocokkan berurutan (LCS) ke kata hadis. Diterima bila
   * ≥ 80% huruf kunci teks guru ada berurutan dalam satu bagian rapat hadis itu; yang dipakai teks data bagian itu.
   * ponytail: hanya 8 calon teratas yang dibandingkan; naikkan kalau hadis panjang sering terlewat.
   */
  function cariMirip(arab: string, terbaik: (d: Iterable<number>) => number, disebut: number[]): HasilHadis | null {
    const kata = arab.split(/\s+/).map(normalArab).filter(Boolean);
    const huruf = kata.reduce((n, k) => n + k.length, 0);
    if (kata.length < 4 || huruf < 2 * MIN_HURUF) return null;
    const suara = new Map<number, number>();
    for (let i = 0; i + 3 <= kata.length; i++) {
      const jangkar = kata.slice(i, i + 3).join("");
      if (jangkar.length < 7) continue;
      const kena = new Set<number>();
      const k = keIndeks(jangkar);
      for (let p = indeks.indexOf(k); p >= 0 && kena.size < 40; p = indeks.indexOf(k, p + 1)) kena.add(hadisDi(p));
      for (const h of kena) suara.set(h, (suara.get(h) ?? 0) + 1);
    }
    // 8 suara terbanyak, ditambah 8 terbanyak dari kitab yang disebut guru/buku.
    const urut = [...suara].filter(([, s]) => s >= 2).sort((a, b) => b[1] - a[1]);
    const calon = new Set([...urut.slice(0, 8), ...urut.filter(([h]) => disebut.includes(kitab[h])).slice(0, 8)]);
    const lolos: { h: number; nilai: number; awal: number; akhir: number; kataData: string[] }[] = [];
    for (const [h] of calon) {
      const kataData = teksHadis(h).split(" ");
      const kunciData = kataData.map(normalArab);
      // Dua arah: kata guru dipasangkan ke kemunculan paling awal, lalu paling akhir (hadis panjang sering mengulang kata
      // yang sama, mis. "سئل عن صومه" sebelum "سئل عن صوم يوم عرفة"); dipakai yang hasilnya lebih banyak.
      const maju = jajar(kata, kunciData);
      const mundur = jajar([...kata].reverse(), [...kunciData].reverse());
      const [awal, akhir, cocok] = mundur[2] > maju[2] ? [kunciData.length - 1 - mundur[1], kunciData.length - 1 - mundur[0], mundur[2]] : maju;
      const nilai = cocok / huruf;
      if (nilai >= 0.8) lolos.push({ h, nilai, awal, akhir, kataData });
    }
    if (!lolos.length) return null;
    // Kitab yang disebut guru/buku menang bila lolos; selain itu yang paling mirip (seri ±0,05 → urutan kitab).
    const disebutLolos = lolos.filter((x) => disebut.includes(kitab[x.h]));
    const kelompokPilih = disebutLolos.length ? disebutLolos : lolos;
    const puncak = Math.max(...kelompokPilih.map((x) => x.nilai));
    const pilih = kelompokPilih.find((x) => x.h === terbaik(kelompokPilih.filter((y) => y.nilai >= puncak - 0.05).map((y) => y.h)))!;
    return { sumber: sumber(pilih.h), arab: rapi(pilih.kataData.slice(pilih.awal, pilih.akhir + 1).join(" ")), kitab: true };
  }

  return { cari, jumlah: nomor.length };
}

/** Pencari dalil untuk materi (CariAyat di materi.ts): ayat di mushaf dulu, lalu hadis di data 9 kitab. */
export const cariDalil = (arab: string, petunjuk = "") => mushaf().cari(arab, petunjuk) ?? hadis().cari(arab, petunjuk);

let tersimpan: ReturnType<typeof buatHadis> | undefined;
/** Indeks dibuat sekali saat pertama dipakai (membaca ±62 MB file, ±1–2 detik); teks hadis dibaca dari file saat ketemu. */
export function hadis() {
  if (tersimpan) return tersimpan;
  const nama = KITAB.map((k) => path.join(process.cwd(), "data", "hadis", `${k.id}.tsv`));
  const baca: Baca = (k, mulai, akhir) => {
    const fd = openSync(nama[k], "r");
    try {
      const b = Buffer.alloc(akhir - mulai);
      readSync(fd, b, 0, b.length, mulai);
      return b.toString("utf8");
    } finally {
      closeSync(fd);
    }
  };
  return (tersimpan = buatHadis(nama.map((f) => () => readFileSync(f)), baca));
}
