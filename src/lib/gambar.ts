// Gambar materi/soal (0.30.0). Tanpa import "@/..." supaya bisa dites langsung: npm test
// Gambar selalu dikecilkan & diubah jadi JPEG di browser guru (src/app/gambar.tsx); server hanya menerima JPEG.

export const BATAS_GAMBAR = {
  sisi: 1280, // px, sisi terpanjang setelah dikecilkan
  bita: 450 * 1024, // satu gambar (base64-nya ±600 KB, di bawah batas kiriman aksi server 1 MB)
  perMateri: 10,
  perSet: 20, // materi digabung (PTS/PAS): yang dikirim ke AI paling banyak sekian
  perGuru: 600, // 0.48.1 (dulu 300)
  keterangan: 200,
  dinilai: 20, // gambar yang dinilai AI saat analisa materi (pratinjau kecil); sisanya hanya ditawarkan ke guru
  pratinjau: 384, // px, sisi terpanjang pratinjau untuk dinilai AI
  bitaPratinjau: 25 * 1024, // 20 pratinjau ±670 KB base64 + teks materi: tetap di bawah batas kiriman 1 MB
};

/** Gambar di data bab: id = baris tabel `gambar`; keterangan opsional dari guru (dibaca AI & model tanpa penglihatan). */
export type GambarBab = { id: number; keterangan: string };

/** Kotak potong gambar (0.34.0, potong-gambar.tsx): pecahan 0–1 dari lebar/tinggi gambar. */
export type KotakPotong = { kiri: number; atas: number; kanan: number; bawah: number };
export type Pegangan = "geser" | "kiri-atas" | "kanan-atas" | "kiri-bawah" | "kanan-bawah";
const MIN_POTONG = 0.05; // kotak potong paling kecil 5% sisi gambar
const batasi = (n: number, bawah: number, atas: number) => Math.min(atas, Math.max(bawah, n));

/** Geser kotak (dx, dy dalam pecahan) sesuai pegangan yang ditarik; tetap di dalam gambar dan tidak lebih kecil dari 5%. */
export function geserKotak(k: KotakPotong, p: Pegangan, dx: number, dy: number): KotakPotong {
  if (p === "geser") {
    const x = batasi(dx, -k.kiri, 1 - k.kanan);
    const y = batasi(dy, -k.atas, 1 - k.bawah);
    return { kiri: k.kiri + x, kanan: k.kanan + x, atas: k.atas + y, bawah: k.bawah + y };
  }
  const b = { ...k };
  if (p.startsWith("kiri")) b.kiri = batasi(k.kiri + dx, 0, k.kanan - MIN_POTONG);
  else b.kanan = batasi(k.kanan + dx, k.kiri + MIN_POTONG, 1);
  if (p.endsWith("atas")) b.atas = batasi(k.atas + dy, 0, k.bawah - MIN_POTONG);
  else b.bawah = batasi(k.bawah + dy, k.atas + MIN_POTONG, 1);
  return b;
}

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

/** Penilaian AI atas gambar materi saat analisa: dipakai untuk soal atau tidak (logo/hiasan), plus keterangannya. */
export type NilaiGambar = { no: number; pakai: boolean; keterangan: string };

/**
 * Jawaban AI "gambar" → satu penilaian per nomor 1..`jumlah` (nomor tanpa penilaian dianggap dipakai, supaya gambar
 * guru tidak hilang diam-diam). `tempel` = nomor gambar yang ditempel guru: selalu dipakai.
 */
export function rapikanNilaiGambar(x: unknown, jumlah: number, tempel: number[] = []): NilaiGambar[] {
  const ai = new Map<number, { pakai?: unknown; keterangan?: unknown }>();
  for (const g of Array.isArray(x) ? x : []) {
    const no = Number((g as { no?: unknown })?.no);
    if (Number.isInteger(no) && no >= 1 && no <= jumlah && !ai.has(no)) ai.set(no, g as object);
  }
  return Array.from({ length: jumlah }, (_, i) => {
    const g = ai.get(i + 1);
    return {
      no: i + 1,
      pakai: tempel.includes(i + 1) || g?.pakai !== false,
      keterangan: String(g?.keterangan ?? "").replace(/\s+/g, " ").trim().slice(0, BATAS_GAMBAR.keterangan),
    };
  });
}

/** Ukuran tampil di Word (piksel 96 dpi): muat di satu kolom lembar soal, perbandingan sisi tetap. */
export function ukuranWord(lebar: number, tinggi: number, maksLebar = 280, maksTinggi = 220) {
  const skala = Math.min(1, maksLebar / lebar, maksTinggi / tinggi);
  return { width: Math.round(lebar * skala), height: Math.round(tinggi * skala) };
}
