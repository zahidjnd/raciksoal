/**
 * Skema agama tahap 5a (0.59.0, ATURAN-SOAL 4.13): posisi shaf sholat, bagan ahli waris, mata angin & arah kiblat dari
 * tabel 2 kolom "| Bagian | Isi |" + penanda "[[SKEMA shaf|waris|arah: judul]]" (diteruskan skema.ts). SVG hitam-putih,
 * semua tulisan Latin (aturan 5). Pemeriksa ahli waris hanya memakai kaidah faraidh yang pasti (hijab anak laki-laki,
 * ayah, ibu, cucu laki-laki; bagian suami/istri, ibu & ayah bila ada keturunan, anak perempuan; jumlah > 1 = 'aul);
 * kasus khusus (gharrawain, musyarakah, kakek bersama saudara) tidak diperiksa.
 */
import { ARAB, bersih, esc, garis, LEBAR, normal, r1, tulis } from "./bangun.ts";

export type JenisAgama = "shaf" | "waris" | "arah";
type P = [number, number];
const K = ["Bagian", "Isi"];

const WARIS = [
  "ayah", "ibu", "kakek", "nenek", "suami", "istri", "anak laki-laki", "anak perempuan", "cucu laki-laki", "cucu perempuan",
  "saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman",
];

export const ATURAN_AGAMA: Record<JenisAgama, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  shaf: {
    nama: "Posisi shaf",
    baris: [1, 6],
    petunjuk: 'Baris "bentuk | berjamaah" (atau "berdua": satu makmum di kanan imam, sedikit di belakang). Lalu jumlah orang per barisan, urut dari depan: "makmum laki-laki | 5", "makmum anak-anak | 3", "makmum perempuan | 4" (1–12 orang). "nama baris | sembunyi" = barisan ditandai huruf A, B, C (untuk ditanyakan).',
    contoh: [K, ["bentuk", "berjamaah"], ["makmum laki-laki", "5"], ["makmum anak-anak", "3"], ["makmum perempuan", "4"]],
  },
  waris: {
    nama: "Bagan ahli waris",
    baris: [2, 12],
    petunjuk: `Baris "mayit | laki-laki" (atau perempuan), lalu satu baris per ahli waris dan bagiannya: "istri | 1/8", "anak perempuan (2) | 2/3", "anak laki-laki | ashabah", "ayah | 1/6 + sisa", "saudara laki-laki | mahjub", atau "?". Ahli waris: ${WARIS.join(", ")}. Jumlah bagian lebih dari 1: tambah "aul | ya".`,
    contoh: [K, ["mayit", "laki-laki"], ["istri", "1/8"], ["ibu", "1/6"], ["anak laki-laki", "ashabah"], ["anak perempuan (2)", "ashabah"], ["saudara laki-laki", "mahjub"]],
  },
  arah: {
    nama: "Mata angin & kiblat",
    baris: [1, 8],
    petunjuk: 'Mawar mata angin 8 arah. Baris "kiblat | 295°" (sudut dari utara searah jarum jam) atau "kiblat | barat laut"; benda di suatu arah: "masjid | timur laut" atau "sekolah | 120°". "nama arah | sembunyi" = hanya Utara yang ditulis (untuk ditanyakan).',
    contoh: [K, ["kiblat", "295°"], ["masjid", "utara"], ["pasar", "tenggara"]],
  },
};

type Baris = { k: string; kk: string; v: string; n: number };
function badan(isi: string[][], jenis: JenisAgama): Baris[] | string {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `${ATURAN_AGAMA[jenis].nama} memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const [lo, hi] = ATURAN_AGAMA[jenis].baris;
  if (isi.length - 1 < lo || isi.length - 1 > hi) return `Isi ${lo}–${hi} baris (sekarang ${isi.length - 1}).`;
  const b = isi.slice(1).map((x, n) => ({ k: bersih(x[0] ?? ""), v: bersih(x[1] ?? ""), n: n + 1 })).filter((x) => x.k || x.v);
  for (const x of b) {
    if (ARAB.test(x.k + x.v)) return `Baris ${x.n} berisi huruf Arab; gambar hanya memakai huruf Latin (mis. "ashabah", "mahjub").`;
    if (!x.k) return `Baris ${x.n} kolom 1 masih kosong.`;
    if (x.k.length > 32 || x.v.length > 24) return `Baris ${x.n} terlalu panjang.`;
  }
  return b.map((x) => ({ ...x, kk: normal(x.k) }));
}

// ---------- shaf ----------

type Shaf = { berdua: boolean; baris: { nama: string; jenis: "L" | "A" | "P"; n: number }[]; sembunyi: boolean };

function bacaShaf(isi: string[][]): Shaf | string {
  const b = badan(isi, "shaf");
  if (typeof b === "string") return b;
  const s: Shaf = { berdua: false, baris: [], sembunyi: false };
  for (const x of b) {
    if (x.kk === "bentuk") {
      if (!/^(berjamaah|berjemaah|jamaah|berdua)$/.test(normal(x.v))) return `Baris ${x.n}: bentuk ditulis "berjamaah" atau "berdua".`;
      s.berdua = normal(x.v) === "berdua";
      continue;
    }
    if (x.kk === "namabaris") {
      s.sembunyi = /sembunyi|huruf|tidak/i.test(x.v);
      continue;
    }
    const jenis = /perempuan|wanita|putri/.test(x.kk) ? "P" : /anak|kanak|bocah/.test(x.kk) ? "A" : /laki|pria|putra|dewasa/.test(x.kk) ? "L" : null;
    if (!jenis || !/makmum|jamaah|barisan|shaf|saf/.test(x.kk + "makmum")) return `Baris ${x.n}: "${x.k}" tidak dikenal. Pilih: bentuk, makmum laki-laki, makmum anak-anak, makmum perempuan, nama baris.`;
    if (!/^\d{1,2}$/.test(x.v) || +x.v < 1 || +x.v > 12) return `Baris ${x.n}: jumlah orang ditulis angka 1–12.`;
    s.baris.push({ nama: x.k, jenis, n: +x.v });
  }
  if (!s.baris.length) return 'Tulis minimal satu barisan makmum, mis. "makmum laki-laki | 5".';
  if (s.berdua && (s.baris.length !== 1 || s.baris[0].n !== 1)) return 'Bentuk "berdua" hanya untuk satu makmum: "makmum laki-laki | 1".';
  if (s.baris.length > 5) return "Paling banyak 5 barisan.";
  return s;
}

function orang(c: P, huruf: string, besar = false, isi: string[] = []) {
  const r = besar ? 13 : 10;
  isi.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r}" fill="${huruf === "I" ? "#d0d0d0" : "#fff"}" stroke="#000" stroke-width="1.4"/>`, tulis(c, huruf, `font-size="${besar ? 11 : 9}" font-weight="bold"`));
  return isi;
}

function gambarShaf(s: Shaf, atas: number) {
  const isi: string[] = [];
  const cx = LEBAR / 2;
  // arah kiblat di atas
  isi.push(garis([cx, atas + 34], [cx, atas + 10], 'stroke="#000" stroke-width="1.5"'), `<polygon points="${cx},${atas + 4} ${cx - 5},${atas + 13} ${cx + 5},${atas + 13}" fill="#000"/>`);
  isi.push(`<text x="${cx + 10}" y="${atas + 16}" font-size="11" font-weight="bold">Kiblat</text>`);
  const yImam = atas + 56;
  orang([cx, yImam], "I", true, isi);
  // berdua: makmum di kanan imam, jadi tulisan "Imam" di kiri
  isi.push(s.berdua ? `<text x="${cx - 18}" y="${yImam + 4}" text-anchor="end" font-size="10">Imam</text>` : `<text x="${cx + 18}" y="${yImam + 4}" font-size="10">Imam</text>`);
  let y = yImam;
  if (s.berdua) {
    const c: P = [cx + 30, yImam + 10];
    orang(c, s.baris[0].jenis, false, isi);
    if (!s.sembunyi) isi.push(`<text x="${c[0] + 16}" y="${c[1] + 4}" font-size="10">${esc(s.baris[0].nama)}</text>`);
    y = c[1];
  } else {
    s.baris.forEach((b, k) => {
      y = yImam + 40 + k * 36;
      const jarak = Math.min(26, 300 / b.n);
      for (let i = 0; i < b.n; i++) orang([cx + (i - (b.n - 1) / 2) * jarak, y], b.jenis, false, isi);
      const ujung = cx - ((b.n - 1) / 2) * jarak - 16;
      const label = s.sembunyi ? String.fromCharCode(65 + k) : `Shaf ${k + 1}`;
      isi.push(`<text x="${r1(ujung)}" y="${y + 4}" text-anchor="end" font-size="10" font-weight="bold">${label}</text>`);
    });
  }
  // keterangan huruf
  const ada = [...new Set(s.baris.map((b) => b.jenis))];
  const nama = { L: "laki-laki", A: "anak-anak", P: "perempuan" };
  const ket = ["I = imam", ...ada.map((j) => `${j} = ${nama[j]}`)].join("   ");
  isi.push(`<text x="${cx}" y="${y + 36}" text-anchor="middle" font-size="10">${esc(ket)}</text>`);
  return { isi: isi.join(""), tinggi: y + 46 };
}

// ---------- ahli waris ----------

type Pewaris = { nama: string; dasar: string; jumlah: number; bagian: string; mahjub: boolean; baris: number };
type Waris = { mayit: "laki-laki" | "perempuan" | ""; ahli: Pewaris[]; aul: boolean };

/** "anak perempuan (2)", "2 anak perempuan", "saudara laki-laki kandung" → nama baku + jumlah. */
function bacaNama(t: string): { dasar: string; jumlah: number } | null {
  let s = t.toLowerCase();
  const j = /\((\d+)\)|^(\d+)\s|\s(\d+)\s*(orang)?$/.exec(s);
  const jumlah = j ? +(j[1] ?? j[2] ?? j[3]) : 1;
  s = s.replace(/\(\d+\)|^\d+\s|\s\d+\s*(orang)?$/g, " ").replace(/\bkandung\b|\bsekandung\b/g, " ").replace(/\bsaudari\b/g, "saudara perempuan").replace(/\bputra\b/g, "anak laki-laki").replace(/\bputri\b/g, "anak perempuan");
  s = s.replace(/\s+/g, " ").trim();
  const dasar = WARIS.find((w) => normal(w) === normal(s)) ?? (/^saudara(laki|perempuan)?seibu$/.test(normal(s)) ? "saudara seibu" : null);
  return dasar ? { dasar, jumlah } : null;
}
const pecahan = (t: string) => {
  const m = /(\d+)\s*\/\s*(\d+)/.exec(t);
  return m && +m[2] > 0 ? +m[1] / +m[2] : undefined;
};
const ASHABAH = /ashabah|asabah|sisa/i;

function bacaWaris(isi: string[][]): Waris | string {
  const b = badan(isi, "waris");
  if (typeof b === "string") return b;
  const w: Waris = { mayit: "", ahli: [], aul: false };
  for (const x of b) {
    if (x.kk === "mayit" || x.kk === "pewaris") {
      const m = /perempuan|wanita/i.test(x.v) ? "perempuan" : /laki|pria/i.test(x.v) ? "laki-laki" : "";
      if (!m) return `Baris ${x.n}: mayit ditulis "laki-laki" atau "perempuan".`;
      w.mayit = m;
      continue;
    }
    if (x.kk === "aul") {
      w.aul = /ya|iya/i.test(x.v);
      continue;
    }
    const nm = bacaNama(x.k);
    if (!nm) return `Baris ${x.n}: "${x.k}" bukan ahli waris yang dikenal. Pilih: ${WARIS.join(", ")}.`;
    if (!x.v) return `Baris ${x.n}: tulis bagian ${x.k} (mis. "1/6", "ashabah", "mahjub", atau "?").`;
    if (w.ahli.some((a) => a.dasar === nm.dasar)) return `Baris ${x.n}: ${nm.dasar} ditulis dua kali; tulis jumlahnya, mis. "${nm.dasar} (2)".`;
    w.ahli.push({ nama: x.k, ...nm, bagian: x.v, mahjub: /mahjub|terhalang|hijab|tidak dapat|^0$/i.test(x.v), baris: x.n });
  }
  if (!w.ahli.length) return "Belum ada ahli waris.";
  const ada = (d: string) => w.ahli.find((a) => a.dasar === d && !a.mahjub);
  const tulisAda = (d: string) => w.ahli.find((a) => a.dasar === d);
  if (tulisAda("suami") && tulisAda("istri")) return "Suami dan istri tidak mungkin sama-sama menjadi ahli waris satu mayit.";
  if (tulisAda("suami")) {
    if (w.mayit === "laki-laki") return "Mayit laki-laki tidak meninggalkan suami (tulis istri).";
    w.mayit = "perempuan";
  }
  if (tulisAda("istri")) {
    if (w.mayit === "perempuan") return "Mayit perempuan tidak meninggalkan istri (tulis suami).";
    w.mayit = "laki-laki";
  }
  if ((tulisAda("istri")?.jumlah ?? 1) > 4) return "Istri paling banyak 4.";
  for (const a of w.ahli) if (["ayah", "ibu", "suami", "kakek", "nenek"].includes(a.dasar) && a.jumlah > 1 && a.dasar !== "nenek") return `${a.dasar} hanya satu orang.`;
  // hijab (terhalang) yang pasti
  const furu = ada("anak laki-laki") || ada("anak perempuan") || ada("cucu laki-laki") || ada("cucu perempuan");
  const penghalang: [string[], string][] = [
    [["cucu laki-laki", "cucu perempuan", "saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman"], "anak laki-laki"],
    [["kakek", "saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman"], "ayah"],
    [["nenek"], "ibu"],
    [["saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman"], "cucu laki-laki"],
  ];
  for (const [terhalang, oleh] of penghalang) {
    if (!ada(oleh)) continue;
    const salah = terhalang.map(ada).find(Boolean);
    if (salah && !/\?/.test(salah.bagian)) return `Menurut kaidah faraidh, ${salah.dasar} terhalang (mahjub) oleh ${oleh}; tulis "mahjub" di bagiannya (baris ${salah.baris}).`;
  }
  if (furu) {
    const salah = ada("saudara seibu");
    if (salah && !/\?/.test(salah.bagian)) return `Menurut kaidah faraidh, saudara seibu terhalang (mahjub) oleh keturunan mayit (anak/cucu); tulis "mahjub" (baris ${salah.baris}).`;
  }
  // bagian yang pasti
  const harus = (d: string, benar: string, alasan: string) => {
    const a = ada(d);
    if (!a || /\?/.test(a.bagian)) return null;
    const p = pecahan(a.bagian);
    const cocok = benar === "ashabah" ? ASHABAH.test(a.bagian) && p === undefined : p !== undefined && Math.abs(p - pecahan(benar)!) < 1e-9;
    return cocok ? null : `Menurut kaidah faraidh, bagian ${d} ${alasan} adalah ${benar}, bukan ${a.bagian} (baris ${a.baris}).`;
  };
  const cekBagian = [
    harus("suami", furu ? "1/4" : "1/2", furu ? "bila ada anak/cucu" : "bila tidak ada anak/cucu"),
    harus("istri", furu ? "1/8" : "1/4", furu ? "bila ada anak/cucu" : "bila tidak ada anak/cucu"),
    furu ? harus("ibu", "1/6", "bila ada anak/cucu") : null,
    ada("anak laki-laki") || ada("cucu laki-laki") ? harus("ayah", "1/6", "bila ada anak/cucu laki-laki") : null,
    ada("anak laki-laki") ? harus("anak perempuan", "ashabah", "bersama anak laki-laki") : harus("anak perempuan", (ada("anak perempuan")?.jumlah ?? 1) > 1 ? "2/3" : "1/2", (ada("anak perempuan")?.jumlah ?? 1) > 1 ? "(dua orang atau lebih, tanpa anak laki-laki)" : "(seorang, tanpa anak laki-laki)"),
    ada("anak laki-laki") ? harus("anak laki-laki", "ashabah", "") : null,
  ].find(Boolean);
  if (cekBagian) return cekBagian.replace(/ {2}/g, " ");
  // jumlah bagian tetap
  const tetap = w.ahli.filter((a) => !a.mahjub).map((a) => pecahan(a.bagian) ?? 0);
  const jumlah = tetap.reduce((p, q) => p + q, 0);
  if (jumlah > 1 + 1e-9 && !w.aul) return `Jumlah bagian tetap = ${jumlah.toLocaleString("id-ID", { maximumFractionDigits: 3 })}, lebih dari 1. Bila memang 'aul, tambah baris "aul | ya".`;
  return w;
}

/** Baris tulisan ≤ n huruf (dipotong di spasi). */
function pecah(t: string, n: number): string[] {
  const hasil: string[] = [];
  let kini = "";
  for (const k of t.split(/\s+/)) {
    if (kini && (kini + " " + k).length > n) {
      hasil.push(kini);
      kini = k;
    } else kini = kini ? `${kini} ${k}` : k;
  }
  if (kini) hasil.push(kini);
  return hasil.slice(0, 2);
}

function gambarWaris(w: Waris, atas: number) {
  const isi: string[] = [];
  const W = 84, H = 46, G = 10;
  const ambil = (...d: string[]) => d.map((x) => w.ahli.find((a) => a.dasar === x)).filter(Boolean) as Pewaris[];
  const [kakekNenek, ortu, saudara, anak, cucu] = [
    ambil("kakek", "nenek"),
    ambil("ayah", "ibu"),
    ambil("paman", "saudara seibu", "saudara perempuan seayah", "saudara laki-laki seayah", "saudara perempuan", "saudara laki-laki"),
    ambil("anak laki-laki", "anak perempuan"),
    ambil("cucu laki-laki", "cucu perempuan"),
  ];
  const pasangan = ambil("suami", "istri")[0];
  const barisTengah = saudara.length + 1 + (pasangan ? 1 : 0);
  const lebar = Math.max(LEBAR, barisTengah * (W + G) + 30, Math.max(ortu.length, anak.length, cucu.length, kakekNenek.length) * (W + G) + 30);
  // baris tengah: saudara | MAYIT | pasangan
  const x0 = (lebar - barisTengah * (W + G) + G) / 2;
  const xMayit = x0 + saudara.length * (W + G) + W / 2;
  let y = atas + 8;
  const yKN = kakekNenek.length ? y : NaN;
  if (kakekNenek.length) y += H + 34;
  const yOrtu = ortu.length ? y : NaN;
  if (ortu.length) y += H + 34;
  const yTengah = y;
  y += H + 34;
  const yAnak = anak.length ? y : NaN;
  if (anak.length) y += H + 34;
  const yCucu = cucu.length ? y : NaN;
  if (cucu.length) y += H + 34;

  const kotak = (c: P, judul: string[], bagian: string, mahjub: boolean, mayit = false) => {
    isi.push(`<rect x="${r1(c[0] - W / 2)}" y="${r1(c[1])}" width="${W}" height="${H}" rx="4" fill="${mayit ? "#d0d0d0" : "#fff"}" stroke="#000" stroke-width="${mayit ? 2 : 1.2}"${mahjub ? ' stroke-dasharray="4 3"' : ""}/>`);
    judul.forEach((t, i) => isi.push(tulis([c[0], c[1] + 11 + i * 11 - (judul.length - 1) * 2], t, 'font-size="9"')));
    if (bagian) isi.push(tulis([c[0], c[1] + H - 10], bagian, 'font-size="11" font-weight="bold"'));
    if (mahjub) isi.push(garis([c[0] - W / 2 + 4, c[1] + 4], [c[0] + W / 2 - 4, c[1] + H - 4], 'stroke="#000" stroke-width="1"'), garis([c[0] + W / 2 - 4, c[1] + 4], [c[0] - W / 2 + 4, c[1] + H - 4], 'stroke="#000" stroke-width="1"'));
  };
  const deret = (orangnya: Pewaris[], y: number, pusat: number): P[] =>
    orangnya.map((_, i) => [pusat + (i - (orangnya.length - 1) / 2) * (W + G), y]);
  const tampil = (a: Pewaris) => pecah(a.nama, 14);
  const hubung = (atasP: P[], bawahP: P[], yAtas: number, yBawah: number) => {
    // garis dari tengah kelompok atas ke batang di atas kelompok bawah
    const xa = atasP.reduce((s, p) => s + p[0], 0) / atasP.length;
    const yBatang = yBawah - 14;
    isi.push(garis([xa, yAtas + H], [xa, yBatang], 'stroke="#000" stroke-width="1"'));
    const xs = bawahP.map((p) => p[0]);
    isi.push(garis([Math.min(xa, ...xs), yBatang], [Math.max(xa, ...xs), yBatang], 'stroke="#000" stroke-width="1"'));
    for (const p of bawahP) isi.push(garis([p[0], yBatang], [p[0], yBawah], 'stroke="#000" stroke-width="1"'));
  };
  const pKN = deret(kakekNenek, yKN, xMayit);
  const pOrtu = deret(ortu, yOrtu, xMayit);
  const pMayit: P = [xMayit, yTengah];
  const pSaudara: P[] = saudara.map((_, i) => [x0 + W / 2 + i * (W + G), yTengah]);
  const pPasangan: P | null = pasangan ? [xMayit + W + G, yTengah] : null;
  const pusatAnak = pPasangan ? (xMayit + pPasangan[0]) / 2 : xMayit;
  const pAnak = deret(anak, yAnak, pusatAnak);
  const anakLk = anak.findIndex((a) => a.dasar === "anak laki-laki");
  const pCucu = deret(cucu, yCucu, anakLk >= 0 ? pAnak[anakLk][0] : pusatAnak);
  if (kakekNenek.length && ortu.length) hubung(pKN, pOrtu, yKN, yOrtu);
  if (ortu.length || kakekNenek.length) hubung(ortu.length ? pOrtu : pKN, [pMayit, ...pSaudara], ortu.length ? yOrtu : yKN, yTengah);
  else if (saudara.length) {
    const yb = yTengah - 14;
    isi.push(garis([pSaudara[0][0], yb], [xMayit, yb], 'stroke="#000" stroke-width="1"'));
    for (const p of [pMayit, ...pSaudara]) isi.push(garis([p[0], yb], [p[0], yTengah], 'stroke="#000" stroke-width="1"'));
  }
  if (pPasangan) {
    isi.push(garis([xMayit + W / 2, yTengah + H / 2 - 2], [pPasangan[0] - W / 2, yTengah + H / 2 - 2], 'stroke="#000" stroke-width="1"'));
    isi.push(garis([xMayit + W / 2, yTengah + H / 2 + 2], [pPasangan[0] - W / 2, yTengah + H / 2 + 2], 'stroke="#000" stroke-width="1"'));
  }
  if (anak.length) {
    const xa = pusatAnak;
    const yAsal = pPasangan ? yTengah + H / 2 : yTengah + H;
    const yBatang = yAnak - 14;
    isi.push(garis([xa, yAsal], [xa, yBatang], 'stroke="#000" stroke-width="1"'));
    const xs = pAnak.map((p) => p[0]);
    isi.push(garis([Math.min(xa, ...xs), yBatang], [Math.max(xa, ...xs), yBatang], 'stroke="#000" stroke-width="1"'));
    for (const p of pAnak) isi.push(garis([p[0], yBatang], [p[0], yAnak], 'stroke="#000" stroke-width="1"'));
  }
  if (cucu.length) hubung(anakLk >= 0 ? [pAnak[anakLk]] : pAnak, pCucu, yAnak, yCucu);
  kakekNenek.forEach((a, i) => kotak(pKN[i], tampil(a), a.bagian, a.mahjub));
  ortu.forEach((a, i) => kotak(pOrtu[i], tampil(a), a.bagian, a.mahjub));
  saudara.forEach((a, i) => kotak(pSaudara[i], tampil(a), a.bagian, a.mahjub));
  kotak(pMayit, ["Mayit", w.mayit ? `(${w.mayit})` : ""].filter(Boolean), "", false, true);
  if (pasangan && pPasangan) kotak(pPasangan, tampil(pasangan), pasangan.bagian, pasangan.mahjub);
  anak.forEach((a, i) => kotak(pAnak[i], tampil(a), a.bagian, a.mahjub));
  cucu.forEach((a, i) => kotak(pCucu[i], tampil(a), a.bagian, a.mahjub));
  const catatan = [w.ahli.some((a) => a.mahjub) ? "kotak dicoret = mahjub (terhalang)" : "", w.aul ? "terjadi 'aul" : ""].filter(Boolean).join("; ");
  if (catatan) isi.push(`<text x="${lebar / 2}" y="${y - 12}" text-anchor="middle" font-size="9">${esc(catatan)}</text>`);
  return { isi: isi.join(""), tinggi: y - (catatan ? 0 : 14), lebar };
}

// ---------- mata angin & kiblat ----------

const ARAH: [string, number][] = [["utara", 0], ["timur laut", 45], ["timur", 90], ["tenggara", 135], ["selatan", 180], ["barat daya", 225], ["barat", 270], ["barat laut", 315]];
type Arah = { kiblat?: { sudut: number; teks: string }; benda: { nama: string; sudut: number }[]; sembunyi: boolean };

function bacaSudutArah(t: string): number | undefined {
  const a = ARAH.find(([n]) => normal(n) === normal(t));
  if (a) return a[1];
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(°|derajat)?\s*$/i.exec(t);
  const v = m ? Number(m[1].replace(",", ".")) : NaN;
  return v >= 0 && v <= 360 ? v % 360 : undefined;
}

function bacaArah(isi: string[][]): Arah | string {
  const b = badan(isi, "arah");
  if (typeof b === "string") return b;
  const a: Arah = { benda: [], sembunyi: false };
  for (const x of b) {
    if (x.kk === "namaarah") {
      a.sembunyi = /sembunyi|tidak/i.test(x.v);
      continue;
    }
    const s = bacaSudutArah(x.v);
    if (s === undefined) return `Baris ${x.n}: arah ditulis nama arah (${ARAH.map(([n]) => n).join(", ")}) atau sudut 0–360° dari utara.`;
    if (x.kk === "kiblat" || x.kk === "arahkiblat") a.kiblat = { sudut: s, teks: x.v };
    else {
      if (x.k.length > 16) return `Baris ${x.n}: nama benda terlalu panjang (maks 16 huruf).`;
      a.benda.push({ nama: x.k, sudut: s });
    }
  }
  return a;
}

function gambarArah(a: Arah, atas: number) {
  const isi: string[] = [];
  const R = 92; // ujung arah utama; benda di R, nama arah di luar benda
  const c: P = [LEBAR / 2, atas + 38 + R];
  const titik = (sudut: number, r: number): P => [c[0] + r * Math.sin((sudut * Math.PI) / 180), c[1] - r * Math.cos((sudut * Math.PI) / 180)];
  isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${R * 0.55}" fill="none" stroke="#000" stroke-width="0.8"/>`);
  // arah antara (abu-abu, pendek) digambar dulu, arah utama (hitam-putih) di atasnya
  for (const [nama, s] of [...ARAH].sort((x, y) => (y[1] % 90 === 0 ? 0 : 1) - (x[1] % 90 === 0 ? 0 : 1))) {
    const utama = s % 90 === 0;
    const ujung = titik(s, utama ? R * 0.82 : R * 0.5);
    const kiri = titik(s - 90, utama ? 7 : 5), kanan = titik(s + 90, utama ? 7 : 5);
    isi.push(`<polygon points="${r1(ujung[0])},${r1(ujung[1])} ${r1(kiri[0])},${r1(kiri[1])} ${c[0]},${c[1]}" fill="${utama ? "#000" : "#bfbfbf"}" stroke="#000" stroke-width="0.7"/>`);
    isi.push(`<polygon points="${r1(ujung[0])},${r1(ujung[1])} ${r1(kanan[0])},${r1(kanan[1])} ${c[0]},${c[1]}" fill="#fff" stroke="#000" stroke-width="0.7"/>`);
    if (!a.sembunyi || s === 0) {
      const p = titik(s, R + 22);
      isi.push(tulis(p, nama.replace(/\b\w/g, (h) => h.toUpperCase()), `font-size="${utama ? 11 : 9}"${utama ? ' font-weight="bold"' : ""}`));
    }
  }
  if (a.kiblat) {
    const u = titik(a.kiblat.sudut, R * 0.98);
    const d = Math.hypot(u[0] - c[0], u[1] - c[1]);
    const [ux, uy] = [(u[0] - c[0]) / d, (u[1] - c[1]) / d];
    isi.push(garis(c, [u[0] - ux * 9, u[1] - uy * 9], 'stroke="#000" stroke-width="2.5" stroke-dasharray="7 3"'));
    isi.push(`<polygon points="${r1(u[0])},${r1(u[1])} ${r1(u[0] - ux * 11 - uy * 5)},${r1(u[1] - uy * 11 + ux * 5)} ${r1(u[0] - ux * 11 + uy * 5)},${r1(u[1] - uy * 11 - ux * 5)}" fill="#000"/>`);
    const t = titik(a.kiblat.sudut, R * 0.58);
    isi.push(`<rect x="${r1(t[0] - 21)}" y="${r1(t[1] - 9)}" width="42" height="15" rx="3" fill="#fff" stroke="#000" stroke-width="0.6"/>`, tulis([t[0], t[1] - 2], "Kiblat", 'font-size="10" font-weight="bold"'));
  }
  for (const bnd of a.benda) {
    const p = titik(bnd.sudut, R);
    isi.push(`<rect x="${r1(p[0] - 4)}" y="${r1(p[1] - 4)}" width="8" height="8" fill="#d0d0d0" stroke="#000"/>`);
    // nama benda di samping (tegak lurus arah), supaya tidak menimpa nama arah di luarnya
    const sd = ((bnd.sudut + 90) * Math.PI) / 180;
    const kanan = Math.sin(sd) >= 0;
    isi.push(`<text x="${r1(p[0] + (kanan ? 7 : -7))}" y="${r1(p[1] + 12)}" text-anchor="${kanan ? "start" : "end"}" font-size="10" font-style="italic">${esc(bnd.nama)}</text>`);
  }
  isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="3" fill="#000"/>`);
  return { isi: isi.join(""), tinggi: c[1] + R + 34 };
}

// ---------- pintu ----------

type Hasil = Shaf | Waris | Arah;
export function bacaAgama(isi: string[][], jenis: JenisAgama): Hasil | string {
  return jenis === "shaf" ? bacaShaf(isi) : jenis === "waris" ? bacaWaris(isi) : bacaArah(isi);
}
export function gambarAgama(h: Hasil, jenis: JenisAgama, atas: number): { isi: string; tinggi: number; lebar?: number } {
  return jenis === "shaf" ? gambarShaf(h as Shaf, atas) : jenis === "waris" ? gambarWaris(h as Waris, atas) : gambarArah(h as Arah, atas);
}
