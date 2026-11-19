/**
 * Geometri tahap 2a (0.55.0, ATURAN-SOAL 4.11): bangun datar & sudut dari tabel 2 kolom "| Bagian | Isi |" + penanda
 * "[[GEOMETRI datar|sudut: judul]]" (dibaca grafik.ts, diteruskan geometri.ts). Satu tabel = satu bangun.
 * Ukuran dihitung dari angka yang ditulis (segitiga diselesaikan dengan aturan sinus/cosinus), lalu SEMUA angka yang
 * ditulis dicocokkan dengan gambar jadi: ukuran mustahil/tidak cocok (Pythagoras, jumlah sudut, garis sejajar) =
 * alasan → tampil sebagai tabel + peringatan. Ukuran "?"/"x" = ditanyakan (hanya label). SVG hitam-putih, tanpa Arab.
 */
import { bacaAngka } from "./skala.ts";

export type JenisBangun = "datar" | "sudut";
export type P = [number, number];

const DATAR = ["segitiga", "segitiga siku-siku", "segitiga sama kaki", "segitiga sama sisi", "persegi", "persegi panjang", "jajargenjang", "trapesium", "trapesium siku-siku", "trapesium sama kaki", "belah ketupat", "layang-layang", "lingkaran"];
const BENTUK = ["sudut", "berpelurus", "berpenyiku", "bertolak belakang", "sejajar"];

const K = ["Bagian", "Isi"];
/** Contoh abu-abu jendela edit, per bangun/bentuk (berganti saat guru mengetik nama bangun). */
export const CONTOH_BANGUN: Record<string, string[][]> = {
  segitiga: [K, ["bangun", "segitiga"], ["AB", "7 cm"], ["AC", "5 cm"], ["sudut A", "60°"], ["BC", "?"]],
  "segitiga siku-siku": [K, ["bangun", "segitiga siku-siku"], ["sudut B", "siku-siku"], ["AB", "8 cm"], ["BC", "6 cm"], ["AC", "?"]],
  "segitiga sama kaki": [K, ["bangun", "segitiga sama kaki"], ["AB", "6 cm"], ["AC", "5 cm"], ["BC", "5 cm"], ["tinggi", "?"]],
  "segitiga sama sisi": [K, ["bangun", "segitiga sama sisi"], ["AB", "6 cm"], ["sudut A", "?"]],
  persegi: [K, ["bangun", "persegi"], ["AB", "5 cm"], ["AC", "?"]],
  "persegi panjang": [K, ["bangun", "persegi panjang"], ["AB", "8 cm"], ["BC", "6 cm"], ["AC", "?"]],
  jajargenjang: [K, ["bangun", "jajargenjang"], ["AB", "10 cm"], ["AD", "6 cm"], ["tinggi", "5 cm"]],
  trapesium: [K, ["bangun", "trapesium"], ["AB", "12 cm"], ["CD", "7 cm"], ["tinggi", "5 cm"]],
  "trapesium siku-siku": [K, ["bangun", "trapesium siku-siku"], ["AB", "9 cm"], ["CD", "5 cm"], ["AD", "3 cm"], ["BC", "?"]],
  "trapesium sama kaki": [K, ["bangun", "trapesium sama kaki"], ["AB", "14 cm"], ["CD", "8 cm"], ["AD", "5 cm"], ["tinggi", "?"]],
  "belah ketupat": [K, ["bangun", "belah ketupat"], ["AC", "16 cm"], ["BD", "12 cm"], ["AB", "?"]],
  "layang-layang": [K, ["bangun", "layang-layang"], ["AC", "12 cm"], ["BD", "14 cm"], ["titik", "A, B, C, D, O"]],
  lingkaran: [K, ["bangun", "lingkaran"], ["jari-jari", "7 cm"], ["juring", "60°"], ["titik", "O, A, B"]],
  sudut: [K, ["bentuk", "sudut"], ["titik", "A, B, C"], ["sudut B", "50°"]],
  berpelurus: [K, ["bentuk", "berpelurus"], ["sudut 1", "2x + 10°"], ["sudut 2", "3x − 20°"]],
  berpenyiku: [K, ["bentuk", "berpenyiku"], ["sudut 1", "35°"], ["sudut 2", "x"]],
  "bertolak belakang": [K, ["bentuk", "bertolak belakang"], ["sudut 1", "110°"], ["sudut 2", "x"]],
  sejajar: [K, ["bentuk", "sejajar"], ["sudut A1", "65°"], ["sudut B3", "x"]],
};

export const ATURAN_BANGUN: Record<JenisBangun, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  datar: {
    nama: "Bangun datar",
    baris: [1, 12],
    petunjuk: `Baris "bangun" = ${DATAR.join(", ")} (contoh abu-abu ikut berganti). Lalu ukuran: sisi "AB | 8 cm", diagonal "AC | 10 cm", "sudut B | 90°" (atau siku-siku), "tinggi | 4 cm", lingkaran: "jari-jari", "diameter", "juring | 60°". Yang ditanyakan ditulis "?" atau "x". Titik sudut A, B, C, D berlawanan arah jarum jam dari kiri bawah; nama lain lewat "titik | P, Q, R".`,
    contoh: CONTOH_BANGUN["segitiga siku-siku"],
  },
  sudut: {
    nama: "Sudut",
    baris: [1, 10],
    petunjuk: `Baris "bentuk" = ${BENTUK.join(", ")} (contoh abu-abu ikut berganti). Lalu ukuran sudut: "sudut 1 | 65°" (1 = kanan atas, 2 = kiri atas, 3 = kiri bawah, 4 = kanan bawah); garis sejajar: "sudut A1", "sudut B3" (A = perpotongan atas, B = bawah). Yang ditanyakan "x" atau "?"; boleh bentuk aljabar "2x + 10°".`,
    contoh: CONTOH_BANGUN.sejajar,
  },
};

export const ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
export const bersih = (s: string) => String(s ?? "").replace(/[\t$]/g, "").trim();
export const normal = (s: string) => bersih(s).toLowerCase().replace(/[\s-]+/g, "");
const MAKS_LABEL = 20;

/** Nama bangun/bentuk yang ditulis guru (tanpa beda spasi/tanda hubung), atau null. */
export const cariNama = (daftar: string[], t: string) => daftar.find((d) => normal(d) === normal(t)) ?? null;

/** Contoh untuk bangun/bentuk yang sedang diketik di tabel (jendela edit). */
export function contohBangun(isi: string[][], jenis: JenisBangun): string[][] {
  const baris = isi.find((b) => /^(bangun|bentuk)$/i.test(bersih(b[0] ?? "")));
  const nama = baris && cariNama(jenis === "datar" ? DATAR : BENTUK, baris[1] ?? "");
  return (nama && CONTOH_BANGUN[nama]) || ATURAN_BANGUN[jenis].contoh;
}

/** "8 cm", "2,5", "12 m" → angka; "?", "x", "3√2" → undefined (hanya label). */
export function angkaUkuran(t: string): number | undefined {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:mm|cm|dm|m|km|satuan)?\s*$/i.exec(t);
  return m ? bacaAngka(m[1]) : undefined;
}
/** "65°", "65", "65 derajat", "siku-siku" → derajat; selain itu undefined. */
function angkaSudut(t: string): number | undefined {
  if (/^\s*siku[\s-]*siku\s*$/i.test(t)) return 90;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:°|derajat|o)?\s*$/i.exec(t);
  return m ? bacaAngka(m[1]) : undefined;
}
export const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("id-ID");

// ---------- membaca tabel ----------

type Ukuran = { teks: string; n?: number; baris: number };
type DataDatar = {
  bangun: string;
  nama: string[];
  ruas: Map<string, Ukuran & { i: number; j: number }>; // kunci "i-j" (i < j)
  sudut: Map<number, Ukuran>;
  tinggi?: Ukuran;
  jari?: Ukuran;
  diameter?: Ukuran;
  juring?: Ukuran;
};

const BANYAK: Record<string, number> = { lingkaran: 3, segitiga: 3 };
const banyakTitik = (b: string) => (b.startsWith("segitiga") ? 3 : (BANYAK[b] ?? 4));

function bacaDatar(isi: string[][]): DataDatar | string {
  const badan = isi.slice(1).map((b, n) => ({ b: [bersih(b[0] ?? ""), bersih(b[1] ?? "")], n: n + 1 })).filter((x) => x.b[0] || x.b[1]);
  const bb = badan.find((x) => normal(x.b[0]) === "bangun");
  if (!bb) return `Tulis baris "bangun" (${DATAR.join(", ")}).`;
  const bangun = cariNama(DATAR, bb.b[1]);
  if (!bangun) return `Baris ${bb.n}: bangun "${bb.b[1]}" tidak dikenal. Pilih: ${DATAR.join(", ")}.`;
  const bt = badan.find((x) => normal(x.b[0]) === "titik");
  const bawaan = bangun === "lingkaran" ? ["O", "A", "B"] : ["A", "B", "C", "D"].slice(0, banyakTitik(bangun));
  const nama = bt ? bt.b[1].split(/[\s,;]+/).filter(Boolean) : bawaan;
  const banyak = banyakTitik(bangun);
  if (bt && (nama.length < banyak || nama.length > banyak + (bangun === "lingkaran" ? 0 : 1) || nama.some((x) => !/^[A-Za-z]['’]?$/.test(x)) || new Set(nama).size !== nama.length))
    return `Baris ${bt.n}: tulis ${banyak} nama titik berbeda berupa satu huruf, mis. "${bawaan.join(", ")}"${bangun === "lingkaran" ? " (pusat dulu)" : "; boleh ditambah satu huruf untuk titik potong diagonal"}.`;
  const d: DataDatar = { bangun, nama, ruas: new Map(), sudut: new Map() };
  const idx = (h: string) => nama.slice(0, banyak).indexOf(h);
  for (const { b, n } of badan) {
    const [kunci, nilai] = b;
    if (ARAB.test(kunci + nilai)) return `Baris ${n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    const k = normal(kunci);
    if (k === "bangun" || k === "titik") continue;
    if (!nilai) return `Baris ${n} kolom 2 masih kosong (tulis ukurannya, atau "?" bila ditanyakan).`;
    if (nilai.length > MAKS_LABEL) return `Baris ${n}: isi terlalu panjang (maks ${MAKS_LABEL} huruf).`;
    const u = (angka?: number): Ukuran => ({ teks: nilai, n: angka, baris: n });
    if (bangun === "lingkaran") {
      if (/^(jarijari|r)$/.test(k)) d.jari = u(angkaUkuran(nilai));
      else if (/^(diameter|d)$/.test(k)) d.diameter = u(angkaUkuran(nilai));
      else if (/^(juring|sudutpusat)$/.test(k)) d.juring = u(angkaSudut(nilai));
      else return `Baris ${n}: bagian "${kunci}" tidak dikenal untuk lingkaran. Pilih: jari-jari, diameter, juring.`;
      continue;
    }
    if (/^(tinggi|t)$/.test(k)) {
      if (!/segitiga|jajargenjang|trapesium/.test(bangun)) return `Baris ${n}: tinggi hanya untuk segitiga, jajargenjang, dan trapesium.`;
      d.tinggi = u(angkaUkuran(nilai));
      continue;
    }
    const sudut = /^(?:sudut|∠)\s*([A-Za-z]['’]?){1,3}$/i.exec(bersih(kunci).replace(/\s+/g, " ")) && bersih(kunci).replace(/^(sudut|∠)\s*/i, "");
    if (sudut) {
      const h = sudut.length === 3 ? sudut[1] : sudut;
      const i = idx(h);
      if (i < 0) return `Baris ${n}: titik "${h}" tidak ada. Titik: ${nama.slice(0, banyak).join(", ")}.`;
      const v = angkaSudut(nilai);
      if (v !== undefined && (v <= 0 || v >= 180)) return `Baris ${n}: besar sudut harus di antara 0° dan 180°.`;
      d.sudut.set(i, u(v));
      continue;
    }
    const sebut: Record<string, string> = { alas: "AB", sisi: "AB", panjang: "AB", lebar: "BC" };
    const pasang = sebut[k] ? sebut[k].split("").map((h) => ["A", "B", "C", "D"].indexOf(h)) : bersih(kunci).replace(/^(sisi|diagonal|garis|ruas)\s+/i, "").replace(/\s+/g, "").split("").map(idx);
    if (pasang.length !== 2 || pasang.some((i) => i < 0) || pasang[0] === pasang[1])
      return `Baris ${n}: bagian "${kunci}" tidak dikenal. Contoh: AB (sisi/diagonal), sudut B, tinggi${banyak === 4 ? ", alas" : ""}.`;
    const [i, j] = pasang[0] < pasang[1] ? pasang : [pasang[1], pasang[0]];
    d.ruas.set(`${i}-${j}`, { ...u(angkaUkuran(nilai)), i, j });
  }
  return d;
}

// ---------- menyusun titik ----------

const rad = (g: number) => (g * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const jarak = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ruasN = (d: DataDatar, i: number, j: number) => d.ruas.get(i < j ? `${i}-${j}` : `${j}-${i}`)?.n;
const pertama = (...v: (number | undefined)[]) => v.find((x) => x !== undefined && x > 0);

/** Segitiga ABC: aturan sinus/cosinus sampai ketiga sisi & sudut diketahui; yang kurang diisi bentuk bawaan jenisnya. */
/** Segitiga alas prisma/limas (ruang.ts): sisi & sudut ABC → titik 2D, atau alasan. */
export function segitigaDasar(sisi: Record<string, number | undefined>, sudut: Record<string, number | undefined>): P[] | string {
  const d: DataDatar = { bangun: "segitiga", nama: ["A", "B", "C"], ruas: new Map(), sudut: new Map() };
  for (const [k, n] of Object.entries(sisi)) if (n !== undefined) {
    const [i, j] = k.split("").map((h) => "ABC".indexOf(h)).sort();
    d.ruas.set(`${i}-${j}`, { teks: String(n), n, baris: 0, i, j });
  }
  for (const [k, n] of Object.entries(sudut)) if (n !== undefined) d.sudut.set("ABC".indexOf(k), { teks: String(n), n, baris: 0 });
  return segitiga(d);
}

function segitiga(d: DataDatar): P[] | string {
  const s = [ruasN(d, 1, 2), ruasN(d, 0, 2), ruasN(d, 0, 1)]; // s[i] = sisi di depan titik i
  const a = [0, 1, 2].map((i) => d.sudut.get(i)?.n);
  const lengkapSisi = () => s.every((x) => x !== undefined);
  if (lengkapSisi()) {
    const [p, q, r] = [...(s as number[])].sort((x, y) => x - y);
    if (p + q <= r) return `Sisi ${(s as number[]).map(fmt).join(", ")} tidak bisa membentuk segitiga (dua sisi terpendek harus lebih panjang dari sisi terpanjang).`;
  }
  if (a.every((x) => x !== undefined) && Math.abs(a.reduce((x, y) => x! + y!, 0)! - 180) > 1) return "Jumlah ketiga sudut segitiga harus 180°.";
  if (!lengkapSisi()) {
    if (d.bangun === "segitiga sama sisi") [0, 1, 2].forEach((i) => (a[i] ??= 60));
    if (d.bangun === "segitiga siku-siku" && !a.includes(90)) {
      const i = [1, 2, 0].find((k) => a[k] === undefined);
      if (i !== undefined) a[i] = 90;
    }
    if (d.bangun === "segitiga sama kaki") {
      a[0] ??= a[1];
      a[1] ??= a[0];
      if (a[0] === undefined && a[2] !== undefined) a[0] = a[1] = (180 - a[2]) / 2;
      s[0] ??= s[1];
      s[1] ??= s[0];
    }
  }
  let gagal = "";
  const putar = () => {
    for (let k = 0; k < 6; k++) {
      const tahu = a.filter((x) => x !== undefined) as number[];
      if (tahu.length === 2) {
        const sisa = 180 - tahu[0] - tahu[1];
        if (sisa <= 0) return (gagal = "Jumlah dua sudut segitiga sudah 180° atau lebih.");
        a[a.indexOf(undefined)] = sisa;
      }
      if (lengkapSisi())
        for (let i = 0; i < 3; i++) {
          const [x, y, z] = [s[i]!, s[(i + 1) % 3]!, s[(i + 2) % 3]!];
          a[i] ??= deg(Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))));
        }
      for (let i = 0; i < 3; i++) {
        const [y, z] = [s[(i + 1) % 3], s[(i + 2) % 3]];
        if (s[i] === undefined && a[i] !== undefined && y !== undefined && z !== undefined) s[i] = Math.sqrt(y * y + z * z - 2 * y * z * Math.cos(rad(a[i]!)));
      }
      const i0 = [0, 1, 2].find((i) => s[i] !== undefined && a[i] !== undefined);
      if (i0 !== undefined) {
        const R = s[i0]! / Math.sin(rad(a[i0]!));
        for (let j = 0; j < 3; j++) {
          if (a[j] !== undefined && s[j] === undefined) s[j] = R * Math.sin(rad(a[j]!));
          else if (s[j] !== undefined && a[j] === undefined) {
            const v = s[j]! / R;
            if (v > 1 + 1e-9) return (gagal = "Ukuran segitiga tidak mungkin (sisi terlalu panjang untuk sudut yang ditulis).");
            a[j] = deg(Math.asin(Math.min(1, v)));
          }
        }
      }
    }
  };
  putar();
  if (gagal) return gagal;
  if (a.some((x) => x === undefined)) {
    const kosong = [0, 1, 2].filter((i) => a[i] === undefined);
    const sisa = 180 - (a.filter((x) => x !== undefined) as number[]).reduce((x, y) => x + y, 0);
    if (sisa <= 0) return "Jumlah sudut segitiga sudah 180° atau lebih.";
    for (const i of kosong) a[i] = sisa / kosong.length;
    putar();
    if (gagal) return gagal;
  }
  if (!s.some((x) => x !== undefined)) {
    s[2] = 1;
    putar();
  }
  if (s.some((x) => x === undefined || !Number.isFinite(x))) return "Ukuran segitiga belum cukup untuk digambar.";
  const A = rad(a[0]!);
  return [[0, 0], [s[2]!, 0], [s[1]! * Math.cos(A), s[1]! * Math.sin(A)]];
}

function segiempat(d: DataDatar): P[] | string {
  const n = (i: number, j: number) => ruasN(d, i, j);
  const sd = (i: number) => d.sudut.get(i)?.n;
  const t = d.tinggi?.n;
  switch (d.bangun) {
    case "persegi": {
      const dg = pertama(n(0, 2), n(1, 3));
      const x = pertama(n(0, 1), n(1, 2), n(2, 3), n(0, 3)) ?? (dg ? dg / Math.SQRT2 : 5);
      return [[0, 0], [x, 0], [x, x], [0, x]];
    }
    case "persegi panjang": {
      const dg = pertama(n(0, 2), n(1, 3));
      let p = pertama(n(0, 1), n(2, 3));
      let l = pertama(n(1, 2), n(0, 3));
      if (dg && p && !l) l = Math.sqrt(dg * dg - p * p);
      if (dg && l && !p) p = Math.sqrt(dg * dg - l * l);
      if (!Number.isFinite(p ?? 0) || !Number.isFinite(l ?? 0)) return "Diagonal persegi panjang harus lebih panjang dari sisinya.";
      p ??= l ? l * 1.6 : 8;
      l ??= p * 0.6;
      return [[0, 0], [p, 0], [p, l], [0, l]];
    }
    case "jajargenjang": {
      const p = pertama(n(0, 1), n(2, 3)) ?? 10;
      let s = pertama(n(0, 3), n(1, 2));
      let A = pertama(sd(0), sd(2), sd(1) && 180 - sd(1)!, sd(3) && 180 - sd(3)!);
      if (A === undefined && t && s) {
        if (t > s) return "Tinggi jajargenjang tidak boleh lebih panjang dari sisi miringnya.";
        A = deg(Math.asin(t / s));
      }
      A ??= 60;
      s ??= t ? t / Math.sin(rad(A)) : p * 0.6;
      const [dx, dy] = [s * Math.cos(rad(A)), s * Math.sin(rad(A))];
      return [[0, 0], [p, 0], [p + dx, dy], [dx, dy]];
    }
    case "trapesium":
    case "trapesium siku-siku":
    case "trapesium sama kaki": {
      const a = n(0, 1) ?? 10;
      const b = n(2, 3) ?? a * 0.6;
      let tt = t;
      let geser: number;
      if (d.bangun === "trapesium sama kaki") {
        const kaki = pertama(n(0, 3), n(1, 2));
        geser = (a - b) / 2;
        if (tt === undefined && kaki) tt = Math.sqrt(kaki * kaki - geser * geser);
      } else if (d.bangun === "trapesium siku-siku") {
        geser = 0;
        tt ??= n(0, 3);
        const miring = n(1, 2);
        if (tt === undefined && miring) tt = Math.sqrt(miring * miring - (a - b) ** 2);
      } else {
        const kiri = n(0, 3);
        tt ??= sd(0) && kiri ? kiri * Math.sin(rad(sd(0)!)) : undefined;
        geser = kiri && tt !== undefined && kiri >= tt ? Math.sqrt(kiri * kiri - tt * tt) : (a - b) * 0.3;
      }
      if (tt !== undefined && !Number.isFinite(tt)) return "Ukuran trapesium tidak mungkin (kaki terlalu pendek untuk selisih alas atas dan bawah).";
      tt ??= a * 0.45;
      return [[0, 0], [a, 0], [geser + b, tt], [geser, tt]];
    }
    case "belah ketupat": {
      let p = n(0, 2);
      let q = n(1, 3);
      const s = pertama(n(0, 1), n(1, 2), n(2, 3), n(0, 3));
      if (s && p && !q) q = 2 * Math.sqrt(s * s - (p / 2) ** 2);
      if (s && q && !p) p = 2 * Math.sqrt(s * s - (q / 2) ** 2);
      if (!Number.isFinite(p ?? 0) || !Number.isFinite(q ?? 0)) return "Sisi belah ketupat harus lebih panjang dari setengah diagonalnya.";
      p ??= q ? q * 1.33 : s ? s * 1.6 : 8;
      q ??= p * 0.75;
      return [[-p / 2, 0], [0, -q / 2], [p / 2, 0], [0, q / 2]];
    }
    default: {
      // layang-layang: A kiri, B bawah, C kanan, D atas; AC mendatar, BD tegak, sisi pendek AD = CD
      const p = n(0, 2) ?? 8;
      const pendek = pertama(n(0, 3), n(2, 3));
      const panjang = pertama(n(0, 1), n(1, 2));
      const q = n(1, 3);
      let atas = pendek ? Math.sqrt(pendek * pendek - (p / 2) ** 2) : undefined;
      let bawah = panjang ? Math.sqrt(panjang * panjang - (p / 2) ** 2) : undefined;
      if ((atas !== undefined && !Number.isFinite(atas)) || (bawah !== undefined && !Number.isFinite(bawah))) return "Sisi layang-layang harus lebih panjang dari setengah diagonal AC.";
      if (q) {
        if (atas === undefined && bawah !== undefined) atas = q - bawah;
        if (bawah === undefined && atas !== undefined) bawah = q - atas;
      }
      atas ??= (q ?? p * 1.25) * 0.3;
      bawah ??= (q ?? p * 1.25) - atas;
      if (atas <= 0 || bawah <= 0) return "Ukuran layang-layang tidak mungkin.";
      return [[-p / 2, 0], [0, -bawah], [p / 2, 0], [0, atas]];
    }
  }
}

/** Titik potong garis ab dan cd (diagonal). */
function potong(a: P, b: P, c: P, d: P): P | null {
  const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(den) < 1e-12) return null;
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

/** Kaki tinggi: titik puncak & alasnya (segitiga: C ke AB; jajargenjang/trapesium: D, siku-siku: C). */
function kakiTinggi(d: DataDatar, t: P[]): [P, P] {
  const puncak = d.bangun.startsWith("segitiga") ? t[2] : d.bangun === "trapesium siku-siku" ? t[2] : t[3];
  const [a, b] = [t[0], t[1]];
  const u = [(b[0] - a[0]) / jarak(a, b), (b[1] - a[1]) / jarak(a, b)];
  const k = (puncak[0] - a[0]) * u[0] + (puncak[1] - a[1]) * u[1];
  return [puncak, [a[0] + k * u[0], a[1] + k * u[1]]];
}

/** Sudut dalam di titik i (derajat). */
function sudutDi(t: P[], i: number) {
  const [p, v, q] = [t[(i + t.length - 1) % t.length], t[i], t[(i + 1) % t.length]];
  const a = Math.atan2(p[1] - v[1], p[0] - v[0]) - Math.atan2(q[1] - v[1], q[0] - v[0]);
  const g = Math.abs(deg(a)) % 360;
  return g > 180 ? 360 - g : g;
}

/** Semua angka yang ditulis harus cocok dengan bangun jadi (selisih ≤ 2% / 1°). */
function cocokkan(d: DataDatar, t: P[]): string | null {
  const nm = (i: number) => d.nama[i];
  for (const r of d.ruas.values()) {
    if (r.n === undefined) continue;
    const g = jarak(t[r.i], t[r.j]);
    if (Math.abs(g - r.n) > 0.02 * r.n) return `Ukuran tidak cocok: ${nm(r.i)}${nm(r.j)} tertulis ${r.teks}, padahal dari ukuran lain ${nm(r.i)}${nm(r.j)} = ${fmt(g)} (baris ${r.baris}). Periksa hitungannya.`;
  }
  for (const [i, s] of d.sudut) {
    if (s.n === undefined) continue;
    const g = sudutDi(t, i);
    if (Math.abs(g - s.n) > 1) return `Ukuran tidak cocok: sudut ${nm(i)} tertulis ${s.teks}, padahal dari ukuran lain sudut ${nm(i)} = ${fmt(g)}° (baris ${s.baris}).`;
  }
  if (d.tinggi?.n !== undefined) {
    const [p, q] = kakiTinggi(d, t);
    const g = jarak(p, q);
    if (Math.abs(g - d.tinggi.n) > 0.02 * d.tinggi.n) return `Ukuran tidak cocok: tinggi tertulis ${d.tinggi.teks}, padahal dari ukuran lain tinggi = ${fmt(g)} (baris ${d.tinggi.baris}).`;
  }
  const s = [jarak(t[1], t[2]), jarak(t[0], t[2]), jarak(t[0], t[1])];
  const sama = (x: number, y: number) => Math.abs(x - y) <= 0.02 * Math.max(x, y);
  if (d.bangun === "segitiga siku-siku" && ![0, 1, 2].some((i) => Math.abs(sudutDi(t, i) - 90) < 1)) return "Segitiga siku-siku, tetapi ukurannya tidak membentuk sudut siku-siku (periksa Pythagoras).";
  if (d.bangun === "segitiga sama kaki" && !(sama(s[0], s[1]) || sama(s[1], s[2]) || sama(s[0], s[2]))) return "Segitiga sama kaki, tetapi tidak ada dua sisi yang sama panjang.";
  if (d.bangun === "segitiga sama sisi" && !(sama(s[0], s[1]) && sama(s[1], s[2]))) return "Segitiga sama sisi, tetapi ketiga sisinya tidak sama panjang.";
  return null;
}

// ---------- sudut ----------

type DataSudut = { bentuk: string; nama: string[]; sudut: { nama: string; titik: number; pos: number; u: Ukuran }[]; theta: number };

function bacaSudut(isi: string[][]): DataSudut | string {
  const badan = isi.slice(1).map((b, n) => ({ b: [bersih(b[0] ?? ""), bersih(b[1] ?? "")], n: n + 1 })).filter((x) => x.b[0] || x.b[1]);
  const bb = badan.find((x) => /^(bentuk|bangun)$/.test(normal(x.b[0])));
  if (!bb) return `Tulis baris "bentuk" (${BENTUK.join(", ")}).`;
  const bentuk = cariNama(BENTUK, bb.b[1]);
  if (!bentuk) return `Baris ${bb.n}: bentuk "${bb.b[1]}" tidak dikenal. Pilih: ${BENTUK.join(", ")}.`;
  const bt = badan.find((x) => normal(x.b[0]) === "titik");
  const bawaan = bentuk === "sejajar" ? ["A", "B"] : bentuk === "sudut" ? ["A", "B", "C"] : ["O"];
  const nama = bt ? bt.b[1].split(/[\s,;]+/).filter(Boolean) : bawaan;
  if (nama.length !== bawaan.length || nama.some((x) => !/^[A-Za-z]['’]?$/.test(x))) return `Baris ${bt!.n}: tulis ${bawaan.length} nama titik berupa satu huruf, mis. "${bawaan.join(", ")}".`;
  const d: DataSudut = { bentuk, nama, sudut: [], theta: 0 };
  for (const { b, n } of badan) {
    const [kunci, nilai] = b;
    if (ARAB.test(kunci + nilai)) return `Baris ${n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    if (/^(bentuk|bangun|titik)$/.test(normal(kunci))) continue;
    const m = /^(?:sudut|∠)\s*(.*)$/i.exec(kunci);
    if (!m) return `Baris ${n}: bagian "${kunci}" tidak dikenal. Tulis "sudut 1", "sudut A1", dan seterusnya.`;
    if (!nilai) return `Baris ${n} kolom 2 masih kosong (tulis besar sudutnya, atau "x").`;
    if (nilai.length > MAKS_LABEL) return `Baris ${n}: isi terlalu panjang (maks ${MAKS_LABEL} huruf).`;
    const v = angkaSudut(nilai);
    if (v !== undefined && (v <= 0 || v >= 180)) return `Baris ${n}: besar sudut harus di antara 0° dan 180°.`;
    const u: Ukuran = { teks: nilai, n: v, baris: n };
    const s = m[1].replace(/\s+/g, "");
    if (bentuk === "sudut") {
      d.sudut.push({ nama: s, titik: 0, pos: 1, u });
      continue;
    }
    const mm = bentuk === "sejajar" ? /^([A-Za-z]['’]?)([1-4])$/.exec(s) : /^([1-4])$/.exec(s);
    const maks = bentuk === "berpelurus" || bentuk === "berpenyiku" ? 2 : 4;
    const pos = Number(mm?.[bentuk === "sejajar" ? 2 : 1]);
    const titik = bentuk === "sejajar" ? nama.indexOf(mm?.[1] ?? "") : 0;
    if (!mm || pos > maks || titik < 0)
      return bentuk === "sejajar" ? `Baris ${n}: tulis "sudut ${nama[0]}1" sampai "sudut ${nama[1]}4" (${nama[0]} = perpotongan atas, ${nama[1]} = bawah).` : `Baris ${n}: tulis "sudut 1" sampai "sudut ${maks}".`;
    d.sudut.push({ nama: s, titik, pos, u });
  }
  if (!d.sudut.length) return 'Belum ada sudut. Tambah baris mis. "sudut 1 | 65°".';
  // besar sudut acuan θ (sudut posisi 1) dari angka pertama yang ditulis, lalu semua angka dicocokkan
  const total = bentuk === "berpenyiku" ? 90 : 180;
  const keTheta = (pos: number, v: number) => (bentuk === "sudut" || pos % 2 === 1 ? v : total - v);
  const acuan = d.sudut.find((s) => s.u.n !== undefined);
  d.theta = acuan ? keTheta(acuan.pos, acuan.u.n!) : { sudut: 50, berpelurus: 65, berpenyiku: 35, "bertolak belakang": 60, sejajar: 65 }[bentuk]!;
  if (bentuk === "berpenyiku" && d.theta >= 90) return "Sudut berpenyiku: tiap sudut harus kurang dari 90°.";
  for (const s of d.sudut) {
    if (s.u.n === undefined || bentuk === "sudut") continue;
    const harus = s.pos % 2 === 1 ? d.theta : total - d.theta;
    if (Math.abs(harus - s.u.n) > 0.5) {
      const alasan = { berpelurus: "jumlah sudut berpelurus 180°", berpenyiku: "jumlah sudut berpenyiku 90°", "bertolak belakang": "sudut bertolak belakang sama besar, sudut bersebelahan berjumlah 180°", sejajar: "pada garis sejajar, sudut sehadap/berseberangan sama besar dan sudut bersebelahan berjumlah 180°" }[bentuk];
      return `Ukuran tidak cocok: sudut ${s.nama} tertulis ${s.u.teks}, padahal ${alasan}, jadi sudut ${s.nama} = ${fmt(harus)}° (baris ${s.u.baris}).`;
    }
  }
  return d;
}

/** Kenapa tabel ini tidak bisa digambar (kalimat untuk guru), atau null. */
export function alasanBangun(isi: string[][], jenis: JenisBangun): string | null {
  const s = susun(isi, jenis);
  return typeof s === "string" ? s : null;
}

type Susun = { jenis: "datar"; d: DataDatar; t: P[] } | { jenis: "sudut"; d: DataSudut };
function susun(isi: string[][], jenis: JenisBangun): Susun | string {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `${ATURAN_BANGUN[jenis].nama} memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const banyak = isi.slice(1).length;
  const [lo, hi] = ATURAN_BANGUN[jenis].baris;
  if (banyak < lo || banyak > hi) return `Isi ${lo}–${hi} baris (sekarang ${banyak}).`;
  if (jenis === "sudut") {
    const d = bacaSudut(isi);
    return typeof d === "string" ? d : { jenis, d };
  }
  const d = bacaDatar(isi);
  if (typeof d === "string") return d;
  if (d.bangun === "lingkaran") {
    if (d.juring && d.diameter) return "Lingkaran: pilih salah satu, juring atau diameter.";
    return { jenis, d, t: [] };
  }
  const t = d.bangun.startsWith("segitiga") ? segitiga(d) : segiempat(d);
  if (typeof t === "string") return t;
  const salah = cocokkan(d, t);
  return salah ?? { jenis, d, t };
}

// ---------- gambar ----------

export const LEBAR = 360;
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const r1 = (n: number) => Math.round(n * 10) / 10;
export const tulis = (p: P, isi: string, opsi = "") => `<text x="${r1(p[0])}" y="${r1(p[1] + 4)}" text-anchor="middle" ${opsi}>${esc(isi)}</text>`;
export const garis = (a: P, b: P, opsi = 'stroke="#000" stroke-width="1.5"') => `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" ${opsi}/>`;
export const PUTUS = 'stroke="#000" stroke-width="1" stroke-dasharray="4 3"';
export const arah = (a: P, b: P): P => {
  const n = jarak(a, b) || 1;
  return [(b[0] - a[0]) / n, (b[1] - a[1]) / n];
};
export const tambah = (a: P, u: P, k: number): P => [a[0] + u[0] * k, a[1] + u[1] * k];

/** Busur sudut di v antara arah ke a dan ke b (+ label di garis bagi), atau tanda siku. */
export function busur(v: P, a: P, b: P, label: string, jari = 18, siku = false): string {
  const [ua, ub] = [arah(v, a), arah(v, b)];
  if (siku) {
    const s = 10;
    const p1 = tambah(v, ua, s), p3 = tambah(v, ub, s), p2 = tambah(p1, ub, s);
    return `<polyline points="${r1(p1[0])},${r1(p1[1])} ${r1(p2[0])},${r1(p2[1])} ${r1(p3[0])},${r1(p3[1])}" fill="none" stroke="#000" stroke-width="1"/>`;
  }
  const [pa, pb] = [tambah(v, ua, jari), tambah(v, ub, jari)];
  const silang = ua[0] * ub[1] - ua[1] * ub[0];
  let bagi: P = [ua[0] + ub[0], ua[1] + ub[1]];
  const nb = Math.hypot(...bagi);
  bagi = nb < 1e-6 ? [ua[1], -ua[0]] : [bagi[0] / nb, bagi[1] / nb];
  const busurnya = `<path d="M${r1(pa[0])},${r1(pa[1])} A${jari},${jari} 0 0 ${silang > 0 ? 1 : 0} ${r1(pb[0])},${r1(pb[1])}" fill="none" stroke="#000" stroke-width="1"/>`;
  // label panjang ("2x + 10°") lebih jauh supaya tidak menimpa kaki sudut
  return busurnya + (label ? tulis(tambah(v, bagi, jari + 10 + Math.min(30, label.length * 2.8)), label, 'font-size="11"') : "");
}

function gambarDatar(s: { d: DataDatar; t: P[] }, atas: number) {
  const { d, t } = s;
  const isi: string[] = [];
  if (d.bangun === "lingkaran") {
    const jari = 85, O: P = [LEBAR / 2, atas + 20 + jari];
    const [nO, nA, nB] = d.nama;
    isi.push(`<circle cx="${O[0]}" cy="${O[1]}" r="${jari}" fill="none" stroke="#000" stroke-width="1.5"/>`);
    const titik = (p: P, n: string, u: P) => isi.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.5" fill="#000"/>`, tulis(tambah(p, u, 12), n, 'font-size="12" font-style="italic"'));
    if (d.juring) {
      const th = d.juring.n ?? 60;
      const A: P = [O[0] + jari, O[1]];
      const B: P = [O[0] + jari * Math.cos(rad(th)), O[1] - jari * Math.sin(rad(th))];
      isi.push(`<path d="M${O[0]},${O[1]} L${r1(A[0])},${r1(A[1])} A${jari},${jari} 0 ${th > 180 ? 1 : 0} 0 ${r1(B[0])},${r1(B[1])} Z" fill="#d0d0d0" stroke="#000" stroke-width="1.5"/>`);
      isi.push(busur(O, A, B, d.juring.teks, 16));
      titik(A, nA, [1, 0]);
      titik(B, nB, arah(O, B));
      if (d.jari) isi.push(tulis([(O[0] + A[0]) / 2, O[1] + 12], d.jari.teks, 'font-size="11"'));
    } else if (d.diameter) {
      const A: P = [O[0] - jari, O[1]], B: P = [O[0] + jari, O[1]];
      isi.push(garis(A, B));
      titik(A, nA, [-1, 0]);
      titik(B, nB, [1, 0]);
      isi.push(tulis([O[0] + jari / 2, O[1] - 10], d.diameter.teks, 'font-size="11"'));
      if (d.jari) isi.push(tulis([O[0] - jari / 2, O[1] - 10], d.jari.teks, 'font-size="11"'));
    } else if (d.jari) {
      const A: P = [O[0] + jari, O[1]];
      isi.push(garis(O, A));
      titik(A, nA, [1, 0]);
      isi.push(tulis([O[0] + jari / 2, O[1] - 10], d.jari.teks, 'font-size="11"'));
    }
    isi.push(`<circle cx="${O[0]}" cy="${O[1]}" r="2.5" fill="#000"/>`, tulis([O[0] - 8, O[1] + 12], nO, 'font-size="12" font-style="italic"'));
    return { isi: isi.join(""), tinggi: O[1] + jari + 14 };
  }

  // satuan → layar (y ke atas), muat di 280 × 220
  const potongDiag = t.length === 4 ? potong(t[0], t[2], t[1], t[3]) : null;
  const tinggi = d.tinggi ? kakiTinggi(d, t) : null;
  const semua = [...t, ...(tinggi ? [tinggi[1]] : [])];
  const [x0, x1] = [Math.min(...semua.map((p) => p[0])), Math.max(...semua.map((p) => p[0]))];
  const [y0, y1] = [Math.min(...semua.map((p) => p[1])), Math.max(...semua.map((p) => p[1]))];
  const k = Math.min(280 / (x1 - x0 || 1), 220 / (y1 - y0 || 1));
  const kiri = (LEBAR - (x1 - x0) * k) / 2;
  const L = (p: P): P => [kiri + (p[0] - x0) * k, atas + 22 + (y1 - p[1]) * k];
  const T = t.map(L);
  const pusat: P = [T.reduce((a, p) => a + p[0], 0) / T.length, T.reduce((a, p) => a + p[1], 0) / T.length];
  const n = T.length;

  isi.push(`<polygon points="${T.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>`);
  // ruas yang bukan sisi (diagonal) digambar; label ruas: sisi → di luar, diagonal → di samping
  for (const r of d.ruas.values()) {
    const sisi = (r.j - r.i === 1 || (r.i === 0 && r.j === n - 1));
    const [a, b] = [T[r.i], T[r.j]];
    if (!sisi) isi.push(garis(a, b, 'stroke="#000" stroke-width="1"'));
    // diagonal: label di 30% panjangnya (dua diagonal belah ketupat berpotongan tepat di tengah)
    const f = sisi ? 0.5 : 0.3;
    const m: P = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const u = arah(a, b);
    let tegak: P = [u[1], -u[0]];
    if (sisi ? (m[0] - pusat[0]) * tegak[0] + (m[1] - pusat[1]) * tegak[1] < 0 : tegak[1] > 0) tegak = [-tegak[0], -tegak[1]];
    // geser menjauhi garis; garis tegak butuh setengah lebar tulisan
    isi.push(tulis(tambah(m, tegak, 9 + Math.abs(tegak[0]) * r.teks.length * 2.9), r.teks, 'font-size="11"'));
  }
  if (potongDiag && d.nama[n]) {
    const p = L(potongDiag);
    isi.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2" fill="#000"/>`, tulis([p[0] + 9, p[1] - 8], d.nama[n], 'font-size="12" font-style="italic"'));
  }
  // tanda siku: sudut 90° yang ditulis / tersirat dari jenis bangun
  const siku = new Set<number>();
  for (const [i, s] of d.sudut) if (s.n === 90) siku.add(i);
  if (d.bangun === "segitiga siku-siku") [0, 1, 2].filter((i) => Math.abs(sudutDi(t, i) - 90) < 0.5).forEach((i) => siku.add(i));
  if (d.bangun === "trapesium siku-siku") [0, 3].forEach((i) => siku.add(i));
  for (let i = 0; i < n; i++) {
    const s = d.sudut.get(i);
    const [p, q] = [T[(i + n - 1) % n], T[(i + 1) % n]];
    if (siku.has(i)) isi.push(busur(T[i], p, q, "", 0, true));
    else if (s) isi.push(busur(T[i], p, q, s.teks));
  }
  if (tinggi) {
    const [a, b] = tinggi.map(L) as [P, P];
    isi.push(garis(a, b, PUTUS));
    // kaki di luar alas (segitiga tumpul): perpanjang alas putus-putus
    const [A, B] = [T[0], T[1]];
    const dalam = (b[0] - A[0]) * (B[0] - A[0]) + (b[1] - A[1]) * (B[1] - A[1]);
    if (dalam < 0) isi.push(garis(A, b, PUTUS));
    else if (dalam > jarak(A, B) ** 2) isi.push(garis(B, b, PUTUS));
    isi.push(busur(b, a, dalam < 0 ? B : A, "", 0, true));
    isi.push(tulis([(a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2], d.tinggi!.teks, 'font-size="11" text-anchor="start"').replace('text-anchor="middle" ', ""));
  }
  T.forEach((p, i) => isi.push(tulis(tambah(p, arah(pusat, p), 13), d.nama[i], 'font-size="12" font-style="italic"')));
  return { isi: isi.join(""), tinggi: atas + 22 + (y1 - y0) * k + 22 };
}

function gambarSudut(d: DataSudut, atas: number) {
  const isi: string[] = [];
  const th = rad(d.theta);
  const ke = (v: P, sudutDeg: number, panjang: number): P => [v[0] + panjang * Math.cos(rad(sudutDeg)), v[1] - panjang * Math.sin(rad(sudutDeg))];
  const nilai = (titik: number, pos: number) => d.sudut.find((s) => s.titik === titik && s.pos === pos);
  /** Empat sudut di perpotongan garis mendatar & garis miring θ: nilai (atau nomor kecil). */
  const empat = (v: P, titik: number, nomor: boolean) => {
    const arahPos = [0, d.theta, 180, 180 + d.theta, 360];
    for (let pos = 1; pos <= 4; pos++) {
      const s = nilai(titik, pos);
      const [a, b] = [ke(v, arahPos[pos - 1], 30), ke(v, arahPos[pos], 30)];
      if (s) isi.push(busur(v, a, b, s.u.teks, 15));
      else if (nomor) {
        const tengah = (arahPos[pos - 1] + arahPos[pos]) / 2;
        isi.push(tulis(ke(v, tengah, 15), String(pos), 'font-size="9"'));
      }
    }
  };
  let tinggi: number;
  if (d.bentuk === "sejajar") {
    const [ya, yb] = [atas + 50, atas + 150];
    const xa = LEBAR / 2 + 30;
    const xb = xa - (yb - ya) / Math.tan(th);
    for (const y of [ya, yb]) {
      isi.push(garis([20, y], [LEBAR - 20, y]));
      isi.push(`<polyline points="${LEBAR - 46},${y - 4} ${LEBAR - 40},${y} ${LEBAR - 46},${y + 4}" fill="none" stroke="#000" stroke-width="1.2"/>`);
    }
    const u: P = [Math.cos(th), -Math.sin(th)];
    isi.push(garis(tambah([xa, ya], u, 40), tambah([xb, yb], u, -40)));
    empat([xa, ya], 0, true);
    empat([xb, yb], 1, true);
    isi.push(tulis([xa - 50, ya - 7], d.nama[0], 'font-size="12" font-style="italic"'), tulis([xb - 50, yb - 7], d.nama[1], 'font-size="12" font-style="italic"'));
    tinggi = yb + 50;
  } else if (d.bentuk === "bertolak belakang") {
    const O: P = [LEBAR / 2, atas + 90];
    isi.push(garis([O[0] - 140, O[1]], [O[0] + 140, O[1]]), garis(ke(O, d.theta, 90), ke(O, 180 + d.theta, 90)));
    empat(O, 0, true);
    isi.push(tulis([O[0], O[1] + 30], d.nama[0], 'font-size="12" font-style="italic"'));
    tinggi = O[1] + 90 * Math.sin(th) + 16;
  } else if (d.bentuk === "sudut") {
    const B: P = [LEBAR / 2 - 90, atas + 150];
    const [A, C] = [ke(B, 0, 190), ke(B, d.theta, 150)];
    isi.push(garis(B, A), garis(B, C), busur(B, A, C, d.sudut[0].u.teks, 26));
    isi.push(tulis([A[0] + 4, A[1] + 14], d.nama[0], 'font-size="12" font-style="italic"'), tulis([B[0] - 8, B[1] + 12], d.nama[1], 'font-size="12" font-style="italic"'), tulis(ke(C, d.theta, 12), d.nama[2], 'font-size="12" font-style="italic"'));
    tinggi = B[1] + 22;
  } else {
    // berpelurus: garis lurus + satu sinar; berpenyiku: sinar 0°, θ, 90°
    const O: P = [LEBAR / 2, atas + 130];
    const ujung = d.bentuk === "berpelurus" ? 180 : 90;
    isi.push(garis(O, ke(O, 0, 130)), garis(O, ke(O, ujung, d.bentuk === "berpelurus" ? 130 : 110)), garis(O, ke(O, d.theta, 120)));
    const s1 = nilai(0, 1), s2 = nilai(0, 2);
    if (s1) isi.push(busur(O, ke(O, 0, 30), ke(O, d.theta, 30), s1.u.teks, 22));
    if (s2) isi.push(busur(O, ke(O, d.theta, 30), ke(O, ujung, 30), s2.u.teks, 28));
    isi.push(tulis([O[0], O[1] + 16], d.nama[0], 'font-size="12" font-style="italic"'));
    tinggi = O[1] + 26;
  }
  return { isi: isi.join(""), tinggi };
}

export function svgBangun(isi: string[][], jenis: JenisBangun, judul: string): string | null {
  const s = susun(isi, jenis);
  if (typeof s === "string") return null;
  const atas = judul ? 26 : 4;
  const b = s.jenis === "sudut" ? gambarSudut(s.d, atas) : gambarDatar(s, atas);
  const t = Math.ceil(b.tinggi);
  const kepala = judul ? `<text x="${LEBAR / 2}" y="18" text-anchor="middle" font-size="13" font-weight="bold">${esc(judul)}</text>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${t}" viewBox="0 0 ${LEBAR} ${t}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000">` +
    `<rect width="${LEBAR}" height="${t}" fill="#fff"/>${kepala}${b.isi}</svg>`
  );
}
