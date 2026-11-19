/**
 * Skema IPS tahap 5b (0.60.0, ATURAN-SOAL 4.13): lapisan bumi/atmosfer/tanah, gerhana & fase bulan, diagram interaksi
 * pelaku ekonomi dari tabel 2 kolom "| Bagian | Isi |" + penanda "[[SKEMA lapisan|langit|ekonomi: judul]]" (diteruskan
 * skema.ts). Tata letak tetap (tidak sesuai skala, seperti buku paket); "nama | sembunyi" / "label arus | angka"
 * mengganti nama dengan huruf/nomor supaya bisa ditanyakan. SVG hitam-putih, tulisan Latin.
 */
import { ARAB, bersih, esc, garis, LEBAR, normal, r1, tulis } from "./bangun.ts";

export type JenisIps = "lapisan" | "langit" | "ekonomi";
type P = [number, number];
const K = ["Bagian", "Isi"];

export const ATURAN_IPS: Record<JenisIps, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  lapisan: {
    nama: "Lapisan",
    baris: [3, 8],
    petunjuk:
      'Baris "bentuk | bumi" (lapisan dari luar ke dalam), "atmosfer" (dari bawah ke atas), atau "tanah" (horizon dari atas ke bawah). Lalu satu baris per lapisan: "troposfer | 0–12 km" (keterangan boleh "?" atau "-"). Nama lapisan yang ditanyakan boleh ditulis "?". 2–7 lapisan; tebal digambar sama rata (tidak sesuai skala).',
    contoh: [K, ["bentuk", "atmosfer"], ["troposfer", "0–12 km"], ["stratosfer", "12–50 km"], ["mesosfer", "50–80 km"], ["termosfer", "80–700 km"], ["eksosfer", "> 700 km"]],
  },
  langit: {
    nama: "Gerhana & fase bulan",
    baris: [1, 3],
    petunjuk: 'Baris "bentuk | gerhana matahari", "gerhana bulan", atau "fase bulan". "nama | sembunyi" = nama benda diganti huruf A, B, C (gerhana) atau nama fase diganti nomor 1–8 (fase bulan), untuk ditanyakan.',
    contoh: [K, ["bentuk", "gerhana matahari"]],
  },
  ekonomi: {
    nama: "Interaksi pelaku ekonomi",
    baris: [1, 3],
    petunjuk: 'Baris "bentuk | 2 sektor" (rumah tangga konsumen & produsen), "3 sektor" (+ pemerintah), atau "4 sektor" (+ masyarakat luar negeri). "label arus | angka" = nama arus diganti nomor (1), (2), ... untuk ditanyakan. Garis utuh = arus barang/jasa & faktor produksi, garis putus-putus = arus uang.',
    contoh: [K, ["bentuk", "2 sektor"], ["label arus", "kata"]],
  },
};

type Baris = { k: string; kk: string; v: string; n: number };
function badan(isi: string[][], jenis: JenisIps): Baris[] | string {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `${ATURAN_IPS[jenis].nama} memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const [lo, hi] = ATURAN_IPS[jenis].baris;
  if (isi.length - 1 < lo || isi.length - 1 > hi) return `Isi ${lo}–${hi} baris (sekarang ${isi.length - 1}).`;
  const b = isi.slice(1).map((x, n) => ({ k: bersih(x[0] ?? ""), v: bersih(x[1] ?? ""), n: n + 1 })).filter((x) => x.k || x.v);
  for (const x of b) {
    if (ARAB.test(x.k + x.v)) return `Baris ${x.n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    if (!x.k) return `Baris ${x.n} kolom 1 masih kosong.`;
    if (x.k.length > 24 || x.v.length > 24) return `Baris ${x.n} terlalu panjang (maks 24 huruf).`;
  }
  return b.map((x) => ({ ...x, kk: normal(x.k) }));
}
const sembunyi = (v: string) => /sembunyi|huruf|angka|nomor|tidak/i.test(v);

// ---------- lapisan ----------

type Lapisan = { bentuk: "bumi" | "atmosfer" | "tanah"; lapis: { nama: string; ket: string }[] };

function bacaLapisan(isi: string[][]): Lapisan | string {
  const b = badan(isi, "lapisan");
  if (typeof b === "string") return b;
  const l: Lapisan = { bentuk: "bumi", lapis: [] };
  let ada = false;
  for (const x of b) {
    if (x.kk === "bentuk") {
      const t = normal(x.v).replace(/^lapisan/, "");
      if (!["bumi", "atmosfer", "tanah"].includes(t)) return `Baris ${x.n}: bentuk ditulis "bumi", "atmosfer", atau "tanah".`;
      l.bentuk = t as Lapisan["bentuk"];
      ada = true;
    } else l.lapis.push({ nama: x.k, ket: x.v === "-" ? "" : x.v });
  }
  if (!ada) return 'Tulis baris "bentuk | bumi", "atmosfer", atau "tanah".';
  if (l.lapis.length < 2 || l.lapis.length > 7) return `Tulis 2–7 lapisan (sekarang ${l.lapis.length}).`;
  if (l.bentuk === "atmosfer") {
    // ketinggian (angka pertama tiap lapisan) harus naik dari bawah ke atas
    const awal = l.lapis.map((x) => /(\d+(?:[.,]\d+)?)/.exec(x.ket)?.[1]).map((t) => (t ? Number(t.replace(",", ".")) : NaN));
    for (let i = 1; i < awal.length; i++)
      if (!Number.isNaN(awal[i]) && !Number.isNaN(awal[i - 1]) && awal[i] < awal[i - 1]) return `Lapisan atmosfer ditulis dari bawah ke atas: ketinggian "${l.lapis[i].nama}" (${l.lapis[i].ket}) lebih rendah dari "${l.lapis[i - 1].nama}".`;
  }
  return l;
}

const ABU = ["#ffffff", "#e6e6e6", "#cccccc", "#b3b3b3", "#999999", "#808080", "#666666"];

function gambarLapisan(l: Lapisan, atas: number) {
  const isi: string[] = [];
  const n = l.lapis.length;
  if (l.bentuk === "bumi") {
    // setengah lingkaran berlapis, luar ke dalam; keterangan di kanan dengan garis penunjuk
    const R = 120, c: P = [130, atas + 14 + R];
    l.lapis.forEach((x, i) => {
      const r = R * (1 - i / n);
      isi.push(`<path d="M${r1(c[0] - r)},${c[1]} A${r1(r)},${r1(r)} 0 0 1 ${r1(c[0] + r)},${c[1]} Z" fill="${ABU[i]}" stroke="#000" stroke-width="1.2"/>`);
    });
    l.lapis.forEach((x, i) => {
      const rTengah = R * (1 - (i + 0.5) / n);
      const sudut = (Math.PI / 180) * (60 - i * (40 / Math.max(1, n - 1)));
      const p: P = [c[0] + rTengah * Math.cos(sudut), c[1] - rTengah * Math.sin(sudut)];
      const ty = atas + 22 + i * (R / n + 4);
      isi.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2" fill="#000"/>`, garis(p, [262, ty - 4], 'stroke="#000" stroke-width="0.7"'));
      isi.push(`<text x="266" y="${r1(ty)}" font-size="10" font-weight="bold">${esc(x.nama)}</text>`);
      if (x.ket) isi.push(`<text x="266" y="${r1(ty + 11)}" font-size="9">${esc(x.ket)}</text>`);
    });
    isi.push(garis([c[0] - R - 6, c[1]], [c[0] + R + 6, c[1]], 'stroke="#000" stroke-width="1.2"'));
    return { isi: isi.join(""), tinggi: c[1] + 12 };
  }
  // atmosfer: bawah → atas; tanah: atas → bawah. Pita sama tebal.
  const h = 34, x0 = 40, w = 280;
  const urut = l.bentuk === "atmosfer" ? [...l.lapis].reverse() : l.lapis;
  const yAwal = atas + 8;
  urut.forEach((x, k) => {
    const i = l.bentuk === "atmosfer" ? n - 1 - k : k; // indeks asli (warna makin gelap ke bawah)
    const y = yAwal + k * h;
    const warna = l.bentuk === "atmosfer" ? ABU[Math.min(6, i)] : ABU[Math.min(6, k + 1)];
    isi.push(`<rect x="${x0}" y="${y}" width="${w}" height="${h}" fill="${l.bentuk === "atmosfer" ? ABU[Math.max(0, 6 - i - 3)] : warna}" stroke="#000" stroke-width="1"/>`);
    isi.push(`<text x="${x0 + 10}" y="${y + h / 2 + 4}" font-size="11" font-weight="bold">${esc(x.nama)}</text>`);
    if (x.ket) isi.push(`<text x="${x0 + w - 10}" y="${y + h / 2 + 4}" text-anchor="end" font-size="10">${esc(x.ket)}</text>`);
  });
  const yAkhir = yAwal + n * h;
  if (l.bentuk === "atmosfer") {
    // permukaan bumi di bawah
    isi.push(garis([x0 - 10, yAkhir], [x0 + w + 10, yAkhir], 'stroke="#000" stroke-width="2"'));
    for (let x = x0 - 6; x < x0 + w + 10; x += 10) isi.push(garis([x, yAkhir], [x - 6, yAkhir + 6], 'stroke="#000" stroke-width="0.7"'));
    isi.push(tulis([x0 + w / 2, yAkhir + 18], "permukaan bumi", 'font-size="9"'));
    return { isi: isi.join(""), tinggi: yAkhir + 28 };
  }
  // tanah: rumput di atas
  for (let x = x0 + 6; x < x0 + w; x += 14) isi.push(`<polyline points="${x - 4},${yAwal} ${x},${yAwal - 8} ${x + 4},${yAwal}" fill="none" stroke="#000" stroke-width="0.8"/>`);
  return { isi: isi.join(""), tinggi: yAkhir + 10 };
}

// ---------- gerhana & fase bulan ----------

type Langit = { bentuk: "gerhana matahari" | "gerhana bulan" | "fase bulan"; sembunyi: boolean };

function bacaLangit(isi: string[][]): Langit | string {
  const b = badan(isi, "langit");
  if (typeof b === "string") return b;
  const g: Langit = { bentuk: "gerhana matahari", sembunyi: false };
  let ada = false;
  for (const x of b) {
    if (x.kk === "bentuk") {
      const t = ["gerhana matahari", "gerhana bulan", "fase bulan"].find((y) => normal(y) === normal(x.v));
      if (!t) return `Baris ${x.n}: bentuk ditulis "gerhana matahari", "gerhana bulan", atau "fase bulan".`;
      g.bentuk = t as Langit["bentuk"];
      ada = true;
    } else if (x.kk === "nama" || x.kk === "namafase" || x.kk === "namabenda") g.sembunyi = sembunyi(x.v);
    else return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: bentuk, nama.`;
  }
  if (!ada) return 'Tulis baris "bentuk | gerhana matahari", "gerhana bulan", atau "fase bulan".';
  return g;
}

const FASE = ["bulan baru", "sabit awal", "kuartal pertama", "cembung awal", "purnama", "cembung akhir", "kuartal akhir", "sabit akhir"];

/** Wujud bulan dilihat dari bumi untuk sudut fase θ (0 = bulan baru, 180 = purnama); bagian terang menghadap kanan saat bertambah. */
function bulanTampak(c: P, r: number, teta: number) {
  const gelap = `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r}" fill="#404040" stroke="#000" stroke-width="0.8"/>`;
  const t = ((teta % 360) + 360) % 360;
  if (t === 0) return gelap;
  if (t === 180) return `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r}" fill="#fff" stroke="#000" stroke-width="0.8"/>`;
  const kanan = t < 180;
  const phi = kanan ? t : 360 - t;
  const rx = Math.abs(r * Math.cos((phi * Math.PI) / 180));
  const sapu1 = kanan ? 1 : 0;
  const sabit = phi < 90;
  const sapu2 = sabit ? 1 - sapu1 : sapu1;
  const [atasP, bawahP] = [`${r1(c[0])},${r1(c[1] - r)}`, `${r1(c[0])},${r1(c[1] + r)}`];
  return gelap + `<path d="M${atasP} A${r},${r} 0 0 ${sapu1} ${bawahP} A${r1(rx)},${r} 0 0 ${sapu2} ${atasP} Z" fill="#fff" stroke="none"/>`;
}

function gambarLangit(g: Langit, atas: number) {
  const isi: string[] = [];
  const nama = (t: string, huruf: string) => (g.sembunyi ? huruf : t);
  if (g.bentuk === "fase bulan") {
    const c: P = [LEBAR / 2 - 14, atas + 150], orbit = 78, luar = 128;
    isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${orbit}" fill="none" stroke="#000" stroke-width="0.8" stroke-dasharray="4 3"/>`);
    // bumi: sisi kanan terang
    isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="17" fill="#404040" stroke="#000"/>`, `<path d="M${c[0]},${c[1] - 17} A17,17 0 0 1 ${c[0]},${c[1] + 17} Z" fill="#fff" stroke="#000"/>`);
    isi.push(tulis([c[0], c[1] + 30], "Bumi", 'font-size="9"'));
    // sinar matahari dari kanan
    for (const dy of [-100, -78, 78, 100]) { // tidak di tengah: di sana ada tulisan "bulan baru"
      const y = c[1] + dy;
      isi.push(garis([LEBAR - 6, y], [LEBAR - 30, y], 'stroke="#000" stroke-width="1"'), `<polygon points="${LEBAR - 34},${y} ${LEBAR - 28},${y - 3.5} ${LEBAR - 28},${y + 3.5}" fill="#000"/>`);
    }
    isi.push(`<text x="${LEBAR - 6}" y="${c[1] - 108}" text-anchor="end" font-size="9">sinar matahari</text>`);
    FASE.forEach((f, k) => {
      const a = (k * 45 * Math.PI) / 180; // bulan baru di kanan (arah matahari), bergerak berlawanan jarum jam
      const p: P = [c[0] + orbit * Math.cos(a), c[1] - orbit * Math.sin(a)];
      // bulan di orbit: setengah kanan (menghadap matahari) terang
      isi.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="10" fill="#404040" stroke="#000" stroke-width="0.8"/>`, `<path d="M${r1(p[0])},${r1(p[1] - 10)} A10,10 0 0 1 ${r1(p[0])},${r1(p[1] + 10)} Z" fill="#fff"/>`);
      const q: P = [c[0] + luar * Math.cos(a), c[1] - luar * Math.sin(a)];
      isi.push(bulanTampak(q, 11, k * 45));
      const lbl = nama(f, String(k + 1));
      // label di atas ikon (bulan di atas Bumi) atau di bawahnya (lainnya, termasuk kiri/kanan supaya tidak terpotong tepi)
      const ly = q[1] + (Math.sin(a) > 0.3 ? -16 : 24);
      isi.push(tulis([q[0], ly - 4], lbl, 'font-size="9"'));
    });
    return { isi: isi.join(""), tinggi: c[1] + luar + 32 };
  }
  // gerhana: Matahari kiri, lalu benda penghalang, lalu benda yang terkena bayangan
  const cy = atas + 80;
  const S: P = [44, cy], Rs = 38;
  const mataharibulan = g.bentuk === "gerhana matahari";
  const [Mx, rM] = mataharibulan ? [205, 0] : [195, 24]; // penghalang
  const [Tx, rT] = mataharibulan ? [318, 26] : [318, 10]; // yang terkena bayangan
  // gerhana matahari: jari-jari bulan dipilih supaya ujung umbra tepat menyentuh permukaan bumi
  const r = mataharibulan ? (Rs * (Tx - rT + 4 - Mx)) / (Tx - rT + 4 - S[0]) : rM;
  const ujung = (a: P, b: P, x: number): P => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
  const xAkhir = Tx + rT + 10;
  // penumbra: garis silang (atas matahari → bawah penghalang, bawah matahari → atas penghalang)
  const pA = ujung([S[0], cy - Rs], [Mx, cy + r], xAkhir), pB = ujung([S[0], cy + Rs], [Mx, cy - r], xAkhir);
  isi.push(`<polygon points="${Mx},${r1(cy - r)} ${Mx},${r1(cy + r)} ${r1(pA[0])},${r1(pA[1])} ${r1(pB[0])},${r1(pB[1])}" fill="#d9d9d9" stroke="none"/>`);
  // umbra: garis lurus (atas–atas, bawah–bawah) menyempit
  const tipX = Mx + ((Mx - S[0]) * r) / (Rs - r);
  const uA = tipX <= xAkhir ? ([tipX, cy] as P) : ujung([S[0], cy - Rs], [Mx, cy - r], xAkhir);
  const uB = tipX <= xAkhir ? ([tipX, cy] as P) : ujung([S[0], cy + Rs], [Mx, cy + r], xAkhir);
  isi.push(`<polygon points="${Mx},${r1(cy - r)} ${r1(uA[0])},${r1(uA[1])} ${r1(uB[0])},${r1(uB[1])} ${Mx},${r1(cy + r)}" fill="#7f7f7f" stroke="none"/>`);
  for (const [a, b] of [[[S[0], cy - Rs], [pA[0], pA[1]]], [[S[0], cy + Rs], [pB[0], pB[1]]], [[S[0], cy - Rs], uA], [[S[0], cy + Rs], uB]] as [P, P][])
    isi.push(garis(a, b, 'stroke="#000" stroke-width="0.6"'));
  // benda langit
  isi.push(`<circle cx="${S[0]}" cy="${cy}" r="${Rs}" fill="#fff" stroke="#000" stroke-width="1.5"/>`);
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    isi.push(garis([S[0] + (Rs + 3) * Math.cos(a), cy + (Rs + 3) * Math.sin(a)], [S[0] + (Rs + 9) * Math.cos(a), cy + (Rs + 9) * Math.sin(a)], 'stroke="#000" stroke-width="1"'));
  }
  isi.push(`<circle cx="${Mx}" cy="${cy}" r="${r1(r)}" fill="${mataharibulan ? "#404040" : "#fff"}" stroke="#000" stroke-width="1.2"/>`);
  isi.push(`<circle cx="${Tx}" cy="${cy}" r="${rT}" fill="${mataharibulan ? "#fff" : "#404040"}" stroke="#000" stroke-width="1.2"/>`);
  const [nPeng, nKena] = mataharibulan ? ["Bulan", "Bumi"] : ["Bumi", "Bulan"];
  isi.push(tulis([S[0], cy + Rs + 24], nama("Matahari", "A"), 'font-size="10" font-weight="bold"'));
  isi.push(tulis([Mx, cy + Math.max(r, 24) + 40], nama(nPeng, "B"), 'font-size="10" font-weight="bold"'));
  isi.push(tulis([Tx, cy + rT + 40], nama(nKena, "C"), 'font-size="10" font-weight="bold"'));
  // keterangan umbra & penumbra (garis penunjuk)
  const um: P = [(Mx + Math.min(tipX, xAkhir)) / 2 + 6, cy];
  isi.push(garis(um, [um[0] + 4, atas + 14], 'stroke="#000" stroke-width="0.6"'), tulis([um[0] + 4, atas + 8], "umbra", 'font-size="9"'));
  const pe: P = [Tx - rT - 14, pA[1] - (pA[1] - cy) * 0.35 - 6];
  isi.push(garis(pe, [pe[0] - 24, cy + 66], 'stroke="#000" stroke-width="0.6"'), tulis([pe[0] - 24, cy + 76], "penumbra", 'font-size="9"'));
  return { isi: isi.join(""), tinggi: cy + 86 };
}

// ---------- interaksi pelaku ekonomi ----------

type Ekonomi = { sektor: 2 | 3 | 4; angka: boolean };

function bacaEkonomi(isi: string[][]): Ekonomi | string {
  const b = badan(isi, "ekonomi");
  if (typeof b === "string") return b;
  const e: Ekonomi = { sektor: 2, angka: false };
  let ada = false;
  for (const x of b) {
    if (x.kk === "bentuk") {
      const m = /([234])\s*sektor/i.exec(x.v);
      if (!m) return `Baris ${x.n}: bentuk ditulis "2 sektor", "3 sektor", atau "4 sektor".`;
      e.sektor = +m[1] as 2 | 3 | 4;
      ada = true;
    } else if (x.kk === "labelarus" || x.kk === "label") {
      // "angka", "nomor", "1-8" (AI sering menulis rentang nomor) = pakai nomor; "kata"/"nama" = tulisan
      if (/angka|nomor|\d/i.test(x.v)) e.angka = true;
      else if (/kata|nama|tulisan/i.test(x.v)) e.angka = false;
      else return `Baris ${x.n}: label arus ditulis "angka" atau "kata".`;
    }
    else return `Baris ${x.n}: bagian "${x.k}" tidak dikenal. Pilih: bentuk, label arus.`;
  }
  if (!ada) return 'Tulis baris "bentuk | 2 sektor", "3 sektor", atau "4 sektor".';
  return e;
}

function gambarEkonomi(e: Ekonomi, atas: number) {
  const isi: string[] = [];
  const lebar = e.sektor === 4 ? 486 : LEBAR;
  const yT = atas + 26, yM = atas + 132, yB = atas + 238;
  const kotak = (cx: number, cy: number, w: number, h: number, t: string[]) => {
    isi.push(`<rect x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="#000" stroke-width="1.4"/>`);
    t.forEach((s, i) => isi.push(tulis([cx, cy - (t.length - 1) * 5.5 + i * 11], s, 'font-size="9.5" font-weight="bold"')));
  };
  let nomor = 0;
  /** Panah siku-siku lewat titik-titik; label di ruas terpanjang yang mendatar (di atas/bawah garis). */
  const arus = (titik: P[], label: string, uang: boolean, bawah = false) => {
    const opsi = `stroke="#000" stroke-width="1.2" fill="none"${uang ? ' stroke-dasharray="5 3"' : ""}`;
    const [a, b] = [titik[titik.length - 2], titik[titik.length - 1]];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [ux, uy] = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    const ujung: P = [b[0] - ux * 7, b[1] - uy * 7];
    isi.push(`<polyline points="${[...titik.slice(0, -1), ujung].map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" ${opsi}/>`);
    isi.push(`<polygon points="${r1(b[0])},${r1(b[1])} ${r1(ujung[0] - uy * 3.5)},${r1(ujung[1] + ux * 3.5)} ${r1(ujung[0] + uy * 3.5)},${r1(ujung[1] - ux * 3.5)}" fill="#000"/>`);
    let terpanjang = 0, m: P = titik[0];
    for (let i = 1; i < titik.length; i++) {
      const [p, q] = [titik[i - 1], titik[i]];
      if (Math.abs(p[1] - q[1]) < 0.5 && Math.abs(q[0] - p[0]) > terpanjang) {
        terpanjang = Math.abs(q[0] - p[0]);
        m = [(p[0] + q[0]) / 2, p[1]];
      }
    }
    nomor++;
    const teks = e.angka ? `(${nomor})` : label;
    isi.push(tulis([m[0], m[1] + (bawah ? 11 : -5)], teks, 'font-size="8.5"'));
  };
  const [kx, px] = [52, 308]; // tengah RTK & RTP
  const [ow, oh] = [120, 34];
  kotak(kx, yM, 88, 40, ["Rumah Tangga", "Konsumen"]);
  kotak(px, yM, 88, 40, ["Rumah Tangga", "Produsen"]);
  kotak(180, yT, ow, oh, ["Pasar Barang", "dan Jasa"]);
  kotak(180, yB, ow, oh, ["Pasar Faktor", "Produksi"]);
  const [kTop, kBot, pTop, pBot] = [yM - 20, yM + 20, yM - 20, yM + 20];
  const [oL, oR, iL, iR] = [180 - ow / 2, 180 + ow / 2, 180 - ow / 2, 180 + ow / 2];
  // arus barang/jasa & faktor produksi (utuh, lingkar luar)
  arus([[px + 20, pTop], [px + 20, yT - 8], [oR, yT - 8]], "barang & jasa", false);
  arus([[oL, yT - 8], [kx - 20, yT - 8], [kx - 20, kTop]], "barang & jasa", false);
  arus([[kx - 20, kBot], [kx - 20, yB + 8], [iL, yB + 8]], "faktor produksi", false, true);
  arus([[iR, yB + 8], [px + 20, yB + 8], [px + 20, pBot]], "faktor produksi", false, true);
  // arus uang (putus-putus, lingkar dalam, arah berlawanan)
  arus([[kx + 20, kTop], [kx + 20, yT + 8], [oL, yT + 8]], "pengeluaran", true, true);
  arus([[oR, yT + 8], [px - 20, yT + 8], [px - 20, pTop]], "penerimaan", true, true);
  arus([[px - 20, pBot], [px - 20, yB - 8], [iR, yB - 8]], "balas jasa", true);
  arus([[iL, yB - 8], [kx + 20, yB - 8], [kx + 20, kBot]], "pendapatan", true);
  if (e.sektor >= 3) {
    kotak(180, yM, 76, 30, ["Pemerintah"]);
    arus([[kx + 44, yM - 6], [180 - 38, yM - 6]], "pajak", true);
    arus([[180 - 38, yM + 6], [kx + 44, yM + 6]], "gaji, subsidi", true, true);
    arus([[px - 44, yM - 6], [180 + 38, yM - 6]], "pajak", true);
    arus([[180 + 38, yM + 6], [px - 44, yM + 6]], "subsidi", true, true);
  }
  if (e.sektor === 4) {
    kotak(436, yM, 84, 40, ["Masyarakat", "Luar Negeri"]);
    arus([[px + 44, yM - 8], [436 - 42, yM - 8]], "ekspor", false);
    arus([[436 - 42, yM + 8], [px + 44, yM + 8]], "impor", false, true);
  }
  // keterangan garis
  const yK = yB + 40;
  isi.push(garis([lebar / 2 - 120, yK], [lebar / 2 - 96, yK], 'stroke="#000" stroke-width="1.2"'), `<text x="${lebar / 2 - 92}" y="${yK + 3}" font-size="8.5">barang/jasa</text>`);
  isi.push(garis([lebar / 2 + 4, yK], [lebar / 2 + 28, yK], 'stroke="#000" stroke-width="1.2" stroke-dasharray="5 3"'), `<text x="${lebar / 2 + 32}" y="${yK + 3}" font-size="8.5">uang</text>`);
  return { isi: isi.join(""), tinggi: yK + 12, lebar };
}

// ---------- pintu ----------

type Hasil = Lapisan | Langit | Ekonomi;
export function bacaIps(isi: string[][], jenis: JenisIps): Hasil | string {
  return jenis === "lapisan" ? bacaLapisan(isi) : jenis === "langit" ? bacaLangit(isi) : bacaEkonomi(isi);
}
export function gambarIps(h: Hasil, jenis: JenisIps, atas: number): { isi: string; tinggi: number; lebar?: number } {
  return jenis === "lapisan" ? gambarLapisan(h as Lapisan, atas) : jenis === "langit" ? gambarLangit(h as Langit, atas) : gambarEkonomi(h as Ekonomi, atas);
}
