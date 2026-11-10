// Gambar materi/soal (0.30.0). Tanpa import "@/..." supaya bisa dites langsung: npm test
// Gambar selalu dikecilkan & diubah jadi JPEG di browser guru (src/app/gambar.tsx); server hanya menerima JPEG.

export const BATAS_GAMBAR = {
  sisi: 1280, // px, sisi terpanjang setelah dikecilkan
  bita: 450 * 1024, // satu gambar (base64-nya ±600 KB, di bawah batas kiriman aksi server 1 MB)
  perMateri: 10,
  perSet: 20, // materi digabung (PTS/PAS): yang dikirim ke AI paling banyak sekian
  perGuru: 300,
  keterangan: 200,
};

/** Gambar di data bab: id = baris tabel `gambar`; keterangan opsional dari guru (dibaca AI & model tanpa penglihatan). */
export type GambarBab = { id: number; keterangan: string };

/** Lebar & tinggi JPEG dari penanda SOF-nya, atau null kalau bukan JPEG yang sah. */
export function ukuranJpeg(b: Uint8Array): { lebar: number; tinggi: number } | null {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const jenis = b[i + 1];
    if (jenis === 0xff) { i++; continue; } // bita pengisi
    const panjang = (b[i + 2] << 8) | b[i + 3];
    // SOF0–SOF15 kecuali DHT (C4), JPG (C8), DAC (CC)
    if (jenis >= 0xc0 && jenis <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(jenis)) {
      const tinggi = (b[i + 5] << 8) | b[i + 6];
      const lebar = (b[i + 7] << 8) | b[i + 8];
      return lebar && tinggi ? { lebar, tinggi } : null;
    }
    i += 2 + panjang;
  }
  return null;
}

/** Daftar gambar dari browser → rapi: id bulat unik, keterangan dipotong, paling banyak `maks`. */
export function rapikanGambar(x: unknown, maks: number = BATAS_GAMBAR.perMateri): GambarBab[] {
  const hasil: GambarBab[] = [];
  for (const g of Array.isArray(x) ? x : []) {
    const id = Number((g as GambarBab)?.id);
    if (!Number.isInteger(id) || id <= 0 || hasil.some((h) => h.id === id)) continue;
    hasil.push({ id, keterangan: String((g as GambarBab)?.keterangan ?? "").replace(/\s+/g, " ").trim().slice(0, BATAS_GAMBAR.keterangan) });
    if (hasil.length >= maks) break;
  }
  return hasil;
}

/** Ukuran tampil di Word (piksel 96 dpi): muat di satu kolom lembar soal, perbandingan sisi tetap. */
export function ukuranWord(lebar: number, tinggi: number, maksLebar = 280, maksTinggi = 220) {
  const skala = Math.min(1, maksLebar / lebar, maksTinggi / tinggi);
  return { width: Math.round(lebar * skala), height: Math.round(tinggi * skala) };
}
