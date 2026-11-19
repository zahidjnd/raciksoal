/**
 * Skema IPA tahap 4b (0.58.0, ATURAN-SOAL 4.12): cermin & lensa, gaya pada balok, katrol, tuas dari tabel 2 kolom
 * "| Bagian | Isi |" + penanda "[[SKEMA optik|gaya|katrol|tuas: judul]]" (diteruskan skema.ts). SVG hitam-putih.
 * Optik: bayangan dihitung 1/f = 1/s + 1/s', semua sinar istimewa diarahkan ke titik bayangan (paraksial), maya =
 * putus-putus. Pemeriksa: jarak/tinggi bayangan & perbesaran (optik), sudut bidang (gaya), beban yang wajib (katrol),
 * beban × lengan beban = kuasa × lengan kuasa (tuas). Panah gaya tidak sebanding besarnya.
 */
import { ARAB, bersih, esc, garis, LEBAR, normal, r1, tulis } from "./bangun.ts";
import { bacaAngka } from "./skala.ts";

export type JenisFisika = "optik" | "gaya" | "katrol" | "tuas";
type P = [number, number];
const K = ["Bagian", "Isi"];

export const ATURAN_FISIKA: Record<JenisFisika, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  optik: {
    nama: "Cermin & lensa",
    baris: [2, 9],
    petunjuk: 'Baris "alat | cermin cekung" (cermin cembung, lensa cembung, lensa cekung), "fokus | 10 cm" (cermin: boleh "jari-jari | 20 cm"), "jarak benda | 15 cm", "tinggi benda | 2 cm". Boleh: "jarak bayangan", "tinggi bayangan", "perbesaran" (angka dicocokkan dengan rumus, atau "?"), "bayangan | sembunyi" bila letak/sifat bayangan ditanyakan.',
    contoh: [K, ["alat", "lensa cembung"], ["fokus", "10 cm"], ["jarak benda", "15 cm"], ["tinggi benda", "2 cm"], ["jarak bayangan", "?"]],
  },
  gaya: {
    nama: "Gaya pada balok",
    baris: [2, 9],
    petunjuk: 'Baris "bidang | datar" atau "miring 30°", "benda | m = 5 kg" (tulisan di balok). Gaya: "berat | w", "normal | N", "gesek | f" (boleh "ke atas"/"ke bawah"/"ke kiri"/"ke kanan"), "F | 20 N, 37°" (sudut terhadap bidang; "ke kiri" membalik). Uraian berat di bidang miring: "uraian | ya".',
    contoh: [K, ["bidang", "miring 30°"], ["benda", "m = 4 kg"], ["berat", "w"], ["normal", "N"], ["gesek", "f"], ["uraian", "ya"]],
  },
  katrol: {
    nama: "Katrol",
    baris: [2, 6],
    petunjuk: 'Baris "bentuk | tetap" (dua beban tergantung; atau satu beban + "F"), "bebas" (beban di katrol bergerak, ditarik F ke atas), atau "meja" (balok m1 di meja, tali lewat katrol ke beban m2). Lalu "m1 | 2 kg", "m2 | 3 kg", "F | ?", meja: "meja | licin" atau "kasar, μ = 0,2".',
    contoh: [K, ["bentuk", "meja"], ["m1", "4 kg"], ["m2", "2 kg"], ["meja", "licin"]],
  },
  tuas: {
    nama: "Tuas",
    baris: [2, 6],
    petunjuk: 'Baris "jenis | 1" (titik tumpu di tengah), "2" (beban di tengah), "3" (kuasa di tengah). Lalu "beban | 300 N", "kuasa | ?", "lengan beban | 0,5 m", "lengan kuasa | 1,5 m". Bila semua angka ditulis: beban × lengan beban = kuasa × lengan kuasa.',
    contoh: [K, ["jenis", "1"], ["beban", "300 N"], ["kuasa", "?"], ["lengan beban", "0,5 m"], ["lengan kuasa", "1,5 m"]],
  },
};

/** "15 cm", "300 N", "2,5" → angka; "?", "x" → undefined. */
function angka(t: string): number | undefined {
  const m = /^\s*(-?\d+(?:[.,]\d+)?)\s*[a-zA-Zµμ°/²³]*\s*$/.exec(t);
  return m ? bacaAngka(m[1]) : undefined;
}
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString("id-ID");
type Baris = { k: string; kk: string; v: string; n: number };
function badan(isi: string[][], jenis: JenisFisika): Baris[] | string {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `${ATURAN_FISIKA[jenis].nama} memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const [lo, hi] = ATURAN_FISIKA[jenis].baris;
  if (isi.length - 1 < lo || isi.length - 1 > hi) return `Isi ${lo}–${hi} baris (sekarang ${isi.length - 1}).`;
  const b = isi.slice(1).map((x, n) => ({ k: bersih(x[0] ?? ""), v: bersih(x[1] ?? ""), n: n + 1 })).filter((x) => x.k || x.v);
  for (const x of b) {
    if (ARAB.test(x.k + x.v)) return `Baris ${x.n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    if (!x.k) return `Baris ${x.n} kolom 1 masih kosong.`;
    if (x.v.length > 30) return `Baris ${x.n}: isi terlalu panjang (maks 30 huruf).`;
  }
  return b.map((x) => ({ ...x, kk: normal(x.k) }));
}

/** Panah dari a ke b (kepala di b) + label di ujung. */
function panah(a: P, b: P, label = "", lebar = 1.6, putus = false) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const [ux, uy] = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  const ujung: P = [b[0] - ux * 8, b[1] - uy * 8];
  let s = garis(a, ujung, `stroke="#000" stroke-width="${lebar}"${putus ? ' stroke-dasharray="4 3"' : ""}`);
  s += `<polygon points="${r1(b[0])},${r1(b[1])} ${r1(ujung[0] - uy * 4)},${r1(ujung[1] + ux * 4)} ${r1(ujung[0] + uy * 4)},${r1(ujung[1] - ux * 4)}" fill="#000"/>`;
  if (label) s += tulis([b[0] + ux * 12, b[1] + uy * 12], label, 'font-size="11" font-style="italic"');
  return s;
}
const PUTUS = 'stroke="#000" stroke-width="1" stroke-dasharray="4 3"';

// ---------- optik ----------

const ALAT = ["cermin cekung", "cermin cembung", "lensa cembung", "lensa cekung"];
type Optik = { alat: string; f: number; s: number; h?: number; sembunyi: boolean; label: Record<string, string>; sAksen: number };

function bacaOptik(isi: string[][]): Optik | string {
  const b = badan(isi, "optik");
  if (typeof b === "string") return b;
  const o: Optik = { alat: "", f: NaN, s: NaN, sembunyi: false, label: {}, sAksen: NaN };
  const cek: { nama: string; nilai: number; teks: string; n: number }[] = [];
  for (const x of b) {
    if (/^(alat|jenis)$/.test(x.kk)) {
      const t = normal(x.v).replace("positif", x.v.match(/lensa/i) ? "cembung" : "cekung").replace("negatif", x.v.match(/lensa/i) ? "cekung" : "cembung");
      const a = ALAT.find((y) => normal(y) === t);
      if (!a) return `Baris ${x.n}: alat "${x.v}" tidak dikenal. Pilih: ${ALAT.join(", ")}.`;
      o.alat = a;
    } else if (/^(fokus|jarakfokus|f)$/.test(x.kk)) {
      o.f = Math.abs(angka(x.v) ?? NaN);
      o.label.f = x.v;
    } else if (/^(jarijari|jarijarikelengkungan|r)$/.test(x.kk)) {
      o.f = Math.abs(angka(x.v) ?? NaN) / 2;
      o.label.r = x.v;
    } else if (/^(jarakbenda|s|so)$/.test(x.kk)) {
      o.s = Math.abs(angka(x.v) ?? NaN);
      o.label.s = x.v;
    } else if (/^(tinggibenda|h|ho)$/.test(x.kk)) {
      o.h = angka(x.v);
      o.label.h = x.v;
    } else if (/^(jarakbayangan|s'|s’|si)$/.test(x.kk)) {
      o.label.si = x.v;
      if (angka(x.v) !== undefined) cek.push({ nama: "jarak bayangan", nilai: angka(x.v)!, teks: x.v, n: x.n });
    } else if (/^(tinggibayangan|h'|h’|hi)$/.test(x.kk)) {
      o.label.hi = x.v;
      if (angka(x.v) !== undefined) cek.push({ nama: "tinggi bayangan", nilai: angka(x.v)!, teks: x.v, n: x.n });
    } else if (/^(perbesaran|m)$/.test(x.kk)) {
      if (angka(x.v.replace(/\s*(kali|x|×)$/i, "")) !== undefined) cek.push({ nama: "perbesaran", nilai: angka(x.v.replace(/\s*(kali|x|×)$/i, ""))!, teks: x.v, n: x.n });
    } else if (x.kk === "bayangan") o.sembunyi = /sembunyi|tidak|tanpa|hilang/i.test(x.v);
    else return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: alat, fokus, jari-jari, jarak benda, tinggi benda, jarak bayangan, tinggi bayangan, perbesaran, bayangan.`;
  }
  if (!o.alat) return `Tulis baris "alat" (${ALAT.join(", ")}).`;
  if (!(o.f > 0)) return 'Tulis "fokus" berupa angka (mis. "10 cm").';
  if (!(o.s > 0)) return 'Tulis "jarak benda" berupa angka (mis. "15 cm").';
  const fe = /cekung/.test(o.alat) === o.alat.startsWith("cermin") ? o.f : -o.f; // cermin cekung & lensa cembung = positif
  o.sAksen = Math.abs(o.s - fe) < 1e-9 ? Infinity : (o.s * fe) / (o.s - fe);
  const M = o.sAksen / o.s;
  for (const c of cek) {
    if (!Number.isFinite(o.sAksen)) return `Benda tepat di titik fokus: bayangan di tak hingga, jadi ${c.nama} tidak bisa dihitung (baris ${c.n}).`;
    const benar = c.nama === "jarak bayangan" ? o.sAksen : c.nama === "perbesaran" ? M : o.h !== undefined ? M * o.h : NaN;
    if (Number.isNaN(benar)) return `Baris ${c.n}: tulis "tinggi benda" supaya tinggi bayangan bisa diperiksa.`;
    const cocok = Math.abs(Math.abs(c.nilai) - Math.abs(benar)) <= 0.02 * Math.abs(benar) + 1e-9 && (c.nilai >= 0 || benar < 0 || c.nama !== "jarak bayangan");
    if (!cocok)
      return `Ukuran tidak cocok: ${c.nama} tertulis ${c.teks}, padahal dari 1/f = 1/s + 1/s' ${c.nama} = ${fmt(c.nama === "perbesaran" ? Math.abs(benar) : benar)}${c.nama === "jarak bayangan" && benar < 0 ? " (maya)" : ""} (baris ${c.n}).`;
  }
  return o;
}

function gambarOptik(o: Optik, atas: number) {
  const isi: string[] = [];
  const cermin = o.alat.startsWith("cermin");
  const fe = /cekung/.test(o.alat) === cermin ? o.f : -o.f;
  const si = o.sAksen;
  const xi = cermin ? -si : si; // letak bayangan (benda di x = −s, alat di x = 0)
  const h = o.h ?? o.f * 0.4;
  const hi = Number.isFinite(si) ? -(si / o.s) * h : NaN;
  // rentang mendatar: benda, F & 2F kedua sisi (lensa) / satu sisi (cermin), bayangan bila tidak terlalu jauh
  const jauh = 4 * Math.max(o.s, 2 * o.f);
  const tampakBayangan = !o.sembunyi && Number.isFinite(xi) && Math.abs(xi) <= jauh;
  const xs = [-o.s, -2 * o.f, cermin && fe < 0 ? 2 * o.f : cermin ? 0.25 * o.f : 2 * o.f, ...(tampakBayangan ? [xi] : [])];
  const [x0, x1] = [Math.min(...xs) * 1.12, Math.max(...xs) * 1.12 + (cermin && fe > 0 ? o.f * 0.3 : 0)];
  const kx = (LEBAR - 40) / (x1 - x0);
  const tinggiMaks = Math.max(Math.abs(h), tampakBayangan ? Math.abs(hi) : 0);
  const ky = 70 / tinggiMaks;
  const tAlat = tinggiMaks * ky + 22; // setengah tinggi lensa/cermin (layar)
  const yAxis = atas + 16 + tAlat;
  const X = (x: number) => 20 + (x - x0) * kx;
  const Y = (y: number) => yAxis - y * ky;
  const L = (p: P): P => [X(p[0]), Y(p[1])];
  const bawahMaks = tampakBayangan && hi < 0 ? -hi : 0;
  // sumbu utama
  isi.push(garis([10, yAxis], [LEBAR - 10, yAxis], 'stroke="#000" stroke-width="1"'));
  // alat
  if (cermin) {
    const lengkung = fe > 0 ? -7 : 7; // cekung: kedua ujung condong ke benda (kiri), tengah menjorok ke kanan
    isi.push(`<path d="M${r1(X(0) + lengkung)},${r1(yAxis - tAlat)} Q${r1(X(0) - lengkung)},${r1(yAxis)} ${r1(X(0) + lengkung)},${r1(yAxis + tAlat)}" fill="none" stroke="#000" stroke-width="2"/>`);
    for (let y = -tAlat + 6; y < tAlat; y += 9) {
      const t = (y + tAlat) / (2 * tAlat);
      const xb = X(0) + lengkung * ((1 - t) ** 2 + t ** 2) - lengkung * 2 * t * (1 - t) + 1;
      isi.push(garis([xb, yAxis + y], [xb + 6, yAxis + y - 6], 'stroke="#000" stroke-width="0.8"'));
    }
  } else {
    const ke = fe > 0 ? 1 : -1; // cembung: panah keluar, cekung: panah masuk
    isi.push(garis([X(0), yAxis - tAlat], [X(0), yAxis + tAlat], 'stroke="#000" stroke-width="2"'));
    for (const ujung of [-1, 1]) {
      const y = yAxis + ujung * tAlat;
      const d = ujung * ke * 7;
      isi.push(`<polyline points="${r1(X(0) - 6)},${r1(y - d)} ${r1(X(0))},${r1(y)} ${r1(X(0) + 6)},${r1(y - d)}" fill="none" stroke="#000" stroke-width="2"/>`);
    }
  }
  // titik F, M / 2F
  const tanda = (x: number, t: string) => {
    if (x < x0 || x > x1) return;
    isi.push(`<circle cx="${r1(X(x))}" cy="${r1(yAxis)}" r="2.5" fill="#000"/>`, tulis([X(x), yAxis + 14], t, 'font-size="10"'));
  };
  if (cermin) {
    const sisi = fe > 0 ? -1 : 1;
    tanda(sisi * o.f, "F");
    tanda(sisi * 2 * o.f, "M");
  } else {
    tanda(-o.f, "F1");
    tanda(o.f, "F2");
    tanda(-2 * o.f, "2F1");
    tanda(2 * o.f, "2F2");
  }
  isi.push(tulis([X(0) + 8, yAxis + 14], "O", 'font-size="10"'));
  // benda
  const P0: P = [-o.s, h];
  isi.push(panah(L([-o.s, 0]), L(P0), "", 2.2));
  isi.push(tulis([X(-o.s) - 4, Y(h) - 8], o.label.h ?? "benda", 'font-size="10"'));
  // sinar istimewa: sejajar sumbu, lewat pusat O, lewat F (bila wajar); keluar menuju (atau seolah dari) bayangan
  const arahKeluar = cermin ? -1 : 1;
  const sinar = (q: number, mMasuk: number) => {
    const Q: P = [0, q];
    isi.push(garis(L(P0), L(Q), 'stroke="#000" stroke-width="1"'));
    const mKeluar = mMasuk - q / fe; // paraksial, ruang "terbuka" setelah alat
    const batas = arahKeluar > 0 ? x1 : x0;
    const Lx = Math.abs(batas);
    const akhir: P = [arahKeluar * Lx, q + mKeluar * Lx];
    isi.push(panahTengah(L(Q), L(akhir)));
    // bayangan maya: perpanjangan putus-putus ke belakang alat
    if (Number.isFinite(xi) && (cermin ? xi > 0 : xi < 0) && tampakBayangan) isi.push(garis(L(Q), L([xi, hi]), PUTUS));
  };
  // bayangan disembunyikan (ditanyakan): sinar juga tidak digambar, perpotongannya membocorkan letak bayangan
  if (!o.sembunyi) sinar(h, 0);
  if (!o.sembunyi) sinar(0, -h / o.s);
  if (!o.sembunyi && fe > 0 && Math.abs(o.s - o.f) > 1e-9) {
    const q = (-h * o.f) / (o.s - o.f);
    if (Math.abs(q) <= 2.2 * Math.abs(h)) sinar(q, -h / (o.s - o.f));
  }
  if (tampakBayangan) {
    const maya = cermin ? xi > 0 : xi < 0;
    isi.push(panah(L([xi, 0]), L([xi, hi]), "", 2.2, maya));
    isi.push(tulis([X(xi) + 4, Y(hi) + (hi < 0 ? 14 : -8)], o.label.hi ?? (maya ? "bayangan (maya)" : "bayangan"), 'font-size="10"'));
  }
  // jarak benda (dan jarak bayangan bila ditulis) di bawah sumbu
  const yUkur = Math.max(yAxis + Math.max(28, bawahMaks * ky + 18), yAxis + tAlat - 6);
  const ukur = (xa: number, xb: number, t: string, y: number) => {
    isi.push(garis([X(xa), y], [X(xb), y], 'stroke="#000" stroke-width="0.8"'), garis([X(xa), y - 4], [X(xa), y + 4], 'stroke="#000" stroke-width="0.8"'), garis([X(xb), y - 4], [X(xb), y + 4], 'stroke="#000" stroke-width="0.8"'));
    isi.push(tulis([(X(xa) + X(xb)) / 2, y + 12], t, 'font-size="10"'));
  };
  if (o.label.s) ukur(-o.s, 0, `s = ${o.label.s}`, yUkur);
  if (o.label.si && tampakBayangan) ukur(0, xi, `s' = ${o.label.si}`, yUkur + 24);
  const f = o.label.f ? `f = ${o.label.f}` : o.label.r ? `R = ${o.label.r}` : "";
  if (f) isi.push(`<text x="12" y="${atas + 12}" font-size="10">${esc(f)}</text>`);
  return { isi: isi.join(""), tinggi: yUkur + (o.label.si && tampakBayangan ? 24 : 0) + 22 };
}
/** Garis dengan kepala panah kecil di tengah (arah rambat sinar). */
function panahTengah(a: P, b: P) {
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const [ux, uy] = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  return garis(a, b, 'stroke="#000" stroke-width="1"') + `<polygon points="${r1(m[0] + ux * 4)},${r1(m[1] + uy * 4)} ${r1(m[0] - ux * 3 - uy * 3)},${r1(m[1] - uy * 3 + ux * 3)} ${r1(m[0] - ux * 3 + uy * 3)},${r1(m[1] - uy * 3 - ux * 3)}" fill="#000"/>`;
}

// ---------- gaya pada balok ----------

type Gaya = { sudut: number; benda: string; gaya: { jenis: "w" | "N" | "f" | "lain"; label: string; sudut: number; balik: boolean; arah?: string }[]; uraian: boolean };

function bacaGaya(isi: string[][]): Gaya | string {
  const b = badan(isi, "gaya");
  if (typeof b === "string") return b;
  const g: Gaya = { sudut: 0, benda: "", gaya: [], uraian: false };
  let adaBidang = false;
  for (const x of b) {
    if (x.kk === "bidang") {
      adaBidang = true;
      if (/datar/i.test(x.v)) g.sudut = 0;
      else if (/miring/i.test(x.v)) {
        const m = /(\d+(?:[.,]\d+)?)\s*°?/.exec(x.v);
        g.sudut = m ? bacaAngka(m[1]) : 30;
        if (!(g.sudut > 0 && g.sudut < 90)) return `Baris ${x.n}: sudut bidang miring harus di antara 0° dan 90°.`;
      } else return `Baris ${x.n}: bidang ditulis "datar" atau "miring 30°".`;
    } else if (/^(benda|balok)$/.test(x.kk)) g.benda = x.v;
    else if (x.kk === "uraian") g.uraian = /ya|tampil|iya/i.test(x.v);
    else {
      // huruf besar/kecil dibedakan: "F" = gaya tarik, "f" = gesek
      const jenis = /^(berat|w)$/i.test(x.k) ? "w" : /^(normal|N)$/i.test(x.k) && x.k !== "n" ? "N" : /^(gesek|gesekan)$/i.test(x.k) || /^f[sk]?$/.test(x.k) ? "f" : "lain";
      if (jenis === "lain" && x.k.length > 8) return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: bidang, benda, berat, normal, gesek, F (atau nama gaya pendek), uraian.`;
      const m = /(-?\d+(?:[.,]\d+)?)\s*°/.exec(x.v);
      const arah = /ke\s+(atas|bawah|kiri|kanan)/i.exec(x.v)?.[1].toLowerCase();
      const label = x.v.replace(/,?\s*-?\d+(?:[.,]\d+)?\s*°/, "").replace(/,?\s*ke\s+(atas|bawah|kiri|kanan)/i, "").trim();
      g.gaya.push({ jenis, label: jenis === "lain" ? (label && label !== x.k ? `${x.k} = ${label}` : x.k) : label || (jenis === "w" ? "w" : jenis), sudut: m ? bacaAngka(m[1]) : 0, balik: arah === "kiri" || arah === "bawah", arah });
    }
  }
  if (!adaBidang) return 'Tulis baris "bidang | datar" atau "bidang | miring 30°".';
  if (g.uraian && !g.sudut) return "Uraian w sin θ dan w cos θ hanya untuk bidang miring.";
  if (!g.gaya.length && !g.uraian) return "Belum ada gaya. Tambah mis. \"berat | w\".";
  return g;
}

function gambarGaya(g: Gaya, atas: number) {
  const isi: string[] = [];
  const th = (g.sudut * Math.PI) / 180;
  const sepanjang: P = [Math.cos(th), -Math.sin(th)]; // naik bidang (layar)
  const tegak: P = [-Math.sin(th), -Math.cos(th)]; // menjauhi bidang
  const alasY = atas + 210;
  let pusat: P;
  const s = 46; // sisi balok
  if (g.sudut) {
    const lebarAlas = 280, kiri = 40;
    const tinggi = Math.min(170, lebarAlas * Math.tan(th));
    const lebar = tinggi / Math.tan(th);
    const A: P = [kiri, alasY], B: P = [kiri + lebar, alasY], C: P = [kiri + lebar, alasY - tinggi];
    isi.push(`<polygon points="${A.join(",")} ${B.join(",")} ${r1(C[0])},${r1(C[1])}" fill="#eeeeee" stroke="#000" stroke-width="1.5"/>`);
    isi.push(`<path d="M${A[0] + 34},${A[1]} A34,34 0 0 0 ${r1(A[0] + 34 * Math.cos(th))},${r1(A[1] - 34 * Math.sin(th))}" fill="none" stroke="#000"/>`);
    isi.push(tulis([A[0] + 46 * Math.cos(th / 2), A[1] - 46 * Math.sin(th / 2)], `${fmt(g.sudut)}°`, 'font-size="10"'));
    const tengahBidang: P = [A[0] + (C[0] - A[0]) * 0.55, A[1] + (C[1] - A[1]) * 0.55];
    pusat = [tengahBidang[0] + tegak[0] * (s / 2), tengahBidang[1] + tegak[1] * (s / 2)];
  } else {
    isi.push(garis([30, alasY], [LEBAR - 30, alasY], 'stroke="#000" stroke-width="1.5"'));
    for (let x = 34; x < LEBAR - 30; x += 10) isi.push(garis([x, alasY], [x - 6, alasY + 6], 'stroke="#000" stroke-width="0.7"'));
    pusat = [LEBAR / 2, alasY - s / 2];
  }
  isi.push(`<rect x="${r1(pusat[0] - s / 2)}" y="${r1(pusat[1] - s / 2)}" width="${s}" height="${s}" fill="#fff" stroke="#000" stroke-width="1.5" transform="rotate(${-g.sudut} ${r1(pusat[0])} ${r1(pusat[1])})"/>`);
  if (g.benda) isi.push(tulis(pusat, g.benda, `font-size="9" transform="rotate(${-g.sudut} ${r1(pusat[0])} ${r1(pusat[1])})"`));
  const ke = (u: P, k: number): P => [pusat[0] + u[0] * k, pusat[1] + u[1] * k];
  const adaF = g.gaya.find((x) => x.jenis === "lain");
  for (const x of g.gaya) {
    if (x.jenis === "w") isi.push(panah(pusat, [pusat[0], pusat[1] + 78], x.label));
    else if (x.jenis === "N") isi.push(panah(pusat, ke(tegak, 70), x.label));
    else {
      // f: berlawanan dengan F; tanpa F: miring = ke atas bidang (menahan), datar = ke kiri
      let maju = x.jenis === "f" ? (adaF ? adaF.balik : !!g.sudut) : !x.balik;
      if (x.jenis === "f" && x.arah) maju = x.arah === "atas" || x.arah === "kanan";
      const a = (x.sudut * Math.PI) / 180;
      const dir: P = [(maju ? 1 : -1) * (sepanjang[0] * Math.cos(a)) + tegak[0] * Math.sin(a), (maju ? 1 : -1) * (sepanjang[1] * Math.cos(a)) + tegak[1] * Math.sin(a)];
      // gesek di permukaan bawah balok
      const asal = x.jenis === "f" ? ke(tegak, -s / 2 + 2) : pusat;
      isi.push(panah(asal, [asal[0] + dir[0] * 74, asal[1] + dir[1] * 74], x.label));
      if (x.sudut) isi.push(tulis([pusat[0] + dir[0] * 26 + 10, pusat[1] + dir[1] * 26 - 4], `${fmt(x.sudut)}°`, 'font-size="9"'));
    }
  }
  if (g.uraian) {
    const w = 78;
    const sej: P = [-sepanjang[0], -sepanjang[1]];
    isi.push(panah(pusat, ke(sej, w * Math.sin(th)), "w sin θ", 1.2, true), panah(pusat, ke(tegak, -w * Math.cos(th)), "w cos θ", 1.2, true));
  }
  return { isi: isi.join(""), tinggi: alasY + 24 };
}

// ---------- katrol ----------

type Katrol = { bentuk: "tetap" | "bebas" | "meja"; m1: string; m2: string; F: string; meja: string };

function bacaKatrol(isi: string[][]): Katrol | string {
  const b = badan(isi, "katrol");
  if (typeof b === "string") return b;
  const k: Katrol = { bentuk: "tetap", m1: "", m2: "", F: "", meja: "" };
  let ada = false;
  for (const x of b) {
    if (/^(bentuk|jenis)$/.test(x.kk)) {
      const t = normal(x.v).replace(/^katrol/, "");
      if (!["tetap", "bebas", "meja"].includes(t)) return `Baris ${x.n}: bentuk "${x.v}" tidak dikenal. Pilih: tetap, bebas, meja.`;
      k.bentuk = t as Katrol["bentuk"];
      ada = true;
    } else if (/^(m1|beban1|a|balok1|m)$/.test(x.kk)) k.m1 = x.v;
    else if (/^(m2|beban2|b|balok2)$/.test(x.kk)) k.m2 = x.v;
    else if (/^(f|kuasa|gaya)$/.test(x.kk)) k.F = x.v;
    else if (/^(meja|permukaan|lantai)$/.test(x.kk)) k.meja = x.v;
    else return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: bentuk, m1, m2, F, meja.`;
  }
  if (!ada) return 'Tulis baris "bentuk | tetap", "bebas", atau "meja".';
  if (!k.m1) return 'Tulis baris "m1" (beban pertama).';
  if (k.bentuk === "meja" && !k.m2) return 'Bentuk meja butuh "m1" (balok di meja) dan "m2" (beban tergantung).';
  if (k.bentuk === "tetap" && !k.m2 && !k.F) return 'Katrol tetap: tulis "m2" (beban kedua) atau "F" (gaya tarik).';
  return k;
}

function beban(c: P, label: string, isi: string[], w = 46, h = 36) {
  isi.push(`<rect x="${r1(c[0] - w / 2)}" y="${r1(c[1])}" width="${w}" height="${h}" fill="#fff" stroke="#000" stroke-width="1.5"/>`, tulis([c[0], c[1] + h / 2], label, 'font-size="10"'));
}

function gambarKatrol(k: Katrol, atas: number) {
  const isi: string[] = [];
  const atap = (x1: number, x2: number, y: number) => {
    isi.push(garis([x1, y], [x2, y], 'stroke="#000" stroke-width="1.5"'));
    for (let x = x1 + 4; x < x2; x += 9) isi.push(garis([x, y], [x + 6, y - 6], 'stroke="#000" stroke-width="0.7"'));
  };
  const roda = (c: P, r = 18) => isi.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r}" fill="#fff" stroke="#000" stroke-width="1.5"/>`, `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="2.5" fill="#000"/>`);
  const tali = 'stroke="#000" stroke-width="1.2"';
  let tinggi: number;
  if (k.bentuk === "tetap") {
    const c: P = [LEBAR / 2, atas + 50];
    atap(c[0] - 40, c[0] + 40, atas + 14);
    isi.push(garis([c[0], atas + 14], c, 'stroke="#000" stroke-width="1.5"'));
    roda(c);
    const [ki, ka] = [c[0] - 18, c[0] + 18];
    const y1 = c[1] + 110, y2 = c[1] + 70;
    isi.push(garis([ki, c[1]], [ki, y1], tali));
    beban([ki, y1], k.m1, isi);
    if (k.m2) {
      isi.push(garis([ka, c[1]], [ka, y2], tali));
      beban([ka, y2], k.m2, isi);
    }
    if (k.F) isi.push(garis([ka, c[1]], [ka, y2 + 30], tali), panah([ka, k.m2 ? y2 + 36 : y2 + 30], [ka, (k.m2 ? y2 + 36 : y2 + 30) + 46], k.F));
    tinggi = y1 + 36 + (k.F && !k.m2 ? 50 : 0) + 18;
  } else if (k.bentuk === "bebas") {
    const yAtap = atas + 14;
    atap(LEBAR / 2 - 80, LEBAR / 2 + 10, yAtap);
    const c: P = [LEBAR / 2, atas + 150];
    const [ki, ka] = [c[0] - 18, c[0] + 18];
    isi.push(garis([ki, yAtap], [ki, c[1]], tali), garis([ka, c[1]], [ka, atas + 40], tali));
    roda(c);
    isi.push(panah([ka, atas + 44], [ka, atas + 8], k.F || "F"));
    isi.push(garis(c, [c[0], c[1] + 40], 'stroke="#000" stroke-width="1.5"'));
    beban([c[0], c[1] + 40], k.m1, isi);
    tinggi = c[1] + 40 + 36 + 18;
  } else {
    const yMeja = atas + 80, xUjung = LEBAR - 90;
    isi.push(`<rect x="20" y="${yMeja}" width="${xUjung - 20}" height="12" fill="#eeeeee" stroke="#000" stroke-width="1.5"/>`, garis([40, yMeja + 12], [40, yMeja + 120], 'stroke="#000" stroke-width="1.5"'), garis([xUjung - 20, yMeja + 12], [xUjung - 20, yMeja + 120], 'stroke="#000" stroke-width="1.5"'));
    if (k.meja) isi.push(tulis([110, yMeja + 26], k.meja, 'font-size="10"'));
    // katrol di sudut meja: tali dari tengah sisi kanan balok mendatar menyinggung atas katrol, lalu turun
    const c: P = [xUjung + 10, yMeja];
    isi.push(garis([xUjung, yMeja + 6], c, 'stroke="#000" stroke-width="2"'));
    roda(c);
    const bx = 120;
    beban([bx, yMeja - 36], k.m1, isi, 60, 36);
    isi.push(garis([bx + 30, yMeja - 18], [c[0], yMeja - 18], tali), garis([c[0] + 18, c[1]], [c[0] + 18, yMeja + 70], tali));
    beban([c[0] + 18, yMeja + 70], k.m2, isi);
    if (k.F) isi.push(panah([bx - 30, yMeja - 18], [bx - 90, yMeja - 18], k.F));
    tinggi = yMeja + 70 + 36 + 18;
  }
  return { isi: isi.join(""), tinggi };
}

// ---------- tuas ----------

type Tuas = { jenis: 1 | 2 | 3; W: string; F: string; lb: string; lk: string; nlb: number; nlk: number };

function bacaTuas(isi: string[][]): Tuas | string {
  const b = badan(isi, "tuas");
  if (typeof b === "string") return b;
  const t: Tuas = { jenis: 1, W: "", F: "", lb: "", lk: "", nlb: NaN, nlk: NaN };
  let ada = false;
  for (const x of b) {
    if (x.kk === "jenis") {
      const m = /([123])|pertama|kedua|ketiga/i.exec(x.v);
      const j = m?.[1] ? +m[1] : /pertama/i.test(x.v) ? 1 : /kedua/i.test(x.v) ? 2 : /ketiga/i.test(x.v) ? 3 : 0;
      if (!j) return `Baris ${x.n}: jenis tuas ditulis 1, 2, atau 3.`;
      t.jenis = j as 1 | 2 | 3;
      ada = true;
    } else if (/^(beban|w)$/.test(x.kk)) t.W = x.v;
    else if (/^(kuasa|f)$/.test(x.kk)) t.F = x.v;
    else if (/^(lenganbeban|lb)$/.test(x.kk)) t.lb = x.v;
    else if (/^(lengankuasa|lk)$/.test(x.kk)) t.lk = x.v;
    else return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: jenis, beban, kuasa, lengan beban, lengan kuasa.`;
  }
  if (!ada) return 'Tulis baris "jenis | 1", "2", atau "3".';
  const [W, F, lb0, lk0] = [t.W, t.F, t.lb, t.lk].map(angka);
  if ((lb0 !== undefined && lb0 <= 0) || (lk0 !== undefined && lk0 <= 0)) return "Panjang lengan harus lebih dari 0.";
  // lengan yang ditanyakan dihitung dulu dari keseimbangan, supaya urutan jenis 2/3 tetap bisa diperiksa
  let [lb, lk] = [lb0, lk0];
  if (W !== undefined && F !== undefined && F > 0 && W > 0) {
    if (lb === undefined && lk !== undefined) lb = (F * lk) / W;
    if (lk === undefined && lb !== undefined) lk = (W * lb) / F;
  }
  const hitung = lb0 === undefined || lk0 === undefined ? " (dari beban × lengan beban = kuasa × lengan kuasa)" : "";
  if (t.jenis === 2 && lb !== undefined && lk !== undefined && lk <= lb) return `Tuas jenis 2: beban di tengah, jadi lengan kuasa harus lebih panjang dari lengan beban (lengan kuasa ${fmt(lk)}, lengan beban ${fmt(lb)}${hitung}).`;
  if (t.jenis === 3 && lb !== undefined && lk !== undefined && lb <= lk) return `Tuas jenis 3: kuasa di tengah, jadi lengan beban harus lebih panjang dari lengan kuasa (lengan beban ${fmt(lb)}, lengan kuasa ${fmt(lk)}${hitung}). Pada tuas jenis 3 kuasa selalu lebih besar dari beban.`;
  if ([W, F, lb0, lk0].every((v) => v !== undefined)) {
    const benar = (W! * lb!) / lk!;
    if (Math.abs(benar - F!) > 0.02 * benar) return `Ukuran tidak cocok: kuasa tertulis ${t.F}, padahal beban × lengan beban = kuasa × lengan kuasa, jadi kuasa = ${fmt(benar)}.`;
  }
  t.nlb = lb ?? (t.jenis === 3 ? 2 : 1);
  t.nlk = lk ?? (t.jenis === 2 ? 2 : t.jenis === 3 ? 1 : 2);
  if (t.jenis === 2 && t.nlk <= t.nlb) t.nlk = t.nlb * 2;
  if (t.jenis === 3 && t.nlb <= t.nlk) t.nlb = t.nlk * 2;
  return t;
}

function gambarTuas(t: Tuas, atas: number) {
  const isi: string[] = [];
  // letak (satuan panjang): tumpu, beban, kuasa
  const [tumpu, xb, xk] = t.jenis === 1 ? [0, -t.nlb, t.nlk] : [0, t.nlb, t.nlk];
  const [a, b] = [Math.min(tumpu, xb, xk), Math.max(tumpu, xb, xk)];
  const k = 260 / (b - a);
  const X = (x: number) => 50 + (x - a) * k;
  const y = atas + 80;
  isi.push(`<rect x="${r1(X(a) - 10)}" y="${y - 4}" width="${r1((b - a) * k + 20)}" height="8" fill="#eeeeee" stroke="#000" stroke-width="1.5"/>`);
  isi.push(`<polygon points="${r1(X(tumpu))},${y + 4} ${r1(X(tumpu) - 12)},${y + 26} ${r1(X(tumpu) + 12)},${y + 26}" fill="#d0d0d0" stroke="#000" stroke-width="1.5"/>`);
  isi.push(tulis([X(tumpu), y + 38], "titik tumpu", 'font-size="9"'));
  // beban: kotak di atas papan + panah ke bawah; kuasa: jenis 1 ke bawah, jenis 2 & 3 ke atas
  isi.push(`<rect x="${r1(X(xb) - 16)}" y="${y - 36}" width="32" height="32" fill="#fff" stroke="#000" stroke-width="1.5"/>`);
  isi.push(tulis([X(xb), y - 46], t.W ? `beban ${t.W}` : "beban", 'font-size="10"'));
  const kuasaBawah = t.jenis === 1;
  isi.push(kuasaBawah ? panah([X(xk), y - 60], [X(xk), y - 6], "") : panah([X(xk), y + 6], [X(xk), y - 56], ""));
  isi.push(tulis([X(xk), kuasaBawah ? y - 68 : y - 70], t.F ? `kuasa ${t.F}` : "kuasa", 'font-size="10"'));
  // lengan (garis ukur di bawah)
  const ukur = (x1: number, x2: number, teks: string, yy: number) => {
    const [p, q] = [X(Math.min(x1, x2)), X(Math.max(x1, x2))];
    isi.push(garis([p, yy], [q, yy], 'stroke="#000" stroke-width="0.8"'), garis([p, yy - 4], [p, yy + 4], 'stroke="#000" stroke-width="0.8"'), garis([q, yy - 4], [q, yy + 4], 'stroke="#000" stroke-width="0.8"'));
    isi.push(tulis([(p + q) / 2, yy + 12], teks, 'font-size="10"'));
  };
  ukur(tumpu, xb, t.lb ? `lengan beban ${t.lb}` : "lengan beban", y + 54);
  ukur(tumpu, xk, t.lk ? `lengan kuasa ${t.lk}` : "lengan kuasa", t.jenis === 1 ? y + 54 : y + 82);
  return { isi: isi.join(""), tinggi: (t.jenis === 1 ? y + 54 : y + 82) + 24 };
}

// ---------- pintu ----------

type Hasil = Optik | Gaya | Katrol | Tuas;
export function bacaFisika(isi: string[][], jenis: JenisFisika): Hasil | string {
  return jenis === "optik" ? bacaOptik(isi) : jenis === "gaya" ? bacaGaya(isi) : jenis === "katrol" ? bacaKatrol(isi) : bacaTuas(isi);
}
export function gambarFisika(h: Hasil, jenis: JenisFisika, atas: number): { isi: string; tinggi: number } {
  return jenis === "optik" ? gambarOptik(h as Optik, atas) : jenis === "gaya" ? gambarGaya(h as Gaya, atas) : jenis === "katrol" ? gambarKatrol(h as Katrol, atas) : gambarTuas(h as Tuas, atas);
}
