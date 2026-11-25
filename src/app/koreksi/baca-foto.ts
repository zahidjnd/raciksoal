// Baca satu foto LJK di browser: dikecilkan, diabukan, dibaca mesin ljk.ts, potongan nama jadi JPEG kecil.
import { bacaLjk, keAbu, LJK, potong, type Jawab } from "@/lib/ljk";

const SISI = 1600; // cukup tajam untuk bulatan, tetap cepat di HP

export type HasilFoto = { ok: true; jawab: Jawab[]; potong: string } | { ok: false; pesan: string };

/** Gambar apa pun (foto, bingkai video) → kanvas abu-abu berukuran maks `sisi`. */
export function keKanvas(sumber: CanvasImageSource, lebar: number, tinggi: number, sisi = SISI) {
  const f = Math.min(1, sisi / Math.max(lebar, tinggi));
  const w = Math.round(lebar * f), h = Math.round(tinggi * f);
  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(sumber, 0, 0, w, h);
  return keAbu(ctx.getImageData(0, 0, w, h).data, w, h);
}

export async function bacaFoto(file: Blob): Promise<HasilFoto> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    return { ok: false, pesan: "Foto tidak bisa dibuka." };
  }
  return bacaGambar(bmp, bmp.width, bmp.height);
}

/** Baca LJK dari foto atau bingkai kamera langsung. */
export function bacaGambar(sumber: CanvasImageSource, lebar: number, tinggi: number): HasilFoto {
  const g = keKanvas(sumber, lebar, tinggi);
  const r = bacaLjk(g);
  if (!r.ok) return r;
  const n = potong(g, r.H, LJK.nama, 480);
  const k = document.createElement("canvas");
  k.width = n.w;
  k.height = n.h;
  const kx = k.getContext("2d")!;
  const img = kx.createImageData(n.w, n.h);
  n.d.forEach((v, i) => img.data.set([v, v, v, 255], i * 4));
  kx.putImageData(img, 0, 0);
  return { ok: true, jawab: r.jawab, potong: k.toDataURL("image/jpeg", 0.6).split(",")[1] };
}
