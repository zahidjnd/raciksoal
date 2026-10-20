// "Materi sendiri" milik guru (langkah 8). Tanpa import "@/..." supaya bisa dites langsung: npm test
import { arabTakTerverifikasi, identitasBab, KELAS, korpusArab, POLA_ARAB, type Bab } from "./soal.ts";

export const BATAS_MATERI = { judul: 150, mapel: 60, tp: 15, teksTp: 500, isiMin: 100, isi: 30000, dalil: 20, teksDalil: 3000, perGuru: 50 };

/** Saran isian kolom Mapel (boleh diketik lain). */
export const DAFTAR_MAPEL = [
  "Al-Qur'an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab", "Bahasa Indonesia", "Bahasa Inggris",
  "Matematika", "Fisika", "Kimia", "Biologi", "Ekonomi", "Geografi", "Sosiologi", "Sejarah", "Pendidikan Pancasila", "Informatika",
  "Ilmu Tafsir", "Ilmu Hadis", "Ushul Fikih", "Ilmu Kalam", "Akhlak",
];

/** Isian form "Materi Saya" (apa adanya dari browser, belum dipercaya). */
export type IsianMateri = {
  mapel: string;
  kelas: string; // "X" | "XI" | "XII"
  judul: string;
  tp: string; // satu TP per baris, boleh diawali kode, mis. "TP 1.2: ..."
  isi: string;
  // usulan: teks Arab dari file yang tidak ditemukan di mushaf; mushaf: teks dari data mushaf (keduanya tampilan saja,
  // server selalu mencocokkan ulang ke mushaf)
  dalil: { sumber: string; arab: string; terjemah: string; usulan?: boolean; mushaf?: boolean }[];
  diverifikasi: boolean; // centang: guru sudah memeriksa teks hadis / teks Arab yang tidak ada di mushaf
};

/** Pencari ayat di mushaf (mushaf().cari); disuntikkan supaya file ini tetap bisa dites tanpa membaca mushaf. */
export type CariAyat = (arab: string, petunjuk: string) => { sumber: string; arab: string } | null;

const teks = (x: unknown) => String(x ?? "").normalize("NFC").trim();

/**
 * Rapikan isian materi menjadi data bab. Aturan 5: teks Arab hanya dipercaya dari kotak "Ayat & Hadis Terverifikasi".
 * Teks yang ditemukan di mushaf (`cariAyat`) DIGANTI teks resmi mushaf + sumbernya, tanpa perlu centang; selebihnya
 * (hadis, dll.) wajib dicentang guru. Teks Arab di judul/TP/isi yang tidak ada di kotak itu dibuang dan dilaporkan di
 * `dihapus`. Mengembalikan pesan kalau isian tidak valid.
 */
export function rapikanMateri(x: Partial<IsianMateri>, id: string, cariAyat?: CariAyat): { bab: Bab; dihapus: string[] } | string {
  const B = BATAS_MATERI;
  const mapel = teks(x?.mapel).replace(/\s+/g, " ");
  if (!mapel) return "Mata pelajaran wajib diisi.";
  if (mapel.length > B.mapel) return `Nama mata pelajaran maksimal ${B.mapel} huruf.`;
  const kelas = teks(x?.kelas);
  if (!KELAS.includes(kelas)) return "Pilih kelas X, XI, atau XII.";
  const judul = teks(x?.judul);
  if (!judul) return "Judul materi wajib diisi.";
  if (judul.length > B.judul) return `Judul maksimal ${B.judul} huruf.`;

  const dalilMentah = (Array.isArray(x?.dalil) ? x.dalil : [])
    .map((d) => ({ sumber: teks(d?.sumber), arab: teks(d?.arab), terjemah: teks(d?.terjemah) }))
    .filter((d) => d.sumber || d.arab || d.terjemah)
    .map((d) => {
      const ayat = d.arab ? cariAyat?.(d.arab, d.sumber) : null;
      return ayat ? { ...d, ...ayat, mushaf: true } : { ...d, mushaf: false };
    });
  if (dalilMentah.length > B.dalil) return `Ayat/hadis maksimal ${B.dalil}.`;
  for (const [i, d] of dalilMentah.entries()) {
    if (!d.sumber || !d.arab || !d.terjemah) return `Ayat/hadis ke-${i + 1}: sumber, teks Arab, dan terjemah wajib diisi.`;
    if (!new RegExp(POLA_ARAB).test(d.arab)) return `Ayat/hadis ke-${i + 1}: kolom teks Arab tidak berisi huruf Arab.`;
    if ([d.sumber, d.arab, d.terjemah].some((t) => t.length > B.teksDalil)) return `Ayat/hadis ke-${i + 1}: teks terlalu panjang (maks ${B.teksDalil} huruf).`;
  }
  if (dalilMentah.some((d) => !d.mushaf) && x?.diverifikasi !== true)
    return "Ada teks Arab yang tidak ditemukan di mushaf (hadis atau lainnya). Centang pernyataan bahwa teks itu sudah Anda periksa.";
  const dalil = dalilMentah.map(({ mushaf, ...d }, i) => ({ id: `dalil-${i + 1}`, ...d, mufradat: [], ...(mushaf && { mushaf }) }));

  // Buang teks Arab yang tidak berasal dari kotak ayat/hadis terverifikasi.
  const korpus = korpusArab({ id: "", judul: "", tp: [], materi: [], dalil });
  const dihapus: string[] = [];
  const bersihkan = (t: string) => {
    const asing = new Set(arabTakTerverifikasi(t, korpus));
    dihapus.push(...asing);
    return asing.size ? t.replace(new RegExp(POLA_ARAB, "g"), (p) => (asing.has(p) ? "" : p)).replace(/[ \t]{2,}/g, " ").trim() : t;
  };

  const barisTp = teks(x?.tp).split("\n").map((b) => b.trim()).filter(Boolean);
  if (!barisTp.length) return "Tujuan Pembelajaran (TP) wajib diisi, satu per baris.";
  if (barisTp.length > B.tp) return `TP maksimal ${B.tp} baris.`;
  if (barisTp.some((b) => b.length > B.teksTp)) return `Satu TP maksimal ${B.teksTp} huruf.`;
  const tp = barisTp.map((b, i) => {
    const m = /^TP\s*([\d.]+)\s*[:.\-–]?\s*(.+)$/i.exec(b);
    return m ? { kode: `TP ${m[1].replace(/\.$/, "")}`, teks: bersihkan(m[2]) } : { kode: `TP ${i + 1}`, teks: bersihkan(b) };
  });

  const isi = teks(x?.isi);
  if (isi.length < B.isiMin) return `Isi materi terlalu pendek (minimal ${B.isiMin} huruf).`;
  if (isi.length > B.isi) return `Isi materi terlalu panjang (maksimal ${B.isi.toLocaleString("id-ID")} huruf, sekarang ${isi.length.toLocaleString("id-ID")}).`;
  const materi = isi.split("\n").map((b) => bersihkan(b.trim())).filter(Boolean);

  return { bab: { id, mapel: bersihkan(mapel), kelas, judul: bersihkan(judul), tp, dalil, materi }, dihapus };
}

/** Kebalikan rapikanMateri: data bab tersimpan → isian form (untuk mengedit). Materi lama tanpa mapel → identitasBab. */
export function keIsian(bab: Bab): IsianMateri {
  return {
    ...identitasBab(bab),
    judul: bab.judul,
    tp: bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n"),
    isi: bab.materi.join("\n"),
    dalil: bab.dalil.map(({ sumber, arab, terjemah, mushaf }) => ({ sumber, arab, terjemah, ...(mushaf && { mushaf }) })),
    diverifikasi: bab.dalil.some((d) => !d.mushaf),
  };
}
