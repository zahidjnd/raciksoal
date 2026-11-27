// Batas pemakaian AI (aturan 4): angka & aturan penggabungan murni (tanpa DB, supaya bisa dites: npm test).
// Tiga lapis, yang paling spesifik menang: batas khusus guru → batas bawaan (diatur admin di /admin/batas) → NORMAL di sini.
// Dipakai lib/batas.ts (server), halaman Admin → Batas, Akun, dan Set baru.

export const JENIS_BATAS = ["set", "bulan", "ubah", "analisa", "halaman"] as const;
export type JenisBatas = (typeof JENIS_BATAS)[number];
/** Angka batas per jenis. Di database -1 = tanpa batas; setelah digabung `Infinity`. */
export type Angka = Record<JenisBatas, number>;
export type Bawaan = Angka & { web: number }; // web = total set seluruh guru per hari (pengaman saldo AI)

export const BEBAS = -1;
export const MAKS_ANGKA = 100000;

export const NAMA_JENIS: Record<JenisBatas | "web", { nama: string; satuan: string; per: string }> = {
  set: { nama: "Set soal", satuan: "set", per: "hari" },
  bulan: { nama: "Set soal", satuan: "set", per: "bulan" },
  ubah: { nama: "Ganti / Ubah / Tambah soal", satuan: "kali", per: "hari" },
  analisa: { nama: "Analisa materi", satuan: "kali", per: "hari" },
  halaman: { nama: "Halaman PDF dibaca AI", satuan: "halaman", per: "hari" },
  web: { nama: "Total semua guru", satuan: "set", per: "hari" },
};

// Paket siap pakai. NORMAL = angka sebelum dilonggarkan untuk ASAS (0.48.1) + batas bulanan; dipakai bila admin belum mengatur.
export const NORMAL: Bawaan = { set: 10, bulan: 150, ubah: 60, analisa: 30, halaman: 200, web: 100 };
export const HEMAT: Bawaan = { set: 5, bulan: 60, ubah: 30, analisa: 15, halaman: 100, web: 50 };
export const LONGGAR: Bawaan = { set: 50, bulan: 600, ubah: 500, analisa: 300, halaman: 1000, web: 500 };

const angkaSah = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && (v === BEBAS || (v >= 0 && v <= MAKS_ANGKA)) ? v : undefined);

/** Isi pengaturan bawaan dari database: angka yang rusak/hilang diganti NORMAL. */
export function rapikanBawaan(mentah: unknown) {
  const m = (mentah ?? {}) as Record<string, unknown>;
  const b = { ...NORMAL };
  for (const k of [...JENIS_BATAS, "web"] as const) b[k] = angkaSah(m[k]) ?? NORMAL[k];
  return { ...b, rem: m.rem === true, remPesan: typeof m.remPesan === "string" ? m.remPesan.slice(0, 200) : "" };
}

/** Batas khusus satu guru: hanya jenis yang diisi (selain itu ikut bawaan). */
export function rapikanKhusus(mentah: unknown) {
  const m = (mentah ?? {}) as Record<string, unknown>;
  const k: Partial<Angka> = {};
  for (const j of JENIS_BATAS) {
    const a = angkaSah(m[j]);
    if (a !== undefined) k[j] = a;
  }
  return k;
}

/** Gabungkan tiga lapis. `sampai` lewat → batas khusus dianggap tidak ada (guru kembali ke bawaan). */
export function gabungBatas(bawaan: Bawaan, khusus: Partial<Angka> | null, sampai: Date | null, sekarang = new Date()) {
  const aktif = !!khusus && Object.keys(khusus).length > 0 && (!sampai || sampai > sekarang);
  const angka = {} as Angka;
  for (const j of JENIS_BATAS) {
    const v = (aktif ? khusus![j] : undefined) ?? bawaan[j];
    angka[j] = v === BEBAS ? Infinity : v;
  }
  return { angka, khusus: aktif };
}

/** Akun yang semua jenisnya 0 = "dihentikan" (tombol Stop di admin). */
export const dihentikan = (a: Angka) => JENIS_BATAS.every((j) => a[j] === 0);

const WIB = 7 * 3600_000;
/** Batas berlaku: "hari" = sampai 00.00 WIB berikutnya, "7"/"30" = sampai akhir hari ke-n, selain itu tanpa tanggal. */
export function sampaiDari(lama: string, sekarang = new Date()) {
  const n = lama === "hari" ? 1 : lama === "7" ? 7 : lama === "30" ? 30 : 0;
  if (!n) return null;
  const awalHari = Math.floor((sekarang.getTime() + WIB) / 86400_000) * 86400_000 - WIB;
  return new Date(awalHari + n * 86400_000);
}

/** Pesan untuk guru bila jatah habis / dihentikan. null = masih boleh. `terpakai` = jumlah yang sudah dipakai periode ini. */
export function pesanBatas(jenis: JenisBatas, batas: number, terpakai: number, khusus: boolean): string | null {
  if (terpakai < batas) return null;
  const akhiran = jenis === "halaman" ? " Halaman berikutnya memakai teks PDF biasa (tabel, rumus, dan gambar tidak terbaca)." : "";
  if (batas === 0)
    return `${khusus ? "Pemakaian AI untuk akun Anda sedang dihentikan admin" : "Fitur ini sedang ditutup admin"}. Edit manual dan tulis soal sendiri tetap bisa; hubungi admin bila perlu.${akhiran}`;
  switch (jenis) {
    case "set":
      return `Jatah ${batas} set soal Anda hari ini sudah habis. Silakan lanjutkan besok.`;
    case "bulan":
      return `Jatah ${batas} set soal Anda bulan ini sudah habis; kembali penuh tanggal 1. Hubungi admin bila perlu tambahan.`;
    case "ubah":
      return `Batas ${batas} kali ganti/ubah/tambah soal hari ini sudah habis. Edit manual dan tulis soal sendiri tetap bisa; coba lagi besok.`;
    case "analisa":
      return `Batas ${batas} analisa materi hari ini sudah habis. Pakai materi yang sudah ada, atau lanjutkan besok.`;
    case "halaman":
      return `Batas ${batas} halaman PDF dibaca AI hari ini sudah habis.${akhiran}`;
  }
}

/** Catatan admin tanpa tanda baca di ujung, supaya kalimat penutup tidak menempel/dobel titik. */
export const rapikanCatatan = (c: string) => c.replace(/[\s.!?]+$/, "");
export const pesanRem = (catatan: string) =>
  `Pembuatan soal dengan AI sedang dihentikan sementara oleh admin${catatan ? `: ${rapikanCatatan(catatan)}` : ""}. Edit manual dan tulis soal sendiri tetap bisa; coba lagi nanti.`;
