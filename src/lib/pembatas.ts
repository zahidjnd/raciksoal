// Batas pemakaian (aturan 4), dipakai actions.ts dan halaman Kelola guru supaya angkanya selalu sama.
export const BATAS_PER_GURU = 10; // set per guru per hari (WIB); admin tidak dibatasi per guru
export const BATAS_TOTAL = 100; // set per hari seluruh web, pengaman saldo AI
export const BATAS_UBAH_PER_GURU = 60; // Ganti/Ubah/Tambah soal (yang berhasil) per guru per hari; admin bebas
export const BATAS_ANALISA = 30; // analisa materi per guru per hari; admin bebas
export const BATAS_HALAMAN_PDF = 200; // halaman PDF yang dibaca AI per guru per hari (0.31.0: 100; 0.34.1: 200); admin bebas
// Halaman per PDF yang dibaca AI sekali lampir (dipilih guru bila PDF lebih panjang). 0.33.0: 30 (satu bab Fisika X = 28
// halaman); 0.34.1: 50; 0.47.2: 75. Jangan jauh lebih tinggi: 75 halaman buku padat ±150 ribu huruf = batas materi (BATAS_MATERI.isi).
export const MAKS_HALAMAN_PDF = 75;

// Pembatas percobaan masuk (tanpa import Next/DB, supaya bisa dites: npm test).
// ponytail: disimpan di memori (hilang saat server restart), cukup untuk satu madrasah & satu proses server.

export const BATAS_PERANGKAT = 5; // salah dari satu perangkat (IP) untuk satu nama pengguna
export const BATAS_NAMA = 30; // salah dari semua perangkat untuk satu nama pengguna (cegah tebak beramai-ramai)
// Nama tak terdaftar dari satu perangkat (0.32.5). Halaman masuk memberi tahu "nama tidak terdaftar" supaya guru tahu
// salahnya di mana; lewat batas ini perangkat itu hanya mendapat pesan umum (cegah coba-coba nama). Tidak mengunci
// masuk: satu madrasah bisa berbagi satu IP, guru yang namanya benar tetap bisa masuk.
export const BATAS_NAMA_ASING = 10;
export const LAMA_KUNCI = 15 * 60 * 1000;

type Catatan = { kali: number; sampai: number };

/**
 * Audit 2026-11-04 C4: dulu kunci hanya per nama pengguna, jadi orang lain bisa mengunci akun guru dengan 5 kali salah.
 * Kini kunci utama per perangkat + nama (guru tetap bisa masuk dari perangkatnya sendiri), ditambah batas longgar
 * per nama dari semua perangkat.
 */
export function buatPembatas(sekarang = () => Date.now()) {
  const data = new Map<string, Catatan>();
  const masihBerlaku = (c?: Catatan) => (c && c.sampai > sekarang() ? c : undefined);
  const kunciPerangkat = (ip: string, nama: string) => `${ip}|${nama}`;

  return {
    /** true = sedang dikunci, jangan coba masuk. */
    terkunci(ip: string, nama: string) {
      const p = masihBerlaku(data.get(kunciPerangkat(ip, nama)));
      const n = masihBerlaku(data.get(nama));
      return (p?.kali ?? 0) >= BATAS_PERANGKAT || (n?.kali ?? 0) >= BATAS_NAMA;
    },
    gagal(ip: string, nama: string) {
      if (data.size > 5000) for (const [k, c] of data) if (c.sampai <= sekarang()) data.delete(k); // bersihkan yang kedaluwarsa
      for (const k of [kunciPerangkat(ip, nama), nama]) {
        const lama = masihBerlaku(data.get(k));
        data.set(k, { kali: (lama?.kali ?? 0) + 1, sampai: sekarang() + LAMA_KUNCI });
      }
    },
    /** Admin mereset kata sandi: semua kunci untuk nama ini dibuka (dari perangkat mana pun). */
    buka(nama: string) {
      for (const k of data.keys()) if (k === nama || k.endsWith(`|${nama}`)) data.delete(k);
    },
    /** Mencoba nama yang tidak terdaftar. */
    namaAsing(ip: string) {
      const lama = masihBerlaku(data.get(`asing>${ip}`));
      data.set(`asing>${ip}`, { kali: (lama?.kali ?? 0) + 1, sampai: sekarang() + LAMA_KUNCI });
    },
    /** true = perangkat ini sudah terlalu sering mencoba nama tak terdaftar: beri pesan umum saja. */
    samar(ip: string) {
      return (masihBerlaku(data.get(`asing>${ip}`))?.kali ?? 0) >= BATAS_NAMA_ASING;
    },
    /** Berhasil masuk: catatan perangkat ini dihapus (catatan nama tetap, supaya tebakan dari perangkat lain tetap terhitung). */
    berhasil(ip: string, nama: string) {
      data.delete(kunciPerangkat(ip, nama));
    },
  };
}

/**
 * Satu pembatas untuk seluruh server: dipakai halaman Masuk (mencatat salah) dan Kelola guru (reset = buka kunci).
 * Disimpan di globalThis supaya tetap satu walau berkas dimuat ulang (mode dev) atau dibundel di dua tempat.
 */
const g = globalThis as typeof globalThis & { __pembatasMasuk?: ReturnType<typeof buatPembatas> };
export const pembatasMasuk = (g.__pembatasMasuk ??= buatPembatas());

/**
 * IP perangkat dari header proxy. Diambil yang TERAKHIR di X-Forwarded-For (ditambahkan proxy hosting sendiri);
 * nilai paling depan bisa diisi bebas oleh pengirim, jadi tidak dipercaya.
 */
export function ipDari(xff: string | null, cadangan = "?") {
  const daftar = String(xff ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return daftar.at(-1) ?? cadangan;
}
