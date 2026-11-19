/**
 * Geometri tahap 1 (0.54.0, ATURAN-SOAL 4.11): bidang koordinat & garis bilangan dari tabel 3 kolom
 * "| Jenis | Isi | Label |" + penanda "[[GEOMETRI koordinat|bilangan: judul]]" (dibaca grafik.ts, jalur sama dengan bagan).
 * Tiap baris = satu benda: titik, garis, ruas, kurva y = f(x), panah (vektor), daerah berarsir, nama & rentang sumbu.
 * SVG hitam-putih yang sama untuk web & Word (gambar SVG, lihat `gambarWord` di word.ts). Rumus kurva dihitung
 * pembaca rumus kecil di bawah (`bacaRumus`), TIDAK pernah dijalankan sebagai kode. Tanpa huruf Arab (aturan 5).
 */
import { ATURAN_BANGUN, alasanBangun, contohBangun, svgBangun, type JenisBangun } from "./bangun.ts";
import { alasanRuang, ATURAN_RUANG, contohRuang, svgRuang } from "./ruang.ts";
import { bacaAngka } from "./skala.ts";

/** Tahap 1 di file ini; bangun datar & sudut (tahap 2a, 0.55.0) di bangun.ts. */
export type JenisGeometri = "koordinat" | "bilangan" | JenisBangun | "ruang";
const adalahBangun = (j: JenisGeometri): j is JenisBangun => j in ATURAN_BANGUN;
/** Satu tabel = satu bangun (bangun datar, sudut, bangun ruang): contoh abu-abu ikut nama bangun yang diketik. */
export const satuBangun = (j: string): j is JenisBangun | "ruang" => j === "datar" || j === "sudut" || j === "ruang";
export const contohGeometri = (isi: string[][], j: JenisBangun | "ruang") => (j === "ruang" ? contohRuang(isi) : contohBangun(isi, j));

export const ATURAN_GEOMETRI: Record<JenisGeometri, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  koordinat: {
    nama: "Bidang koordinat",
    baris: [1, 12],
    petunjuk:
      'Satu baris = satu benda. Jenis: titik "(4, 6)"; titik bantu (titik + garis putus ke sumbu); garis "(0, 10) (10, 0)" (lurus sampai tepi); ruas "(0, 0) (2, 10) (6, 10)" (patah-patah, mis. grafik v–t); kurva "y = x^2 - 4"; panah "(0, 0) (3, 4)" (vektor); daerah "(0, 0) (4, 0) (0, 3)" (diarsir); sumbu x / sumbu y = nama sumbu, kolom Label = rentang "0..10". Label boleh kosong.',
    contoh: [["Jenis", "Isi", "Label"], ["sumbu x", "Q", "0..10"], ["sumbu y", "P", "0..10"], ["garis", "(0, 10) (10, 0)", "D"], ["garis", "(0, 2) (8, 10)", "S"], ["titik bantu", "(4, 6)", "E"]],
  },
  bilangan: {
    nama: "Garis bilangan",
    baris: [1, 10],
    petunjuk: 'Satu baris = satu benda. Jenis: titik "3" (bulat penuh = termasuk); titik kosong "-1" (bulat kosong = tidak termasuk); daerah "-1..3", "2.." (ke kanan tak hingga), "..0" (ke kiri); rentang "-3..5" (angka yang tampil, boleh tidak ditulis). Label boleh kosong.',
    contoh: [["Jenis", "Isi", "Label"], ["rentang", "-3..5", ""], ["titik kosong", "-1", ""], ["titik", "3", ""], ["daerah", "-1..3", ""]],
  },
  ...ATURAN_BANGUN,
  ruang: ATURAN_RUANG,
};

const ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const bersih = (s: string) => String(s ?? "").replace(/[\t$]/g, "").trim();
const MAKS_LABEL = 20;

// ---------- pembaca rumus (tanpa eval) ----------

const FUNGSI: Record<string, (v: number) => number> = { sqrt: Math.sqrt, akar: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, log: Math.log10, ln: Math.log };

/**
 * "y = 2x^2 - 3x + 1" → f(x), atau null bila tidak terbaca. Awalan "y =", "f(x) =", "v =" dibuang. Huruf peubah = x
 * atau `peubah` (nama sumbu mendatar satu huruf, mis. "t" pada grafik v–t). Mengenal + - * / ^ ² ³ × · ÷, kurung,
 * perkalian tanpa tanda ("2x", "3(x+1)"), desimal koma/titik, pi/π, dan sqrt/akar, sin, cos, tan, abs, log, ln.
 */
export function bacaRumus(teks: string, peubah = "x"): ((x: number) => number) | null {
  const s = bersih(teks)
    .replace(/^[a-z]\s*(\(\s*[a-z]\s*\))?\s*=/i, "")
    .replace(/[−–]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/π/g, "pi");
  const tok = s.match(/\d+(?:[.,]\d+)?|[a-z]+|[-+*/^()]|\S/gi) ?? [];
  let i = 0;
  const pv = peubah.toLowerCase();
  type F = (x: number) => number;
  const awalAtom = (t?: string) => !!t && (/^[\d(]/.test(t) || /^[a-z]+$/i.test(t));
  function atom(): F {
    const t = tok[i++];
    if (t === undefined) throw 0;
    if (/^\d/.test(t)) {
      const n = Number(t.replace(",", "."));
      return () => n;
    }
    if (t === "(") {
      const e = jumlah();
      if (tok[i++] !== ")") throw 0;
      return e;
    }
    const k = t.toLowerCase();
    if (k === "x" || k === pv) return (x) => x;
    if (k === "pi") return () => Math.PI;
    const f = FUNGSI[k];
    if (f) {
      const isi = pangkat();
      return (x) => f(isi(x));
    }
    throw 0;
  }
  function pangkat(): F {
    const a = atom();
    if (tok[i] !== "^") return a;
    i++;
    const b = minus();
    return (x) => a(x) ** b(x);
  }
  function minus(): F {
    if (tok[i] === "-") {
      i++;
      const a = minus();
      return (x) => -a(x);
    }
    if (tok[i] === "+") i++;
    return pangkat();
  }
  function kali(): F {
    let a = minus();
    for (;;) {
      const t = tok[i];
      if (t === "*" || t === "/") {
        i++;
        const b = minus();
        const l = a;
        a = t === "*" ? (x) => l(x) * b(x) : (x) => l(x) / b(x);
      } else if (awalAtom(t)) {
        const b = pangkat();
        const l = a;
        a = (x) => l(x) * b(x);
      } else return a;
    }
  }
  function jumlah(): F {
    let a = kali();
    while (tok[i] === "+" || tok[i] === "-") {
      const t = tok[i++];
      const b = kali();
      const l = a;
      a = t === "+" ? (x) => l(x) + b(x) : (x) => l(x) - b(x);
    }
    return a;
  }
  try {
    if (!tok.length) return null;
    const f = jumlah();
    return i === tok.length ? f : null;
  } catch {
    return null;
  }
}

// ---------- pembaca isi baris ----------

type Titik = [number, number];
const ANGKA = /^\s*[-−]?\s*\d[\d.,]*\s*$/;
const angkaSah = (t: string) => (ANGKA.test(t) ? bacaAngka(t) : NaN);

/** "(0, 10) (10, 0)" → titik-titik; "(2,5; 3)" memakai titik koma bila ada desimal. null = salah tulis. */
export function bacaTitik(isi: string): Titik[] | null {
  const kurung = bersih(isi).match(/\([^()]*\)/g);
  if (!kurung || bersih(isi).replace(/\([^()]*\)/g, "").replace(/[\s,;]/g, "")) return null;
  const hasil: Titik[] = [];
  for (const k of kurung) {
    const dalam = k.slice(1, -1);
    const bagian = dalam.includes(";") ? dalam.split(";") : dalam.split(",");
    if (bagian.length !== 2) return null;
    const [x, y] = bagian.map(angkaSah);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    hasil.push([x, y]);
  }
  return hasil;
}

/** "0..10", "-5 sampai 5", "-5 s.d. 5"; `terbuka` membolehkan "2.." / "..0" (ujung kosong = tak hingga). */
export function bacaRentang(isi: string, terbuka = false): [number, number] | null {
  const m = /^(.*?)\s*(?:\.\.|sampai|s\.\s*d\.?|s\/d)\s*(.*)$/i.exec(bersih(isi));
  if (!m) return null;
  const a = m[1] ? angkaSah(m[1]) : terbuka ? -Infinity : NaN;
  const b = m[2] ? angkaSah(m[2]) : terbuka ? Infinity : NaN;
  if (Number.isNaN(a) || Number.isNaN(b) || a >= b || (!Number.isFinite(a) && !Number.isFinite(b))) return null;
  return [a, b];
}

const SINONIM: Record<string, string> = { vektor: "panah", fungsi: "kurva", grafik: "kurva", arsir: "daerah", poligon: "daerah", "titik penuh": "titik", "titik terbuka": "titik kosong", "titik bulat": "titik" };
const normalJenis = (t: string) => {
  const k = bersih(t).toLowerCase().replace(/\s+/g, " ");
  return SINONIM[k] ?? k;
};
const JENIS: Record<"koordinat" | "bilangan", string[]> = {
  koordinat: ["titik", "titik bantu", "garis", "ruas", "kurva", "panah", "daerah", "sumbu x", "sumbu y"],
  bilangan: ["titik", "titik kosong", "daerah", "rentang"],
};
const BANYAK_TITIK: Record<string, [number, number, string]> = {
  titik: [1, 1, '"(4, 6)"'],
  "titik bantu": [1, 1, '"(4, 6)"'],
  garis: [2, 2, '"(0, 10) (10, 0)"'],
  panah: [2, 2, '"(0, 0) (3, 4)"'],
  ruas: [2, 12, '"(0, 0) (2, 10) (6, 10)"'],
  daerah: [3, 12, '"(0, 0) (4, 0) (0, 3)"'],
};

type Benda = { jenis: string; titik: Titik[]; rumus?: (x: number) => number; rentang?: [number, number]; nama: string; label: string };
type Susunan = { benda: Benda[]; sumbuX: string; sumbuY: string; rx?: [number, number]; ry?: [number, number] };

/** Huruf peubah kurva dari nama sumbu mendatar ("t (s)" → "t"), selain itu x. */
const peubahSumbu = (nama: string) => /^([a-z])(?![a-z])/i.exec(bersih(nama))?.[1] ?? "x";

/** Tabel → benda-benda yang digambar, atau alasan (kalimat untuk guru, menyebut letak baris). */
function susun(isi: string[][], jenis: "koordinat" | "bilangan"): Susunan | string {
  const a = ATURAN_GEOMETRI[jenis];
  const [judul, ...badan] = isi;
  const kolom = judul?.length ?? 0;
  if (kolom < 2 || kolom > 3) return `${a.nama} memakai 3 kolom: Jenis | Isi | Label (sekarang ${kolom}).`;
  if (badan.length < a.baris[0] || badan.length > a.baris[1]) return `Isi ${a.baris[0]}–${a.baris[1]} baris (sekarang ${badan.length}).`;
  const sumbuXBaris = badan.find((b) => normalJenis(b[0]) === "sumbu x");
  const peubah = peubahSumbu(sumbuXBaris?.[1] ?? "");
  const hasil: Susunan = { benda: [], sumbuX: "", sumbuY: "" };
  for (const [n, b] of badan.entries()) {
    const no = `Baris ${n + 1}`;
    const sel = [0, 1, 2].map((j) => bersih(b[j] ?? ""));
    if (sel.some((t) => ARAB.test(t))) return `${no} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    const [jn, teks, label] = sel;
    const j = normalJenis(jn);
    if (!jn) return `${no} kolom 1 (jenis) masih kosong.`;
    if (!JENIS[jenis].includes(j)) return `${no}: jenis "${jn}" tidak dikenal. Pilih: ${JENIS[jenis].join(", ")}.`;
    if (!teks && j !== "rentang") return `${no} kolom 2 (isi) masih kosong.`;
    if (j === "sumbu x" || j === "sumbu y") {
      if (teks.length > MAKS_LABEL) return `${no}: nama sumbu terlalu panjang (maks ${MAKS_LABEL} huruf).`;
      const r = label ? bacaRentang(label) : undefined;
      if (r === null) return `${no} kolom 3: rentang sumbu ditulis "0..10" (angka kecil..besar).`;
      if (j === "sumbu x") [hasil.sumbuX, hasil.rx] = [teks, r];
      else [hasil.sumbuY, hasil.ry] = [teks, r];
      continue;
    }
    if (label.length > MAKS_LABEL) return `${no}: label terlalu panjang (maks ${MAKS_LABEL} huruf).`;
    const benda: Benda = { jenis: j, titik: [], nama: teks, label };
    if (jenis === "bilangan") {
      if (j === "rentang" || j === "daerah") {
        const r = bacaRentang(teks, j === "daerah");
        if (!r) return j === "rentang" ? `${no}: rentang ditulis "-3..5" (angka kecil..besar).` : `${no}: daerah ditulis "-1..3", "2.." (ke kanan), atau "..0" (ke kiri).`;
        if (j === "rentang") hasil.rx = r;
        else benda.rentang = r;
      } else {
        const v = angkaSah(teks);
        if (!Number.isFinite(v)) return `${no} kolom 2 harus satu angka, mis. "3".`;
        benda.titik = [[v, 0]];
      }
    } else if (j === "kurva") {
      const f = bacaRumus(teks, peubah);
      if (!f) return `${no}: rumus kurva tidak terbaca. Contoh: "y = x^2 - 2x - 3" (pangkat pakai ^, kali boleh tanpa tanda: 2x).`;
      benda.rumus = f;
    } else {
      const t = bacaTitik(teks);
      const [min, maks, contoh] = BANYAK_TITIK[j];
      if (!t) return `${no} kolom 2: titik ditulis dalam kurung, mis. ${contoh} (desimal: "(2,5; 3)").`;
      if (t.length < min || t.length > maks) return `${no}: ${j} memakai ${min === maks ? `tepat ${min}` : `${min}–${maks}`} titik (sekarang ${t.length}).`;
      if ((j === "garis" || j === "panah") && t[0][0] === t[1][0] && t[0][1] === t[1][1]) return `${no}: kedua titik ${j} tidak boleh sama.`;
      benda.titik = t;
    }
    if (j !== "rentang") hasil.benda.push(benda);
  }
  if (!hasil.benda.length) return jenis === "bilangan" ? "Belum ada titik atau daerah yang digambar." : "Belum ada titik, garis, kurva, panah, atau daerah yang digambar.";
  // titik di luar rentang yang ditulis guru
  const luar = (v: number, r?: [number, number]) => r && (v < r[0] - 1e-9 || v > r[1] + 1e-9);
  for (const [n, b] of hasil.benda.entries()) {
    const ujung = b.rentang?.filter(Number.isFinite).map((v): Titik => [v, 0]) ?? [];
    const p = [...b.titik, ...ujung].find(([x, y]) => luar(x, hasil.rx) || (jenis === "koordinat" && luar(y, hasil.ry)));
    if (p) return `Benda ke-${n + 1} (${b.jenis}) memakai ${jenis === "bilangan" ? p[0] : `(${p[0]}, ${p[1]})`} di luar rentang sumbu; lebarkan rentangnya.`;
  }
  return hasil;
}

/** Kenapa tabel ini tidak bisa digambar (kalimat untuk guru), atau null. */
export function alasanGeometri(isi: string[][], jenis: JenisGeometri): string | null {
  if (adalahBangun(jenis)) return alasanBangun(isi, jenis);
  if (jenis === "ruang") return alasanRuang(isi);
  const s = susun(isi, jenis);
  return typeof s === "string" ? s : null;
}

// ---------- gambar ----------

const LEBAR = 360;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r = (n: number) => Math.round(n * 10) / 10;
const angka = (n: number) => (Math.round(n * 1e6) / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 2 });
const tulis = (x: number, y: number, isi: string, opsi = "") => `<text x="${r(x)}" y="${r(y)}" ${opsi}>${esc(isi)}</text>`;
const garis = (x1: number, y1: number, x2: number, y2: number, opsi = 'stroke="#000"') => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" ${opsi}/>`;
/** Kepala panah di (x, y) searah (dx, dy). */
function kepala(x: number, y: number, dx: number, dy: number, u = 8) {
  const p = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / p, dy / p];
  return `<polygon points="${r(x)},${r(y)} ${r(x - u * ux - u * 0.4 * uy)},${r(y - u * uy + u * 0.4 * ux)} ${r(x - u * ux + u * 0.4 * uy)},${r(y - u * uy - u * 0.4 * ux)}" fill="#000"/>`;
}

/** Potong ruas (p→q) ke kotak [x0,x1]×[y0,y1] (Liang–Barsky); null bila di luar. */
function potong(p: Titik, q: Titik, [x0, x1, y0, y1]: number[]): [Titik, Titik] | null {
  const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
  let [t0, t1] = [0, 1];
  for (const [pp, qq] of [[-dx, p[0] - x0], [dx, x1 - p[0]], [-dy, p[1] - y0], [dy, y1 - p[1]]]) {
    if (pp === 0) {
      if (qq < 0) return null;
      continue;
    }
    const t = qq / pp;
    if (pp < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [[p[0] + t0 * dx, p[1] + t0 * dy], [p[0] + t1 * dx, p[1] + t1 * dy]];
}

/** Langkah sumbu 1/2/5 × 10ⁿ (tanpa 2,5 seperti grafik data: titik bulat harus jatuh di garis kisi), ≤ `maks` langkah. */
export function langkahRapi(lebar: number, maks = 10) {
  const p = 10 ** Math.floor(Math.log10(lebar / maks));
  return [1, 2, 5, 10].map((f) => f * p).find((l) => lebar / l <= maks + 1e-9)!;
}

/** Rentang sumbu: tulisan guru apa adanya, atau dari isi + titik asal dibulatkan ke langkah. */
function rentangSumbu(nilai: number[], tetap?: [number, number]) {
  if (tetap) return { a: tetap[0], b: tetap[1], langkah: langkahRapi(tetap[1] - tetap[0]) };
  const [lo, hi] = [Math.min(0, ...nilai), Math.max(0, ...nilai)];
  const langkah = langkahRapi(hi - lo || 1);
  return { a: Math.floor(lo / langkah + 1e-9) * langkah, b: Math.ceil(hi / langkah - 1e-9) * langkah || langkah, langkah };
}

function koordinat(s: Susunan, atas: number) {
  const titikSemua = s.benda.flatMap((b) => b.titik);
  const kurva = s.benda.filter((b) => b.rumus);
  let xs = titikSemua.map((p) => p[0]);
  if (!s.rx && !xs.length) xs = [-5, 5];
  const sx = rentangSumbu(xs, s.rx);
  const contoh = kurva.flatMap((b) => Array.from({ length: 41 }, (_, k) => b.rumus!(sx.a + ((sx.b - sx.a) * k) / 40))).filter((v) => Number.isFinite(v) && Math.abs(v) < 1e4);
  const sy = rentangSumbu([...titikSemua.map((p) => p[1]), ...contoh], s.ry);
  // satuan sama di kedua sumbu bila langkahnya sama (vektor & bangun tidak gepeng), selain itu kotak ±280×220
  const kiri = 40, kanan = 24 + 7 * (s.sumbuX || "x").length, lebarPlot = LEBAR - kiri - kanan;
  const sama = sx.langkah === sy.langkah;
  const satuan = sama ? Math.min(lebarPlot / (sx.b - sx.a), 260 / (sy.b - sy.a)) : 0;
  const lp = sama ? satuan * (sx.b - sx.a) : lebarPlot;
  const tp = sama ? satuan * (sy.b - sy.a) : 220;
  const x0 = kiri + (lebarPlot - lp) / 2;
  const yAtas = atas + 22;
  const X = (v: number) => x0 + ((v - sx.a) / (sx.b - sx.a)) * lp;
  const Y = (v: number) => yAtas + tp - ((v - sy.a) / (sy.b - sy.a)) * tp;
  const kotak = [sx.a, sx.b, sy.a, sy.b];
  const isi: string[] = [];

  // daerah berarsir dulu (di bawah kisi), lalu kisi, sumbu, benda
  for (const b of s.benda.filter((b) => b.jenis === "daerah")) isi.push(`<polygon points="${b.titik.map(([x, y]) => `${r(X(x))},${r(Y(y))}`).join(" ")}" fill="#d0d0d0" stroke="none"/>`);
  const ox = sx.a <= 0 && sx.b >= 0 ? 0 : sx.a; // letak sumbu y
  const oy = sy.a <= 0 && sy.b >= 0 ? 0 : sy.a; // letak sumbu x
  const nx = Math.round((sx.b - sx.a) / sx.langkah), ny = Math.round((sy.b - sy.a) / sy.langkah);
  const tepat = (a: number, k: number, l: number) => Math.round((Math.ceil(a / l - 1e-9) + k) * l * 1e9) / 1e9;
  for (let k = 0; tepat(sx.a, k, sx.langkah) <= sx.b + 1e-9 && k <= nx + 1; k++) {
    const v = tepat(sx.a, k, sx.langkah);
    isi.push(garis(X(v), yAtas, X(v), yAtas + tp, 'stroke="#e0e0e0" stroke-width="0.8"'));
    if (Math.abs(v - ox) > 1e-9) isi.push(garis(X(v), Y(oy) - 3, X(v), Y(oy) + 3), tulis(X(v), Y(oy) + 14, angka(v), 'font-size="10" text-anchor="middle"'));
  }
  for (let k = 0; tepat(sy.a, k, sy.langkah) <= sy.b + 1e-9 && k <= ny + 1; k++) {
    const v = tepat(sy.a, k, sy.langkah);
    isi.push(garis(X(sx.a), Y(v), X(sx.b), Y(v), 'stroke="#e0e0e0" stroke-width="0.8"'));
    if (Math.abs(v - oy) > 1e-9) isi.push(garis(X(ox) - 3, Y(v), X(ox) + 3, Y(v)), tulis(X(ox) - 6, Y(v) + 4, angka(v), 'font-size="10" text-anchor="end"'));
  }
  // sumbu berpanah di ujung positif + nama sumbu; titik asal "O"
  isi.push(garis(X(sx.a), Y(oy), X(sx.b) + 12, Y(oy)), kepala(X(sx.b) + 14, Y(oy), 1, 0));
  isi.push(garis(X(ox), Y(sy.a), X(ox), Y(sy.b) - 12), kepala(X(ox), Y(sy.b) - 14, 0, -1));
  isi.push(tulis(X(sx.b) + 18, Y(oy) + 4, s.sumbuX || "x", 'font-size="12" font-style="italic"'));
  isi.push(tulis(X(ox) + 8, Y(sy.b) - 8, s.sumbuY || "y", 'font-size="12" font-style="italic"'));
  if (ox === 0 && oy === 0) isi.push(tulis(X(0) - 5, Y(0) + 14, "O", 'font-size="10" text-anchor="end"'));
  else if (Math.abs(ox - oy) < 1e-9) isi.push(tulis(X(ox) - 5, Y(oy) + 14, angka(ox), 'font-size="10" text-anchor="end"'));

  const labelDi = (px: number, py: number, t: string) => t && isi.push(tulis(px > x0 + lp - 30 ? px - 5 : px + 5, py < yAtas + 12 ? py + 14 : py - 5, t, `font-size="12" font-style="italic"${px > x0 + lp - 30 ? ' text-anchor="end"' : ""}`));
  /** Label garis/kurva: 16 px sebelum ujungnya, 10 px ke sisi atas garis (tidak menimpa angka sumbu di ujung). */
  const labelUjung = (u: Titik, dari: Titik, t: string) => {
    if (!t) return;
    const [ex, ey, fx, fy] = [X(u[0]), Y(u[1]), X(dari[0]), Y(dari[1])];
    const d = Math.hypot(ex - fx, ey - fy) || 1;
    const [ux, uy] = [(ex - fx) / d, (ey - fy) / d];
    const sisi = ux > 0 ? 1 : -1; // tegak lurus yang mengarah ke atas
    isi.push(tulis(ex - ux * 16 + uy * 10 * sisi, ey - uy * 16 - ux * 10 * sisi + 4, t, 'font-size="12" font-style="italic" text-anchor="middle"'));
  };
  const ujungKanan = (a: Titik, b: Titik) => (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]) ? a : b);
  for (const b of s.benda) {
    const t = b.titik;
    if (b.jenis === "daerah") {
      isi.push(`<polygon points="${t.map(([x, y]) => `${r(X(x))},${r(Y(y))}`).join(" ")}" fill="none" stroke="#000" stroke-width="0.8" stroke-dasharray="3 2"/>`);
      const [cx, cy] = [t.reduce((a, p) => a + p[0], 0) / t.length, t.reduce((a, p) => a + p[1], 0) / t.length];
      if (b.label) isi.push(tulis(X(cx), Y(cy) + 4, b.label, 'font-size="12" font-weight="bold" text-anchor="middle"'));
    } else if (b.jenis === "garis") {
      const [p, q] = t;
      const jauh = 1e3 * Math.max(sx.b - sx.a, sy.b - sy.a);
      const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
      const n = Math.hypot(dx, dy);
      const c = potong([p[0] - (dx / n) * jauh, p[1] - (dy / n) * jauh], [p[0] + (dx / n) * jauh, p[1] + (dy / n) * jauh], kotak);
      if (!c) continue;
      isi.push(garis(X(c[0][0]), Y(c[0][1]), X(c[1][0]), Y(c[1][1]), 'stroke="#000" stroke-width="1.5"'));
      const u = ujungKanan(c[0], c[1]);
      labelUjung(u, u === c[0] ? c[1] : c[0], b.label);
    } else if (b.jenis === "ruas") {
      isi.push(`<polyline points="${t.map(([x, y]) => `${r(X(x))},${r(Y(y))}`).join(" ")}" fill="none" stroke="#000" stroke-width="1.5"/>`);
      labelUjung(t[t.length - 1], t[t.length - 2], b.label);
    } else if (b.jenis === "panah") {
      const [p, q] = t;
      const [px, py, qx, qy] = [X(p[0]), Y(p[1]), X(q[0]), Y(q[1])];
      const d = Math.hypot(qx - px, qy - py) || 1;
      isi.push(garis(px, py, qx - ((qx - px) / d) * 6, qy - ((qy - py) / d) * 6, 'stroke="#000" stroke-width="1.5"'), kepala(qx, qy, qx - px, qy - py, 9));
      // label di tengah panah, 11 px ke samping (menjauhi sumbu x supaya tidak menimpa angkanya)
      const [mx, my] = [(px + qx) / 2, (py + qy) / 2];
      const k = (my > Y(oy) ? 1 : -1) * ((qx - px) / d >= 0 ? 1 : -1);
      if (b.label) isi.push(tulis(mx - ((qy - py) / d) * 11 * k, my + ((qx - px) / d) * 11 * k + 4, b.label, 'font-size="12" font-weight="bold" font-style="italic" text-anchor="middle"'));
    } else if (b.rumus) {
      // contoh 200 titik; ruas yang keluar kotak dipotong, yang melompat (asimtot) diputus
      const pot: string[][] = [];
      let akhir: [Titik, Titik] | null = null;
      let sebelum: Titik | null = null;
      const xy = (p: Titik) => `${r(X(p[0]))},${r(Y(p[1]))}`;
      for (let k = 0; k <= 200; k++) {
        const x = sx.a + ((sx.b - sx.a) * k) / 200;
        const y = b.rumus(x);
        const p: Titik | null = Number.isFinite(y) ? [x, y] : null;
        const c = sebelum && p && Math.abs(p[1] - sebelum[1]) < 4 * (sy.b - sy.a) ? potong(sebelum, p, kotak) : null;
        if (c) {
          const kini = pot[pot.length - 1];
          // tersambung dengan potongan sebelumnya? tambah ujungnya saja; selain itu mulai potongan baru
          if (kini && kini[kini.length - 1] === xy(c[0])) kini.push(xy(c[1]));
          else pot.push([xy(c[0]), xy(c[1])]);
          akhir = [c[1], c[0]];
        }
        sebelum = p;
      }
      for (const k of pot) isi.push(`<polyline points="${k.join(" ")}" fill="none" stroke="#000" stroke-width="1.5"/>`);
      if (akhir) labelUjung(akhir[0], akhir[1], b.label);
    }
  }
  for (const b of s.benda.filter((b) => b.jenis.startsWith("titik"))) {
    const [x, y] = b.titik[0];
    if (b.jenis === "titik bantu") {
      isi.push(garis(X(x), Y(y), X(x), Y(oy), 'stroke="#000" stroke-width="0.8" stroke-dasharray="4 3"'));
      isi.push(garis(X(x), Y(y), X(ox), Y(y), 'stroke="#000" stroke-width="0.8" stroke-dasharray="4 3"'));
    }
    isi.push(`<circle cx="${r(X(x))}" cy="${r(Y(y))}" r="3" fill="#000"/>`);
    labelDi(X(x), Y(y), b.label);
  }
  return { isi: isi.join(""), tinggi: yAtas + tp + 30 };
}

function bilangan(s: Susunan, atas: number) {
  const nilai = s.benda.flatMap((b) => [...b.titik.map((p) => p[0]), ...(b.rentang ?? []).filter(Number.isFinite)]);
  let rx = s.rx;
  if (!rx) {
    const [lo, hi] = [Math.floor(Math.min(0, ...nilai)) - 1, Math.ceil(Math.max(0, ...nilai)) + 1];
    rx = [lo, hi];
  }
  const langkah = rx[1] - rx[0] <= 20 ? 1 : langkahRapi(rx[1] - rx[0], 12);
  const kiri = 26, kanan = 26;
  const X = (v: number) => kiri + ((v - rx[0]) / (rx[1] - rx[0])) * (LEBAR - kiri - kanan);
  const y = atas + 34;
  const isi: string[] = [garis(6, y, LEBAR - 6, y, 'stroke="#000" stroke-width="1.2"'), kepala(4, y, -1, 0), kepala(LEBAR - 4, y, 1, 0)];
  for (let k = Math.ceil(rx[0] / langkah - 1e-9); k * langkah <= rx[1] + 1e-9; k++) {
    const v = Math.round(k * langkah * 1e9) / 1e9;
    isi.push(garis(X(v), y - 5, X(v), y + 5), tulis(X(v), y + 19, angka(v), 'font-size="11" text-anchor="middle"'));
  }
  for (const b of s.benda.filter((b) => b.jenis === "daerah")) {
    const [a, c] = b.rentang!;
    const [xa, xc] = [Number.isFinite(a) ? X(a) : 12, Number.isFinite(c) ? X(c) : LEBAR - 12];
    isi.push(garis(xa, y - 9, xc, y - 9, 'stroke="#000" stroke-width="3"'));
    if (!Number.isFinite(a)) isi.push(kepala(6, y - 9, -1, 0));
    if (!Number.isFinite(c)) isi.push(kepala(LEBAR - 6, y - 9, 1, 0));
    if (b.label) isi.push(tulis((xa + xc) / 2, y - 16, b.label, 'font-size="12" font-style="italic" text-anchor="middle"'));
  }
  for (const b of s.benda.filter((b) => b.jenis !== "daerah")) {
    const x = X(b.titik[0][0]);
    isi.push(`<circle cx="${r(x)}" cy="${y}" r="4.5" fill="${b.jenis === "titik kosong" ? "#fff" : "#000"}" stroke="#000" stroke-width="1.5"/>`);
    if (b.label) isi.push(tulis(x, y - 16, b.label, 'font-size="12" font-style="italic" text-anchor="middle"'));
  }
  return { isi: isi.join(""), tinggi: y + 30 };
}

export function svgGeometri(isi: string[][], jenis: JenisGeometri, judul: string): string | null {
  if (adalahBangun(jenis)) return svgBangun(isi, jenis, judul);
  if (jenis === "ruang") return svgRuang(isi, judul);
  const s = susun(isi, jenis);
  if (typeof s === "string") return null;
  const atas = judul ? 26 : 4;
  const b = jenis === "koordinat" ? koordinat(s, atas) : bilangan(s, atas);
  const t = Math.ceil(b.tinggi);
  const kepalaJudul = judul ? tulis(LEBAR / 2, 18, judul, 'font-size="13" font-weight="bold" text-anchor="middle"') : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${t}" viewBox="0 0 ${LEBAR} ${t}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000">` +
    `<rect width="${LEBAR}" height="${t}" fill="#fff"/>${kepalaJudul}${b.isi}</svg>`
  );
}
