// Ambil teks dari file Word (.docx) atau PowerPoint (.pptx) untuk "materi sendiri" (langkah 8b).
// Dipakai di BROWSER guru (file tidak diunggah ke hosting). Tanpa import "@/..." supaya bisa dites: npm test
import JSZip from "jszip";
import { paragrafArab } from "./soal.ts";

export { paragrafArab };

const ENTITAS: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const dekode = (t: string) =>
  t.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (asli, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ""), e[1].toLowerCase() === "x" ? 16 : 10)) : (ENTITAS[e] ?? asli),
  );

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

/**
 * Baca .docx / .pptx: `teks` = paragraf Latin (untuk kotak Isi materi), `arab` = paragraf Arab (USULAN ayat/hadis,
 * wajib diperiksa guru sebelum dipercaya, aturan 5). Melempar Error berbahasa Indonesia kalau file tidak didukung.
 */
export async function bacaFileOffice(data: ArrayBuffer | Uint8Array, nama: string): Promise<{ teks: string[]; arab: string[]; semua: string[] }> {
  const akhiran = nama.toLowerCase().split(".").pop();
  if (akhiran === "pdf") throw new Error("File PDF tidak didukung karena teks Arabnya rusak saat diambil. Gunakan Word atau PowerPoint.");
  if (akhiran === "doc" || akhiran === "ppt") throw new Error("Format lama (.doc/.ppt) tidak didukung. Simpan ulang sebagai .docx/.pptx (File → Save As).");
  if (akhiran !== "docx" && akhiran !== "pptx") throw new Error("Pilih file Word (.docx) atau PowerPoint (.pptx).");

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
    semua = paragraf(xml, "w:p", "w:t");
  } else {
    // Slide diurutkan menurut nomornya (slide2 sebelum slide10).
    const slide = zip.file(/^ppt\/slides\/slide\d+\.xml$/).sort((a, b) => Number(a.name.match(/\d+/)![0]) - Number(b.name.match(/\d+/)![0]));
    if (!slide.length) throw new Error("Slide PowerPoint tidak ditemukan.");
    for (const s of slide) semua.push(...paragraf(await s.async("string"), "a:p", "a:t"));
  }

  const teks = semua.map((t) => t.normalize("NFC"));
  return {
    teks: teks.filter((t) => !paragrafArab(t)),
    arab: [...new Set(teks.filter(paragrafArab))],
    semua: teks, // urut seperti di file (untuk analisa materi: terjemah biasanya tepat setelah ayatnya)
  };
}
