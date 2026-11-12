// 0.31.0: PDF dibaca AI di browser guru. Setiap halaman difoto (canvas pdf.js → JPEG), dikirim SATU per panggilan ke
// bacaHalamanPdf (AI membaca teks, tabel, rumus, dan letak gambar), lalu diperiksa cakupannya terhadap teks PDF biasa.
// Gambar isi pelajaran dipotong dari foto halaman. Halaman yang gagal dibaca AI memakai teks PDF biasa (cara lama).
// 0.40.0: foto halaman buku dari HP memakai jalur yang sama (bacaFotoDenganAI), tanpa teks PDF pembanding.
// Dimuat hanya saat guru melampirkan PDF/foto (import dinamis dari kotak-materi.tsx).
import { bacaHalamanPdf } from "./actions";
import { BATAS_GAMBAR } from "@/lib/gambar";
import { geserTandaGambar, POLA_TANDA_GAMBAR, TANDA_PDF, tandaGambar } from "@/lib/materi";
import { bukaPdf, buangKepalaHalaman, cakupanKata, teksHalamanPdf, type GambarFile } from "@/lib/office";

const SISI = 1600; // px sisi terpanjang foto halaman: huruf kecil & rumus masih terbaca (uji 2026-11-11)
const SERENTAK = 3; // halaman yang dibaca bersamaan
const BATAS_CAKUPAN = 0.85; // bacaan AI memuat < 85% kata teks asli → halaman itu memakai teks asli
const RUANG = 0.015; // tambahan tepi potongan gambar (bagian dari lebar/tinggi halaman): kotak AI kadang sedikit sempit

/** Jumlah halaman PDF (untuk memilih rentang halaman yang dibaca AI). */
export async function jumlahHalamanPdf(data: ArrayBuffer) {
  const { doc, tutup } = await bukaPdf(data);
  const n = doc.numPages;
  await tutup();
  return n;
}

const keBita = async (c: HTMLCanvasElement, mutu: number) =>
  new Uint8Array(await (await new Promise<Blob>((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("gagal"))), "image/jpeg", mutu))).arrayBuffer());

/** Potong gambar dari foto halaman sesuai kotak AI (skala 0–1000), dengan sedikit ruang tepi. */
async function potong(foto: HTMLCanvasElement, [x0, y0, x1, y1]: number[], nama: string): Promise<GambarFile> {
  const { width: W, height: H } = foto;
  const kiri = Math.max(0, Math.floor((x0 / 1000 - RUANG) * W));
  const atas = Math.max(0, Math.floor((y0 / 1000 - RUANG) * H));
  const lebar = Math.min(W, Math.ceil((x1 / 1000 + RUANG) * W)) - kiri;
  const tinggi = Math.min(H, Math.ceil((y1 / 1000 + RUANG) * H)) - atas;
  const c = document.createElement("canvas");
  c.width = lebar;
  c.height = tinggi;
  c.getContext("2d")!.drawImage(foto, kiri, atas, lebar, tinggi, 0, 0, lebar, tinggi);
  return { nama, data: await keBita(c, 0.9) };
}

/** Kirim foto halaman ke AI (JPEG, dikecilkan mutunya bila kebesaran). */
async function kirimFoto(foto: HTMLCanvasElement, mapel: string, contekan?: string) {
  let url = foto.toDataURL("image/jpeg", 0.8);
  if ((url.length - 23) * 0.75 > BATAS_GAMBAR.bita) url = foto.toDataURL("image/jpeg", 0.6);
  return bacaHalamanPdf(url, mapel, contekan).catch(() => ({ ok: false as const, pesan: "Koneksi terputus saat AI membaca halaman." }));
}

/** Potong gambar sesuai kotak AI; potongan yang gagal dibuang beserta tandanya, tanda sisanya dinomori ulang. */
async function pasangPotongan(foto: HTMLCanvasElement, r: { paragraf: string[]; gambar: { kotak: number[] }[] }, nama: string) {
  const potongan = await Promise.all(r.gambar.map((g, i) => potong(foto, g.kotak, `${nama}-${i + 1}.jpg`).catch(() => null)));
  const baru = new Map<number, number>();
  const gambar = potongan.flatMap((p, i) => (p ? (baru.set(i + 1, baru.size + 1), [p]) : []));
  const paragraf = r.paragraf
    .map((p) => p.replace(POLA_TANDA_GAMBAR, (_, k) => (baru.has(Number(k)) ? tandaGambar(baru.get(Number(k))!) : "")).trim())
    .filter(Boolean);
  return { paragraf, gambar };
}

/** Jalankan `kerja(0..n-1)` paling banyak SERENTAK sekaligus. */
async function bergiliran(n: number, kerja: (ke: number) => Promise<void>) {
  let berikut = 0;
  await Promise.all(
    Array.from({ length: Math.min(SERENTAK, n) }, async () => {
      while (berikut < n) await kerja(berikut++);
    }),
  );
}

/**
 * 0.40.0: foto halaman buku dari HP (kamera/galeri) dibaca AI seperti halaman PDF, urut sesuai pilihan guru.
 * Tanpa teks asli: tidak ada cek cakupan dan tidak ada cadangan teks; foto yang gagal hanya dicatat.
 */
export async function bacaFotoDenganAI(daftar: File[], mapel: string, kemajuan: (selesai: number, total: number) => void) {
  const hasil: { paragraf: string[]; gambar: GambarFile[] }[] = [];
  const catatan = new Set<string>();
  let selesai = 0;
  await bergiliran(daftar.length, async (ke) => {
    hasil[ke] = { paragraf: [], gambar: [] };
    let bmp: ImageBitmap | null = null;
    try {
      bmp = await createImageBitmap(daftar[ke]); // arah foto (EXIF) diikuti browser
    } catch {
      catatan.add(`Foto ${ke + 1} tidak bisa dibuka. Pakai foto JPG atau PNG.`);
    }
    if (bmp) {
      const skala = Math.min(1, SISI / Math.max(bmp.width, bmp.height));
      const foto = document.createElement("canvas");
      foto.width = Math.max(1, Math.round(bmp.width * skala));
      foto.height = Math.max(1, Math.round(bmp.height * skala));
      const g = foto.getContext("2d")!;
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, foto.width, foto.height);
      g.drawImage(bmp, 0, 0, foto.width, foto.height);
      bmp.close();
      const r = await kirimFoto(foto, mapel);
      if (!r.ok) catatan.add(`Foto ${ke + 1} tidak terbaca: ${r.pesan.split(";")[0].replace(/\.$/, "")}.`);
      else hasil[ke] = await pasangPotongan(foto, r, `foto-${ke + 1}`);
      foto.width = 0;
    }
    kemajuan(++selesai, daftar.length);
  });
  const paragraf: string[] = [];
  const gambar: GambarFile[] = [];
  for (const h of hasil) {
    paragraf.push(...h.paragraf.map((p) => geserTandaGambar(p, gambar.length)));
    gambar.push(...h.gambar);
  }
  if (!paragraf.join("").replace(/\s/g, "")) throw new Error(`Foto tidak bisa dibaca. ${[...catatan][0] ?? ""} Coba foto lebih terang dan tegak, atau ketik materinya.`.trim());
  return { paragraf, gambar, catatan: [...catatan].slice(0, 3) };
}

/**
 * Baca halaman `dari`..`sampai` dengan AI. Hasil: paragraf materi (urut halaman, tanda [[GAMBAR n]] bernomor urut
 * seluruh PDF), gambar hasil potongan (nomor sama dengan tandanya), dan catatan untuk guru.
 */
export async function bacaPdfDenganAI(data: ArrayBuffer, mapel: string, dari: number, sampai: number, kemajuan: (selesai: number, total: number) => void) {
  const { doc, tutup } = await bukaPdf(data);
  try {
    const nomor = Array.from({ length: Math.max(0, Math.min(sampai, doc.numPages) - dari + 1) }, (_, i) => dari + i);
    const hasil: { paragraf: string[]; gambar: GambarFile[] }[] = [];
    const asliSemua: string[][] = [];
    const catatan = new Set<string>();
    let selesai = 0;

    async function satuHalaman(n: number, ke: number) {
      const halaman = await doc.getPage(n);
      const dasar = halaman.getViewport({ scale: 1 });
      const viewport = halaman.getViewport({ scale: SISI / Math.max(dasar.width, dasar.height) });
      const foto = document.createElement("canvas");
      foto.width = Math.round(viewport.width);
      foto.height = Math.round(viewport.height);
      // intent "print": tanpa requestAnimationFrame, yang berhenti saat tab tidak terlihat (guru pindah tab sambil menunggu
      // → dulu macet di halaman pertama; ketahuan saat uji 2026-11-11).
      await halaman.render({ canvas: foto, viewport, background: "#ffffff", intent: "print" }).promise;
      const asli = await teksHalamanPdf(doc, n);
      asliSemua[ke] = asli;
      // 0.33.2: teks lapisan PDF (pangkat ditandai) ikut dikirim sebagai contekan angka/minus; Arab dibuang di server.
      const contekan = (await teksHalamanPdf(doc, n, true)).filter((p) => !p.startsWith(TANDA_PDF)).join("\n");
      const r = await kirimFoto(foto, mapel, contekan);
      let isi = { paragraf: asli, gambar: [] as GambarFile[] };
      if (!r.ok) catatan.add(r.pesan);
      else if ((cakupanKata(asli, r.paragraf) ?? 1) < BATAS_CAKUPAN) catatan.add(`Halaman ${n}: bacaan AI kurang lengkap, jadi dipakai teks PDF biasa.`);
      else isi = await pasangPotongan(foto, r, `halaman-${n}`);
      foto.width = 0; // lepaskan memori foto halaman
      hasil[ke] = isi;
      kemajuan(++selesai, nomor.length);
    }

    await bergiliran(nomor.length, (ke) => satuHalaman(nomor[ke], ke));

    const paragraf: string[] = [];
    const gambar: GambarFile[] = [];
    const bersih = buangKepalaHalaman(hasil.map((h) => h.paragraf), asliSemua); // judul buku & nomor halaman (0.33.2)
    for (const [i, h] of hasil.entries()) {
      paragraf.push(...bersih[i].map((p) => geserTandaGambar(p, gambar.length)));
      gambar.push(...h.gambar);
    }
    if (!paragraf.join("").replace(/\s/g, "")) throw new Error(`PDF ini tidak bisa dibaca. ${[...catatan][0] ?? ""} Ketik atau tempel materinya.`.trim());
    return { paragraf, gambar, catatan: [...catatan].slice(0, 3), halaman: doc.numPages };
  } finally {
    await tutup();
  }
}
