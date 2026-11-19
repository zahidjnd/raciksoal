/**
 * Geometri tahap 2b (0.56.0, ATURAN-SOAL 4.11): bangun ruang dari tabel 2 kolom "| Bagian | Isi |" + penanda
 * "[[GEOMETRI ruang: judul]]". Kubus/balok/prisma/limas = titik 3D → proyeksi miring buku paket (kedalaman 45°, ½);
 * rusuk tersembunyi (kedua sisinya membelakangi pembaca) putus-putus. Tabung/kerucut/bola digambar langsung.
 * Titik tengah ("titik P | tengah EH") & garis tambahan ("AG | ?") untuk soal jarak dimensi tiga. Semua angka yang
 * ditulis dicocokkan dengan jarak 3D bangun jadi (diagonal ruang, rusuk tegak limas, garis pelukis) → alasan.
 */
import { ARAB, angkaUkuran, arah, bersih, busur, cariNama, esc, fmt, garis, jarak, LEBAR, normal, PUTUS, r1, segitigaDasar, tambah, tulis } from "./bangun.ts";

type P = [number, number];
type V = [number, number, number];

const RUANG = ["kubus", "balok", "prisma segitiga", "limas segiempat", "limas segitiga", "tabung", "kerucut", "bola"];
const K = ["Bagian", "Isi"];
export const CONTOH_RUANG: Record<string, string[][]> = {
  kubus: [K, ["bangun", "kubus"], ["rusuk", "6 cm"], ["titik P", "tengah EH"], ["AP", "?"]],
  balok: [K, ["bangun", "balok"], ["AB", "8 cm"], ["BC", "6 cm"], ["AE", "4 cm"], ["AG", "?"]],
  "prisma segitiga": [K, ["bangun", "prisma segitiga"], ["AB", "6 cm"], ["BC", "8 cm"], ["AC", "10 cm"], ["AD", "12 cm"]],
  "limas segiempat": [K, ["bangun", "limas segiempat"], ["AB", "8 cm"], ["BC", "8 cm"], ["tinggi", "3 cm"], ["TA", "?"]],
  "limas segitiga": [K, ["bangun", "limas segitiga"], ["AB", "6 cm"], ["BC", "6 cm"], ["AC", "6 cm"], ["tinggi", "8 cm"]],
  tabung: [K, ["bangun", "tabung"], ["jari-jari", "7 cm"], ["tinggi", "10 cm"]],
  kerucut: [K, ["bangun", "kerucut"], ["jari-jari", "6 cm"], ["tinggi", "8 cm"], ["garis pelukis", "?"]],
  bola: [K, ["bangun", "bola"], ["jari-jari", "7 cm"]],
};
export const ATURAN_RUANG: { nama: string; baris: [number, number]; petunjuk: string; contoh: string[][] } = {
  nama: "Bangun ruang",
  baris: [1, 12],
  petunjuk: `Baris "bangun" = ${RUANG.join(", ")} (contoh abu-abu ikut berganti). Titik: kubus/balok ABCD.EFGH (ABCD alas, A kiri depan), prisma ABC.DEF, limas T.ABCD / T.ABC. Ukuran: rusuk "AB | 8 cm" (kubus: "rusuk"), "tinggi", tabung/kerucut/bola: "jari-jari", "diameter", "tinggi", "garis pelukis". Titik tengah: "titik P | tengah EH"; garis tambahan: "AG | ?". Yang ditanyakan ditulis "?".`,
  contoh: CONTOH_RUANG.balok,
};
export const contohRuang = (isi: string[][]) => {
  const b = isi.find((x) => normal(x[0] ?? "") === "bangun");
  const n = b && cariNama(RUANG, b[1] ?? "");
  return (n && CONTOH_RUANG[n]) || ATURAN_RUANG.contoh;
};

type Ukuran = { teks: string; n?: number; baris: number };
type Bentuk = {
  bangun: string;
  nama: string[];
  titik: V[];
  sisi: number[][]; // bidang (urutan titik)
  ruas: { a: number; b: number; u: Ukuran }[];
  tinggi?: { puncak: number; kaki: V; u: Ukuran };
  tambahan: number[]; // titik tengah (indeks)
};
type Bulat = { bangun: string; r: number; t: number; jari?: Ukuran; diameter?: Ukuran; tinggiU?: Ukuran; pelukis?: Ukuran };

const tengah = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const jarak3 = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hurufNama = (t: string) => t.match(/[A-Za-z]['’]?/g) ?? [];

function baca(isi: string[][]): Bentuk | Bulat | string {
  const kolom = isi[0]?.length ?? 0;
  if (kolom !== 2) return `Bangun ruang memakai 2 kolom: Bagian | Isi (sekarang ${kolom}).`;
  const badan = isi.slice(1).map((b, n) => ({ b: [bersih(b[0] ?? ""), bersih(b[1] ?? "")], n: n + 1 })).filter((x) => x.b[0] || x.b[1]);
  if (isi.length - 1 < ATURAN_RUANG.baris[0] || isi.length - 1 > ATURAN_RUANG.baris[1]) return `Isi ${ATURAN_RUANG.baris.join("–")} baris (sekarang ${isi.length - 1}).`;
  const bb = badan.find((x) => normal(x.b[0]) === "bangun");
  if (!bb) return `Tulis baris "bangun" (${RUANG.join(", ")}).`;
  const bangun = cariNama(RUANG, bb.b[1]);
  if (!bangun) return `Baris ${bb.n}: bangun "${bb.b[1]}" tidak dikenal. Pilih: ${RUANG.join(", ")}.`;
  for (const { b, n } of badan) {
    if (ARAB.test(b[0] + b[1])) return `Baris ${n} berisi huruf Arab; gambar hanya memakai huruf Latin.`;
    if (b[1].length > 20) return `Baris ${n}: isi terlalu panjang (maks 20 huruf).`;
    if (!b[1] && normal(b[0]) !== "bangun") return `Baris ${n} kolom 2 masih kosong (tulis ukurannya, atau "?" bila ditanyakan).`;
  }
  const u = (x: { b: string[]; n: number }): Ukuran => ({ teks: x.b[1], n: angkaUkuran(x.b[1]), baris: x.n });

  // ---------- tabung, kerucut, bola ----------
  if (["tabung", "kerucut", "bola"].includes(bangun)) {
    const h: Bulat = { bangun, r: 0, t: 0 };
    for (const x of badan) {
      const k = normal(x.b[0]);
      if (k === "bangun") continue;
      if (/^(jarijari|r)$/.test(k)) h.jari = u(x);
      else if (/^(diameter|d)$/.test(k)) h.diameter = u(x);
      else if (/^(tinggi|t)$/.test(k) && bangun !== "bola") h.tinggiU = u(x);
      else if (/^(garispelukis|pelukis|s)$/.test(k) && bangun === "kerucut") h.pelukis = u(x);
      else return `Baris ${x.n}: bagian "${x.b[0]}" tidak dikenal untuk ${bangun}. Pilih: jari-jari, diameter${bangun === "bola" ? "" : ", tinggi"}${bangun === "kerucut" ? ", garis pelukis" : ""}.`;
    }
    const r = h.jari?.n ?? (h.diameter?.n !== undefined ? h.diameter.n / 2 : undefined);
    let t = h.tinggiU?.n;
    if (bangun === "kerucut" && t === undefined && r !== undefined && h.pelukis?.n !== undefined) {
      if (h.pelukis.n <= r) return "Garis pelukis kerucut harus lebih panjang dari jari-jarinya.";
      t = Math.sqrt(h.pelukis.n ** 2 - r ** 2);
    }
    h.r = r ?? (t ? t * (bangun === "tabung" ? 0.5 : 0.6) : 5);
    h.t = t ?? h.r * (bangun === "tabung" ? 1.6 : 1.4);
    if (h.jari?.n !== undefined && h.diameter?.n !== undefined && Math.abs(h.diameter.n - 2 * h.jari.n) > 0.02 * h.diameter.n) return `Ukuran tidak cocok: diameter tertulis ${h.diameter.teks}, padahal diameter = 2 × jari-jari = ${fmt(2 * h.jari.n)}.`;
    if (h.pelukis?.n !== undefined) {
      const s = Math.hypot(h.r, h.t);
      if (Math.abs(s - h.pelukis.n) > 0.02 * h.pelukis.n) return `Ukuran tidak cocok: garis pelukis tertulis ${h.pelukis.teks}, padahal dari jari-jari & tinggi garis pelukis = ${fmt(s)} (Pythagoras).`;
    }
    return h;
  }

  // ---------- polihedron ----------
  const bawaan = { kubus: "ABCDEFGH", balok: "ABCDEFGH", "prisma segitiga": "ABCDEF", "limas segiempat": "TABCD", "limas segitiga": "TABC" }[bangun]!.split("");
  const bt = badan.find((x) => normal(x.b[0]) === "titik");
  const nama = bt ? hurufNama(bt.b[1]) : [...bawaan];
  if (nama.length !== bawaan.length || new Set(nama).size !== nama.length) return `Baris ${bt!.n}: tulis ${bawaan.length} nama titik berbeda, mis. "${bangun.startsWith("limas") ? `${bawaan[0]}.${bawaan.slice(1).join("")}` : bangun === "prisma segitiga" ? "ABC.DEF" : "ABCD.EFGH"}".`;
  // ukuran: rusuk "AB" (urutan nama bawaan), tinggi, titik tengah
  const ukur = new Map<string, Ukuran>(); // kunci = dua huruf bawaan, urut
  const tengahBaris: { nama: string; a: string; b: string; n: number }[] = [];
  let tinggi: Ukuran | undefined;
  const keBawaan = (h: string) => bawaan[nama.indexOf(h)];
  for (const x of badan) {
    const k = normal(x.b[0]);
    if (k === "bangun" || k === "titik") continue;
    if (/^(tinggi|t)$/.test(k)) {
      tinggi = u(x);
      continue;
    }
    const sebut: Record<string, string> = { rusuk: "AB", sisi: "AB", panjang: "AB", lebar: "BC" };
    if (sebut[k] && !bangun.startsWith("limas")) {
      ukur.set(sebut[k], u(x));
      continue;
    }
    const mt = /^titik\s+([A-Za-z]['’]?)$/i.exec(x.b[0]);
    if (mt) {
      const m = /^(?:titik\s+)?tengah(?:[\s-]+tengah)?\s+(?:rusuk\s+|garis\s+|ruas\s+)?([A-Za-z]['’]?)\s*([A-Za-z]['’]?)$/i.exec(x.b[1]);
      if (!m) return `Baris ${x.n}: titik tambahan ditulis "titik P | tengah EH".`;
      if (nama.includes(mt[1]) || tengahBaris.some((t) => t.nama === mt[1])) return `Baris ${x.n}: nama titik "${mt[1]}" sudah dipakai.`;
      tengahBaris.push({ nama: mt[1], a: m[1], b: m[2], n: x.n });
      continue;
    }
    const h = hurufNama(x.b[0].replace(/^(rusuk|sisi|diagonal|garis|ruas|jarak)\s+/i, ""));
    if (h.length !== 2 || h.join("") !== x.b[0].replace(/^(rusuk|sisi|diagonal|garis|ruas|jarak)\s+/i, "").replace(/\s+/g, ""))
      return `Baris ${x.n}: bagian "${x.b[0]}" tidak dikenal. Contoh: AB, AG, tinggi, titik P${bangun === "kubus" ? ", rusuk" : ""}.`;
    ukur.set(h.join(" "), u(x)); // diperiksa setelah semua titik (termasuk titik tengah) ada
  }

  // titik 3D: x kanan, y ke belakang, z ke atas
  const n = (a: string, b: string) => {
    for (const [k, v] of ukur) {
      const [p, q] = k.includes(" ") ? k.split(" ").map(keBawaan) : k.split("");
      if (v.n !== undefined && ((p === a && q === b) || (p === b && q === a))) return v.n;
    }
    return undefined;
  };
  const pertama = (...p: string[]) => p.map((s) => n(s[0], s[1])).find((v) => v !== undefined);
  let titik: V[];
  let sisi: number[][];
  let kakiTinggi: { puncak: number; kaki: V } | undefined;
  if (bangun === "kubus" || bangun === "balok") {
    const kubus = bangun === "kubus";
    const semua = pertama("AB", "DC", "EF", "HG", "BC", "AD", "FG", "EH", "AE", "BF", "CG", "DH");
    let p = kubus ? semua : pertama("AB", "DC", "EF", "HG");
    let l = kubus ? semua : pertama("BC", "AD", "FG", "EH");
    let t = kubus ? semua : (pertama("AE", "BF", "CG", "DH") ?? tinggi?.n);
    if (kubus && p === undefined) {
      const dr = pertama("AG", "BH", "CE", "DF");
      const db = pertama("AC", "BD", "EG", "FH", "AF", "BE", "CH", "DG", "AH", "DE", "BG", "CF");
      p = l = t = dr ? dr / Math.sqrt(3) : db ? db / Math.SQRT2 : 6;
    }
    p ??= l ? l * 1.33 : 8;
    l ??= p * 0.75;
    t ??= p * 0.5;
    titik = [[0, 0, 0], [p, 0, 0], [p!, l!, 0], [0, l!, 0], [0, 0, t!], [p!, 0, t!], [p!, l!, t!], [0, l!, t!]] as V[];
    sisi = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  } else {
    // alas segitiga/segiempat dari ukuran yang ada
    const segiempat = bangun === "limas segiempat";
    const o = bangun.startsWith("limas") ? 1 : 0; // indeks titik alas pertama
    const huruf = (i: number) => bawaan[o + i];
    let alas: P[];
    if (segiempat) {
      let p = pertama("AB", "DC");
      let l = pertama("BC", "AD");
      p ??= l ?? 8;
      l ??= p;
      alas = [[0, 0], [p, 0], [p, l], [0, l]];
    } else {
      const s = { AB: n(huruf(0), huruf(1)), BC: n(huruf(1), huruf(2)), AC: n(huruf(0), huruf(2)) };
      const tahu = Object.values(s).filter((v) => v !== undefined);
      // tanpa sudut: dua sisi saja → anggap sama kaki/sama sisi supaya tetap tergambar
      if (tahu.length === 1) {
        s.AB ??= tahu[0];
        s.BC ??= tahu[0];
        s.AC ??= tahu[0];
      }
      if (tahu.length === 2) {
        s.AC ??= s.BC ?? s.AB;
        s.BC ??= s.AC;
      }
      const sg = segitigaDasar(tahu.length ? s : { AB: 6, BC: 6, AC: 6 }, {});
      if (typeof sg === "string") return `Alas: ${sg}`;
      alas = sg;
    }
    if (bangun === "prisma segitiga") {
      const t = pertama("AD", "BE", "CF") ?? tinggi?.n ?? 10;
      titik = [...alas.map(([x, y]): V => [x, y, 0]), ...alas.map(([x, y]): V => [x, y, t])];
      sisi = [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]];
    } else {
      const pusat: P = segiempat ? [(alas[0][0] + alas[2][0]) / 2, (alas[0][1] + alas[2][1]) / 2] : [(alas[0][0] + alas[1][0] + alas[2][0]) / 3, (alas[0][1] + alas[1][1] + alas[2][1]) / 3];
      const tegak = pertama(...bawaan.slice(1).map((h) => `T${h}`));
      let t = tinggi?.n;
      if (t === undefined && tegak !== undefined) {
        const ke = jarak(alas[0], pusat);
        if (tegak <= ke) return "Rusuk tegak limas terlalu pendek untuk alasnya.";
        t = Math.sqrt(tegak * tegak - ke * ke);
      }
      t ??= jarak(alas[0], alas[1]) * 0.9;
      titik = [[pusat[0], pusat[1], t], ...alas.map(([x, y]): V => [x, y, 0])];
      sisi = segiempat ? [[1, 2, 3, 4], [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]] : [[1, 2, 3], [0, 1, 2], [0, 2, 3], [0, 3, 1]];
      if (tinggi) kakiTinggi = { puncak: 0, kaki: [pusat[0], pusat[1], 0] };
    }
  }

  // titik tengah, lalu ukuran → ruas (nama tampilan)
  const semuaNama = [...nama];
  const tambahan: number[] = [];
  for (const t of tengahBaris) {
    const [a, b] = [semuaNama.indexOf(t.a), semuaNama.indexOf(t.b)];
    if (a < 0 || b < 0 || a === b) return `Baris ${t.n}: titik ${t.a}${t.b} tidak ada pada bangun ini.`;
    titik.push(tengah(titik[a], titik[b]));
    semuaNama.push(t.nama);
    tambahan.push(titik.length - 1);
  }
  const ruas: Bentuk["ruas"] = [];
  for (const [k, v] of ukur) {
    const pasang = k.includes(" ") ? k.split(" ") : k.split("").map((h) => nama[bawaan.indexOf(h)]);
    const [a, b] = pasang.map((h) => semuaNama.indexOf(h));
    if (a < 0 || b < 0) return `Baris ${v.baris}: titik ${pasang.find((h, i) => [a, b][i] < 0)} tidak ada. Titik: ${semuaNama.join(", ")}.`;
    if (a === b) return `Baris ${v.baris}: dua titik garis harus berbeda.`;
    ruas.push({ a, b, u: v });
  }
  const bentuk: Bentuk = { bangun, nama: semuaNama, titik, sisi, ruas, tambahan, ...(kakiTinggi && tinggi && { tinggi: { ...kakiTinggi, u: tinggi } }) };
  // semua angka tertulis dicocokkan dengan jarak 3D
  for (const r of ruas) {
    if (r.u.n === undefined) continue;
    const g = jarak3(titik[r.a], titik[r.b]);
    if (Math.abs(g - r.u.n) > 0.02 * r.u.n) return `Ukuran tidak cocok: ${semuaNama[r.a]}${semuaNama[r.b]} tertulis ${r.u.teks}, padahal dari ukuran lain ${semuaNama[r.a]}${semuaNama[r.b]} = ${fmt(g)} (baris ${r.u.baris}). Periksa hitungannya.`;
  }
  if (tinggi?.n !== undefined) {
    const g = bangun.startsWith("limas") ? titik[0][2] : bangun === "prisma segitiga" ? titik[3][2] : titik[4][2];
    if (Math.abs(g - tinggi.n) > 0.02 * tinggi.n) return `Ukuran tidak cocok: tinggi tertulis ${tinggi.teks}, padahal dari ukuran lain tinggi = ${fmt(g)} (baris ${tinggi.baris}).`;
  }
  return bentuk;
}

/** Kenapa tabel ini tidak bisa digambar (kalimat untuk guru), atau null. */
export function alasanRuang(isi: string[][]): string | null {
  const b = baca(isi);
  return typeof b === "string" ? b : null;
}

// ---------- gambar ----------

const KD = 0.5, SD = Math.PI / 4; // kedalaman ½, miring 45°
const proyeksi = ([x, y, z]: V): P => [x + y * KD * Math.cos(SD), z + y * KD * Math.sin(SD)];
const PANDANG: V = [-KD * Math.cos(SD), 1, -KD * Math.sin(SD)]; // arah masuk layar
const kurang = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const silang = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const titikKali = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function gambarBentuk(b: Bentuk, atas: number) {
  const pusat3 = b.titik.slice(0, b.nama.length - b.tambahan.length).reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]] as V, [0, 0, 0] as V).map((v) => v / (b.nama.length - b.tambahan.length)) as V;
  // bidang menghadap pembaca?
  const tampak = b.sisi.map((s) => {
    let nrm = silang(kurang(b.titik[s[1]], b.titik[s[0]]), kurang(b.titik[s[2]], b.titik[s[0]]));
    const c = s.reduce((a, i) => [a[0] + b.titik[i][0], a[1] + b.titik[i][1], a[2] + b.titik[i][2]] as V, [0, 0, 0] as V).map((v) => v / s.length) as V;
    if (titikKali(nrm, kurang(c, pusat3)) < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]];
    return titikKali(nrm, PANDANG) < 1e-9;
  });
  const rusuk = new Map<string, boolean>(); // "i-j" → kelihatan
  b.sisi.forEach((s, f) =>
    s.forEach((i, k) => {
      const j = s[(k + 1) % s.length];
      const kunci = i < j ? `${i}-${j}` : `${j}-${i}`;
      rusuk.set(kunci, (rusuk.get(kunci) ?? false) || tampak[f]);
    }),
  );
  const pr = b.titik.map(proyeksi);
  const [x0, x1] = [Math.min(...pr.map((p) => p[0])), Math.max(...pr.map((p) => p[0]))];
  const [y0, y1] = [Math.min(...pr.map((p) => p[1])), Math.max(...pr.map((p) => p[1]))];
  const k = Math.min(270 / (x1 - x0 || 1), 220 / (y1 - y0 || 1));
  const kiri = (LEBAR - (x1 - x0) * k) / 2;
  const L = (p: P): P => [kiri + (p[0] - x0) * k, atas + 20 + (y1 - p[1]) * k];
  const T = pr.map(L);
  const tengahLayar: P = [T.reduce((a, p) => a + p[0], 0) / T.length, T.reduce((a, p) => a + p[1], 0) / T.length];
  const isi: string[] = [];
  for (const [kunci, lihat] of rusuk) if (!lihat) isi.push(garis(T[+kunci.split("-")[0]], T[+kunci.split("-")[1]], PUTUS));
  for (const [kunci, lihat] of rusuk) if (lihat) isi.push(garis(T[+kunci.split("-")[0]], T[+kunci.split("-")[1]]));
  if (b.tinggi) {
    const kaki = L(proyeksi(b.tinggi.kaki));
    isi.push(garis(T[b.tinggi.puncak], kaki, PUTUS), `<circle cx="${r1(kaki[0])}" cy="${r1(kaki[1])}" r="2" fill="#000"/>`);
    // label 30% dari puncak (di tengah sering tertimpa rusuk alas belakang)
    isi.push(tulis([T[0][0] + 0.3 * (kaki[0] - T[0][0]) + 6 + b.tinggi.u.teks.length * 2.9, T[0][1] + 0.3 * (kaki[1] - T[0][1])], b.tinggi.u.teks, 'font-size="11"'));
  }
  // garis tambahan (bukan rusuk) & label ukuran
  for (const r of b.ruas) {
    const kunci = r.a < r.b ? `${r.a}-${r.b}` : `${r.b}-${r.a}`;
    const [a, c] = [T[r.a], T[r.b]];
    if (!rusuk.has(kunci)) isi.push(garis(a, c, 'stroke="#000" stroke-width="1"'));
    const m: P = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
    const u = arah(a, c);
    let tg: P = [u[1], -u[0]];
    if (rusuk.has(kunci) ? (m[0] - tengahLayar[0]) * tg[0] + (m[1] - tengahLayar[1]) * tg[1] < 0 : tg[1] > 0) tg = [-tg[0], -tg[1]];
    isi.push(tulis(tambah(m, tg, 9 + Math.abs(tg[0]) * r.u.teks.length * 2.9), r.u.teks, 'font-size="11"'));
  }
  for (const i of b.tambahan) isi.push(`<circle cx="${r1(T[i][0])}" cy="${r1(T[i][1])}" r="2.5" fill="#000"/>`);
  T.forEach((p, i) => {
    const d = Math.hypot(p[0] - tengahLayar[0], p[1] - tengahLayar[1]) < 1 ? ([0, -1] as P) : arah(tengahLayar, p);
    isi.push(tulis(tambah(p, d, 12), b.nama[i], 'font-size="12" font-style="italic"'));
  });
  return { isi: isi.join(""), tinggi: atas + 20 + (y1 - y0) * k + 22 };
}

/** Elips mendatar: separuh belakang (atas) putus-putus bila `belakang`, separuh depan utuh. */
function elips(c: P, rx: number, ry: number, belakangPutus: boolean) {
  const [ki, ka] = [`${r1(c[0] - rx)},${r1(c[1])}`, `${r1(c[0] + rx)},${r1(c[1])}`];
  return (
    `<path d="M${ki} A${r1(rx)},${r1(ry)} 0 0 1 ${ka}" fill="none" ${belakangPutus ? PUTUS : 'stroke="#000" stroke-width="1.5"'}/>` +
    `<path d="M${ki} A${r1(rx)},${r1(ry)} 0 0 0 ${ka}" fill="none" stroke="#000" stroke-width="1.5"/>`
  );
}

function gambarBulat(h: Bulat, atas: number) {
  const isi: string[] = [];
  const lbl = (p: P, t: string) => isi.push(tulis(p, t, 'font-size="11"'));
  const rTeks = h.jari?.teks;
  if (h.bangun === "bola") {
    const R = 100, c: P = [LEBAR / 2, atas + 14 + R];
    isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${R}" fill="none" stroke="#000" stroke-width="1.5"/>`, elips(c, R, R * 0.25, true));
    isi.push(`<circle cx="${c[0]}" cy="${c[1]}" r="2.5" fill="#000"/>`);
    if (h.diameter) {
      isi.push(garis([c[0] - R, c[1]], [c[0] + R, c[1]], 'stroke="#000" stroke-width="1"'));
      lbl([c[0] - R / 2, c[1] - 9], h.diameter.teks);
    }
    if (rTeks || !h.diameter) {
      isi.push(garis(c, [c[0] + R, c[1]], 'stroke="#000" stroke-width="1"'));
      if (rTeks) lbl([c[0] + R / 2, c[1] - 9], rTeks);
    }
    return { isi: isi.join(""), tinggi: c[1] + R + 14 };
  }
  const k = Math.min(110 / h.r, 210 / (h.t + h.r * 0.5));
  const [R, Tg, ry] = [h.r * k, h.t * k, h.r * k * 0.28];
  const atasBangun = atas + 14 + (h.bangun === "tabung" ? ry : 0);
  const c: P = [LEBAR / 2, atasBangun + Tg]; // pusat alas
  isi.push(elips(c, R, ry, true));
  if (h.bangun === "tabung") {
    const ca: P = [c[0], c[1] - Tg];
    isi.push(`<ellipse cx="${ca[0]}" cy="${r1(ca[1])}" rx="${r1(R)}" ry="${r1(ry)}" fill="none" stroke="#000" stroke-width="1.5"/>`);
    isi.push(garis([c[0] - R, c[1]], [c[0] - R, ca[1]]), garis([c[0] + R, c[1]], [c[0] + R, ca[1]]));
    if (h.tinggiU) lbl([c[0] + R + 8 + h.tinggiU.teks.length * 2.9, c[1] - Tg / 2], h.tinggiU.teks);
  } else {
    const puncak: P = [c[0], c[1] - Tg];
    isi.push(garis(puncak, [c[0] - R, c[1]]), garis(puncak, [c[0] + R, c[1]]));
    if (h.tinggiU) {
      isi.push(garis(puncak, c, PUTUS), busur(c, puncak, [c[0] + R, c[1]], "", 0, true));
      lbl([c[0] - 8 - h.tinggiU.teks.length * 2.9, c[1] - Tg / 2], h.tinggiU.teks);
    }
    if (h.pelukis) lbl([c[0] + R / 2 + 10 + h.pelukis.teks.length * 2.9, c[1] - Tg / 2], h.pelukis.teks);
  }
  isi.push(`<circle cx="${c[0]}" cy="${r1(c[1])}" r="2.5" fill="#000"/>`);
  if (h.diameter) {
    isi.push(garis([c[0] - R, c[1]], [c[0] + R, c[1]], PUTUS));
    lbl([c[0] - R / 2, c[1] + 13], h.diameter.teks);
  }
  if (rTeks || !h.diameter) {
    isi.push(garis(c, [c[0] + R, c[1]], PUTUS));
    if (rTeks) lbl([c[0] + R / 2, c[1] + 13], rTeks);
  }
  return { isi: isi.join(""), tinggi: c[1] + ry + 22 };
}

export function svgRuang(isi: string[][], judul: string): string | null {
  const b = baca(isi);
  if (typeof b === "string") return null;
  const atas = judul ? 26 : 4;
  const g = "titik" in b ? gambarBentuk(b, atas) : gambarBulat(b, atas);
  const t = Math.ceil(g.tinggi);
  const kepala = judul ? `<text x="${LEBAR / 2}" y="18" text-anchor="middle" font-size="13" font-weight="bold">${esc(judul)}</text>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${t}" viewBox="0 0 ${LEBAR} ${t}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000">` +
    `<rect width="${LEBAR}" height="${t}" fill="#fff"/>${kepala}${g.isi}</svg>`
  );
}

