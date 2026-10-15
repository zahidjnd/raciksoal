// "Materi sendiri" milik guru (langkah 8). Tanpa import "@/..." supaya bisa dites langsung: npm test
import { arabTakTerverifikasi, korpusArab, POLA_ARAB, type Bab } from "./soal.ts";

export const BATAS_MATERI = { judul: 150, tp: 15, teksTp: 500, isiMin: 100, isi: 30000, dalil: 20, teksDalil: 3000, perGuru: 50 };

/** Isian form "Materi Saya" (apa adanya dari browser, belum dipercaya). */
export type IsianMateri = {
  judul: string;
  tp: string; // satu TP per baris, boleh diawali kode, mis. "TP 1.2: ..."
  isi: string;
  dalil: { sumber: string; arab: string; terjemah: string; usulan?: boolean }[]; // usulan: diambil dari file (tampilan saja)
  diverifikasi: boolean; // centang: guru sudah memeriksa teks ayat/hadis
};

const teks = (x: unknown) => String(x ?? "").normalize("NFC").trim();

/**
 * Rapikan isian materi menjadi data bab. Aturan 5: teks Arab hanya dipercaya dari kotak "Ayat & Hadis Terverifikasi"
 * (yang dicentang guru). Teks Arab di judul/TP/isi yang tidak ada di kotak itu dibuang dan dilaporkan di `dihapus`.
 * Mengembalikan pesan kalau isian tidak valid.
 */
export function rapikanMateri(x: Partial<IsianMateri>, id: string): { bab: Bab; dihapus: string[] } | string {
  const B = BATAS_MATERI;
  const judul = teks(x?.judul);
  if (!judul) return "Judul materi wajib diisi.";
  if (judul.length > B.judul) return `Judul maksimal ${B.judul} huruf.`;

  const dalilMentah = (Array.isArray(x?.dalil) ? x.dalil : [])
    .map((d) => ({ sumber: teks(d?.sumber), arab: teks(d?.arab), terjemah: teks(d?.terjemah) }))
    .filter((d) => d.sumber || d.arab || d.terjemah);
  if (dalilMentah.length > B.dalil) return `Ayat/hadis maksimal ${B.dalil}.`;
  for (const [i, d] of dalilMentah.entries()) {
    if (!d.sumber || !d.arab || !d.terjemah) return `Ayat/hadis ke-${i + 1}: sumber, teks Arab, dan terjemah wajib diisi.`;
    if (!new RegExp(POLA_ARAB).test(d.arab)) return `Ayat/hadis ke-${i + 1}: kolom teks Arab tidak berisi huruf Arab.`;
    if (Object.values(d).some((t) => t.length > B.teksDalil)) return `Ayat/hadis ke-${i + 1}: teks terlalu panjang (maks ${B.teksDalil} huruf).`;
  }
  if (dalilMentah.length && x?.diverifikasi !== true) return "Centang pernyataan bahwa teks ayat/hadis sudah Anda periksa.";
  const dalil = dalilMentah.map((d, i) => ({ id: `dalil-${i + 1}`, ...d, mufradat: [] }));

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

  return { bab: { id, judul: bersihkan(judul), tp, dalil, materi }, dihapus };
}

/** Kebalikan rapikanMateri: data bab tersimpan → isian form (untuk mengedit). */
export function keIsian(bab: Bab): IsianMateri {
  return {
    judul: bab.judul,
    tp: bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n"),
    isi: bab.materi.join("\n"),
    dalil: bab.dalil.map(({ sumber, arab, terjemah }) => ({ sumber, arab, terjemah })),
    diverifikasi: bab.dalil.length > 0,
  };
}
