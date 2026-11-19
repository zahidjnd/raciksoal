/**
 * Skema IPA tahap 4a (0.57.0, ATURAN-SOAL 4.12): rangkaian listrik, model atom Bohr, jaring/rantai makanan dari tabel
 * 2 kolom "| Bagian | Isi |" + penanda "[[SKEMA listrik|atom|jaring: judul]]" (dibaca grafik.ts, jalur sama dengan
 * bagan & geometri: web & Word = SVG hitam-putih). Pemeriksa: nama komponen dobel/voltmeter tanpa sasaran (listrik),
 * jumlah elektron & isi kulit (atom), nama makhluk & lingkaran makan-memakan (jaring). Tanpa huruf Arab.
 */
import { ARAB, bersih, esc, garis, LEBAR, normal, r1, tulis } from "./bangun.ts";

export type JenisSkema = "listrik" | "atom" | "jaring";
type P = [number, number];
const K = ["Bagian", "Isi"];

export const ATURAN_SKEMA: Record<JenisSkema, { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] }> = {
  listrik: {
    nama: "Rangkaian listrik",
    baris: [2, 10],
    petunjuk:
      'Satu baris = satu komponen, urut sepanjang rangkaian: "baterai | 12 V", hambatan "R1 | 4 Ω", lampu "L1", kapasitor "C1", saklar "S | terbuka/tertutup", "amperemeter | A". Cabang: "paralel | R2 = 6 Ω, R3 = 3 Ω" (2–4 cabang). Voltmeter: "voltmeter | R1" (dipasang sejajar dengan R1). Isi boleh "?" bila ditanyakan.',
    contoh: [K, ["baterai", "12 V"], ["R1", "4 Ω"], ["paralel", "R2 = 6 Ω, R3 = 3 Ω"], ["amperemeter", "A"], ["voltmeter", "R1"]],
  },
  atom: {
    nama: "Model atom Bohr",
    baris: [1, 4],
    petunjuk: 'Baris "unsur | Na" (lambang di inti), "nomor atom | 11", "konfigurasi | 2 8 1" (boleh tidak ditulis bila nomor atom ≤ 20), "inti | 11p, 12n" (tulisan di bawah inti, boleh tidak ditulis).',
    contoh: [K, ["unsur", "Na"], ["nomor atom", "11"], ["konfigurasi", "2 8 1"]],
  },
  jaring: {
    nama: "Jaring makanan",
    baris: [1, 12],
    petunjuk: 'Satu baris = satu makhluk dan pemakannya: "rumput | belalang, tikus" artinya rumput dimakan belalang dan tikus. Pemakan puncak tidak perlu baris sendiri. Rantai makanan = tiap baris satu pemakan.',
    contoh: [K, ["rumput", "belalang, tikus"], ["belalang", "katak, burung"], ["tikus", "ular"], ["katak", "ular"], ["ular", "elang"], ["burung", "elang"]],
  },
};

const badanTabel = (isi: string[][]) => isi.slice(1).map((b, n) => ({ k: bersih(b[0] ?? ""), v: bersih(b[1] ?? ""), n: n + 1 })).filter((x) => x.k || x.v);
function cekUmum(isi: string[][], jenis: JenisSkema): string | null {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `${ATURAN_SKEMA[jenis].nama} memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const [lo, hi] = ATURAN_SKEMA[jenis].baris;
  const n = isi.length - 1;
  if (n < lo || n > hi) return `Isi ${lo}–${hi} baris (sekarang ${n}).`;
  for (const x of badanTabel(isi)) {
    if (ARAB.test(x.k + x.v)) return `Baris ${x.n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    if (!x.k) return `Baris ${x.n} kolom 1 masih kosong.`;
    if (x.k.length > 20 || x.v.length > 60) return `Baris ${x.n} terlalu panjang.`;
  }
  return null;
}

// ---------- rangkaian listrik ----------

type Jenis = "hambatan" | "lampu" | "kapasitor" | "saklar" | "ampere";
type Komp = { jenis: Jenis; nama: string; nilai: string };
type Slot = { komp: Komp[]; volt?: boolean }; // komp > 1 = paralel
type Listrik = { baterai: string; slot: Slot[]; voltBaterai: boolean };

function jenisKomp(nama: string): Jenis | null {
  const k = normal(nama);
  if (/^(r\d*|hambatan\d*|resistor\d*)$/.test(k)) return "hambatan";
  if (/^(l\d*|lampu\d*)$/.test(k)) return "lampu";
  if (/^(c\d*|kapasitor\d*)$/.test(k)) return "kapasitor";
  if (/^(s\d*|saklar\d*|sakelar\d*)$/.test(k)) return "saklar";
  if (/^(a\d*|amperemeter\d*)$/.test(k)) return "ampere";
  return null;
}
const DAFTAR = "R1 (hambatan), L1 (lampu), C1 (kapasitor), S (saklar), amperemeter, paralel, voltmeter, baterai";

function bacaListrik(isi: string[][]): Listrik | string {
  const umum = cekUmum(isi, "listrik");
  if (umum) return umum;
  const h: Listrik = { baterai: "", slot: [], voltBaterai: false };
  let adaBaterai = false;
  const nama = new Set<string>();
  const tambah = (k: Komp, n: number) => {
    if (nama.has(normal(k.nama))) return `Baris ${n}: nama "${k.nama}" dipakai dua kali.`;
    nama.add(normal(k.nama));
    return null;
  };
  const volt: { sasaran: string; n: number }[] = [];
  for (const { k, v, n } of badanTabel(isi)) {
    const kk = normal(k);
    if (/^(baterai|sumber|ggl|elemen|e|ε)$/.test(kk)) {
      if (adaBaterai) return `Baris ${n}: rangkaian ini hanya memakai satu baterai.`;
      adaBaterai = true;
      h.baterai = v;
      continue;
    }
    if (/^(voltmeter|v)$/.test(kk)) {
      if (!v) return `Baris ${n}: tulis komponen yang diukur voltmeter, mis. "voltmeter | R1".`;
      volt.push({ sasaran: v, n });
      continue;
    }
    if (kk === "paralel") {
      const cabang = v.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
      if (cabang.length < 2 || cabang.length > 4) return `Baris ${n}: paralel berisi 2–4 cabang dipisah koma, mis. "R2 = 6 Ω, R3 = 3 Ω".`;
      const komp: Komp[] = [];
      for (const c of cabang) {
        const m = /^(\S+?)\s*(?:=\s*|\s+)(.*)$/.exec(c) ?? [c, c, ""];
        const j = jenisKomp(m[1]);
        if (!j) return `Baris ${n}: "${m[1]}" bukan nama komponen. Contoh: ${DAFTAR}.`;
        const kp = { jenis: j, nama: m[1], nilai: (m[2] ?? "").trim() };
        const salah = tambah(kp, n);
        if (salah) return salah;
        komp.push(kp);
      }
      h.slot.push({ komp });
      continue;
    }
    const j = jenisKomp(k);
    if (!j) return `Baris ${n}: "${k}" bukan nama komponen. Contoh: ${DAFTAR}.`;
    const kp = { jenis: j, nama: j === "ampere" && /^amperemeter$/i.test(k) ? "" : k, nilai: v };
    if (kp.nama) {
      const salah = tambah(kp, n);
      if (salah) return salah;
    }
    h.slot.push({ komp: [kp] });
  }
  if (!adaBaterai) return 'Tulis baris "baterai | 12 V" (sumber tegangan).';
  if (!h.slot.length) return "Belum ada komponen selain baterai.";
  if (h.slot.length > 8) return "Paling banyak 8 komponen/cabang berurutan.";
  for (const { sasaran, n } of volt) {
    if (/^(baterai|sumber|ggl|e|ε)$/i.test(sasaran)) {
      h.voltBaterai = true;
      continue;
    }
    const s = h.slot.find((x) => x.komp.some((c) => normal(c.nama) === normal(sasaran)));
    if (!s) return `Baris ${n}: voltmeter mengukur "${sasaran}", tetapi komponen itu tidak ada di rangkaian.`;
    s.volt = true;
  }
  return h;
}

const lebarSlot = (s: Slot) => (s.komp.length > 1 ? 96 : 76);
const labelKomp = (c: Komp) => (c.nama && c.nilai && c.jenis !== "saklar" ? `${c.nama} = ${c.nilai}` : c.nama || (c.jenis === "ampere" ? "" : c.nilai));

/** Simbol komponen mendatar berpusat di (x, y), lebar ±18; label di atas. */
function simbol(c: Komp, x: number, y: number, isi: string[], labelBawah = false) {
  const s = 'stroke="#000" stroke-width="1.5" fill="none"';
  if (c.jenis === "hambatan") {
    const p = [[x - 18, y]];
    for (let i = 0; i < 6; i++) p.push([x - 15 + i * 6, y + (i % 2 ? 6 : -6)]);
    p.push([x + 18, y]);
    isi.push(`<polyline points="${p.map(([a, b]) => `${r1(a)},${r1(b)}`).join(" ")}" ${s}/>`, garis([x - 22, y], [x - 18, y]), garis([x + 18, y], [x + 22, y]));
  } else if (c.jenis === "lampu") {
    isi.push(`<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#000" stroke-width="1.5"/>`, garis([x - 6.4, y - 6.4], [x + 6.4, y + 6.4], 'stroke="#000" stroke-width="1.2"'), garis([x - 6.4, y + 6.4], [x + 6.4, y - 6.4], 'stroke="#000" stroke-width="1.2"'));
  } else if (c.jenis === "kapasitor") {
    isi.push(`<rect x="${x - 4}" y="${y - 10}" width="8" height="20" fill="#fff" stroke="none"/>`, garis([x - 4, y - 10], [x - 4, y + 10], 'stroke="#000" stroke-width="2"'), garis([x + 4, y - 10], [x + 4, y + 10], 'stroke="#000" stroke-width="2"'));
  } else if (c.jenis === "saklar") {
    const buka = /buka|terbuka|off|putus/i.test(c.nilai);
    isi.push(`<rect x="${x - 14}" y="${y - 3}" width="28" height="6" fill="#fff" stroke="none"/>`);
    isi.push(`<circle cx="${x - 12}" cy="${y}" r="2.5" fill="#fff" stroke="#000"/>`, `<circle cx="${x + 12}" cy="${y}" r="2.5" fill="#fff" stroke="#000"/>`);
    isi.push(garis([x - 10, y], buka ? [x + 10, y - 12] : [x + 10, y], 'stroke="#000" stroke-width="1.5"'));
  } else {
    isi.push(`<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="#000" stroke-width="1.5"/>`, `<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold">A</text>`);
  }
  const l = labelKomp(c);
  if (l) isi.push(tulis([x, labelBawah ? y + 22 : y - 16], l, 'font-size="10"'));
}
function meterV(x: number, y: number, isi: string[]) {
  isi.push(`<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="#000" stroke-width="1.5"/>`, `<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold">V</text>`);
}

function gambarListrik(h: Listrik, atas: number) {
  const isi: string[] = [];
  // komponen di sisi atas (kiri → kanan); bila > 4, sisanya di sisi bawah (kanan → kiri)
  const atasN = h.slot.length > 4 ? Math.ceil(h.slot.length / 2) : h.slot.length;
  const [sAtas, sBawah] = [h.slot.slice(0, atasN), h.slot.slice(atasN)];
  const panjang = (ss: Slot[]) => ss.reduce((a, s) => a + lebarSlot(s), 0);
  const lebarIsi = Math.max(panjang(sAtas), panjang(sBawah), 160);
  // ruang kiri untuk tulisan baterai & voltmeter baterai; rangkaian panjang = gambar lebih lebar (Word mengecilkannya)
  const labelBaterai = h.baterai ? h.baterai.length * 6 + 24 : 0;
  const cadang = 14 + labelBaterai + (h.voltBaterai ? 34 : 0);
  const lebar = Math.max(LEBAR, cadang + lebarIsi + 16);
  const kiri = cadang + (lebar - cadang - 16 - lebarIsi) / 2, kanan = kiri + lebarIsi;
  const cabangMaks = (ss: Slot[]) => Math.max(1, ...ss.map((s) => s.komp.length));
  const naik = (ss: Slot[]) => ((cabangMaks(ss) - 1) / 2) * 40 + (ss.some((s) => s.volt) ? 44 : 0);
  const y0 = atas + 26 + naik(sAtas);
  const y1 = y0 + Math.max(110, ((cabangMaks(sAtas) - 1) / 2) * 40 + ((cabangMaks(sBawah) - 1) / 2) * 40 + 70);
  const deret = (ss: Slot[], y: number, arah: 1 | -1) => {
    let x = arah === 1 ? kiri : kanan;
    const sisa = lebarIsi - panjang(ss);
    const awal = x;
    x += (arah * sisa) / 2;
    isi.push(garis([awal, y], [x, y]));
    for (const s of ss) {
      const w = lebarSlot(s);
      const [xa, xb] = [x, x + arah * w];
      const xm = (xa + xb) / 2;
      if (s.komp.length === 1) {
        isi.push(garis([xa, y], [xb, y]));
        simbol(s.komp[0], xm, y, isi, arah === -1);
      } else {
        const m = s.komp.length;
        const ys = s.komp.map((_, k) => y + (k - (m - 1) / 2) * 40);
        const [ka, kb] = [xa + arah * 12, xb - arah * 12];
        isi.push(garis([xa, y], [ka, y]), garis([kb, y], [xb, y]), garis([ka, ys[0]], [ka, ys[m - 1]]), garis([kb, ys[0]], [kb, ys[m - 1]]));
        isi.push(`<circle cx="${r1(ka)}" cy="${y}" r="2.5" fill="#000"/>`, `<circle cx="${r1(kb)}" cy="${y}" r="2.5" fill="#000"/>`);
        s.komp.forEach((c, k) => {
          isi.push(garis([ka, ys[k]], [kb, ys[k]]));
          simbol(c, xm, ys[k], isi);
        });
      }
      if (s.volt) {
        const tepi = s.komp.length > 1 ? ((s.komp.length - 1) / 2) * 40 : 0;
        const yv = arah === 1 ? y - tepi - 40 : y + tepi + 40;
        const [ka, kb] = [xa + arah * 5, xb - arah * 5];
        isi.push(garis([ka, y], [ka, yv]), garis([ka, yv], [kb, yv]), garis([kb, yv], [kb, y]));
        isi.push(`<circle cx="${r1(ka)}" cy="${y}" r="2.5" fill="#000"/>`, `<circle cx="${r1(kb)}" cy="${y}" r="2.5" fill="#000"/>`);
        meterV(xm, yv, isi);
      }
      x = xb;
    }
    isi.push(garis([x, y], [arah === 1 ? kanan : kiri, y]));
  };
  deret(sAtas, y0, 1);
  if (sBawah.length) deret(sBawah, y1, -1);
  else isi.push(garis([kiri, y1], [kanan, y1]));
  // sisi kanan: kabel; sisi kiri: baterai di tengah
  isi.push(garis([kanan, y0], [kanan, y1]));
  const yb = (y0 + y1) / 2;
  isi.push(garis([kiri, y0], [kiri, yb - 4]), garis([kiri, yb + 4], [kiri, y1]));
  isi.push(garis([kiri - 13, yb - 4], [kiri + 13, yb - 4], 'stroke="#000" stroke-width="1.5"'), garis([kiri - 6, yb + 4], [kiri + 6, yb + 4], 'stroke="#000" stroke-width="3.5"'));
  isi.push(tulis([kiri + 18, yb - 10], "+", 'font-size="10"'));
  if (h.baterai) isi.push(`<text x="${r1(kiri - 18)}" y="${r1(yb + 4)}" text-anchor="end" font-size="10">${esc(h.baterai)}</text>`);
  if (h.voltBaterai) {
    const xv = kiri - labelBaterai - 22;
    isi.push(garis([kiri, yb - 30], [xv, yb - 30]), garis([xv, yb - 30], [xv, yb + 30]), garis([xv, yb + 30], [kiri, yb + 30]));
    meterV(xv, yb, isi);
  }
  const bawahVolt = sBawah.some((s) => s.volt) ? 44 : 0;
  return { isi: isi.join(""), tinggi: y1 + ((cabangMaks(sBawah) - 1) / 2) * 40 + bawahVolt + 34, lebar };
}

// ---------- atom ----------

type Atom = { unsur: string; z?: number; kulit: number[]; inti: string; adaKonfigurasi: boolean };

/** Konfigurasi Bohr sederhana untuk nomor atom ≤ 20 (K2 L8 M8 N2). */
export function konfigurasiBohr(z: number): number[] {
  const hasil: number[] = [];
  let sisa = z;
  for (const maks of [2, 8, 8, 2]) {
    if (sisa <= 0) break;
    hasil.push(Math.min(maks, sisa));
    sisa -= maks;
  }
  return hasil;
}

function bacaAtom(isi: string[][]): Atom | string {
  const umum = cekUmum(isi, "atom");
  if (umum) return umum;
  const a: Atom = { unsur: "", kulit: [], inti: "", adaKonfigurasi: false };
  for (const { k, v, n } of badanTabel(isi)) {
    const kk = normal(k);
    if (/^(unsur|lambang|atom)$/.test(kk)) a.unsur = v;
    else if (/^(nomoratom|z)$/.test(kk)) {
      if (!/^\d{1,3}$/.test(v) || +v < 1 || +v > 118) return `Baris ${n}: nomor atom ditulis angka 1–118.`;
      a.z = +v;
    } else if (/^(konfigurasi|konfigurasielektron|kulit)$/.test(kk)) {
      const s = v.split(/[\s,.;-]+/).filter(Boolean);
      if (!s.length || s.some((x) => !/^\d{1,2}$/.test(x))) return `Baris ${n}: konfigurasi ditulis angka per kulit, mis. "2 8 1".`;
      a.kulit = s.map(Number);
      a.adaKonfigurasi = true;
    } else if (/^(inti|nukleon)$/.test(kk)) a.inti = v;
    else return `Baris ${n}: bagian "${k}" tidak dikenal. Pilih: unsur, nomor atom, konfigurasi, inti.`;
  }
  if (a.unsur.length > 3) return "Lambang unsur paling banyak 3 huruf (mis. Na).";
  if (!a.adaKonfigurasi) {
    if (a.z === undefined) return 'Tulis "nomor atom" atau "konfigurasi".';
    if (a.z > 20) return 'Nomor atom lebih dari 20: tulis juga baris "konfigurasi" (mis. "2 8 18 3").';
    a.kulit = konfigurasiBohr(a.z);
  }
  if (a.kulit.length > 7) return "Paling banyak 7 kulit (K sampai Q).";
  const NAMA = "KLMNOPQ";
  for (const [i, e] of a.kulit.entries()) {
    if (e < 1) return `Kulit ${NAMA[i]} tidak boleh kosong (0) bila masih ada kulit di luarnya.`;
    if (e > 2 * (i + 1) ** 2) return `Kulit ${NAMA[i]} paling banyak berisi ${2 * (i + 1) ** 2} elektron (sekarang ${e}).`;
  }
  if (a.kulit[a.kulit.length - 1] > 8 && a.kulit.length > 1) return `Kulit terluar paling banyak 8 elektron (sekarang ${a.kulit[a.kulit.length - 1]}).`;
  const total = a.kulit.reduce((x, y) => x + y, 0);
  if (a.z !== undefined && total !== a.z) return `Ukuran tidak cocok: jumlah elektron ${a.kulit.join(" + ")} = ${total}, padahal nomor atom ${a.z}.`;
  return a;
}

function gambarAtom(a: Atom, atas: number) {
  const isi: string[] = [];
  const n = a.kulit.length;
  const inti = 20;
  const langkah = Math.min(24, (150 - inti) / n);
  const c: P = [LEBAR / 2, atas + 14 + inti + langkah * n];
  for (let i = n - 1; i >= 0; i--) {
    const R = inti + langkah * (i + 1);
    isi.push(`<circle cx="${c[0]}" cy="${r1(c[1])}" r="${r1(R)}" fill="none" stroke="#000" stroke-width="1"/>`);
    // elektron tersebar rata, mulai dari atas; diberi nama kulit di kanan atas
    const e = a.kulit[i];
    for (let k = 0; k < e; k++) {
      const t = -Math.PI / 2 + (2 * Math.PI * k) / e + (i % 2 ? Math.PI / e : 0);
      isi.push(`<circle cx="${r1(c[0] + R * Math.cos(t))}" cy="${r1(c[1] + R * Math.sin(t))}" r="3.2" fill="#000"/>`);
    }
    isi.push(tulis([c[0] + R * 0.74 + 6, c[1] - R * 0.74 - 4], "KLMNOPQ"[i], 'font-size="9"'));
  }
  isi.push(`<circle cx="${c[0]}" cy="${r1(c[1])}" r="${inti}" fill="#d0d0d0" stroke="#000" stroke-width="1.5"/>`);
  if (a.unsur) isi.push(`<text x="${c[0]}" y="${r1(c[1] + (a.inti ? -1 : 5))}" text-anchor="middle" font-size="14" font-weight="bold">${esc(a.unsur)}</text>`);
  if (a.inti) isi.push(tulis([c[0], c[1] + (a.unsur ? 9 : 0)], a.inti, 'font-size="7"'));
  return { isi: isi.join(""), tinggi: c[1] + inti + langkah * n + 14 };
}

// ---------- jaring makanan ----------

type Jaring = { tingkat: string[][]; panah: [string, string][] };

function bacaJaring(isi: string[][]): Jaring | string {
  const umum = cekUmum(isi, "jaring");
  if (umum) return umum;
  const nama = new Map<string, string>(); // kunci normal → tulisan
  const panah: [string, string][] = [];
  const catat = (t: string) => {
    if (t.length > 20) return `Nama "${t}" terlalu panjang (maks 20 huruf).`;
    if (!nama.has(normal(t))) nama.set(normal(t), t);
    return null;
  };
  for (const { k, v, n } of badanTabel(isi)) {
    const salah = catat(k);
    if (salah) return salah;
    if (/^(-+|—|–|tidak ada|tidak dimakan|kosong)$/i.test(v)) continue; // pemakan puncak boleh ditulis "-"
    if (!v) return `Baris ${n}: tulis pemakan "${k}", mis. "${k} | belalang, tikus" (pemakan puncak: "-").`;
    for (const p of v.split(/[,;]|\bdan\b/).map((x) => x.trim()).filter(Boolean)) {
      const s = catat(p);
      if (s) return s;
      if (normal(p) === normal(k)) return `Baris ${n}: "${k}" tidak bisa memakan dirinya sendiri.`;
      if (!panah.some(([a, b]) => a === normal(k) && b === normal(p))) panah.push([normal(k), normal(p)]);
    }
  }
  if (nama.size > 14) return "Paling banyak 14 makhluk.";
  // tingkat trofik = 1 + tingkat mangsa tertinggi; lingkaran makan-memakan ditolak
  const tingkat = new Map<string, number>();
  const jalan = (x: string, di: Set<string>): number | string => {
    if (tingkat.has(x)) return tingkat.get(x)!;
    if (di.has(x)) return `Ada lingkaran makan-memakan yang melewati "${nama.get(x)}" (A dimakan B, B dimakan A).`;
    di.add(x);
    let t = 1;
    for (const [a, b] of panah)
      if (b === x) {
        const ta = jalan(a, di);
        if (typeof ta === "string") return ta;
        t = Math.max(t, ta + 1);
      }
    di.delete(x);
    tingkat.set(x, t);
    return t;
  };
  for (const x of nama.keys()) {
    const t = jalan(x, new Set());
    if (typeof t === "string") return t;
  }
  const maks = Math.max(...tingkat.values());
  if (maks > 6) return "Paling banyak 6 tingkat trofik.";
  const lapis: string[][] = Array.from({ length: maks }, () => []);
  for (const [x, t] of tingkat) lapis[t - 1].push(x);
  if (lapis.some((l) => l.length > 5)) return "Paling banyak 5 makhluk dalam satu tingkat.";
  // urutkan tiap tingkat menurut rata-rata letak mangsanya (garis panah lebih sedikit bersilang)
  for (let t = 1; t < maks; t++) {
    const letak = (x: string) => {
      const m = panah.filter(([, b]) => b === x).map(([a]) => lapis[tingkat.get(a)! - 1].indexOf(a) / Math.max(1, lapis[tingkat.get(a)! - 1].length - 1));
      return m.length ? m.reduce((p, q) => p + q, 0) / m.length : 0.5;
    };
    lapis[t].sort((a, b) => letak(a) - letak(b));
  }
  return { tingkat: lapis.map((l) => l.map((x) => nama.get(x)!)), panah: panah.map(([a, b]) => [nama.get(a)!, nama.get(b)!]) };
}

function gambarJaring(j: Jaring, atas: number) {
  const isi: string[] = [];
  const n = j.tingkat.length;
  const jarakY = 62, tinggiKotak = 26;
  const letak = new Map<string, P>();
  const lebarKotak = new Map<string, number>();
  j.tingkat.forEach((l, t) => {
    const y = atas + 20 + (n - 1 - t) * jarakY + tinggiKotak / 2; // produsen di bawah
    const lebar = Math.min(84, (LEBAR - 16) / l.length - 6);
    l.forEach((x, k) => {
      letak.set(x, [8 + ((LEBAR - 16) * (k + 0.5)) / l.length, y]);
      lebarKotak.set(x, Math.max(48, Math.min(lebar, x.length * 6.4 + 14)));
    });
  });
  for (const [a, b] of j.panah) {
    const [pa, pb] = [letak.get(a)!, letak.get(b)!];
    const awal: P = [pa[0], pa[1] - tinggiKotak / 2];
    const akhir: P = [pb[0], pb[1] + tinggiKotak / 2];
    const d = Math.hypot(akhir[0] - awal[0], akhir[1] - awal[1]) || 1;
    const [ux, uy] = [(akhir[0] - awal[0]) / d, (akhir[1] - awal[1]) / d];
    isi.push(garis(awal, [akhir[0] - ux * 7, akhir[1] - uy * 7], 'stroke="#000" stroke-width="1.2"'));
    isi.push(`<polygon points="${r1(akhir[0])},${r1(akhir[1])} ${r1(akhir[0] - ux * 8 - uy * 3.5)},${r1(akhir[1] - uy * 8 + ux * 3.5)} ${r1(akhir[0] - ux * 8 + uy * 3.5)},${r1(akhir[1] - uy * 8 - ux * 3.5)}" fill="#000"/>`);
  }
  for (const [x, p] of letak) {
    const w = lebarKotak.get(x)!;
    isi.push(`<rect x="${r1(p[0] - w / 2)}" y="${r1(p[1] - tinggiKotak / 2)}" width="${r1(w)}" height="${tinggiKotak}" rx="5" fill="#fff" stroke="#000" stroke-width="1.2"/>`);
    const muat = Math.floor((w - 6) / 6);
    isi.push(tulis(p, x.length > muat ? `${x.slice(0, muat - 1)}…` : x, 'font-size="10.5"'));
  }
  return { isi: isi.join(""), tinggi: atas + 20 + (n - 1) * jarakY + tinggiKotak + 12 };
}

// ---------- pintu ----------

function baca(isi: string[][], jenis: JenisSkema) {
  return jenis === "listrik" ? bacaListrik(isi) : jenis === "atom" ? bacaAtom(isi) : bacaJaring(isi);
}

/** Kenapa tabel ini tidak bisa digambar (kalimat untuk guru), atau null. */
export function alasanSkema(isi: string[][], jenis: JenisSkema): string | null {
  const h = baca(isi, jenis);
  return typeof h === "string" ? h : null;
}

export function svgSkema(isi: string[][], jenis: JenisSkema, judul: string): string | null {
  const h = baca(isi, jenis);
  if (typeof h === "string") return null;
  const atas = judul ? 26 : 4;
  const g: { isi: string; tinggi: number; lebar?: number } = jenis === "listrik" ? gambarListrik(h as Listrik, atas) : jenis === "atom" ? gambarAtom(h as Atom, atas) : gambarJaring(h as Jaring, atas);
  const t = Math.ceil(g.tinggi);
  const L = Math.ceil(g.lebar ?? LEBAR);
  const kepala = judul ? `<text x="${L / 2}" y="18" text-anchor="middle" font-size="13" font-weight="bold">${esc(judul)}</text>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${t}" viewBox="0 0 ${L} ${t}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000">` +
    `<rect width="${L}" height="${t}" fill="#fff"/>${kepala}${g.isi}</svg>`
  );
}
