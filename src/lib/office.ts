// Ambil teks dari file Word (.docx), PowerPoint (.pptx), atau PDF untuk "materi sendiri" (langkah 8b).
// Dipakai di BROWSER guru (file tidak diunggah ke hosting). Tanpa import "@/..." supaya bisa dites: npm test
import JSZip from "jszip";
import { TANDA_PDF } from "./materi.ts";
import { paragrafArab } from "./soal.ts";

export { paragrafArab };

const ENTITAS: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const dekode = (t: string) =>
  t.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (asli, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ""), e[1].toLowerCase() === "x" ? 16 : 10)) : (ENTITAS[e] ?? asli),
  );

/**
 * Tabel Word/PowerPoint (`ns` = "w" / "a") → satu paragraf per baris "| sel | sel |", plus "|---|" setelah baris judul,
 * supaya susunan kolom tidak hilang (0.28.0; dulu tiap sel jadi paragraf lepas). Tanda | di dalam sel diganti /.
 * Tabel bersarang tidak didukung (jarang di materi).
 */
function tabelJadiBaris(xml: string, ns: string): string {
  const semua = (isi: string, tag: string) => isi.match(new RegExp(`<${ns}:${tag}[\\s>][\\s\\S]*?</${ns}:${tag}>`, "g")) ?? [];
  const tulis = (b: string) => `<${ns}:p><${ns}:t>${b}</${ns}:t></${ns}:p>`;
  return xml.replace(new RegExp(`<${ns}:tbl>[\\s\\S]*?</${ns}:tbl>`, "g"), (tbl) =>
    semua(tbl, "tr")
      .map((tr) => `| ${semua(tr, "tc").map((tc) => paragraf(tc, `${ns}:p`, `${ns}:t`).join(" ").replace(/\|/g, "/")).join(" | ")} |`)
      .map((b, i) => tulis(b) + (i === 0 ? tulis(`|${"---|".repeat(b.split(" | ").length)}`) : ""))
      .join(""),
  );
}

/** Paragraf-paragraf dari XML Office: `p` = tag paragraf (w:p / a:p), `t` = tag teks (w:t / a:t). */
function paragraf(xml: string, p: string, t: string): string[] {
  return xml
    .split(`</${p}>`)
    .map((isi) =>
      [...isi.matchAll(new RegExp(`<${t}(?:\\s[^>]*)?>([^<]*)</${t}>|<w:tab/>|<a:tab/>|<w:br/>|<a:br/>`, "g"))]
        .map((m) => (m[1] !== undefined ? dekode(m[1]) : " "))
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** Satu potongan teks PDF (bentuk `TextItem` pdf.js): x = transform[4], y = transform[5]. */
export type ItemPdf = { str: string; transform: number[]; width: number; height: number };

/**
 * Item teks satu halaman PDF → paragraf urut. Item dikelompokkan per baris (y berdekatan; harakat yang tercetak
 * sedikit di atas hurufnya ikut barisnya), baris Arab diurutkan kanan→kiri. Baris Latin yang berdekatan digabung jadi
 * satu paragraf; baris Arab berurutan jadi satu blok bertanda TANDA_PDF.
 */
export function paragrafPdf(items: ItemPdf[]): string[] {
  const baris: { y: number; tinggi: number; item: ItemPdf[] }[] = [];
  for (const it of [...items].filter((i) => i.str.trim()).sort((a, b) => b.transform[5] - a.transform[5])) {
    const b = baris.at(-1);
    const tinggi = Math.max(it.height, 1);
    if (b && b.y - it.transform[5] < 0.6 * Math.max(b.tinggi, tinggi)) {
      b.item.push(it);
      b.tinggi = Math.max(b.tinggi, tinggi);
    } else baris.push({ y: it.transform[5], tinggi, item: [it] });
  }

  const hasil: string[] = [];
  let blokArab: string[] = [];
  let latin = "";
  let yLatin = 0;
  const tutup = () => {
    if (latin) hasil.push(latin);
    if (blokArab.length) hasil.push(TANDA_PDF + blokArab.join("\n"));
    latin = "";
    blokArab = [];
  };
  for (const b of baris) {
    const arab = paragrafArab(b.item.map((i) => i.str).join(" "));
    const x = (i: ItemPdf) => i.transform[4];
    b.item.sort((p, q) => (arab ? x(q) - x(p) : x(p) - x(q)));
    let t = "";
    b.item.forEach((it, n) => {
      const sebelum = b.item[n - 1];
      // Spasi hanya bila ada celah: kata yang terpotong jadi beberapa item ("a" + "ku") tetap menyatu.
      const celah = !sebelum ? 0 : arab ? x(sebelum) - (x(it) + it.width) : x(it) - (x(sebelum) + sebelum.width);
      t += (celah > 0.15 * b.tinggi ? " " : "") + it.str;
    });
    // Bentuk sambung (FB50–FEFF) → huruf biasa; lafaz Allah dari Word keluar terbalik "ّللا".
    t = t.normalize("NFKC").replace(/ّللا/g, "الله").replace(/\s+/g, " ").trim();
    if (arab) {
      if (latin) tutup();
      blokArab.push(t);
    } else {
      if (blokArab.length || (latin && yLatin - b.y > 1.8 * b.tinggi)) tutup();
      latin = latin ? `${latin} ${t}` : t;
      yLatin = b.y;
    }
  }
  tutup();
  return hasil;
}

/** PDF dibaca dengan pdf.js (dimuat hanya saat guru memilih PDF). */
async function bacaPdf(data: ArrayBuffer | Uint8Array): Promise<string[]> {
  const diBrowser = typeof window !== "undefined";
  // Versi "legacy" hanya untuk npm test (Node); di browser guru dipakai versi biasa + worker.
  const pdfjs = diBrowser ? await import("pdfjs-dist") : await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (diBrowser) pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const tugas = pdfjs.getDocument({ data: new Uint8Array(data), verbosity: 0 });
  let doc;
  try {
    doc = await tugas.promise;
  } catch (e) {
    if ((e as Error)?.name === "PasswordException") throw new Error("PDF ini dikunci kata sandi. Buka kuncinya dulu.");
    throw new Error("File PDF tidak bisa dibaca (rusak atau bukan PDF).");
  }
  if (doc.numPages > 300) throw new Error("PDF terlalu banyak halamannya (maks 300). Ambil bab yang diperlukan saja.");
  const semua: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const isi = await (await doc.getPage(n)).getTextContent();
    semua.push(...paragrafPdf(isi.items.filter((i): i is ItemPdf & typeof i => "str" in i)));
  }
  await tugas.destroy();
  if (!semua.join("").replace(/\s/g, "")) throw new Error("PDF ini berupa gambar (hasil scan), tidak ada teks yang bisa diambil. Ketik atau tempel materinya.");
  return semua;
}

/**
 * Baca .docx / .pptx / .pdf: `teks` = paragraf Latin (untuk kotak Isi materi), `arab` = paragraf Arab (USULAN ayat/hadis,
 * wajib diperiksa guru sebelum dipercaya, aturan 5). Melempar Error berbahasa Indonesia kalau file tidak didukung.
 * Paragraf Arab dari PDF bertanda TANDA_PDF (lihat di atas).
 */
export async function bacaFileOffice(data: ArrayBuffer | Uint8Array, nama: string): Promise<{ teks: string[]; arab: string[]; semua: string[] }> {
  const akhiran = nama.toLowerCase().split(".").pop();
  if (akhiran === "doc" || akhiran === "ppt") throw new Error("Format lama (.doc/.ppt) tidak didukung. Simpan ulang sebagai .docx/.pptx (File → Save As).");
  if (akhiran === "pdf") {
    const semua = await bacaPdf(data);
    // `arab` sengaja kosong: teks Arab PDF tidak boleh jadi usulan ayat/hadis, hanya dicocokkan ke mushaf di server.
    return { teks: semua.filter((t) => !t.startsWith(TANDA_PDF)), arab: [], semua };
  }
  if (akhiran !== "docx" && akhiran !== "pptx") throw new Error("Pilih file Word (.docx), PowerPoint (.pptx), atau PDF.");

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error("File tidak bisa dibaca (rusak atau bukan file Word/PowerPoint).");
  }

  let semua: string[] = [];
  if (akhiran === "docx") {
    const xml = await zip.file("word/document.xml")?.async("string");
    if (!xml) throw new Error("Isi dokumen Word tidak ditemukan.");
    semua = paragraf(tabelJadiBaris(xml, "w"), "w:p", "w:t");
  } else {
    // Slide diurutkan menurut nomornya (slide2 sebelum slide10).
    const slide = zip.file(/^ppt\/slides\/slide\d+\.xml$/).sort((a, b) => Number(a.name.match(/\d+/)![0]) - Number(b.name.match(/\d+/)![0]));
    if (!slide.length) throw new Error("Slide PowerPoint tidak ditemukan.");
    for (const s of slide) semua.push(...paragraf(tabelJadiBaris(await s.async("string"), "a"), "a:p", "a:t"));
  }

  const teks = semua.map((t) => t.normalize("NFC"));
  return {
    teks: teks.filter((t) => !paragrafArab(t)),
    arab: [...new Set(teks.filter(paragrafArab))],
    semua: teks, // urut seperti di file (untuk analisa materi: terjemah biasanya tepat setelah ayatnya)
  };
}
