// Batas pemakaian (aturan 4), dipakai actions.ts dan halaman Kelola guru supaya angkanya selalu sama.
export const BATAS_PER_GURU = 10; // set per guru per hari (WIB); admin tidak dibatasi per guru
export const BATAS_TOTAL = 100; // set per hari seluruh web, pengaman saldo AI
export const BATAS_UBAH_PER_GURU = 60; // Ganti/Ubah/Tambah soal (yang berhasil) per guru per hari; admin bebas
export const BATAS_ANALISA = 30; // analisa materi per guru per hari; admin bebas

// Pembatas percobaan masuk (tanpa import Next/DB, supaya bisa dites: npm test).
// ponytail: disimpan di memori (hilang saat server restart), cukup untuk satu madrasah & satu proses server.

export const BATAS_PERANGKAT = 5; // salah dari satu perangkat (IP) untuk satu nama pengguna
export const BATAS_NAMA = 30; // salah dari semua perangkat untuk satu nama pengguna (cegah tebak beramai-ramai)
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
    /** Berhasil masuk: catatan perangkat ini dihapus (catatan nama tetap, supaya tebakan dari perangkat lain tetap terhitung). */
    berhasil(ip: string, nama: string) {
      data.delete(kunciPerangkat(ip, nama));
    },
  };
}

/**
 * IP perangkat dari header proxy. Diambil yang TERAKHIR di X-Forwarded-For (ditambahkan proxy hosting sendiri);
 * nilai paling depan bisa diisi bebas oleh pengirim, jadi tidak dipercaya.
 */
export function ipDari(xff: string | null, cadangan = "?") {
  const daftar = String(xff ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return daftar.at(-1) ?? cadangan;
}
