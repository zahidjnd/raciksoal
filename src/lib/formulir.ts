/**
 * Formulir gambar (0.61.0): pengganti "isi tabel abu-abu" untuk jenis yang isinya "satu bangun" (tabel 2 kolom
 * Bagian | Isi). Tiap jenis = RESEP yang membaca baris tabel lalu menghasilkan daftar ISIAN (pilihan, angka + satuan +
 * centang "ditanyakan", centang, keterangan, kelompok berulang). Tiap isian membawa fungsi `ubah` yang mengembalikan
 * baris tabel BARU, jadi isi tersimpan tetap tabel + penanda yang sama (AI, Word, pemeriksa tidak berubah).
 * Baris yang tidak dikenali resep (mis. tulisan AI yang aneh) dilaporkan sebagai `sisa`, tidak dibuang diam-diam.
 * Fungsi murni: bisa dites tanpa browser (formulir.test.mts).
 */
import { CONTOH_BANGUN, normal } from "./bangun.ts";
import { CONTOH_RUANG } from "./ruang.ts";
import { bacaAngka } from "./skala.ts";
import { jenisKomp, konfigurasiBohr } from "./skema.ts";
import { bacaNama, WARIS } from "./agama.ts";

/** Satu baris tabel tanpa baris judul; banyak kolom mengikuti jenisnya (`KOLOM`: 1–3). */
export type Baris = string[];
export type Isian =
  | { t: "pilih"; label: string; opsi: [string, string][]; nilai: string; ubah: (v: string) => Baris[]; kartu?: boolean; kunci?: string }
  | {
      t: "isi";
      label: string;
      kunci?: string;
      nilai: string;
      ubah: (v: string) => Baris[];
      satuan?: string;
      contoh?: string;
      angka?: boolean;
      tanya?: { aktif: boolean; ubah: (b: boolean) => Baris[] };
      /** Pilihan siap pakai, tetap boleh mengetik sendiri (datalist). */
      saran?: string[];
    }
  | { t: "centang"; label: string; nilai: boolean; ubah: (b: boolean) => Baris[] }
  | { t: "info"; teks: string }
  | { t: "kelompok"; label: string; isian: Isian[]; aksi?: { label: string; judul: string; jalankan: () => Baris[] }[]; grid?: boolean }
  | { t: "tombol"; label: string; jalankan: () => Baris[] }
  /** Lembar data seperti Excel (grafik data): sel per baris, tombol per baris, tempel tabel di sel mana pun. */
  | { t: "lembar"; kolom: { label: string; angka: boolean }[]; isi: string[][]; ubah: (i: number, j: number, v: string) => Baris[]; aksi: (i: number) => { label: string; judul: string; jalankan: () => Baris[] }[]; tempel: (teks: string) => Baris[] | string }
  /** Kotak tempel teks; `jalankan` mengembalikan tabel baru atau kalimat kenapa ditolak. */
  | { t: "tempel"; label: string; petunjuk: string; jalankan: (teks: string) => Baris[] | string }
  /** Satu kotak bagan pohon: menjorok sesuai tingkat, nama bisa diubah, tombol + cabang / ↑ / ↓ / ✕. */
  | { t: "simpul"; tingkat: number; nomor?: string; nilai: string; contoh?: string; ubah: (v: string) => Baris[]; tanya: { aktif: boolean; ubah: (b: boolean) => Baris[] }; aksi: { label: string; judul: string; jalankan: () => Baris[] }[] };

// ---------- alat bantu baris ----------

/** Kunci satu huruf ("F" tarik vs "f" gesek) dibandingkan persis; selain itu tanpa beda huruf besar/spasi/tanda hubung. */
const sama = (k: string, kunci: string) => (/^[A-Za-z]$/.test(kunci) ? k.trim() === kunci : normal(k) === normal(kunci));
const salin = (b: Baris[]) => b.map((x) => [...x]);
const cariDi = (b: Baris[], kunci: string | string[]) => {
  for (const k of [kunci].flat()) {
    const i = b.findIndex((x) => sama(x[0], k));
    if (i >= 0) return i;
  }
  return -1;
};
/** Tulis nilai di baris berkunci itu (atau tambah baris baru); nilai kosong = baris dibuang. */
export function pasangDi(baris: Baris[], kunci: string | string[], v: string): Baris[] {
  const b = salin(baris);
  const i = cariDi(b, kunci);
  if (!v.trim()) {
    if (i >= 0) b.splice(i, 1);
    return b;
  }
  if (i >= 0) b[i][1] = v;
  else b.push([[kunci].flat()[0], v]);
  return b;
}
const ubahBaris = (baris: Baris[], i: number, ganti: Baris | null) => {
  const b = salin(baris);
  if (ganti) b[i] = ganti;
  else b.splice(i, 1);
  return b;
};
const tukar = (baris: Baris[], i: number, j: number) => {
  const b = salin(baris);
  [b[i], b[j]] = [b[j], b[i]];
  return b;
};
const tanpaJudul = (t: string[][]): Baris[] => t.slice(1).map((b) => [b[0] ?? "", b[1] ?? ""]);
const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ANGKA = /^-?\s*\d+(?:[.,]\d+)?$/;
const angkaDari = (v: string) => {
  const m = /-?\d+(?:[.,]\d+)?/.exec(v);
  return m ? bacaAngka(m[0]) : NaN;
};
const tampilAngka = (n: number) => (Math.round(n * 100) / 100).toLocaleString("id-ID", { maximumFractionDigits: 2 });

function denganSatuan(v: string, satuan?: string) {
  const t = v.trim();
  if (!t || !satuan || !ANGKA.test(t)) return t;
  return satuan === "°" ? `${t}°` : `${t} ${satuan}`;
}
function tanpaSatuan(v: string, satuan?: string) {
  const t = v.trim();
  if (!satuan) return t;
  const s = satuan === "°" ? t.replace(/\s*°$/, "") : t.endsWith(satuan) ? t.slice(0, -satuan.length).trim() : t;
  return ANGKA.test(s) ? s : t;
}

/** Pembuat formulir untuk satu keadaan tabel: mencatat baris mana yang sudah "dipakai" isian. */
function pembuat(baris: Baris[]) {
  const dipakai = new Set<number>();
  const cari = (kunci: string | string[]) => {
    const i = cariDi(baris, kunci);
    if (i >= 0) dipakai.add(i);
    return i;
  };
  const nilai = (kunci: string | string[]) => {
    const i = cari(kunci);
    return i >= 0 ? baris[i][1] : "";
  };
  const pasang = (kunci: string | string[], v: string) => pasangDi(baris, kunci, v);
  /** Baris yang belum dipakai & cocok → dipakai kelompok berulang (indeks asli). */
  const daftar = (cocok: (b: Baris) => boolean) => {
    const idx = baris.map((_, i) => i).filter((i) => !dipakai.has(i) && cocok(baris[i]));
    idx.forEach((i) => dipakai.add(i));
    return idx;
  };
  return { baris, dipakai, cari, nilai, pasang, daftar };
}
type Pb = ReturnType<typeof pembuat>;

function isi(p: Pb, label: string, kunci: string | string[], o: { satuan?: string; contoh?: string; tanya?: boolean; angka?: boolean; tulis?: (v: string) => string } = {}): Isian {
  const v = p.nilai(kunci);
  const ditanya = v.trim() === "?";
  return {
    t: "isi",
    label,
    kunci: [kunci].flat()[0],
    nilai: ditanya ? "" : tanpaSatuan(v, o.satuan),
    satuan: o.satuan,
    contoh: o.contoh,
    angka: o.angka ?? !!o.satuan,
    ubah: (x) => p.pasang(kunci, o.tulis ? o.tulis(x) : denganSatuan(x, o.satuan)),
    tanya: o.tanya ? { aktif: ditanya, ubah: (b) => p.pasang(kunci, b ? "?" : "") } : undefined,
  };
}
function pilih(p: Pb, label: string, kunci: string, opsi: [string, string][], o: { kartu?: boolean; ganti?: (v: string) => Baris[] } = {}): Isian {
  const v = p.nilai(kunci);
  return { t: "pilih", label, opsi, kartu: o.kartu, nilai: opsi.find(([n]) => normal(n) === normal(v))?.[0] ?? "", ubah: (x) => (o.ganti ? o.ganti(x) : p.pasang(kunci, x)) };
}
function centang(p: Pb, label: string, kunci: string, ya: string, aktif: RegExp): Isian {
  return { t: "centang", label, nilai: aktif.test(p.nilai(kunci)), ubah: (b) => p.pasang(kunci, b ? ya : "") };
}
const info = (teks: string): Isian => ({ t: "info", teks });

/** Satuan panjang bersama (cm/m/...): dibaca dari angka yang ada; diganti = semua angka panjang ikut berganti. */
function satuanPanjang(p: Pb): { u: string; isian: Isian } {
  const SATUAN = ["cm", "m", "dm", "mm", "km", "satuan"];
  const pola = /^(-?\d+(?:[.,]\d+)?)\s*(mm|cm|dm|km|m|satuan)$/;
  const u = p.baris.map((b) => pola.exec(b[1].trim())?.[2]).find(Boolean) ?? "cm";
  return {
    u,
    isian: {
      t: "pilih",
      label: "Satuan panjang",
      opsi: SATUAN.map((s) => [s, s]),
      nilai: u,
      ubah: (baru) => p.baris.map(([k, v]) => [k, v.trim().replace(pola, (_, n) => `${n} ${baru}`)] as Baris),
    },
  };
}

// ---------- resep ----------

const DATAR = ["segitiga", "segitiga siku-siku", "segitiga sama kaki", "segitiga sama sisi", "persegi", "persegi panjang", "jajargenjang", "trapesium", "trapesium siku-siku", "trapesium sama kaki", "belah ketupat", "layang-layang", "lingkaran"];

function resepDatar(p: Pb): Isian[] {
  const bangun = DATAR.find((d) => normal(d) === normal(p.nilai("bangun"))) ?? "segitiga";
  const out: Isian[] = [pilih(p, "Bangun", "bangun", DATAR.map((d) => [d, kapital(d)]), { ganti: (v) => tanpaJudul(CONTOH_BANGUN[v]) })];
  const sat = satuanPanjang(p);
  out.push(sat.isian);
  const bawaan = bangun === "lingkaran" ? "O, A, B" : bangun.startsWith("segitiga") ? "A, B, C" : "A, B, C, D";
  const tulisanTitik = p.nilai("titik");
  const nama = (tulisanTitik || bawaan).split(/[\s,;]+/).filter(Boolean);
  const [A, B, C, D] = nama.length >= 3 ? nama : bawaan.split(", ");
  const sisi = (label: string, x: string, y: string) => isi(p, `${label} ${x}${y}`, [x + y, y + x], { satuan: sat.u, tanya: true });
  const sudut = (x: string, label = `Sudut ${x}`) => isi(p, label, [`sudut ${x}`, `∠${x}`], { satuan: "°", tanya: true, contoh: "kosong = tidak ditulis" });
  const tinggi = () => isi(p, "Tinggi (garis putus-putus)", ["tinggi", "t"], { satuan: sat.u, tanya: true, contoh: "kosong = tidak digambar" });
  /** Dua sisi sama panjang ditulis sekaligus (kaki sama kaki). */
  const kembar = (label: string, k1: string, k2: string): Isian => {
    const a = isi(p, label, [k1, k1.split("").reverse().join("")], { satuan: sat.u, tanya: true });
    p.cari([k2, k2.split("").reverse().join("")]);
    if (a.t !== "isi") return a;
    const tulis = (b: Baris[], v: string) => pasangDi(b, [k2, k2.split("").reverse().join("")], v);
    return {
      ...a,
      ubah: (x: string) => tulis(a.ubah(x), denganSatuan(x, sat.u)),
      tanya: { aktif: a.tanya!.aktif, ubah: (bb: boolean) => tulis(a.tanya!.ubah(bb), bb ? "?" : "") },
    };
  };
  switch (bangun) {
    case "segitiga":
      out.push(sisi("Sisi", A, B), sisi("Sisi", B, C), sisi("Sisi", A, C), sudut(A), sudut(B), sudut(C), tinggi());
      break;
    case "segitiga siku-siku": {
      // "siku-siku di titik ..." = baris "sudut X | siku-siku"
      const sikuIdx = p.baris.map((b, i) => i).filter((i) => /^(sudut|∠)\s*\S$/i.test(p.baris[i][0].trim()) && /siku|^90/.test(p.baris[i][1]));
      sikuIdx.forEach((i) => p.dipakai.add(i));
      const di = sikuIdx.length ? p.baris[sikuIdx[0]][0].trim().slice(-1) : "";
      out.push({
        t: "pilih",
        label: "Siku-siku di titik",
        opsi: [A, B, C].map((x) => [x, x]),
        nilai: di,
        ubah: (v) => {
          // sisi miring ikut pindah (di depan sudut siku): angkanya diganti "?" supaya ukuran lama tidak bertentangan
          const b = [...p.baris.filter((_, i) => !sikuIdx.includes(i)).map((x) => [x[0], x[1]] as Baris), [`sudut ${v}`, "siku-siku"] as Baris];
          const [m1, m2] = [A, B, C].filter((x) => x !== v);
          return v === di ? b : pasangDi(b, [m1 + m2, m2 + m1], "?");
        },
      });
      out.push(sisi("Sisi", A, B), sisi("Sisi", B, C), sisi("Sisi", A, C));
      break;
    }
    case "segitiga sama kaki":
      out.push(sisi("Alas", A, B), kembar(`Kaki ${A}${C} = ${B}${C}`, A + C, B + C), sudut(A, `Sudut alas ${A}`), tinggi());
      break;
    case "segitiga sama sisi":
      out.push(sisi("Sisi", A, B), sudut(A), tinggi());
      break;
    case "persegi":
      out.push(sisi("Sisi", A, B), sisi("Diagonal", A, C));
      break;
    case "persegi panjang":
      out.push(sisi("Panjang", A, B), sisi("Lebar", B, C), sisi("Diagonal", A, C));
      break;
    case "jajargenjang":
      out.push(sisi("Alas", A, B), sisi("Sisi miring", A, D), tinggi(), sudut(A));
      break;
    case "trapesium":
      out.push(sisi("Alas bawah", A, B), sisi("Alas atas", C, D), tinggi(), sisi("Kaki kiri", A, D), sisi("Kaki kanan", B, C));
      break;
    case "trapesium siku-siku":
      out.push(sisi("Alas bawah", A, B), sisi("Alas atas", C, D), sisi("Sisi tegak", A, D), sisi("Sisi miring", B, C));
      break;
    case "trapesium sama kaki":
      out.push(sisi("Alas bawah", A, B), sisi("Alas atas", C, D), kembar(`Kaki ${A}${D} = ${B}${C}`, A + D, B + C), tinggi());
      break;
    case "belah ketupat":
      out.push(sisi("Diagonal mendatar", A, C), sisi("Diagonal tegak", B, D), sisi("Sisi", A, B));
      break;
    case "layang-layang":
      out.push(sisi("Diagonal mendatar", A, C), sisi("Diagonal tegak", B, D), sisi("Sisi pendek", A, D), sisi("Sisi panjang", A, B));
      break;
    case "lingkaran":
      out.push(
        info("Isi jari-jari ATAU diameter. Juring (daerah berarsir) tidak bisa bersama diameter."),
        isi(p, "Jari-jari", ["jari-jari", "r"], { satuan: sat.u, tanya: true }),
        isi(p, "Diameter", ["diameter", "d"], { satuan: sat.u, tanya: true }),
        isi(p, "Sudut pusat juring", ["juring", "sudut pusat"], { satuan: "°", tanya: true, contoh: "kosong = tanpa juring" }),
      );
      break;
  }
  // nama titik: diganti → kunci sisi & sudut ikut berganti huruf
  const lama = nama.length >= 3 ? nama : bawaan.split(", ");
  p.cari("titik");
  out.push({
    t: "isi",
    label: "Nama titik (urut, dipisah koma)",
    nilai: tulisanTitik,
    contoh: bawaan,
    ubah: (x) => {
      const baru = x.split(/[\s,;]+/).filter(Boolean);
      const peta = new Map(lama.map((h, i) => [h, baru[i] ?? h]));
      const ganti = (k: string) => (/^[A-Za-z]{2}$/.test(k.trim()) ? k.trim().split("").map((h) => peta.get(h) ?? h).join("") : k.replace(/^(sudut\s*|∠)([A-Za-z])$/i, (_, a, h) => a + (peta.get(h) ?? h)));
      const b = p.baris.map(([k, v]) => [ganti(k), v] as Baris);
      return pasangDi(b, "titik", baru.join(", ") === bawaan ? "" : x);
    },
  });
  return out;
}

const RUANG = ["kubus", "balok", "prisma segitiga", "limas segiempat", "limas segitiga", "tabung", "kerucut", "bola"];
const SIMPUL: Record<string, string> = { kubus: "ABCDEFGH", balok: "ABCDEFGH", "prisma segitiga": "ABCDEF", "limas segiempat": "TABCD", "limas segitiga": "TABC" };
const RUSUK: Record<string, string[]> = {
  kubus: ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"],
  balok: ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"],
  "prisma segitiga": ["AB", "BC", "CA", "DE", "EF", "FD", "AD", "BE", "CF"],
  "limas segiempat": ["AB", "BC", "CD", "DA", "TA", "TB", "TC", "TD"],
  "limas segitiga": ["AB", "BC", "CA", "TA", "TB", "TC"],
};

function resepRuang(p: Pb): Isian[] {
  const bangun = RUANG.find((d) => normal(d) === normal(p.nilai("bangun"))) ?? "kubus";
  const out: Isian[] = [pilih(p, "Bangun", "bangun", RUANG.map((d) => [d, kapital(d)]), { ganti: (v) => tanpaJudul(CONTOH_RUANG[v]) })];
  const sat = satuanPanjang(p);
  out.push(sat.isian);
  const L = (label: string, k: string | string[]) => isi(p, label, k, { satuan: sat.u, tanya: true });
  const rus = (label: string, xy: string) => L(`${label} ${xy}`, [xy, xy[1] + xy[0]]);
  switch (bangun) {
    case "kubus":
      out.push(L("Panjang rusuk", ["rusuk", "sisi"]));
      break;
    case "balok":
      out.push(rus("Panjang", "AB"), rus("Lebar", "BC"), rus("Tinggi", "AE"));
      break;
    case "prisma segitiga":
      out.push(rus("Sisi alas", "AB"), rus("Sisi alas", "BC"), rus("Sisi alas", "AC"), rus("Tinggi prisma", "AD"));
      break;
    case "limas segiempat":
      out.push(rus("Sisi alas", "AB"), rus("Sisi alas", "BC"), L("Tinggi limas", ["tinggi", "t"]), rus("Rusuk tegak", "TA"));
      break;
    case "limas segitiga":
      out.push(rus("Sisi alas", "AB"), rus("Sisi alas", "BC"), rus("Sisi alas", "AC"), L("Tinggi limas", ["tinggi", "t"]), rus("Rusuk tegak", "TA"));
      break;
    case "tabung":
      out.push(info("Isi jari-jari ATAU diameter."), L("Jari-jari", ["jari-jari", "r"]), L("Diameter", ["diameter", "d"]), L("Tinggi", ["tinggi", "t"]));
      break;
    case "kerucut":
      out.push(L("Jari-jari", ["jari-jari", "r"]), L("Tinggi", ["tinggi", "t"]), L("Garis pelukis", ["garis pelukis", "s"]));
      break;
    case "bola":
      out.push(info("Isi jari-jari ATAU diameter."), L("Jari-jari", ["jari-jari", "r"]), L("Diameter", ["diameter", "d"]));
      break;
  }
  const simpul = SIMPUL[bangun];
  if (!simpul) return out;
  // titik tengah rusuk
  const tengah = p.daftar(([k, v]) => /^titik\s+[A-Za-z]$/i.test(k.trim()) && /tengah/i.test(v));
  const namaTengah = tengah.map((i) => p.baris[i][0].trim().slice(-1));
  tengah.forEach((i, k) => {
    const rusukNya = /([A-Za-z])\s*([A-Za-z])\s*$/.exec(p.baris[i][1]);
    out.push({
      t: "kelompok",
      label: `Titik tengah ${namaTengah[k]}`,
      isian: [
        { t: "isi", label: "Nama titik", nilai: namaTengah[k], contoh: "P", ubah: (x) => ubahBaris(p.baris, i, [`titik ${x.trim().slice(0, 1) || namaTengah[k]}`, p.baris[i][1]]) },
        { t: "pilih", label: "Di tengah rusuk", opsi: RUSUK[bangun].map((r) => [r, r]), nilai: rusukNya ? RUSUK[bangun].find((r) => r === rusukNya[1] + rusukNya[2] || r === rusukNya[2] + rusukNya[1]) ?? "" : "", ubah: (r) => ubahBaris(p.baris, i, [p.baris[i][0], `tengah ${r}`]) },
      ],
      aksi: [{ label: "✕", judul: "Hapus titik tengah ini", jalankan: () => ubahBaris(p.baris, i, null) }],
    });
  });
  const semua = [...simpul.split(""), ...namaTengah];
  const bebas = "PQRSUVWXYZKLMN".split("").find((h) => !semua.includes(h)) ?? "P";
  out.push({ t: "tombol", label: "+ Titik tengah rusuk", jalankan: () => [...salin(p.baris), [`titik ${bebas}`, `tengah ${RUSUK[bangun][bangun === "kubus" || bangun === "balok" ? 7 : 0]}`]] });
  // garis tambahan (diagonal, jarak): dua nama titik yang belum dipakai isian ukuran
  const garis = p.daftar(([k]) => {
    const h = k.replace(/^(garis|diagonal|jarak|ruas)\s+/i, "").replace(/\s+/g, "");
    return h.length === 2 && h.split("").every((x) => semua.includes(x));
  });
  garis.forEach((i) => {
    const [k, v] = p.baris[i];
    const h = k.replace(/^(garis|diagonal|jarak|ruas)\s+/i, "").replace(/\s+/g, "");
    const ditanya = v.trim() === "?";
    out.push({
      t: "kelompok",
      label: `Garis ${h}`,
      grid: true,
      isian: [
        { t: "pilih", label: "Dari titik", opsi: semua.filter((x) => x !== h[1]).map((x) => [x, x]), nilai: h[0], ubah: (x) => ubahBaris(p.baris, i, [x + h[1], v]) },
        { t: "pilih", label: "Ke titik", opsi: semua.filter((x) => x !== h[0]).map((x) => [x, x]), nilai: h[1], ubah: (x) => ubahBaris(p.baris, i, [h[0] + x, v]) },
        {
          t: "isi",
          label: "Panjang",
          kunci: h,
          nilai: ditanya ? "" : tanpaSatuan(v, sat.u),
          satuan: sat.u,
          angka: true,
          ubah: (x) => ubahBaris(p.baris, i, [k, denganSatuan(x, sat.u) || "?"]),
          tanya: { aktif: ditanya, ubah: (b) => ubahBaris(p.baris, i, [k, b ? "?" : ""]) },
        },
      ],
      aksi: [{ label: "✕", judul: "Hapus garis ini", jalankan: () => ubahBaris(p.baris, i, null) }],
    });
  });
  const ada = new Set(garis.map((i) => p.baris[i][0].replace(/\s+/g, "")));
  const usul = semua.flatMap((a, i) => semua.slice(i + 1).map((b) => a + b)).find((x) => !RUSUK[bangun].includes(x) && !RUSUK[bangun].includes(x[1] + x[0]) && !ada.has(x)) ?? "AC";
  out.push({ t: "tombol", label: "+ Garis tambahan (diagonal / jarak)", jalankan: () => [...salin(p.baris), [usul, "?"]] });
  return out;
}

const BENTUK_SUDUT: [string, string][] = [
  ["sudut", "Satu sudut"],
  ["berpelurus", "Berpelurus (jumlah 180°)"],
  ["berpenyiku", "Berpenyiku (jumlah 90°)"],
  ["bertolak belakang", "Bertolak belakang (dua garis berpotongan)"],
  ["sejajar", "Dua garis sejajar dipotong garis lain"],
];
/** Isian sudut: angka (diberi °), huruf (x), atau bentuk aljabar ("2x + 10" → "2x + 10°"). */
const isiSudut = (p: Pb, label: string, kunci: string) =>
  isi(p, label, kunci, { tanya: true, contoh: "65 atau x", tulis: (x) => (/\d$/.test(x.trim()) ? `${x.trim()}°` : x), satuan: "°", angka: false });

function resepSudut(p: Pb): Isian[] {
  const bentuk = BENTUK_SUDUT.find(([b]) => normal(b) === normal(p.nilai(["bentuk", "bangun"])))?.[0] ?? "sudut";
  const out: Isian[] = [pilih(p, "Bentuk", "bentuk", BENTUK_SUDUT, { kartu: true, ganti: (v) => tanpaJudul(CONTOH_BANGUN[v]) })];
  const empat = (label: string, awalan: string): Isian => ({
    t: "kelompok",
    label,
    grid: true,
    isian: [
      isiSudut(p, `${awalan}2 (kiri atas)`, `sudut ${awalan}2`),
      isiSudut(p, `${awalan}1 (kanan atas)`, `sudut ${awalan}1`),
      isiSudut(p, `${awalan}3 (kiri bawah)`, `sudut ${awalan}3`),
      isiSudut(p, `${awalan}4 (kanan bawah)`, `sudut ${awalan}4`),
    ],
  });
  if (bentuk === "sudut") {
    const titik = (p.nilai("titik") || "A, B, C").split(/[\s,;]+/).filter(Boolean);
    const kunciAda = p.baris.find(([k]) => /^(sudut|∠)/i.test(k.trim()))?.[0] ?? `sudut ${titik[1] ?? "B"}`;
    out.push(isi(p, "Nama titik (ujung, puncak, ujung)", "titik", { contoh: "A, B, C" }), isiSudut(p, `Besar sudut ${titik[1] ?? "B"}`, kunciAda));
  } else if (bentuk === "berpelurus" || bentuk === "berpenyiku") {
    out.push(info(bentuk === "berpelurus" ? "Sudut 1 di kanan, sudut 2 di kiri; jumlahnya 180°." : "Sudut 1 di bawah, sudut 2 di atas; jumlahnya 90°."), isiSudut(p, "Sudut 1", "sudut 1"), isiSudut(p, "Sudut 2", "sudut 2"));
  } else if (bentuk === "bertolak belakang") {
    out.push(info("Isi sudut di posisinya (kosongkan yang tidak ditulis)."), empat("Sudut di titik potong", ""));
  } else {
    const [a, b] = (p.nilai("titik") || "A, B").split(/[\s,;]+/).filter(Boolean);
    out.push(
      isi(p, "Nama titik potong (atas, bawah)", "titik", { contoh: "A, B" }),
      info("Isi sudut di posisinya (kosongkan yang tidak ditulis). Sehadap: A1 = B1; dalam berseberangan: A3 = B1; dalam sepihak: A3 + B2 = 180°."),
      empat(`Titik potong atas (${a ?? "A"})`, a ?? "A"),
      empat(`Titik potong bawah (${b ?? "B"})`, b ?? "B"),
    );
  }
  return out;
}

const ALAT: [string, string][] = [
  ["cermin cekung", "Cermin cekung"],
  ["cermin cembung", "Cermin cembung"],
  ["lensa cembung", "Lensa cembung"],
  ["lensa cekung", "Lensa cekung"],
];
/** Hasil rumus 1/f = 1/s + 1/s' (bantuan guru, juga untuk "tulis angka hasil hitung"). */
export function hitungOptik(alat: string, f: number, s: number, h?: number) {
  if (!(f > 0 && s > 0)) return null;
  const cermin = alat.startsWith("cermin");
  const fe = /cekung/.test(alat) === cermin ? f : -f;
  if (Math.abs(s - fe) < 1e-9) return { tak: true as const };
  const si = (s * fe) / (s - fe);
  const M = Math.abs(si / s);
  return { tak: false as const, si, M, hi: h !== undefined && Number.isFinite(h) ? M * h : undefined, sifat: `${si > 0 ? "nyata, terbalik" : "maya, tegak"}, ${M > 1 + 1e-9 ? "diperbesar" : M < 1 - 1e-9 ? "diperkecil" : "sama besar"}` };
}

function resepOptik(p: Pb): Isian[] {
  const alat = ALAT.find(([a]) => normal(a) === normal(p.nilai(["alat", "jenis"])))?.[0] ?? "lensa cembung";
  const sat = satuanPanjang(p);
  const out: Isian[] = [pilih(p, "Alat", "alat", ALAT, { kartu: true }), sat.isian];
  if (alat.startsWith("cermin")) out.push(info("Isi fokus ATAU jari-jari kelengkungan (fokus = setengah jari-jari)."));
  out.push(isi(p, "Jarak fokus (f)", ["fokus", "jarak fokus", "f"], { satuan: sat.u }));
  if (alat.startsWith("cermin")) out.push(isi(p, "Jari-jari kelengkungan (R)", ["jari-jari", "r"], { satuan: sat.u }));
  out.push(isi(p, "Jarak benda (s)", ["jarak benda", "s", "so"], { satuan: sat.u }), isi(p, "Tinggi benda (h)", ["tinggi benda", "h", "ho"], { satuan: sat.u, contoh: "kosong = tidak ditulis" }));
  out.push(centang(p, "Sembunyikan bayangan dan sinarnya (bila letak/sifat bayangan yang ditanyakan)", "bayangan", "sembunyi", /sembunyi|tidak|tanpa/i));
  const f = angkaDari(p.nilai(["fokus", "jarak fokus", "f"])) || angkaDari(p.nilai(["jari-jari", "r"])) / 2;
  const s = angkaDari(p.nilai(["jarak benda", "s", "so"]));
  const h = angkaDari(p.nilai(["tinggi benda", "h", "ho"]));
  const hasil = hitungOptik(alat, f, s, Number.isFinite(h) ? h : undefined);
  if (hasil?.tak) out.push(info("Benda tepat di titik fokus: bayangan di tak hingga (tidak terbentuk)."));
  else if (hasil) out.push(info(`Hasil hitung (untuk guru): jarak bayangan s' = ${tampilAngka(Math.abs(hasil.si))} ${sat.u}${hasil.si < 0 ? " (maya)" : ""}; perbesaran ${tampilAngka(hasil.M)} kali${hasil.hi !== undefined ? `; tinggi bayangan ${tampilAngka(hasil.hi)} ${sat.u}` : ""}; sifat: ${hasil.sifat}.`));
  const tulisan = (label: string, kunci: string[], nilaiHasil: string | null) => {
    const v = p.nilai(kunci).trim();
    return {
      t: "pilih" as const,
      label: `Tulis ${label} di gambar`,
      opsi: [["", "Tidak"], ["?", "Sebagai ? (ditanyakan)"], ...(nilaiHasil ? [["hasil", `Angka hasil hitung (${nilaiHasil})`]] : [])] as [string, string][],
      nilai: !v ? "" : v === "?" ? "?" : "hasil",
      ubah: (x: string) => p.pasang(kunci, x === "hasil" ? (nilaiHasil ?? "") : x),
    };
  };
  const ok = hasil && !hasil.tak ? hasil : null;
  out.push(
    tulisan("jarak bayangan", ["jarak bayangan", "s'", "si"], ok ? `${tampilAngka(Math.abs(ok.si))} ${sat.u}` : null),
    tulisan("tinggi bayangan", ["tinggi bayangan", "h'", "hi"], ok?.hi !== undefined ? `${tampilAngka(ok.hi)} ${sat.u}` : null),
    tulisan("perbesaran", ["perbesaran", "m"], ok ? `${tampilAngka(ok.M)} kali` : null),
  );
  return out;
}

/** Isi gaya "20 N, 37°, ke kiri" → bagian-bagiannya (sama dengan pembaca di fisika.ts). */
const pecahGaya = (v: string) => ({
  sudut: /(-?\d+(?:[.,]\d+)?)\s*°/.exec(v)?.[1] ?? "",
  arah: /ke\s+(atas|bawah|kiri|kanan)/i.exec(v)?.[1].toLowerCase() ?? "",
  label: v.replace(/,?\s*-?\d+(?:[.,]\d+)?\s*°/, "").replace(/,?\s*ke\s+(atas|bawah|kiri|kanan)/i, "").trim(),
});
const susunGaya = (label: string, sudut: string, arah: string) => [label.trim(), sudut.trim() ? `${sudut.trim()}°` : "", arah ? `ke ${arah}` : ""].filter(Boolean).join(", ");

function resepGaya(p: Pb): Isian[] {
  const bidang = p.nilai("bidang");
  const miring = /miring/i.test(bidang);
  const sudutBidang = /(\d+(?:[.,]\d+)?)/.exec(bidang)?.[1] ?? "30";
  const out: Isian[] = [
    { t: "pilih", label: "Bidang", kartu: true, opsi: [["datar", "Bidang datar"], ["miring", "Bidang miring"]], nilai: miring ? "miring" : "datar", ubah: (v) => (v === "miring" ? p.pasang("bidang", `miring ${sudutBidang}°`) : pasangDi(p.pasang("bidang", "datar"), "uraian", "")) },
  ];
  if (miring) out.push({ t: "isi", label: "Sudut kemiringan", nilai: sudutBidang, satuan: "°", angka: true, ubah: (x) => p.pasang("bidang", `miring ${x.trim() || "30"}°`) });
  out.push(isi(p, "Tulisan di balok", ["benda", "balok"], { contoh: "m = 5 kg" }));
  const gaya = (judul: string, kunci: string[], bawaan: string, o: { sudut?: boolean; arah?: [string, string][] }) => {
    const i = p.cari(kunci);
    const v = i >= 0 ? p.baris[i][1] : "";
    const g = pecahGaya(v);
    const tulis = (label: string, sudut: string, arah: string) => p.pasang(kunci, susunGaya(label || bawaan, sudut, arah));
    out.push({ t: "centang", label: judul, nilai: i >= 0, ubah: (b) => p.pasang(kunci, b ? bawaan : "") });
    if (i < 0) return;
    const isian: Isian[] = [{ t: "isi", label: "Tulisan / besar", nilai: g.label, contoh: bawaan, ubah: (x) => tulis(x, g.sudut, g.arah) }];
    if (o.sudut) isian.push({ t: "isi", label: "Sudut terhadap bidang", nilai: g.sudut, satuan: "°", angka: true, contoh: "0", ubah: (x) => tulis(g.label, x, g.arah) });
    if (o.arah) isian.push({ t: "pilih", label: "Arah", opsi: o.arah, nilai: g.arah, ubah: (x) => tulis(g.label, g.sudut, x) });
    out.push({ t: "kelompok", label: judul, isian, grid: true });
  };
  gaya("Gaya berat (w)", ["berat", "w"], "w", {});
  gaya("Gaya normal (N)", ["normal", "N"], "N", {});
  gaya("Gaya gesek (f)", ["gesek", "gesekan", "f", "fs", "fk"], "f", { arah: [["", "Otomatis (melawan gaya tarik)"], ...((miring ? [["atas", "Ke atas bidang"], ["bawah", "Ke bawah bidang"]] : [["kiri", "Ke kiri"], ["kanan", "Ke kanan"]]) as [string, string][])] });
  gaya("Gaya tarik (F)", ["F"], "F", { sudut: true, arah: [["", miring ? "Ke atas bidang" : "Ke kanan"], [miring ? "bawah" : "kiri", miring ? "Ke bawah bidang" : "Ke kiri"]] });
  if (miring) out.push(centang(p, "Tampilkan uraian w sin θ dan w cos θ (putus-putus)", "uraian", "ya", /ya|iya|tampil/i));
  return out;
}

const KATROL: [string, string][] = [
  ["tetap", "Katrol tetap (dua beban tergantung)"],
  ["bebas", "Katrol bebas (beban di katrol bergerak)"],
  ["meja", "Balok di meja + beban tergantung"],
];
function resepKatrol(p: Pb): Isian[] {
  const bentuk = KATROL.find(([b]) => normal(b) === normal(p.nilai(["bentuk", "jenis"]).replace(/katrol/i, "")))?.[0] ?? "tetap";
  // ganti bentuk: isian disusun ulang, angka beban yang sudah diisi dibawa
  const [m1, m2, F] = [p.nilai(["m1", "m"]) || "2 kg", p.nilai(["m2"]) || "3 kg", p.nilai(["F", "kuasa"])];
  const out: Isian[] = [
    pilih(p, "Bentuk", "bentuk", KATROL, {
      kartu: true,
      ganti: (v) =>
        v === "bebas"
          ? [["bentuk", v], ["m1", m1], ["F", F || "F"]]
          : ([["bentuk", v], ["m1", m1], ["m2", m2], ...(v === "meja" ? [["meja", "licin"]] : F ? [["F", F]] : [])] as Baris[]),
    }),
  ];
  const t = (label: string, kunci: string[], contoh: string) => isi(p, label, kunci, { tanya: true, contoh });
  if (bentuk === "tetap") out.push(t("Beban kiri (m1)", ["m1"], "2 kg"), t("Beban kanan (m2)", ["m2"], "3 kg"), t("Gaya tarik F (bila hanya satu beban)", ["F", "kuasa"], "kosong = tanpa gaya tarik"));
  else if (bentuk === "bebas") out.push(t("Beban (m)", ["m1", "m"], "40 N"), t("Gaya tarik F", ["F", "kuasa"], "F"));
  else {
    out.push(t("Balok di meja (m1)", ["m1"], "4 kg"), t("Beban tergantung (m2)", ["m2"], "2 kg"));
    const meja = p.nilai(["meja", "permukaan"]);
    const kasar = /kasar/i.test(meja);
    const mu = /μ\s*=\s*([\d.,]+)/.exec(meja)?.[1] ?? "";
    out.push({ t: "pilih", label: "Permukaan meja", opsi: [["licin", "Licin"], ["kasar", "Kasar"], ["", "Tidak ditulis"]], nilai: kasar ? "kasar" : /licin/i.test(meja) ? "licin" : "", ubah: (v) => p.pasang(["meja", "permukaan"], v === "kasar" ? `kasar${mu ? `, μ = ${mu}` : ""}` : v) });
    if (kasar) out.push({ t: "isi", label: "Koefisien gesek μ", nilai: mu, angka: true, contoh: "0,2 (kosong = tidak ditulis)", ubah: (x) => p.pasang(["meja", "permukaan"], x.trim() ? `kasar, μ = ${x.trim()}` : "kasar") });
    out.push(t("Gaya tarik F pada balok (opsional)", ["F", "kuasa"], "kosong = tanpa gaya tarik"));
  }
  return out;
}

const TUAS: [string, string][] = [
  ["1", "Jenis 1: titik tumpu di tengah (linggis, gunting)"],
  ["2", "Jenis 2: beban di tengah (gerobak, pembuka botol)"],
  ["3", "Jenis 3: kuasa di tengah (sekop, pinset)"],
];
function resepTuas(p: Pb): Isian[] {
  const j = /([123])/.exec(p.nilai("jenis"))?.[1] ?? "1";
  const out: Isian[] = [
    {
      ...pilih(p, "Jenis tuas", "jenis", TUAS, {
        kartu: true,
        // jenis 2: lengan kuasa > lengan beban; jenis 3: kebalikannya → lengan ditukar bila perlu, kuasa jadi "?"
        ganti: (v) => {
          let b = p.pasang("jenis", v);
          const [lb, lk] = [p.nilai(["lengan beban", "lb"]), p.nilai(["lengan kuasa", "lk"])];
          const [nb, nk] = [angkaDari(lb), angkaDari(lk)];
          if ((v === "2" && nb > nk) || (v === "3" && nk > nb)) {
            b = pasangDi(pasangDi(b, ["lengan beban", "lb"], lk), ["lengan kuasa", "lk"], lb);
            if (Number.isFinite(angkaDari(p.nilai(["kuasa", "f"])))) b = pasangDi(b, ["kuasa", "f"], "?");
          }
          return b;
        },
      }),
      nilai: j,
    } as Isian,
  ];
  out.push(
    isi(p, "Beban (W)", ["beban", "w"], { satuan: "N", tanya: true }),
    isi(p, "Kuasa (F)", ["kuasa", "f"], { satuan: "N", tanya: true }),
    isi(p, "Lengan beban", ["lengan beban", "lb"], { satuan: "m", tanya: true }),
    isi(p, "Lengan kuasa", ["lengan kuasa", "lk"], { satuan: "m", tanya: true }),
  );
  const [W, F, lb, lk] = [["beban", "w"], ["kuasa", "f"], ["lengan beban", "lb"], ["lengan kuasa", "lk"]].map((k) => angkaDari(p.nilai(k)));
  const kosong = [W, F, lb, lk].filter((x) => Number.isNaN(x)).length;
  if (kosong === 1) {
    const hasil = Number.isNaN(F) ? ["kuasa", (W * lb) / lk, "N"] : Number.isNaN(W) ? ["beban", (F * lk) / lb, "N"] : Number.isNaN(lb) ? ["lengan beban", (F * lk) / W, "m"] : ["lengan kuasa", (W * lb) / F, "m"];
    if (Number.isFinite(hasil[1] as number)) out.push(info(`Hasil hitung (untuk guru): ${hasil[0]} = ${tampilAngka(hasil[1] as number)} ${hasil[2]} (beban × lengan beban = kuasa × lengan kuasa).`));
  }
  return out;
}

/** 20 unsur pertama: lambang, nama, nomor atom, nomor massa (dibulatkan). */
const UNSUR: [string, string, number, number][] = [
  ["H", "Hidrogen", 1, 1], ["He", "Helium", 2, 4], ["Li", "Litium", 3, 7], ["Be", "Berilium", 4, 9], ["B", "Boron", 5, 11],
  ["C", "Karbon", 6, 12], ["N", "Nitrogen", 7, 14], ["O", "Oksigen", 8, 16], ["F", "Fluorin", 9, 19], ["Ne", "Neon", 10, 20],
  ["Na", "Natrium", 11, 23], ["Mg", "Magnesium", 12, 24], ["Al", "Aluminium", 13, 27], ["Si", "Silikon", 14, 28], ["P", "Fosfor", 15, 31],
  ["S", "Belerang", 16, 32], ["Cl", "Klorin", 17, 35], ["Ar", "Argon", 18, 40], ["K", "Kalium", 19, 39], ["Ca", "Kalsium", 20, 40],
];
function resepAtom(p: Pb): Isian[] {
  const lambang = p.nilai(["unsur", "lambang"]).trim();
  const z = Number(p.nilai(["nomor atom", "z"])) || UNSUR.find((u) => u[0] === lambang)?.[2] || 0;
  const el = UNSUR.find((u) => u[2] === z);
  const lain = !el && (z > 20 || !!p.nilai(["konfigurasi", "kulit"]));
  const sembunyi = /^(x|\?)$/i.test(lambang);
  const intiAda = !!p.nilai(["inti", "nukleon"]);
  const baris = (u: (typeof UNSUR)[number], sem: boolean, inti: boolean): Baris[] => [
    ["unsur", sem ? "X" : u[0]],
    ["nomor atom", String(u[2])],
    ...(inti ? ([["inti", `${u[2]}p, ${u[3] - u[2]}n`]] as Baris[]) : []),
  ];
  const out: Isian[] = [
    {
      t: "pilih",
      label: "Unsur",
      opsi: [...UNSUR.map((u) => [String(u[2]), `${u[0]} — ${u[1]} (nomor atom ${u[2]})`] as [string, string]), ["lain", "Unsur lain (nomor atom lebih dari 20)"]],
      nilai: el ? String(el[2]) : lain ? "lain" : "",
      ubah: (v) => (v === "lain" ? [["unsur", "Br"], ["nomor atom", "35"], ["konfigurasi", "2 8 18 7"]] : baris(UNSUR.find((u) => String(u[2]) === v)!, sembunyi, intiAda)),
    },
  ];
  if (lain || !el) {
    out.push(
      isi(p, "Lambang unsur", ["unsur", "lambang"], { contoh: "Br" }),
      isi(p, "Nomor atom", ["nomor atom", "z"], { angka: true, contoh: "35" }),
      isi(p, "Konfigurasi elektron (per kulit)", ["konfigurasi", "kulit"], { contoh: "2 8 18 7" }),
      isi(p, "Tulisan inti (opsional)", ["inti", "nukleon"], { contoh: "35p, 45n" }),
    );
    return out;
  }
  out.push(
    { t: "centang", label: "Sembunyikan lambang (inti bertuliskan X, untuk ditanyakan)", nilai: sembunyi, ubah: (b) => baris(el, b, intiAda) },
    { t: "centang", label: `Tulis isi inti (${el[2]} proton, ${el[3] - el[2]} neutron)`, nilai: intiAda, ubah: (b) => baris(el, sembunyi, b) },
    info(`Konfigurasi elektron (otomatis): ${konfigurasiBohr(el[2]).join(" ")}.`),
  );
  p.cari(["inti", "nukleon"]);
  p.cari(["konfigurasi", "kulit"]); // nomor atom ≤ 20: konfigurasi dihitung aplikasi (baris lama tetap diperiksa pemeriksa)
  return out;
}

const ARAH: [string, string][] = [
  ["utara", "Utara"], ["timur laut", "Timur laut"], ["timur", "Timur"], ["tenggara", "Tenggara"],
  ["selatan", "Selatan"], ["barat daya", "Barat daya"], ["barat", "Barat"], ["barat laut", "Barat laut"],
];
function resepArah(p: Pb): Isian[] {
  const kiblat = p.nilai(["kiblat", "arah kiblat"]).trim();
  const namaArah = ARAH.find(([a]) => normal(a) === normal(kiblat))?.[0];
  const out: Isian[] = [
    {
      t: "pilih",
      label: "Arah kiblat",
      opsi: [["", "Tidak digambar"], ...ARAH, ["sudut", "Sudut tertentu (derajat dari utara)"]],
      nilai: !kiblat ? "" : namaArah ?? "sudut",
      ubah: (v) => p.pasang(["kiblat", "arah kiblat"], v === "sudut" ? "295°" : v),
    },
  ];
  if (kiblat && !namaArah) out.push(isi(p, "Sudut kiblat dari utara (searah jarum jam)", ["kiblat", "arah kiblat"], { satuan: "°", contoh: "295" }));
  out.push(centang(p, "Sembunyikan nama arah (hanya Utara yang ditulis, untuk ditanyakan)", "nama arah", "sembunyi", /sembunyi|tidak/i));
  const benda = p.daftar(([k]) => !/^(kiblat|arahkiblat|namaarah)$/.test(normal(k)));
  benda.forEach((i) => {
    const [k, v] = p.baris[i];
    out.push({
      t: "kelompok",
      label: `Benda: ${k || "(tanpa nama)"}`,
      grid: true,
      isian: [
        { t: "isi", label: "Nama benda", nilai: k, contoh: "masjid", ubah: (x) => ubahBaris(p.baris, i, [x, v]) },
        { t: "pilih", label: "Arah", opsi: ARAH, nilai: ARAH.find(([a]) => normal(a) === normal(v))?.[0] ?? "", ubah: (x) => ubahBaris(p.baris, i, [k, x]) },
      ],
      aksi: [{ label: "✕", judul: "Hapus benda ini", jalankan: () => ubahBaris(p.baris, i, null) }],
    });
  });
  out.push({ t: "tombol", label: "+ Benda di suatu arah", jalankan: () => [...salin(p.baris), ["sekolah", "timur"]] });
  return out;
}

const LANGIT: [string, string][] = [
  ["gerhana matahari", "Gerhana matahari"],
  ["gerhana bulan", "Gerhana bulan"],
  ["fase bulan", "Fase bulan (8 posisi)"],
];
function resepLangit(p: Pb): Isian[] {
  const bentuk = LANGIT.find(([b]) => normal(b) === normal(p.nilai("bentuk")))?.[0] ?? "gerhana matahari";
  const out: Isian[] = [pilih(p, "Bentuk", "bentuk", LANGIT, { kartu: true }), centang(p, "Ganti nama dengan huruf/nomor (untuk ditanyakan)", "nama", "sembunyi", /sembunyi|huruf|angka|nomor/i)];
  out.push(
    info(
      bentuk === "fase bulan"
        ? "Nomor fase: 1 bulan baru, 2 sabit awal, 3 kuartal pertama, 4 cembung awal, 5 purnama, 6 cembung akhir, 7 kuartal akhir, 8 sabit akhir."
        : bentuk === "gerhana matahari"
          ? "Huruf: A = Matahari, B = Bulan, C = Bumi."
          : "Huruf: A = Matahari, B = Bumi, C = Bulan.",
    ),
  );
  return out;
}

const ARTI_ARUS = [
  "barang & jasa: produsen → pasar barang",
  "barang & jasa: pasar barang → konsumen",
  "faktor produksi: konsumen → pasar faktor",
  "faktor produksi: pasar faktor → produsen",
  "pengeluaran konsumsi: konsumen → pasar barang",
  "penerimaan: pasar barang → produsen",
  "balas jasa (upah, sewa, bunga, laba): produsen → pasar faktor",
  "pendapatan: pasar faktor → konsumen",
  "pajak: konsumen → pemerintah",
  "gaji, subsidi: pemerintah → konsumen",
  "pajak: produsen → pemerintah",
  "subsidi: pemerintah → produsen",
  "ekspor: produsen → luar negeri",
  "impor: luar negeri → produsen",
];
function resepEkonomi(p: Pb): Isian[] {
  const m = /([234])/.exec(p.nilai("bentuk"));
  const sektor = m ? +m[1] : 2;
  const out: Isian[] = [
    { ...pilih(p, "Bentuk", "bentuk", [["2 sektor", "2 sektor (konsumen & produsen)"], ["3 sektor", "3 sektor (+ pemerintah)"], ["4 sektor", "4 sektor (+ masyarakat luar negeri)"]], { kartu: true }), nilai: `${sektor} sektor` } as Isian,
    { t: "centang", label: "Ganti nama arus dengan nomor (untuk ditanyakan)", nilai: /angka|nomor|\d/i.test(p.nilai(["label arus", "label"])), ubah: (b) => p.pasang(["label arus", "label"], b ? "angka" : "") },
  ];
  const n = sektor === 2 ? 8 : sektor === 3 ? 12 : 14;
  if (out[1].t === "centang" && out[1].nilai) out.push(info(`Arti nomor arus: ${ARTI_ARUS.slice(0, n).map((a, i) => `(${i + 1}) ${a}`).join("; ")}.`));
  return out;
}

const LAPISAN: Record<string, Baris[]> = {
  atmosfer: [["troposfer", "0–12 km"], ["stratosfer", "12–50 km"], ["mesosfer", "50–80 km"], ["termosfer", "80–700 km"], ["eksosfer", "> 700 km"]],
  bumi: [["kerak bumi", "5–70 km"], ["mantel", "± 2.900 km"], ["inti luar", "cair"], ["inti dalam", "padat"]],
  tanah: [["horizon O", "bahan organik"], ["horizon A", "tanah atas (humus)"], ["horizon B", "penimbunan"], ["horizon C", "bahan induk"], ["horizon R", "batuan induk"]],
};
function resepLapisan(p: Pb): Isian[] {
  const bentuk = (["bumi", "atmosfer", "tanah"] as const).find((b) => normal(p.nilai("bentuk")).replace(/^lapisan/, "") === b) ?? "atmosfer";
  const urut = { bumi: "dari luar ke dalam", atmosfer: "dari bawah ke atas", tanah: "dari atas ke bawah" }[bentuk];
  const out: Isian[] = [
    pilih(p, "Bentuk", "bentuk", [["atmosfer", "Lapisan atmosfer"], ["bumi", "Lapisan bumi"], ["tanah", "Horizon (profil) tanah"]], { kartu: true, ganti: (v) => [["bentuk", v], ...LAPISAN[v].map((b) => [b[0], b[1]] as Baris)] }),
    info(`Lapisan ditulis urut ${urut}. Centang "ditanyakan" untuk mengganti tulisannya dengan "?".`),
  ];
  const lapis = p.daftar(([k]) => normal(k) !== "bentuk");
  lapis.forEach((i, k) => {
    const [nama, ket] = p.baris[i];
    out.push({
      t: "kelompok",
      label: `Lapisan ${k + 1}`,
      grid: true,
      isian: [
        { t: "isi", label: "Nama lapisan", nilai: nama === "?" ? "" : nama, contoh: "troposfer", ubah: (x) => ubahBaris(p.baris, i, [x, ket]), tanya: { aktif: nama === "?", ubah: (b) => ubahBaris(p.baris, i, [b ? "?" : "lapisan", ket]) } },
        { t: "isi", label: "Keterangan", nilai: ket === "?" || ket === "-" ? "" : ket, contoh: "0–12 km", ubah: (x) => ubahBaris(p.baris, i, [nama, x.trim() ? x : "-"]), tanya: { aktif: ket === "?", ubah: (b) => ubahBaris(p.baris, i, [nama, b ? "?" : "-"]) } },
      ],
      aksi: [
        ...(k > 0 ? [{ label: "↑", judul: "Pindah ke atas", jalankan: () => tukar(p.baris, i, lapis[k - 1]) }] : []),
        ...(k < lapis.length - 1 ? [{ label: "↓", judul: "Pindah ke bawah", jalankan: () => tukar(p.baris, i, lapis[k + 1]) }] : []),
        { label: "✕", judul: "Hapus lapisan ini", jalankan: () => ubahBaris(p.baris, i, null) },
      ],
    });
  });
  if (lapis.length < 7) out.push({ t: "tombol", label: "+ Lapisan", jalankan: () => [...salin(p.baris), ["lapisan baru", "-"]] });
  return out;
}

const JENIS_MAKMUM: [string, string][] = [
  ["laki-laki", "Laki-laki"],
  ["anak-anak", "Anak-anak"],
  ["perempuan", "Perempuan"],
];
function resepShaf(p: Pb): Isian[] {
  const berdua = /berdua/i.test(p.nilai("bentuk"));
  const out: Isian[] = [
    {
      t: "pilih",
      label: "Bentuk",
      kartu: true,
      opsi: [["berjamaah", "Berjamaah (beberapa shaf)"], ["berdua", "Berdua (satu makmum di kanan imam)"]],
      nilai: berdua ? "berdua" : "berjamaah",
      ubah: (v) => (v === "berdua" ? [["bentuk", "berdua"], ["makmum laki-laki", "1"]] : [["bentuk", "berjamaah"], ["makmum laki-laki", "5"], ["makmum anak-anak", "3"], ["makmum perempuan", "4"]]),
    },
  ];
  const barisan = p.daftar(([k]) => /makmum|jamaah|barisan|shaf/i.test(k));
  if (berdua) {
    const i = barisan[0];
    if (i !== undefined) {
      const jenis = /perempuan/i.test(p.baris[i][0]) ? "perempuan" : /anak/i.test(p.baris[i][0]) ? "anak-anak" : "laki-laki";
      out.push({ t: "pilih", label: "Makmum", opsi: JENIS_MAKMUM, nilai: jenis, ubah: (x) => ubahBaris(p.baris, i, [`makmum ${x}`, "1"]) });
    }
    return out;
  }
  out.push(info("Barisan urut dari depan (dekat imam) ke belakang."), centang(p, "Barisan diberi huruf A, B, C (untuk ditanyakan)", "nama baris", "sembunyi", /sembunyi|huruf/i));
  barisan.forEach((i, k) => {
    const [kunci, jml] = p.baris[i];
    const jenis = /perempuan|wanita/i.test(kunci) ? "perempuan" : /anak/i.test(kunci) ? "anak-anak" : "laki-laki";
    out.push({
      t: "kelompok",
      label: `Shaf ${k + 1}`,
      grid: true,
      isian: [
        { t: "pilih", label: "Makmum", opsi: JENIS_MAKMUM, nilai: jenis, ubah: (x) => ubahBaris(p.baris, i, [`makmum ${x}`, jml]) },
        { t: "isi", label: "Jumlah orang (1–12)", nilai: jml, angka: true, contoh: "5", ubah: (x) => ubahBaris(p.baris, i, [kunci, x.trim()]) },
      ],
      aksi: [
        ...(k > 0 ? [{ label: "↑", judul: "Pindah ke depan", jalankan: () => tukar(p.baris, i, barisan[k - 1]) }] : []),
        ...(k < barisan.length - 1 ? [{ label: "↓", judul: "Pindah ke belakang", jalankan: () => tukar(p.baris, i, barisan[k + 1]) }] : []),
        ...(barisan.length > 1 ? [{ label: "✕", judul: "Hapus shaf ini", jalankan: () => ubahBaris(p.baris, i, null) }] : []),
      ],
    });
  });
  if (barisan.length < 5) out.push({ t: "tombol", label: "+ Shaf", jalankan: () => [...salin(p.baris), ["makmum perempuan", "4"]] });
  return out;
}

// ---------- 0.62.0: daftar & pohon (bagan, koordinat, garis bilangan, listrik, jaring makanan, ahli waris) ----------

/** Tombol ↑ / ↓ / ✕ untuk butir ke-k dari daftar indeks `idx`. */
function aksiDaftar(p: Pb, idx: number[], k: number, o: { hapus?: boolean; naik?: string; turun?: string; judulHapus?: string } = {}) {
  const i = idx[k];
  return [
    ...(k > 0 ? [{ label: "↑", judul: o.naik ?? "Pindah ke atas", jalankan: () => tukar(p.baris, i, idx[k - 1]) }] : []),
    ...(k < idx.length - 1 ? [{ label: "↓", judul: o.turun ?? "Pindah ke bawah", jalankan: () => tukar(p.baris, i, idx[k + 1]) }] : []),
    ...(o.hapus !== false ? [{ label: "✕", judul: o.judulHapus ?? "Hapus", jalankan: () => ubahBaris(p.baris, i, null) }] : []),
  ];
}
const KOSONG_TANYA = "....";

/** Garis waktu: baris "waktu | peristiwa". */
function resepWaktu(p: Pb): Isian[] {
  const idx = p.daftar(() => true);
  const out: Isian[] = [info('Urut dari peristiwa paling awal. Centang "ditanyakan" untuk mengganti tulisannya dengan "....".')];
  idx.forEach((i, k) => {
    const [w, ev] = [p.baris[i][0] ?? "", p.baris[i][1] ?? ""];
    out.push({
      t: "kelompok",
      label: `Peristiwa ${k + 1}`,
      isian: [
        { t: "isi", label: "Waktu / tahun", nilai: w === KOSONG_TANYA ? "" : w, contoh: "622 M", ubah: (x) => ubahBaris(p.baris, i, [x, ev]), tanya: { aktif: w === KOSONG_TANYA, ubah: (b) => ubahBaris(p.baris, i, [b ? KOSONG_TANYA : "tahun", ev]) } },
        { t: "isi", label: "Peristiwa", nilai: ev === KOSONG_TANYA ? "" : ev, contoh: "Hijrah ke Madinah", ubah: (x) => ubahBaris(p.baris, i, [w, x]), tanya: { aktif: ev === KOSONG_TANYA, ubah: (b) => ubahBaris(p.baris, i, [w, b ? KOSONG_TANYA : "peristiwa"]) } },
      ],
      aksi: aksiDaftar(p, idx, k, { hapus: idx.length > 2, judulHapus: "Hapus peristiwa ini" }),
    });
  });
  if (idx.length < 10) out.push({ t: "tombol", label: "+ Peristiwa", jalankan: () => [...salin(p.baris), ["tahun", "peristiwa"]] });
  if (idx.length > 1)
    out.push({
      t: "tombol",
      label: "Urutkan menurut tahun",
      jalankan: () => {
        // "...." dan tahun tanpa angka tetap di tempatnya; yang berangka diurutkan di antara mereka
        const b = salin(p.baris);
        const berangka = idx.filter((i) => Number.isFinite(angkaDari(b[i][0] ?? "")));
        const urut = [...berangka].sort((x, y) => angkaDari(b[x][0]) - angkaDari(b[y][0])).map((i) => [...b[i]]);
        berangka.forEach((i, k) => (b[i] = urut[k]));
        return b;
      },
    });
  return out;
}

/** Diagram alir & siklus: satu kolom langkah. */
function resepLangkah(p: Pb, siklus: boolean): Isian[] {
  const idx = p.daftar(() => true);
  const [min, maks] = siklus ? [3, 8] : [2, 8];
  const out: Isian[] = [info(siklus ? "Tahap urut melingkar; tahap terakhir kembali ke tahap pertama." : 'Langkah urut dari atas ke bawah (rantai sanad: nama perawi saja). Centang "ditanyakan" untuk mengganti tulisannya dengan "....".')];
  idx.forEach((i, k) => {
    const v = p.baris[i][0] ?? "";
    out.push({
      t: "simpul",
      tingkat: 0,
      nomor: `${k + 1}.`,
      nilai: v === KOSONG_TANYA ? "" : v,
      contoh: siklus ? "Penguapan" : "Membasuh muka",
      ubah: (x) => ubahBaris(p.baris, i, [x]),
      tanya: { aktif: v === KOSONG_TANYA, ubah: (b) => ubahBaris(p.baris, i, [b ? KOSONG_TANYA : siklus ? "tahap" : "langkah"]) },
      aksi: aksiDaftar(p, idx, k, { hapus: idx.length > min, judulHapus: "Hapus" }),
    });
  });
  if (idx.length < maks) out.push({ t: "tombol", label: siklus ? "+ Tahap" : "+ Langkah", jalankan: () => [...salin(p.baris), [siklus ? "tahap baru" : "langkah baru"]] });
  return out;
}

/** Bagan pohon: baris "nama | induk"; tampil sebagai pohon menjorok dengan tombol + cabang. */
function resepPohon(p: Pb): Isian[] {
  const rows = p.baris;
  rows.forEach((_, i) => p.dipakai.add(i));
  const nama = (i: number) => (rows[i][0] ?? "").trim();
  const induk = (i: number) => (rows[i][1] ?? "").trim();
  const ada = (n: string) => rows.some((_, j) => nama(j) === n);
  const anakDari = (n: string) => rows.map((_, i) => i).filter((i) => induk(i) === n && nama(i) !== n);
  const keturunan = (i: number, lihat = new Set<number>()): number[] => {
    if (lihat.has(i)) return [];
    lihat.add(i);
    return [i, ...anakDari(nama(i)).flatMap((a) => keturunan(a, lihat))];
  };
  const out: Isian[] = [info('Tombol "+" di samping kotak = tambah cabang di bawahnya. Maks 4 tingkat, 15 kotak, 8 kotak paling bawah; nama kotak tidak boleh sama.')];
  const namaBaru = () => {
    let n = 1;
    while (ada(`Cabang ${n}`)) n++;
    return `Cabang ${n}`;
  };
  // nama kosong diabaikan: kalau ditulis, cabang di bawahnya kehilangan induk
  const ganti = (i: number, baru: string) => (!baru.trim() ? salin(rows) : rows.map((r, j) => (j === i ? [baru, r[1] ?? ""] : (r[1] ?? "").trim() === nama(i) ? [r[0], baru] : [...r])));
  const dikunjungi = new Set<number>();
  const jalan = (i: number, t: number) => {
    if (dikunjungi.has(i)) return;
    dikunjungi.add(i);
    const saudara = rows.map((_, j) => j).filter((j) => (induk(j) || "") === (induk(i) || "") && (induk(i) ? true : !induk(j)));
    const k = saudara.indexOf(i);
    const aksi: { label: string; judul: string; jalankan: () => Baris[] }[] = [];
    if (t < 3 && rows.length < 15)
      aksi.push({
        label: "+",
        judul: "Tambah cabang di bawah kotak ini",
        jalankan: () => {
          const akhir = Math.max(...keturunan(i));
          const b = salin(rows);
          b.splice(akhir + 1, 0, [namaBaru(), nama(i)]);
          return b;
        },
      });
    if (k > 0) aksi.push({ label: "↑", judul: "Pindah ke kiri/atas", jalankan: () => tukar(rows, i, saudara[k - 1]) });
    if (k >= 0 && k < saudara.length - 1) aksi.push({ label: "↓", judul: "Pindah ke kanan/bawah", jalankan: () => tukar(rows, i, saudara[k + 1]) });
    if (t > 0 && rows.length - keturunan(i).length >= 2) aksi.push({ label: "✕", judul: "Hapus kotak ini beserta cabangnya", jalankan: () => rows.filter((_, j) => !keturunan(i).includes(j)).map((r) => [...r]) });
    const v = nama(i);
    out.push({
      t: "simpul",
      tingkat: t,
      nilai: v === KOSONG_TANYA ? "" : v,
      contoh: t === 0 ? "Kotak puncak" : "Nama kotak",
      ubah: (x) => ganti(i, x),
      tanya: { aktif: v === KOSONG_TANYA, ubah: (b) => ganti(i, b ? KOSONG_TANYA : namaBaru()) },
      aksi,
    });
    for (const a of anakDari(v)) jalan(a, t + 1);
  };
  rows.forEach((_, i) => {
    if (!induk(i) || !ada(induk(i))) jalan(i, 0);
  });
  rows.forEach((_, i) => jalan(i, 0)); // sisa (induk berputar): tetap tampil supaya bisa diperbaiki
  return out;
}

// --- bidang koordinat ---

const JENIS_BENDA: [string, string][] = [
  ["titik", "Titik"],
  ["titik bantu", "Titik + garis putus ke sumbu"],
  ["garis", "Garis lurus (lewat 2 titik)"],
  ["ruas", "Garis patah (beberapa titik)"],
  ["kurva", "Kurva y = f(x)"],
  ["panah", "Panah / vektor"],
  ["daerah", "Daerah berarsir"],
];
const BAWAAN_BENDA: Record<string, [string, string]> = {
  titik: ["(2, 3)", "A"],
  "titik bantu": ["(4, 6)", "E"],
  garis: ["(0, 4) (4, 0)", ""],
  ruas: ["(0, 0) (2, 4) (5, 4)", ""],
  kurva: ["y = x^2 - 4", "f"],
  panah: ["(0, 0) (3, 4)", "a"],
  daerah: ["(0, 0) (4, 0) (0, 3)", "HP"],
};
const SINONIM_BENDA: Record<string, string> = { vektor: "panah", fungsi: "kurva", grafik: "kurva", arsir: "daerah", poligon: "daerah", titikpenuh: "titik", titikbulat: "titik" };
const jenisBenda = (k: string) => {
  const n = normal(k);
  return SINONIM_BENDA[n] ?? JENIS_BENDA.find(([j]) => normal(j) === n)?.[0] ?? "";
};
/** "(0, 10) (10, 0)" → [["0","10"],["10","0"]]; "(2,5; 3)" memakai titik koma. */
const titikDari = (s: string): [string, string][] =>
  [...s.matchAll(/\(([^()]*)\)/g)].map((m) => {
    const b = m[1].includes(";") ? m[1].split(";") : m[1].split(",");
    return [(b[0] ?? "").trim(), (b[1] ?? "").trim()];
  });
const tulisTitik = (pts: [string, string][]) => pts.map(([x, y]) => `(${x}${/,/.test(x + y) ? "; " : ", "}${y})`).join(" ");

function resepKoordinat(p: Pb): Isian[] {
  const out: Isian[] = [];
  const sumbu = (label: string, kunci: string, bawaan: string) => {
    const i = p.cari(kunci);
    const r = i >= 0 ? p.baris[i] : [kunci, "", ""];
    const m = /^\s*(-?[\d.,]+)?\s*\.\.\s*(-?[\d.,]+)?\s*$/.exec(r[2] ?? "");
    const [a, b] = [m?.[1] ?? "", m?.[2] ?? ""];
    const tulis = (nama: string, x: string, y: string): Baris[] => {
      const isi: Baris = [kunci, nama.trim() ? nama : bawaan, x.trim() && y.trim() ? `${x.trim()}..${y.trim()}` : ""];
      if (!nama.trim() && !x.trim() && !y.trim()) return i >= 0 ? ubahBaris(p.baris, i, null) : salin(p.baris);
      return i >= 0 ? ubahBaris(p.baris, i, isi) : [...salin(p.baris), isi];
    };
    out.push({
      t: "kelompok",
      label,
      grid: true,
      isian: [
        { t: "isi", label: "Nama sumbu", nilai: i >= 0 ? (r[1] ?? "") : "", contoh: bawaan, ubah: (x) => tulis(x, a, b) },
        { t: "isi", label: "Dari (kosong = otomatis)", nilai: a, angka: true, contoh: "0", ubah: (x) => tulis(r[1] ?? bawaan, x, b) },
        { t: "isi", label: "Sampai", nilai: b, angka: true, contoh: "10", ubah: (x) => tulis(r[1] ?? bawaan, a, x) },
      ],
    });
  };
  sumbu("Sumbu mendatar", "sumbu x", "x");
  sumbu("Sumbu tegak", "sumbu y", "y");
  const benda = p.daftar(([k]) => !!jenisBenda(k));
  benda.forEach((i, k) => {
    const [kj, isiB, label] = [p.baris[i][0] ?? "", p.baris[i][1] ?? "", p.baris[i][2] ?? ""];
    const j = jenisBenda(kj);
    const tulis = (isiBaru: string, labelBaru = label): Baris[] => ubahBaris(p.baris, i, [j, isiBaru, labelBaru]);
    const isian: Isian[] = [
      { t: "pilih", label: "Jenis", opsi: JENIS_BENDA, nilai: j, ubah: (v) => ubahBaris(p.baris, i, [v, BAWAAN_BENDA[v][0], label || BAWAAN_BENDA[v][1]]) },
      { t: "isi", label: "Label (boleh kosong)", nilai: label, contoh: BAWAAN_BENDA[j]?.[1] || "A", ubah: (x) => tulis(isiB, x) },
    ];
    if (j === "kurva") {
      isian.push(
        { t: "isi", label: "Rumus", kunci: "rumus", nilai: isiB, contoh: "y = x^2 - 4", ubah: (x) => tulis(x) },
        info("Pangkat pakai ^ (x^2), kali boleh tanpa tanda (2x), akar: sqrt(x). Peubah x atau huruf nama sumbu mendatar."),
      );
    } else {
      const pts = titikDari(isiB);
      const nama = j === "panah" ? ["Pangkal", "Ujung"] : j === "garis" ? ["Titik 1", "Titik 2"] : null;
      const minimal = j === "daerah" ? 3 : j === "ruas" ? 2 : pts.length;
      pts.forEach(([x, y], n) => {
        const ganti = (xx: string, yy: string) => tulis(tulisTitik(pts.map((q, m) => (m === n ? [xx, yy] : q))));
        isian.push({
          t: "kelompok",
          label: nama?.[n] ?? (pts.length > 1 ? `Titik ${n + 1}` : "Letak titik"),
          grid: true,
          isian: [
            { t: "isi", label: "x", nilai: x, angka: true, ubah: (v) => ganti(v, y) },
            { t: "isi", label: "y", nilai: y, angka: true, ubah: (v) => ganti(x, v) },
          ],
          aksi: (j === "ruas" || j === "daerah") && pts.length > minimal ? [{ label: "✕", judul: "Hapus titik ini", jalankan: () => tulis(tulisTitik(pts.filter((_, m) => m !== n))) }] : undefined,
        });
      });
      if ((j === "ruas" || j === "daerah") && pts.length < 12) {
        const akhir = pts[pts.length - 1] ?? ["0", "0"];
        isian.push({ t: "tombol", label: "+ Titik", jalankan: () => tulis(tulisTitik([...pts, [String((angkaDari(akhir[0]) || 0) + 1), akhir[1]]])) });
      }
    }
    out.push({ t: "kelompok", label: `${JENIS_BENDA.find(([x]) => x === j)?.[1] ?? j} ${k + 1}`, isian, aksi: [{ label: "✕", judul: "Hapus benda ini", jalankan: () => ubahBaris(p.baris, i, null) }] });
  });
  if (benda.length < 12)
    for (const [j, lbl] of [["titik", "+ Titik"], ["garis", "+ Garis"], ["kurva", "+ Kurva"], ["panah", "+ Panah"], ["ruas", "+ Garis patah"], ["daerah", "+ Daerah"]] as const)
      out.push({ t: "tombol", label: lbl, jalankan: () => [...salin(p.baris), [j, BAWAAN_BENDA[j][0], BAWAAN_BENDA[j][1]]] });
  return out;
}

// --- garis bilangan ---

const jenisBilangan = (k: string) => {
  const n = normal(k);
  return n === "titikkosong" || n === "titikterbuka" ? "titik kosong" : n === "titik" || n === "titikpenuh" || n === "titikbulat" ? "titik" : n === "daerah" ? "daerah" : n === "rentang" ? "rentang" : "";
};
/** Teks pertidaksamaan dari batas kiri/kanan (kosong = tak hingga). */
function teksPertidaksamaan(a: string, aTutup: boolean, b: string, bTutup: boolean) {
  if (a && b) return `${a} ${aTutup ? "≤" : "<"} x ${bTutup ? "≤" : "<"} ${b}`;
  if (a) return `x ${aTutup ? "≥" : ">"} ${a}`;
  if (b) return `x ${bTutup ? "≤" : "<"} ${b}`;
  return "semua bilangan";
}

function resepBilangan(p: Pb): Isian[] {
  const out: Isian[] = [];
  const rows = p.baris;
  // rentang angka yang tampil
  const ri = p.cari("rentang");
  const rm = /^\s*(-?[\d.,]+)?\s*\.\.\s*(-?[\d.,]+)?\s*$/.exec(ri >= 0 ? (rows[ri][1] ?? "") : "");
  const [ra, rb] = [rm?.[1] ?? "", rm?.[2] ?? ""];
  const tulisRentang = (a: string, b: string) => (a.trim() && b.trim() ? pasangDi(rows, "rentang", `${a.trim()}..${b.trim()}`).map((r) => (r.length < 3 ? [...r, ""] : r)) : pasangDi(rows, "rentang", ""));
  out.push({
    t: "kelompok",
    label: "Angka yang tampil (kosong = otomatis)",
    grid: true,
    isian: [
      { t: "isi", label: "Dari", nilai: ra, angka: true, contoh: "-3", ubah: (x) => tulisRentang(x, rb) },
      { t: "isi", label: "Sampai", nilai: rb, angka: true, contoh: "5", ubah: (x) => tulisRentang(ra, x) },
    ],
  });
  const lain = rows.map((_, i) => i).filter((i) => i !== ri);
  lain.forEach((i) => p.dipakai.add(i));
  const daerah = lain.filter((i) => jenisBilangan(rows[i][0] ?? "") === "daerah");
  const titik = lain.filter((i) => jenisBilangan(rows[i][0] ?? "").startsWith("titik"));
  const dm = daerah.length === 1 ? /^(.*?)\s*\.\.\s*(.*)$/.exec(rows[daerah[0]][1] ?? "") : null;
  const [da, db] = [(dm?.[1] ?? "").trim(), (dm?.[2] ?? "").trim()];
  const samaAngka = (u: string, v: string) => u !== "" && v !== "" && angkaDari(u) === angkaDari(v);
  const polaCocok = !!dm && daerah.length === 1 && titik.length <= 2 && titik.every((i) => samaAngka(rows[i][1] ?? "", da) || samaAngka(rows[i][1] ?? "", db)) && lain.every((i) => !!jenisBilangan(rows[i][0] ?? ""));
  if (polaCocok) {
    // pembuat pertidaksamaan: batas kiri & kanan (angka atau tak hingga), termasuk (●) atau tidak (○)
    const tutup = (v: string) => titik.some((i) => samaAngka(rows[i][1] ?? "", v) && jenisBilangan(rows[i][0] ?? "") === "titik");
    const label = rows[daerah[0]][2] ?? "";
    const [aT, bT] = [tutup(da), tutup(db)];
    const susun = (a: string, aTutup: boolean, b: string, bTutup: boolean, lbl = label): Baris[] => [
      ...(ri >= 0 ? [[...rows[ri]]] : []),
      ...(a ? [[aTutup ? "titik" : "titik kosong", a, ""]] : []),
      ...(b ? [[bTutup ? "titik" : "titik kosong", b, ""]] : []),
      ["daerah", `${a}..${b}`, lbl],
    ];
    out.push(info(`Pertidaksamaan yang tergambar: ${teksPertidaksamaan(da, aT, db, bT)}.`));
    const batas = (judul: string, v: string, t: boolean, ubah: (v: string, t: boolean) => Baris[], arah: string): Isian => ({
      t: "kelompok",
      label: judul,
      grid: true,
      isian: [
        { t: "pilih", label: "Batas", opsi: [["angka", "Angka"], ["tak", `Tak hingga (terus ke ${arah})`]], nilai: v ? "angka" : "tak", ubah: (x) => ubah(x === "tak" ? "" : v || (arah === "kiri" ? "-1" : "3"), t) },
        ...(v
          ? ([
              { t: "isi", label: "Angka", nilai: v, angka: true, ubah: (x: string) => ubah(x.trim(), t) },
              { t: "pilih", label: "Bulatan", opsi: [["ya", "● termasuk (≤ / ≥)"], ["tidak", "○ tidak termasuk (< / >)"]], nilai: t ? "ya" : "tidak", ubah: (x: string) => ubah(v, x === "ya") },
            ] as Isian[])
          : []),
      ],
    });
    out.push(
      batas("Batas kiri", da, aT, (v, t) => susun(v, t, db, bT), "kiri"),
      batas("Batas kanan", db, bT, (v, t) => susun(da, aT, v, t), "kanan"),
      { t: "isi", label: "Tulisan di atas daerah (boleh kosong)", nilai: label, contoh: "HP", ubah: (x) => susun(da, aT, db, bT, x) },
      { t: "tombol", label: "+ Titik atau daerah lain (isi bebas)", jalankan: () => [...salin(rows), ["titik", "0", ""]] },
    );
    return out;
  }
  // isi bebas: daftar titik / titik kosong / daerah
  lain.forEach((i, k) => {
    const [kj, v, lbl] = [rows[i][0] ?? "", rows[i][1] ?? "", rows[i][2] ?? ""];
    const j = jenisBilangan(kj) || "titik";
    out.push({
      t: "kelompok",
      label: `Benda ${k + 1}`,
      grid: true,
      isian: [
        { t: "pilih", label: "Jenis", opsi: [["titik", "● Titik (termasuk)"], ["titik kosong", "○ Titik kosong (tidak termasuk)"], ["daerah", "Daerah (garis tebal)"]], nilai: j, ubah: (x) => ubahBaris(rows, i, [x, x === "daerah" ? (v.includes("..") ? v : `${v}..`) : v.split("..")[0] || "0", lbl]) },
        { t: "isi", label: j === "daerah" ? 'Dari..sampai ("2.." = ke kanan terus)' : "Angka", nilai: v, contoh: j === "daerah" ? "-1..3" : "2", ubah: (x) => ubahBaris(rows, i, [j, x, lbl]) },
        { t: "isi", label: "Tulisan (boleh kosong)", nilai: lbl, ubah: (x) => ubahBaris(rows, i, [j, v, x]) },
      ],
      aksi: [{ label: "✕", judul: "Hapus", jalankan: () => ubahBaris(rows, i, null) }],
    });
  });
  out.push(
    { t: "tombol", label: "+ Titik", jalankan: () => [...salin(rows), ["titik", "0", ""]] },
    { t: "tombol", label: "+ Daerah", jalankan: () => [...salin(rows), ["daerah", "0..2", ""]] },
  );
  return out;
}

// --- rangkaian listrik ---

const KOMP: Record<string, { awalan: string; nama: string; satuan: string }> = {
  hambatan: { awalan: "R", nama: "Hambatan", satuan: "Ω" },
  lampu: { awalan: "L", nama: "Lampu", satuan: "" },
  kapasitor: { awalan: "C", nama: "Kapasitor", satuan: "μF" },
  saklar: { awalan: "S", nama: "Saklar", satuan: "" },
  ampere: { awalan: "A", nama: "Amperemeter", satuan: "" },
};
const jenisKompDari = (nama: string): string => jenisKomp(nama) ?? "";
const pecahParalel = (v: string): [string, string][] =>
  v
    .split(/[;,]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const m = /^(\S+?)\s*(?:=\s*|\s+)(.*)$/.exec(c);
      return m ? [m[1], m[2].trim()] : [c, ""];
    });
const tulisParalel = (c: [string, string][]) => c.map(([n, v]) => (v ? `${n} = ${v}` : n)).join(", ");

function resepListrik(p: Pb): Isian[] {
  const out: Isian[] = [isi(p, "Tegangan baterai", ["baterai", "sumber", "ggl"], { satuan: "V", tanya: true, contoh: "12" })];
  const rows = p.baris;
  const vi = p.cari(["voltmeter", "v"]);
  const komp = p.daftar(([k]) => normal(k) === "paralel" || !!jenisKompDari(k));
  // semua nama komponen (untuk nama baru & pilihan voltmeter)
  const semua = komp.flatMap((i) => (normal(rows[i][0] ?? "") === "paralel" ? pecahParalel(rows[i][1] ?? "").map(([n]) => n) : [rows[i][0] ?? ""])).filter((n) => n && jenisKompDari(n) !== "ampere");
  const namaBaru = (awalan: string, juga: string[] = []) => {
    let n = 1;
    while ([...semua, ...juga].some((x) => normal(x) === normal(`${awalan}${n}`))) n++;
    return `${awalan}${n}`;
  };
  /** Voltmeter ikut komponennya: nama diganti = sasaran ikut; komponen dihapus = voltmeter dilepas. */
  const sasaranVolt = vi >= 0 ? (rows[vi][1] ?? "") : "";
  const gantiNama = (b: Baris[], lama: string, baru: string) => (normal(sasaranVolt) === normal(lama) && baru ? pasangDi(b, ["voltmeter", "v"], baru) : b);
  const lepasVolt = (b: Baris[]) => {
    const ada = b.flatMap(([k, v]) => (normal(k) === "paralel" ? pecahParalel(v ?? "").map(([n]) => n) : [k]));
    return !sasaranVolt || normal(sasaranVolt) === "baterai" || ada.some((n) => normal(n) === normal(sasaranVolt)) ? b : pasangDi(b, ["voltmeter", "v"], "");
  };
  const hapusIkut = (a: { label: string; judul: string; jalankan: () => Baris[] }[]) => a.map((x) => (x.label === "✕" ? { ...x, jalankan: () => lepasVolt(x.jalankan()) } : x));
  const nilaiKomp = (j: string, v: string, ubah: (x: string) => Baris[], label = "Nilai"): Isian =>
    j === "saklar"
      ? { t: "pilih", label: "Keadaan", opsi: [["tertutup", "Tertutup (arus mengalir)"], ["terbuka", "Terbuka (arus putus)"]], nilai: /buka|putus|off/i.test(v) ? "terbuka" : "tertutup", ubah }
      : { t: "isi", label: `${label}${KOMP[j]?.satuan ? "" : " (boleh kosong)"}`, nilai: v === "?" ? "" : tanpaSatuan(v, KOMP[j]?.satuan || undefined), satuan: KOMP[j]?.satuan || undefined, angka: !!KOMP[j]?.satuan, contoh: j === "hambatan" ? "4" : j === "kapasitor" ? "10" : "", ubah: (x) => ubah(denganSatuan(x, KOMP[j]?.satuan || undefined)) };
  komp.forEach((i, k) => {
    const [kunci, v] = [rows[i][0] ?? "", rows[i][1] ?? ""];
    if (normal(kunci) === "paralel") {
      const cabang = pecahParalel(v);
      const tulis = (c: [string, string][]) => ubahBaris(rows, i, ["paralel", tulisParalel(c)]);
      const isian: Isian[] = cabang.map(([n, nv], m) => {
        const j = jenisKompDari(n) || "hambatan";
        return {
          t: "kelompok" as const,
          label: `Cabang ${m + 1}`,
          grid: true,
          isian: [
            { t: "pilih" as const, label: "Komponen", opsi: (["hambatan", "lampu", "kapasitor", "saklar"] as const).map((x) => [x, KOMP[x].nama] as [string, string]), nilai: j, ubah: (x: string) => tulis(cabang.map((c, q) => (q === m ? [namaBaru(KOMP[x].awalan), x === "saklar" ? "tertutup" : ""] : c))) },
            { t: "isi" as const, label: "Nama", nilai: n, contoh: `${KOMP[j].awalan}1`, ubah: (x: string) => gantiNama(tulis(cabang.map((c, q) => (q === m ? [x.trim(), nv] : c))), n, x.trim()) },
            nilaiKomp(j, nv, (x) => tulis(cabang.map((c, q) => (q === m ? [n, x] : c)))),
          ],
          aksi: cabang.length > 2 ? [{ label: "✕", judul: "Hapus cabang ini", jalankan: () => lepasVolt(tulis(cabang.filter((_, q) => q !== m))) }] : undefined,
        };
      });
      if (cabang.length < 4) isian.push({ t: "tombol", label: "+ Cabang", jalankan: () => tulis([...cabang, [namaBaru("R"), "3 Ω"]]) });
      out.push({ t: "kelompok", label: `Komponen ${k + 1}: cabang paralel`, isian, aksi: hapusIkut(aksiDaftar(p, komp, k, { judulHapus: "Hapus cabang paralel ini" })) });
      return;
    }
    const j = jenisKompDari(kunci);
    out.push({
      t: "kelompok",
      label: `Komponen ${k + 1}: ${KOMP[j].nama}`,
      grid: true,
      isian: [
        ...(j === "ampere" ? [] : [{ t: "isi" as const, label: "Nama", nilai: kunci, contoh: `${KOMP[j].awalan}1`, ubah: (x: string) => gantiNama(ubahBaris(rows, i, [x.trim() || kunci, v]), kunci, x.trim()) }]),
        ...(j === "ampere" ? [info("Amperemeter dipasang seri di rangkaian.")] : [nilaiKomp(j, v, (x) => ubahBaris(rows, i, [kunci, x]))]),
      ],
      aksi: hapusIkut(aksiDaftar(p, komp, k, { judulHapus: "Hapus komponen ini" })),
    });
  });
  if (komp.length < 8) {
    for (const j of ["hambatan", "lampu", "kapasitor", "saklar", "ampere"] as const)
      out.push({ t: "tombol", label: `+ ${KOMP[j].nama}`, jalankan: () => [...salin(rows), j === "ampere" ? ["amperemeter", "A"] : [namaBaru(KOMP[j].awalan), j === "hambatan" ? "2 Ω" : j === "kapasitor" ? "10 μF" : j === "saklar" ? "tertutup" : ""]] });
    out.push({ t: "tombol", label: "+ Cabang paralel", jalankan: () => [...salin(rows), ["paralel", tulisParalel([[namaBaru("R"), "6 Ω"], [namaBaru("R", [namaBaru("R")]), "3 Ω"]])]] });
  }
  const sasaran = sasaranVolt;
  out.push({
    t: "pilih",
    label: "Pasang voltmeter pada",
    opsi: [["", "Tidak ada voltmeter"], ["baterai", "Baterai"], ...semua.map((n) => [n, n] as [string, string])],
    nilai: normal(sasaran) === "baterai" ? "baterai" : (semua.find((n) => normal(n) === normal(sasaran)) ?? ""),
    ubah: (x) => pasangDi(rows, ["voltmeter", "v"], x),
  });
  return out;
}

// --- jaring makanan ---

function resepJaring(p: Pb): Isian[] {
  const rows = p.baris;
  rows.forEach((_, i) => p.dipakai.add(i));
  const kosong = (v: string) => /^(-+|—|–|tidak ada|tidak dimakan|kosong)?$/i.test(v.trim());
  const pecah = (v: string) => (kosong(v) ? [] : v.split(/[,;]|\bdan\b/).map((x) => x.trim()).filter(Boolean));
  // nama makhluk (urut muncul) & panah mangsa → pemakan
  const nama: string[] = [];
  const tambahNama = (n: string) => n && !nama.some((x) => normal(x) === normal(n)) && nama.push(n);
  rows.forEach((r) => tambahNama((r[0] ?? "").trim()));
  rows.forEach((r) => pecah(r[1] ?? "").forEach(tambahNama));
  const makan = (mangsa: string) => {
    const r = rows.find((x) => normal(x[0] ?? "") === normal(mangsa));
    return r ? pecah(r[1] ?? "") : [];
  };
  /** Apakah `ke` dicapai dari `dari` lewat rantai "dimakan oleh"? (dipakai supaya tak ada pilihan yang membuat lingkaran) */
  const sampai = (dari: string, ke: string, lihat = new Set<string>()): boolean =>
    normal(dari) === normal(ke) || (!lihat.has(normal(dari)) && (lihat.add(normal(dari)), makan(dari).some((x) => sampai(x, ke, lihat))));
  /** Susun ulang tabel dari daftar nama & hubungan makan. */
  const susun = (ns: string[], rel: (n: string) => string[]): Baris[] =>
    ns.flatMap((n) => {
      const pm = rel(n).filter((x) => ns.some((y) => normal(y) === normal(x)));
      const pemakanOrangLain = ns.some((m) => rel(m).some((x) => normal(x) === normal(n)));
      return pm.length ? [[n, pm.join(", ")]] : pemakanOrangLain ? [] : [[n, "-"]];
    });
  const out: Isian[] = [info('Tulis nama makhluk hidup, lalu centang siapa pemakannya. Contoh: "Rumput dimakan oleh: ☑ belalang ☑ tikus".')];
  nama.forEach((n, k) => {
    const pemakan = makan(n);
    out.push({
      t: "kelompok",
      label: `Makhluk ${k + 1}`,
      isian: [
        {
          t: "isi",
          label: "Nama",
          nilai: n,
          contoh: "rumput",
          ubah: (x) => {
            const baru = x; // spasi di ujung dibiarkan selama mengetik ("burung elang")
            if (!baru.trim()) return susun(nama, makan); // nama kosong diabaikan (makhluk tidak hilang)
            const ns = nama.map((y) => (y === n ? baru : y)).filter(Boolean);
            return susun(ns, (m) => (m === baru ? pemakan : makan(m).map((y) => (normal(y) === normal(n) ? baru : y))));
          },
        },
        {
          t: "kelompok",
          label: `${n || "Makhluk ini"} dimakan oleh`,
          grid: true,
          isian: nama
            .filter((m) => m !== n && (pemakan.some((x) => normal(x) === normal(m)) || !sampai(m, n)))
            .map((m) => ({
              t: "centang" as const,
              label: m,
              nilai: pemakan.some((x) => normal(x) === normal(m)),
              ubah: (b: boolean) => susun(nama, (z) => (z === n ? (b ? [...pemakan, m] : pemakan.filter((x) => normal(x) !== normal(m))) : makan(z))),
            })),
        },
      ],
      aksi: nama.length > 2 ? [{ label: "✕", judul: "Hapus makhluk ini", jalankan: () => susun(nama.filter((m) => m !== n), (z) => makan(z).filter((x) => normal(x) !== normal(n))) }] : undefined,
    });
  });
  if (nama.length < 14)
    out.push({
      t: "tombol",
      label: "+ Makhluk hidup",
      jalankan: () => {
        let b = "makhluk baru";
        for (let i = 2; nama.some((x) => normal(x) === normal(b)); i++) b = `makhluk baru ${i}`;
        return [...susun(nama, makan), [b, "-"]];
      },
    });
  return out;
}

// --- ahli waris ---

const KELOMPOK_WARIS: [string, string[]][] = [
  ["Pasangan", ["suami", "istri"]],
  ["Orang tua & kakek-nenek", ["ayah", "ibu", "kakek", "nenek"]],
  ["Anak & cucu", ["anak laki-laki", "anak perempuan", "cucu laki-laki", "cucu perempuan"]],
  ["Saudara & paman", ["saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman"]],
];
const SEMUA_WARIS = WARIS.filter((w) => KELOMPOK_WARIS.some(([, d]) => d.includes(w)));
const BISA_BANYAK = new Set(["istri", "anak laki-laki", "anak perempuan", "cucu laki-laki", "cucu perempuan", "saudara laki-laki", "saudara perempuan", "saudara laki-laki seayah", "saudara perempuan seayah", "saudara seibu", "paman", "nenek"]);
const BAGIAN: [string, string][] = [
  ["?", "? (ditanyakan)"],
  ["1/2", "1/2"],
  ["1/3", "1/3"],
  ["1/4", "1/4"],
  ["1/6", "1/6"],
  ["1/8", "1/8"],
  ["2/3", "2/3"],
  ["ashabah", "Ashabah (sisa)"],
  ["1/6 + sisa", "1/6 + sisa"],
  ["1/3 sisa", "1/3 sisa"],
  ["mahjub", "Mahjub (terhalang)"],
];

function resepWaris(p: Pb): Isian[] {
  const rows = p.baris;
  const mi = p.cari(["mayit", "pewaris"]);
  const ai = p.cari("aul");
  const ahli = new Map<string, { i: number; jumlah: number; bagian: string }>();
  rows.forEach((r, i) => {
    if (i === mi || i === ai) return;
    const n = bacaNama(r[0] ?? "");
    if (n && !ahli.has(n.dasar)) {
      ahli.set(n.dasar, { i, jumlah: n.jumlah, bagian: (r[1] ?? "").trim() });
      p.dipakai.add(i);
    }
  });
  const mayit = /perempuan|wanita/i.test(mi >= 0 ? (rows[mi][1] ?? "") : "") ? "perempuan" : /laki|pria/i.test(mi >= 0 ? (rows[mi][1] ?? "") : "") ? "laki-laki" : ahli.has("suami") ? "perempuan" : "laki-laki";
  const kunciBaris = (d: string, n: number) => (n > 1 ? `${d} (${n})` : d);
  /** Tabel baru: mayit dulu, ahli waris urut baku, 'aul di akhir; baris lain (tak dikenal) dibawa. */
  const susun = (m: string, data: Map<string, { jumlah: number; bagian: string }>, aul: boolean): Baris[] => [
    ["mayit", m],
    ...SEMUA_WARIS.filter((d) => data.has(d)).map((d) => [kunciBaris(d, data.get(d)!.jumlah), data.get(d)!.bagian]),
    ...rows.filter((_, i) => i !== mi && i !== ai && ![...ahli.values()].some((a) => a.i === i)).map((r) => [...r]),
    ...(aul ? [["aul", "ya"]] : []),
  ];
  const data = new Map([...ahli].map(([d, a]) => [d, { jumlah: a.jumlah, bagian: a.bagian }]));
  const aul = ai >= 0 && /ya|iya/i.test(rows[ai][1] ?? "");
  const ganti = (f: (m: Map<string, { jumlah: number; bagian: string }>) => void, m = mayit, au = aul) => {
    const d = new Map([...data].map(([k, v]) => [k, { ...v }]));
    f(d);
    return susun(m, d, au);
  };
  const out: Isian[] = [
    {
      t: "pilih",
      label: "Mayit (yang meninggal)",
      kartu: true,
      opsi: [["laki-laki", "Laki-laki (meninggalkan istri)"], ["perempuan", "Perempuan (meninggalkan suami)"]],
      nilai: mayit,
      // ganti jenis kelamin mayit: suami ↔ istri ikut berganti
      ubah: (v) =>
        ganti((d) => {
          const [lama, baru] = v === "perempuan" ? ["istri", "suami"] : ["suami", "istri"];
          if (d.has(lama)) {
            d.set(baru, { jumlah: 1, bagian: "?" });
            d.delete(lama);
          }
        }, v),
    },
    info("Centang ahli waris yang ada, lalu pilih bagiannya. Kesalahan kaidah faraidh yang pasti langsung ditandai."),
  ];
  for (const [kel, daftar] of KELOMPOK_WARIS) {
    const isian: Isian[] = [];
    for (const d of daftar) {
      if (d === (mayit === "laki-laki" ? "suami" : "istri")) continue;
      const a = data.get(d);
      isian.push({ t: "centang", label: kapital(d), nilai: !!a, ubah: (b) => ganti((m) => (b ? m.set(d, { jumlah: 1, bagian: "?" }) : m.delete(d))) });
      if (!a) continue;
      const opsi = BAGIAN.some(([v]) => normal(v) === normal(a.bagian)) ? BAGIAN : ([...BAGIAN, [a.bagian, a.bagian]] as [string, string][]);
      isian.push({
        t: "kelompok",
        label: kapital(d),
        grid: true,
        isian: [
          { t: "pilih", label: "Bagian", kunci: d, opsi, nilai: opsi.find(([v]) => normal(v) === normal(a.bagian))?.[0] ?? a.bagian, ubah: (v) => ganti((m) => m.set(d, { ...a, bagian: v })) },
          ...(BISA_BANYAK.has(d) ? [{ t: "isi" as const, label: "Jumlah orang", nilai: String(a.jumlah), angka: true, ubah: (v: string) => ganti((m) => m.set(d, { ...a, jumlah: Math.max(1, Math.min(d === "istri" ? 4 : 12, Math.round(angkaDari(v)) || 1)) })) }] : []),
        ],
      });
    }
    out.push({ t: "kelompok", label: kel, isian });
  }
  out.push({ t: "centang", label: "Terjadi 'aul (jumlah bagian lebih dari 1)", nilai: aul, ubah: (b) => susun(mayit, data, b) });
  if (mi >= 0) p.dipakai.add(mi);
  return out;
}

// ---------- 0.63.0: grafik data (tabel ber-JUDUL: baris 0 = nama sumbu mendatar + nama tiap seri) ----------

const DATA_GRAFIK = ["batang", "garis", "lingkaran", "histogram", "pencar", "piramida"];
/** Resep jenis ini menerima tabel LENGKAP dengan baris judul (judul = nama sumbu, bukan sekadar kepala tabel). */
export const pakaiJudul = (jenis: string) => DATA_GRAFIK.includes(jenis);
const SERI: Record<string, [number, number]> = { batang: [1, 3], garis: [1, 3], pencar: [1, 3], lingkaran: [1, 1], histogram: [1, 1], piramida: [2, 2] };
const BARIS_DATA: Record<string, [number, number]> = { batang: [2, 12], garis: [2, 12], lingkaran: [2, 8], histogram: [2, 12], pencar: [3, 20], piramida: [2, 18] };
const SATUAN_DATA = ["orang", "siswa", "jiwa", "ribu jiwa", "juta jiwa", "%", "°C", "mm", "cm", "m", "km", "km²", "g", "kg", "ton", "ribu ton", "liter", "Rp", "ribu rupiah", "juta rupiah", "miliar rupiah", "unit", "buah", "ekor", "hektare", "detik", "menit", "jam", "hari", "tahun"];
/** "Suhu (°C)" → ["Suhu", "°C"]. */
const pecahNama = (s: string): [string, string] => {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(s ?? "");
  return m ? [m[1], m[2]] : [s ?? "", ""];
};
const susunNama = (nama: string, satuan: string) => (satuan.trim() ? `${nama} (${satuan.trim()})` : nama);
/** Angka "ketat" untuk mengenali baris judul tempelan ("Kelas 7" bukan angka, "Rp 1.500" & "45%" angka). */
const angkaKetat = (s: string) => /^\s*(Rp\.?\s*)?[-−]?\d[\d.,]*\s*%?\s*$/i.test(s);
const bersihAngka = (s: string) => s.trim().replace(/^Rp\.?\s*/i, "").replace(/\s*%$/, "");

/** Teks tempelan Excel/Google Sheets/Word (tab), titik koma, "|", atau "nama angka angka" → sel. */
export function bacaTempelan(teks: string): string[][] {
  const baris = teks
    .replace(/\r/g, "")
    .split("\n")
    .filter((b) => b.trim() && !/^\s*\|?[\s:|-]+\|?\s*$/.test(b)); // baris "|---|---|" dibuang
  const pisah = baris.some((b) => b.includes("\t")) ? "\t" : baris.some((b) => b.includes("|")) ? "|" : baris.some((b) => b.includes(";")) ? ";" : null;
  return baris.map((b) => {
    if (pisah === "|") return b.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((s) => s.trim());
    if (pisah) return b.split(pisah).map((s) => s.trim());
    // tanpa pemisah: "Petani 45" / "1 55" → nama + angka-angka di ujung
    const m = /^(.*?)\s+((?:[-−]?[\d.,]+%?\s*)+)$/.exec(b.trim());
    return m ? [m[1], ...m[2].trim().split(/\s+/)] : [b.trim()];
  });
}

/** Tempelan → tabel grafik lengkap (judul ikut bila baris pertama berisi tulisan), atau kalimat kenapa ditolak. */
export function tempelData(jenis: string, judulLama: string[], teks: string): Baris[] | string {
  const t = bacaTempelan(teks);
  if (!t.length) return "Tidak ada data yang terbaca.";
  const xAngka = jenis === "pencar";
  const adaJudul = t[0].slice(xAngka ? 0 : 1).some((s) => s && !angkaKetat(s));
  const judul = adaJudul ? t.shift()! : null;
  const [minS, maxS] = SERI[jenis];
  const [minB, maxB] = BARIS_DATA[jenis];
  const lebar = Math.min(Math.max(0, ...t.map((r) => r.length)), maxS + 1);
  if (lebar < minS + 1) return minS === 2 ? "Butuh 3 kolom: kelompok umur, laki-laki, perempuan." : "Butuh minimal 2 kolom: nama dan angka.";
  if (t.length < minB || t.length > maxB) return `Butuh ${minB}–${maxB} baris data (tertempel ${t.length}).`;
  const kepala = Array.from({ length: lebar }, (_, j) => judul?.[j]?.trim() || judulLama[j] || (j ? `Seri ${j}` : "Kategori"));
  return [kepala, ...t.map((r) => Array.from({ length: lebar }, (_, j) => (j === 0 && !xAngka ? (r[0] ?? "") : bersihAngka(r[j] ?? ""))))];
}

const KELAS = /^\s*([-−]?\d+)\s*[–—-]\s*([-−]?\d+)\s*$/;
const susunKelas = (a: number, pj: number, n: number) => Array.from({ length: n }, (_, i) => `${a + i * pj}–${a + i * pj + pj - 1}`);
/** Nilai mentah siswa → frekuensi tiap kelas (kelas = batas bawah + panjang, data bulat atau desimal). */
export function hitungFrekuensi(teks: string, a: number, pj: number, n: number): number[] | string {
  const nilai = teks
    .split(/[\s;]+/)
    .map((s) => s.replace(/,$/, ""))
    .filter(Boolean)
    .map(bacaAngka);
  if (!nilai.length || nilai.some((v) => !Number.isFinite(v))) return "Tempel angka saja, dipisah spasi, enter, atau koma + spasi.";
  const f = Array<number>(n).fill(0);
  const luar: number[] = [];
  for (const v of nilai) {
    const i = Math.floor((v - a) / pj);
    if (i >= 0 && i < n) f[i]++;
    else luar.push(v);
  }
  if (luar.length) return `Ada nilai di luar kelas (${luar.slice(0, 5).map(tampilAngka).join(", ")}${luar.length > 5 ? ", ..." : ""}). Ubah batas bawah atau banyak kelas dulu.`;
  return f;
}

const UMUR: [string, string, string[]][] = [
  ["3", "3 kelompok (0–14, 15–64, 65+)", ["0–14", "15–64", "65+"]],
  ["15", "15 tahunan (0–14 … 60+)", ["0–14", "15–29", "30–44", "45–59", "60+"]],
  ["10", "10 tahunan (0–9 … 70+)", ["0–9", "10–19", "20–29", "30–39", "40–49", "50–59", "60–69", "70+"]],
  ["5", "5 tahunan (0–4 … 75+)", [...Array.from({ length: 15 }, (_, i) => `${i * 5}–${i * 5 + 4}`), "75+"]],
];
const samaUmur = (a: string, b: string) => a.replace(/\s|-|—/g, "–").replace(/–+/g, "–") === b.replace(/\s|-|—/g, "–").replace(/–+/g, "–");

function resepData(p: Pb, jenis: string): Isian[] {
  const rows = p.baris;
  rows.forEach((_, i) => p.dipakai.add(i));
  const lebar = Math.max(2, ...rows.map((r) => r.length));
  const t = rows.map((r) => Array.from({ length: lebar }, (_, j) => r[j] ?? ""));
  if (!t.length) t.push(Array<string>(lebar).fill(""));
  const kepala = t[0];
  const badan = t.slice(1);
  const nSeri = lebar - 1;
  const [minS, maxS] = SERI[jenis];
  const [minB, maxB] = BARIS_DATA[jenis];
  const xAngka = jenis === "pencar";
  const sel = (i: number, j: number, v: string): Baris[] => t.map((r, x) => (x === i ? r.map((s, y) => (y === j ? v : s)) : [...r]));
  const out: Isian[] = [];

  // --- nama sumbu & seri ---
  const LABEL_X: Record<string, string> = { batang: "Nama kategori (di bawah batang)", garis: "Nama sumbu mendatar", lingkaran: "Nama kategori", histogram: "Nama data (mis. Nilai ulangan)", pencar: "Sumbu mendatar (x)", piramida: "Nama kelompok umur" };
  const nama: Isian[] = [{ t: "isi", label: LABEL_X[jenis], nilai: kepala[0], contoh: ATURAN_CONTOH[jenis]?.[0] ?? "", ubah: (x) => sel(0, 0, x) }];
  if (jenis === "piramida") {
    const u = pecahNama(kepala[1])[1] || pecahNama(kepala[2])[1];
    nama.push({
      t: "isi",
      label: "Satuan angka",
      nilai: u,
      contoh: "ribu",
      saran: ["ribu", "juta", "jiwa", "orang", "%"],
      ubah: (x) => t.map((r, i) => (i ? [...r] : [r[0], susunNama(pecahNama(r[1])[0] || "Laki-laki", x), susunNama(pecahNama(r[2])[0] || "Perempuan", x)])),
    });
    out.push({ t: "kelompok", label: "Nama sumbu", grid: true, isian: nama });
  } else {
    out.push({ t: "kelompok", label: "Nama sumbu", isian: nama });
    for (let k = 1; k <= nSeri; k++) {
      const [n, u] = pecahNama(kepala[k]);
      const satu = nSeri === 1;
      const judul = satu ? (jenis === "pencar" ? "Sumbu tegak (y)" : jenis === "lingkaran" ? "Angka" : jenis === "histogram" ? "Frekuensi" : "Angka (sumbu tegak)") : `${jenis === "pencar" ? "Kelompok" : "Seri"} ${k}`;
      out.push({
        t: "kelompok",
        label: judul,
        grid: true,
        isian: [
          { t: "isi", label: satu ? "Nama" : "Nama (tampil di keterangan)", nilai: n, contoh: satu ? "Jumlah siswa" : "Laki-laki", ubah: (x) => sel(0, k, susunNama(x, u)) },
          { t: "isi", label: "Satuan (boleh kosong)", kunci: `satuan${k}`, nilai: u, contoh: "orang", saran: SATUAN_DATA, ubah: (x) => sel(0, k, susunNama(n, x)) },
        ],
        aksi: nSeri > minS ? [{ label: "✕", judul: `Hapus ${judul.toLowerCase()}`, jalankan: () => t.map((r) => r.filter((_, j) => j !== k)) }] : undefined,
      });
    }
    if (nSeri < maxS)
      out.push({
        t: "tombol",
        label: jenis === "pencar" ? "+ Kelompok titik" : "+ Seri data (pembanding)",
        // isi seri baru = salinan seri pertama, supaya grafik tetap tergambar; guru tinggal mengganti angkanya
        jalankan: () => t.map((r, i) => [...r, i ? r[1] : jenis === "pencar" ? `Kelompok ${nSeri + 1}` : `Seri ${nSeri + 1}`]),
      });
  }

  // --- bantuan khusus ---
  if (jenis === "histogram") {
    const kls = badan.map((r) => KELAS.exec(r[0]));
    const rapi = kls.length > 0 && kls.every(Boolean);
    const a = rapi ? Number(kls[0]![1].replace("−", "-")) : 51;
    const pj = rapi ? Number(kls[0]![2].replace("−", "-")) - a + 1 : 10;
    const n = badan.length;
    const buat = (aa: number, pp: number, nn: number): Baris[] => {
      if (![aa, pp, nn].every(Number.isInteger) || pp < 1 || nn < minB || nn > maxB) return salin(t);
      return [[...kepala], ...susunKelas(aa, pp, nn).map((k, i) => [k, badan[i]?.[1] ?? "0"])];
    };
    const bulat = (v: string) => (v.trim() ? Number(v.trim().replace("−", "-")) : NaN);
    out.push({
      t: "kelompok",
      label: "Buat kelas otomatis",
      grid: true,
      isian: [
        { t: "isi", label: "Batas bawah kelas pertama", nilai: String(a), angka: true, ubah: (v) => buat(bulat(v), pj, n) },
        { t: "isi", label: "Panjang kelas", nilai: String(pj), angka: true, ubah: (v) => buat(a, bulat(v), n) },
        { t: "isi", label: `Banyak kelas (${minB}–${maxB})`, nilai: String(n), angka: true, ubah: (v) => buat(a, pj, bulat(v)) },
        ...(rapi ? [] : [info("Kelas sekarang tidak berpola angka–angka; mengubah salah satu isian di atas menyusun ulang semua kelas.")]),
      ],
    });
    out.push({
      t: "tempel",
      label: "Hitung frekuensi dari nilai siswa",
      petunjuk: "Tempel nilai siswa satu per satu (dari Excel atau diketik, dipisah spasi/enter). Frekuensi tiap kelas dihitung otomatis.",
      jalankan: (teks) => {
        if (!rapi) return "Susun kelasnya dulu lewat “Buat kelas otomatis”.";
        const f = hitungFrekuensi(teks, a, pj, n);
        return typeof f === "string" ? f : t.map((r, i) => (i ? [r[0], String(f[i - 1])] : [...r]));
      },
    });
  }
  if (jenis === "piramida") {
    const pola = UMUR.find(([, , ls]) => ls.length === badan.length && ls.every((l, i) => samaUmur(l, badan[i][0])));
    out.push({
      t: "pilih",
      label: "Kelompok umur",
      opsi: [...(pola ? [] : ([["", "(tulisan sendiri)"]] as [string, string][])), ...UMUR.map(([v, l]) => [v, l] as [string, string])],
      nilai: pola?.[0] ?? "",
      ubah: (v) => {
        const ls = UMUR.find(([x]) => x === v)?.[2];
        if (!ls) return salin(t);
        const m = ls.length;
        // banyak kelompok sama = angka lama dipakai; selain itu contoh berbentuk piramida (makin tua makin sedikit)
        return [[...kepala], ...ls.map((l, i) => (m === badan.length ? [l, badan[i][1], badan[i][2]] : [l, String(Math.max(1, Math.round((12 * (m - i)) / m))), String(Math.max(1, Math.round((12 * (m - i)) / m) + (i % 2)))]))];
      },
    });
  }
  if (jenis === "lingkaran") {
    const ns = badan.map((r) => bacaAngka(r[1]));
    const total = ns.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
    const persen = /%/.test(pecahNama(kepala[1])[1]);
    if (total > 0)
      out.push(
        info(
          `Jumlah ${tampilAngka(total)}${persen && Math.abs(total - 100) > 0.01 ? " — belum 100%, periksa lagi angkanya" : ""}. Bagian: ${badan.map((r, i) => `${r[0] || "?"} ${tampilAngka(((Number.isFinite(ns[i]) ? ns[i] : 0) / total) * 100)}%`).join(", ")}.`,
        ),
      );
  }

  // --- lembar data ---
  const kolom = kepala.map((k, j) => ({ label: j === 0 ? pecahNama(k)[0] || "Nama" : pecahNama(k)[0] || `Seri ${j}`, angka: j > 0 || xAngka }));
  const geser = jenis !== "histogram";
  out.push({
    t: "lembar",
    kolom,
    isi: badan,
    ubah: (i, j, v) => sel(i + 1, j, v),
    aksi: (i) => [
      ...(geser && i > 0 ? [{ label: "↑", judul: `Pindahkan baris ${i + 1} ke atas`, jalankan: () => tukar(t, i + 1, i) }] : []),
      ...(geser && i < badan.length - 1 ? [{ label: "↓", judul: `Pindahkan baris ${i + 1} ke bawah`, jalankan: () => tukar(t, i + 1, i + 2) }] : []),
      ...(badan.length > minB ? [{ label: "✕", judul: `Hapus baris ${i + 1}`, jalankan: () => ubahBaris(t, i + 1, null) }] : []),
    ],
    tempel: (teks) => tempelData(jenis, kepala, teks),
  });
  if (badan.length < maxB && jenis !== "histogram")
    out.push({
      t: "tombol",
      label: "+ Baris",
      jalankan: () => {
        const akhir = badan[badan.length - 1] ?? kepala.map(() => "1");
        const x = xAngka ? tampilAngka((bacaAngka(akhir[0]) || 0) + 1) : `Data ${badan.length + 1}`;
        return [...salin(t), [x, ...akhir.slice(1)]];
      },
    });
  out.push({
    t: "tempel",
    label: "Tempel dari Excel / Google Sheets",
    petunjuk: "Blok tabel di Excel (boleh beserta baris judulnya), salin (Ctrl+C), lalu tempel (Ctrl+V) di kotak ini. Bisa juga langsung tempel di salah satu kotak tabel di atas.",
    jalankan: (teks) => tempelData(jenis, kepala, teks),
  });
  return out;
}
/** Contoh nama sumbu mendatar tiap jenis (placeholder). */
const ATURAN_CONTOH: Record<string, string[]> = { batang: ["Kelas"], garis: ["Bulan"], lingkaran: ["Pekerjaan"], histogram: ["Nilai"], pencar: ["Jam belajar per hari"], piramida: ["Umur (tahun)"] };

const RESEP: Record<string, (p: Pb) => Isian[]> = {
  datar: resepDatar,
  ruang: resepRuang,
  sudut: resepSudut,
  optik: resepOptik,
  gaya: resepGaya,
  katrol: resepKatrol,
  tuas: resepTuas,
  atom: resepAtom,
  arah: resepArah,
  langit: resepLangit,
  ekonomi: resepEkonomi,
  lapisan: resepLapisan,
  shaf: resepShaf,
  waktu: resepWaktu,
  alur: (p) => resepLangkah(p, false),
  siklus: (p) => resepLangkah(p, true),
  pohon: resepPohon,
  koordinat: resepKoordinat,
  bilangan: resepBilangan,
  listrik: resepListrik,
  jaring: resepJaring,
  waris: resepWaris,
  ...Object.fromEntries(DATA_GRAFIK.map((j) => [j, (p: Pb) => resepData(p, j)])),
};
export const punyaFormulir = (jenis: string) => jenis in RESEP;
/** Banyak kolom tabel [min, maks] tiap jenis berformulir (selain ini tepat 2). */
const KOLOM: Record<string, number> = { alur: 1, siklus: 1, koordinat: 3, bilangan: 3 };
export const kolomFormulir = (jenis: string): [number, number] => (SERI[jenis] ? [SERI[jenis][0] + 1, SERI[jenis][1] + 1] : [KOLOM[jenis] ?? 2, KOLOM[jenis] ?? 2]);

/** Tabel (tanpa baris judul) → isian formulir + indeks baris yang tidak dikenali resep. */
export function formulir(jenis: string, baris: Baris[]): { isian: Isian[]; sisa: number[] } | null {
  const resep = RESEP[jenis];
  if (!resep) return null;
  const p = pembuat(baris);
  const isian = resep(p);
  return { isian, sisa: baris.map((_, i) => i).filter((i) => !p.dipakai.has(i)) };
}
