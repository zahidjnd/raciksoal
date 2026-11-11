// 0.31.0: PDF dibaca AI di browser guru. Setiap halaman difoto (canvas pdf.js → JPEG), dikirim SATU per panggilan ke
// bacaHalamanPdf (AI membaca teks, tabel, rumus, dan letak gambar), lalu diperiksa cakupannya terhadap teks PDF biasa.
// Gambar isi pelajaran dipotong dari foto halaman. Halaman yang gagal dibaca AI memakai teks PDF biasa (cara lama).
// Dimuat hanya saat guru melampirkan PDF (import dinamis dari kotak-materi.tsx).
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
      let url = foto.toDataURL("image/jpeg", 0.8);
      if ((url.length - 23) * 0.75 > BATAS_GAMBAR.bita) url = foto.toDataURL("image/jpeg", 0.6);
      const asli = await teksHalamanPdf(doc, n);
      asliSemua[ke] = asli;
      // 0.33.2: teks lapisan PDF (pangkat ditandai) ikut dikirim sebagai contekan angka/minus; Arab dibuang di server.
      const contekan = (await teksHalamanPdf(doc, n, true)).filter((p) => !p.startsWith(TANDA_PDF)).join("\n");
      const r = await bacaHalamanPdf(url, mapel, contekan).catch(() => ({ ok: false as const, pesan: "Koneksi terputus saat AI membaca PDF." }));
      let isi = { paragraf: asli, gambar: [] as GambarFile[] };
      if (!r.ok) catatan.add(r.pesan);
      else if ((cakupanKata(asli, r.paragraf) ?? 1) < BATAS_CAKUPAN) catatan.add(`Halaman ${n}: bacaan AI kurang lengkap, jadi dipakai teks PDF biasa.`);
      else {
        // Potongan yang gagal dibuang beserta tandanya; tanda sisanya dinomori ulang.
        const potongan = await Promise.all(r.gambar.map((g, i) => potong(foto, g.kotak, `halaman-${n}-${i + 1}.jpg`).catch(() => null)));
        const baru = new Map<number, number>();
        const gambar = potongan.flatMap((p, i) => (p ? (baru.set(i + 1, baru.size + 1), [p]) : []));
        const paragraf = r.paragraf
          .map((p) => p.replace(POLA_TANDA_GAMBAR, (_, k) => (baru.has(Number(k)) ? tandaGambar(baru.get(Number(k))!) : "")).trim())
          .filter(Boolean);
        isi = { paragraf, gambar };
      }
      foto.width = 0; // lepaskan memori foto halaman
      hasil[ke] = isi;
      kemajuan(++selesai, nomor.length);
    }

    let berikut = 0;
    await Promise.all(
      Array.from({ length: Math.min(SERENTAK, nomor.length) }, async () => {
        while (berikut < nomor.length) {
          const ke = berikut++;
          await satuHalaman(nomor[ke], ke);
        }
      }),
    );

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
