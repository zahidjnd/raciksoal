/**
 * Bagan (0.53.0, ATURAN-SOAL 4.10): garis waktu, alur, siklus, pohon dari tabel teks + penanda "[[BAGAN jenis: judul]]"
 * (penanda dibaca grafik.ts). SVG hitam-putih yang sama untuk web & Word (Word: gambar SVG, lihat word.ts).
 * Lebar dasar 360 (bukan 480 seperti grafik) supaya huruf ±8 pt saat dimuat satu kolom lembar soal Word.
 * Tanpa huruf Arab (aturan 5: isi bagan tidak dicocokkan dengan data mushaf/hadis).
 */
export type JenisBagan = "waktu" | "alur" | "siklus" | "pohon";

export const ATURAN_BAGAN: Record<JenisBagan, { nama: string; kolom: number; baris: [number, number]; maksHuruf: number; petunjuk: string; contoh: string[][] }> = {
  waktu: {
    nama: "Garis waktu",
    kolom: 2,
    baris: [2, 10],
    maksHuruf: 120,
    petunjuk: "Kolom pertama = waktu (tahun), kolom kedua = peristiwa, urut dari yang paling awal.",
    contoh: [["Tahun", "Peristiwa"], ["622 M", "Hijrah ke Madinah"], ["624 M", "Perang Badar"], ["630 M", "Fathu Makkah"], ["632 M", "Haji Wada'"]],
  },
  alur: {
    nama: "Diagram alir",
    kolom: 1,
    baris: [2, 8],
    maksHuruf: 80,
    petunjuk: "Satu kolom: tulis langkah berurutan dari atas ke bawah (juga rantai sanad: nama perawi saja).",
    contoh: [["Langkah"], ["Niat"], ["Membasuh muka"], ["Membasuh kedua tangan sampai siku"], ["Mengusap sebagian kepala"], ["Membasuh kedua kaki sampai mata kaki"]],
  },
  siklus: {
    nama: "Siklus",
    kolom: 1,
    baris: [3, 8],
    maksHuruf: 50,
    petunjuk: "Satu kolom: tulis tahap berurutan; tahap terakhir kembali ke tahap pertama.",
    contoh: [["Tahap"], ["Penguapan"], ["Pengembunan"], ["Hujan"], ["Peresapan"]],
  },
  pohon: {
    nama: "Bagan pohon",
    kolom: 2,
    baris: [2, 15],
    maksHuruf: 40,
    petunjuk: "Kolom pertama = nama kotak, kolom kedua = induknya (harus sama persis dengan nama kotak lain). Induk kotak puncak dikosongkan.",
    contoh: [["Bagian", "Induk"], ["Kalimat", ""], ["Isim", "Kalimat"], ["Fi'il", "Kalimat"], ["Huruf", "Kalimat"]],
  },
};

const ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const bersih = (s: string) => String(s ?? "").replace(/[\t$]/g, "").trim();
const MAKS_TINGKAT = 4;
const MAKS_UJUNG = 8;

/** Pohon: anak tiap kotak (urutan tabel), puncak, kedalaman; atau alasan bila tidak sah. */
function susunPohon(badan: string[][]): { anak: Map<string, string[]>; puncak: string; dalam: Map<string, number> } | string {
  const nama = badan.map((b) => bersih(b[0]));
  const ada = new Set<string>();
  for (const [i, n] of nama.entries()) {
    if (ada.has(n)) return `Nama "${n}" dipakai dua kali (baris ${i + 1}); tiap kotak harus bernama beda.`;
    ada.add(n);
  }
  const anak = new Map<string, string[]>(nama.map((n) => [n, []]));
  const puncak: string[] = [];
  for (const [i, b] of badan.entries()) {
    const induk = bersih(b[1]);
    if (!induk) puncak.push(nama[i]);
    else if (!ada.has(induk)) return `Induk "${induk}" di baris ${i + 1} tidak ada di kolom pertama.`;
    else if (induk === nama[i]) return `Baris ${i + 1}: kotak tidak boleh menjadi induk dirinya sendiri.`;
    else anak.get(induk)!.push(nama[i]);
  }
  if (puncak.length !== 1) return `Harus tepat satu kotak puncak (induknya kosong); sekarang ${puncak.length}.`;
  const dalam = new Map<string, number>();
  const jalan = (n: string, d: number) => {
    dalam.set(n, d);
    for (const a of anak.get(n)!) if (!dalam.has(a)) jalan(a, d + 1);
  };
  jalan(puncak[0], 0);
  if (dalam.size !== nama.length) return "Ada kotak yang induknya berputar (A induk B, B induk A); periksa kolom induk.";
  if (Math.max(...dalam.values()) >= MAKS_TINGKAT) return `Paling banyak ${MAKS_TINGKAT} tingkat.`;
  if ([...anak.values()].filter((x) => !x.length).length > MAKS_UJUNG) return `Paling banyak ${MAKS_UJUNG} kotak di ujung paling bawah.`;
  return { anak, puncak: puncak[0], dalam };
}

/** Kenapa tabel ini tidak bisa digambar sebagai bagan (kalimat untuk guru, menyebut letak sel), atau null. */
export function alasanBagan(isi: string[][], jenis: JenisBagan): string | null {
  const a = ATURAN_BAGAN[jenis];
  const [judul, ...badan] = isi;
  const kolom = judul?.length ?? 0;
  if (kolom !== a.kolom) return `${a.nama} memakai tepat ${a.kolom} kolom (sekarang ${kolom}).`;
  if (badan.length < a.baris[0] || badan.length > a.baris[1]) return `Isi ${a.baris[0]}–${a.baris[1]} baris (sekarang ${badan.length}).`;
  for (const [i, b] of badan.entries())
    for (let j = 0; j < kolom; j++) {
      const t = bersih(b[j]);
      if (ARAB.test(t)) return `Baris ${i + 1} kolom ${j + 1} berisi huruf Arab; bagan hanya memakai huruf Latin.`;
      if (!t && !(jenis === "pohon" && j === 1)) return `Baris ${i + 1} kolom ${j + 1} masih kosong.`;
      const maks = jenis === "waktu" && j === 0 ? 20 : a.maksHuruf;
      if (t.length > maks) return `Baris ${i + 1} kolom ${j + 1} terlalu panjang (maks ${maks} huruf).`;
    }
  if (jenis === "pohon") {
    const p = susunPohon(badan);
    if (typeof p === "string") return p;
  }
  return null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r = (n: number) => Math.round(n * 10) / 10;
const HURUF = 12;
const BARIS = 15;

/** Pecah teks menjadi baris ≤ `maks` huruf (kata kepanjangan dipotong). */
export function bungkus(t: string, maks: number): string[] {
  const hasil: string[] = [];
  let kini = "";
  for (let kata of bersih(t).split(/\s+/)) {
    while (kata.length > maks) {
      if (kini) hasil.push(kini), (kini = "");
      hasil.push(kata.slice(0, maks));
      kata = kata.slice(maks);
    }
    if (!kini) kini = kata;
    else if (kini.length + 1 + kata.length <= maks) kini += ` ${kata}`;
    else hasil.push(kini), (kini = kata);
  }
  if (kini) hasil.push(kini);
  return hasil.length ? hasil : [""];
}
const muat = (lebar: number) => Math.max(4, Math.floor((lebar - 10) / (HURUF * 0.56)));

/** Teks berbaris di tengah (x) mulai dari tengah tegak (y). */
function teksTengah(baris: string[], x: number, y: number, tebal = false) {
  const awal = y - ((baris.length - 1) * BARIS) / 2 + 4;
  return baris.map((t, i) => `<text x="${r(x)}" y="${r(awal + i * BARIS)}" text-anchor="middle"${tebal ? ' font-weight="bold"' : ""}>${esc(t)}</text>`).join("");
}
const kotak = (x: number, y: number, w: number, h: number) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="4" fill="#fff" stroke="#000" stroke-width="1.2"/>`;

/** Garis berpanah dari (x1,y1) ke (x2,y2). */
function panah(x1: number, y1: number, x2: number, y2: number) {
  const s = Math.atan2(y2 - y1, x2 - x1);
  const ujung = (d: number) => `${r(x2 - 8 * Math.cos(s + d))},${r(y2 - 8 * Math.sin(s + d))}`;
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="#000" stroke-width="1.2"/><polygon points="${r(x2)},${r(y2)} ${ujung(0.45)} ${ujung(-0.45)}" fill="#000"/>`;
}

type Badan = { isi: string; lebar: number; tinggi: number };

/** Garis waktu tegak: titik di garis, waktu tebal di kiri, peristiwa di kanan. */
function garisWaktu(badan: string[][], atas: number): Badan {
  const L = 360, x = 92;
  const isi: string[] = [];
  let y = atas + 6;
  const titik: number[] = [];
  for (const b of badan) {
    const baris = bungkus(b[1], muat(L - x - 16));
    titik.push(y + 6);
    isi.push(`<circle cx="${x}" cy="${r(y + 6)}" r="5" fill="#000"/>`);
    isi.push(`<text x="${x - 12}" y="${r(y + 10)}" text-anchor="end" font-weight="bold">${esc(bersih(b[0]))}</text>`);
    baris.forEach((t, k) => isi.push(`<text x="${x + 14}" y="${r(y + 10 + k * BARIS)}">${esc(t)}</text>`));
    y += baris.length * BARIS + 14;
  }
  isi.unshift(`<line x1="${x}" y1="${r(titik[0])}" x2="${x}" y2="${r(titik.at(-1)!)}" stroke="#000" stroke-width="2"/>`);
  return { isi: isi.join(""), lebar: L, tinggi: y };
}

/** Diagram alir: kotak berurutan dari atas ke bawah, berpanah. */
function alur(badan: string[][], atas: number): Badan {
  const L = 360, w = 260, x = (L - w) / 2;
  const isi: string[] = [];
  let y = atas + 4;
  badan.forEach((b, i) => {
    const baris = bungkus(b[0], muat(w));
    const h = baris.length * BARIS + 12;
    if (i) isi.push(panah(L / 2, y - 22, L / 2, y));
    isi.push(kotak(x, y, w, h), teksTengah(baris, L / 2, y + h / 2));
    y += h + 22;
  });
  return { isi: isi.join(""), lebar: L, tinggi: y - 22 + 8 };
}

/** Titik di tepi kotak (pusat cx,cy, setengah lebar/tinggi) ke arah (dx,dy). */
function tepi(cx: number, cy: number, hw: number, hh: number, dx: number, dy: number, jarak = 4) {
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  const d = Math.hypot(dx, dy) || 1;
  return [cx + dx * t + (dx / d) * jarak, cy + dy * t + (dy / d) * jarak];
}

/**
 * Siklus: kotak melingkar (lonjong) searah jarum jam mulai dari atas, panah ke tahap berikutnya (terakhir → pertama).
 * Lebar lingkaran dibatasi 360; tingginya ditambah sampai tidak ada kotak yang bertumpuk (8 tahap = lonjong tegak).
 */
function siklus(badan: string[][], atas: number): Badan {
  const n = badan.length;
  const L = 360, w = n >= 7 ? 92 : 110;
  const rx = Math.min(n <= 4 ? 100 : 130, L / 2 - w / 2 - 4);
  const baris = badan.map((b) => bungkus(b[0], muat(w)));
  const h = Math.max(...baris.map((x) => x.length)) * BARIS + 12;
  const sudut = baris.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n);
  const tumpuk = (ry: number) =>
    sudut.some((a, i) => sudut.some((b, j) => j > i && Math.abs(rx * (Math.cos(a) - Math.cos(b))) < w + 10 && Math.abs(ry * (Math.sin(a) - Math.sin(b))) < h + 14));
  let ry = rx;
  while (tumpuk(ry) && ry < 320) ry += 4;
  const cx = L / 2, cy = atas + h / 2 + ry + 4;
  const pusat = sudut.map((s) => [cx + rx * Math.cos(s), cy + ry * Math.sin(s)]);
  const isi: string[] = [];
  pusat.forEach(([x1, y1], i) => {
    const [x2, y2] = pusat[(i + 1) % n];
    const [ax, ay] = tepi(x1, y1, w / 2, h / 2, x2 - x1, y2 - y1);
    const [bx, by] = tepi(x2, y2, w / 2, h / 2, x1 - x2, y1 - y2);
    isi.push(panah(ax, ay, bx, by));
  });
  pusat.forEach(([x, y], i) => isi.push(kotak(x - w / 2, y - h / 2, w, h), teksTengah(baris[i], x, y)));
  return { isi: isi.join(""), lebar: L, tinggi: cy + ry + h / 2 + 8 };
}

/**
 * Pohon: ujung bawah ≤ 4 → tegak (puncak di atas); lebih dari itu → mendatar (puncak di kiri, ujung berderet ke bawah)
 * supaya tetap muat satu kolom lembar soal. Induk di tengah anak-anaknya, garis siku.
 */
function pohon(badan: string[][], atas: number): Badan {
  const p = susunPohon(badan) as Exclude<ReturnType<typeof susunPohon>, string>;
  const ujung: string[] = [];
  const urut = (n: string) => {
    const a = p.anak.get(n)!;
    if (a.length) a.forEach(urut);
    else ujung.push(n);
  };
  urut(p.puncak);
  const D = Math.max(...p.dalam.values()) + 1;
  const tegak = ujung.length <= 4;
  const L = 360;
  const isi: string[] = [];
  const letak = new Map<string, number>(); // posisi sepanjang deret ujung
  const pasang = (n: string): number => {
    const xs = p.anak.get(n)!.map(pasang);
    const v = xs.length ? (xs[0] + xs.at(-1)!) / 2 : ujung.indexOf(n);
    letak.set(n, v);
    return v;
  };
  pasang(p.puncak);
  if (tegak) {
    const slot = L / ujung.length, w = Math.min(120, slot - 10);
    const baris = new Map([...p.dalam.keys()].map((n) => [n, bungkus(n, muat(w))]));
    const h = Math.max(...[...baris.values()].map((x) => x.length)) * BARIS + 12;
    const X = (n: string) => slot * (letak.get(n)! + 0.5);
    const Y = (n: string) => atas + 4 + p.dalam.get(n)! * (h + 36);
    for (const [n, a] of p.anak) {
      if (!a.length) continue;
      const tengah = Y(n) + h + 18;
      isi.push(`<polyline points="${r(X(n))},${r(Y(n) + h)} ${r(X(n))},${r(tengah)}" fill="none" stroke="#000" stroke-width="1.2"/>`);
      isi.push(`<line x1="${r(Math.min(...a.map(X)))}" y1="${r(tengah)}" x2="${r(Math.max(...a.map(X)))}" y2="${r(tengah)}" stroke="#000" stroke-width="1.2"/>`);
      a.forEach((c) => isi.push(`<line x1="${r(X(c))}" y1="${r(tengah)}" x2="${r(X(c))}" y2="${r(Y(c))}" stroke="#000" stroke-width="1.2"/>`));
    }
    for (const n of p.dalam.keys()) isi.push(kotak(X(n) - w / 2, Y(n), w, h), teksTengah(baris.get(n)!, X(n), Y(n) + h / 2, n === p.puncak));
    return { isi: isi.join(""), lebar: L, tinggi: atas + 4 + D * (h + 36) - 36 + 8 };
  }
  const jeda = 22, w = (L - 8 - (D - 1) * jeda) / D;
  const baris = new Map([...p.dalam.keys()].map((n) => [n, bungkus(n, muat(w))]));
  const h = Math.max(...[...baris.values()].map((x) => x.length)) * BARIS + 10;
  const X = (n: string) => 4 + p.dalam.get(n)! * (w + jeda);
  const Y = (n: string) => atas + 4 + letak.get(n)! * (h + 8);
  for (const [n, a] of p.anak) {
    if (!a.length) continue;
    const tengah = X(n) + w + jeda / 2;
    isi.push(`<line x1="${r(X(n) + w)}" y1="${r(Y(n) + h / 2)}" x2="${r(tengah)}" y2="${r(Y(n) + h / 2)}" stroke="#000" stroke-width="1.2"/>`);
    isi.push(`<line x1="${r(tengah)}" y1="${r(Math.min(...a.map(Y)) + h / 2)}" x2="${r(tengah)}" y2="${r(Math.max(...a.map(Y)) + h / 2)}" stroke="#000" stroke-width="1.2"/>`);
    a.forEach((c) => isi.push(`<line x1="${r(tengah)}" y1="${r(Y(c) + h / 2)}" x2="${r(X(c))}" y2="${r(Y(c) + h / 2)}" stroke="#000" stroke-width="1.2"/>`));
  }
  for (const n of p.dalam.keys()) isi.push(kotak(X(n), Y(n), w, h), teksTengah(baris.get(n)!, X(n) + w / 2, Y(n) + h / 2, n === p.puncak));
  return { isi: isi.join(""), lebar: L, tinggi: atas + 4 + ujung.length * (h + 8) + 4 };
}

/** Tabel + jenis + judul → SVG bagan utuh (latar putih), atau null bila tidak bisa digambar. */
export function svgBagan(isi: string[][], jenis: JenisBagan, judul: string): string | null {
  if (alasanBagan(isi, jenis)) return null;
  const badanTabel = isi.slice(1);
  const atas = judul ? 30 : 8;
  const b = jenis === "waktu" ? garisWaktu(badanTabel, atas) : jenis === "alur" ? alur(badanTabel, atas) : jenis === "siklus" ? siklus(badanTabel, atas) : pohon(badanTabel, atas);
  const kepala = judul ? `<text x="${b.lebar / 2}" y="18" text-anchor="middle" font-size="13" font-weight="bold">${esc(judul)}</text>` : "";
  const t = Math.ceil(b.tinggi);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${b.lebar}" height="${t}" viewBox="0 0 ${b.lebar} ${t}" font-family="Arial, Helvetica, sans-serif" font-size="${HURUF}" fill="#000">` +
    `<rect width="${b.lebar}" height="${t}" fill="#fff"/>${kepala}${b.isi}</svg>`
  );
}
