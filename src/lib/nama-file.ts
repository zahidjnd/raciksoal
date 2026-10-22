// Header Content-Disposition untuk unduhan. Tanpa import Next/DB, supaya bisa dites langsung: npm test

/**
 * Header HTTP hanya boleh berisi karakter Latin biasa, padahal nama file diambil dari judul bab yang bisa berhuruf Arab
 * (mis. "أدوات الاستفهام"). Dua nama dikirim: `filename` = versi ASCII (cadangan), `filename*` = nama asli (RFC 5987).
 */
export function headerUnduh(nama: string): string {
  const asli = String(nama ?? "").replace(/[\\/:*?"<>|\r\n\t]+/g, " ").replace(/\s+/g, " ").trim() || "Soal.docx";
  const ascii = asli.replace(/[^\x20-\x7e]/g, "").replace(/\s+/g, " ").replace(/\s+\./g, ".").trim() || "Soal.docx";
  // encodeURIComponent tidak menyandikan ' ( ) * yang dilarang di nilai filename*
  const utf8 = encodeURIComponent(asli).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
