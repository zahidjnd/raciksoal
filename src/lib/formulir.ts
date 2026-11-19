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
import { konfigurasiBohr } from "./skema.ts";

export type Baris = [string, string];
export type Isian =
  | { t: "pilih"; label: string; opsi: [string, string][]; nilai: string; ubah: (v: string) => Baris[]; kartu?: boolean }
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
    }
  | { t: "centang"; label: string; nilai: boolean; ubah: (b: boolean) => Baris[] }
  | { t: "info"; teks: string }
  | { t: "kelompok"; label: string; isian: Isian[]; aksi?: { label: string; judul: string; jalankan: () => Baris[] }[]; grid?: boolean }
  | { t: "tombol"; label: string; jalankan: () => Baris[] };

// ---------- alat bantu baris ----------

/** Kunci satu huruf ("F" tarik vs "f" gesek) dibandingkan persis; selain itu tanpa beda huruf besar/spasi/tanda hubung. */
const sama = (k: string, kunci: string) => (/^[A-Za-z]$/.test(kunci) ? k.trim() === kunci : normal(k) === normal(kunci));
const salin = (b: Baris[]) => b.map((x) => [x[0], x[1]] as Baris);
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
  isi(p, label, kunci, { tanya: true, contoh: "65 atau x", tulis: (x) => (/\d$/.test(x.trim()) ? `${x.trim()}°` : x.trim()), satuan: "°", angka: false });

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
        { t: "isi", label: "Keterangan", nilai: ket === "?" || ket === "-" ? "" : ket, contoh: "0–12 km", ubah: (x) => ubahBaris(p.baris, i, [nama, x.trim() || "-"]), tanya: { aktif: ket === "?", ubah: (b) => ubahBaris(p.baris, i, [nama, b ? "?" : "-"]) } },
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
};
export const punyaFormulir = (jenis: string) => jenis in RESEP;

/** Tabel (tanpa baris judul) → isian formulir + indeks baris yang tidak dikenali resep. */
export function formulir(jenis: string, baris: Baris[]): { isian: Isian[]; sisa: number[] } | null {
  const resep = RESEP[jenis];
  if (!resep) return null;
  const p = pembuat(baris);
  const isian = resep(p);
  return { isian, sisa: baris.map((_, i) => i).filter((i) => !p.dipakai.has(i)) };
}
