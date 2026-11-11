// Ambil teks dari file Word (.docx), PowerPoint (.pptx), atau PDF untuk "materi sendiri" (langkah 8b).
// Dipakai di BROWSER guru (file tidak diunggah ke hosting). Tanpa import "@/..." supaya bisa dites: npm test
import JSZip from "jszip";
import { buangTandaGambar, TANDA_PDF, tandaGambar } from "./materi.ts";
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

type Simpul = { tag: string; attr: string; anak: Simpul[]; teks?: string };

/** Pohon XML sederhana (cukup untuk potongan rumus Office; tanpa komentar/CDATA). */
function pohon(xml: string): Simpul {
  const akar: Simpul = { tag: "", attr: "", anak: [] };
  const tumpuk = [akar];
  for (const m of xml.matchAll(/<(\/?)([\w:]+)([^>]*?)(\/?)>|([^<]+)/g)) {
    const atas = tumpuk.at(-1)!;
    if (m[5] !== undefined) atas.anak.push({ tag: "#", attr: "", anak: [], teks: dekode(m[5]) });
    else if (m[1]) {
      if (tumpuk.length > 1) tumpuk.pop();
    } else {
      const s: Simpul = { tag: m[2], attr: m[3], anak: [] };
      atas.anak.push(s);
      if (!m[4]) tumpuk.push(s);
    }
  }
  return akar;
}

const FUNGSI_LATEX = /^(sin|cos|tan|cot|sec|csc|log|ln|exp|lim|max|min|det|arcsin|arccos|arctan)$/;
const AKSEN_LATEX: Record<string, string> = { "⃗": "vec", "̅": "bar", "¯": "bar", "̇": "dot", "̃": "tilde" };

/**
 * Rumus Word (OMML, Insert → Equation) → LaTeX untuk "$...$" (0.29.0). Dulu rumus di materi terbuang karena hanya w:t
 * yang dibaca. Bagian yang jarang (matriks, susunan persamaan) hanya digabung teksnya.
 */
export function ommlKeLatex(xml: string): string {
  const cari = (s: Simpul | undefined, tag: string): Simpul | undefined => s?.anak.find((a) => a.tag === tag);
  const nilai = (s: Simpul | undefined, pr: string, tag: string) => /m:val="([^"]*)"/.exec(cari(cari(s, pr), tag)?.attr ?? "")?.[1];
  const isi = (s?: Simpul): string => (s ? s.anak.map(tulis).join("") : "");
  const g = (s?: Simpul) => `{${isi(s).trim()}}`;
  function tulis(s: Simpul): string {
    const e = cari(s, "m:e");
    switch (s.tag) {
      case "#":
        return s.teks!.replace(/\\/g, "\\backslash ").replace(/[{}%#&$_^]/g, "\\$&");
      case "m:r": {
        const t = isi(cari(s, "m:t"));
        return cari(cari(s, "m:rPr"), "m:nor") ? `\\text{${t}}` : t;
      }
      case "m:f":
        return `\\frac${g(cari(s, "m:num"))}${g(cari(s, "m:den"))}`;
      case "m:sSup":
        return `${g(e)}^${g(cari(s, "m:sup"))}`;
      case "m:sSub":
        return `${g(e)}_${g(cari(s, "m:sub"))}`;
      case "m:sSubSup":
        return `${g(e)}_${g(cari(s, "m:sub"))}^${g(cari(s, "m:sup"))}`;
      case "m:rad": {
        const deg = isi(cari(s, "m:deg")).trim();
        return `\\sqrt${deg ? `[${deg}]` : ""}${g(e)}`;
      }
      case "m:d": {
        const buka = nilai(s, "m:dPr", "m:begChr") ?? "(";
        const tutup = nilai(s, "m:dPr", "m:endChr") ?? ")";
        const pisah = nilai(s, "m:dPr", "m:sepChr") ?? "|";
        const k = (c: string) => ({ "{": "\\{", "}": "\\}" })[c] ?? c;
        return `\\left${k(buka) || "."}${s.anak.filter((a) => a.tag === "m:e").map(isi).join(pisah)}\\right${k(tutup) || "."}`;
      }
      case "m:nary": {
        const c = nilai(s, "m:naryPr", "m:chr") ?? "∫";
        const op = c === "∑" ? "\\sum" : c === "∫" ? "\\int" : c;
        const sub = isi(cari(s, "m:sub")).trim();
        const sup = isi(cari(s, "m:sup")).trim();
        return `${op}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""} ${isi(e)}`;
      }
      case "m:func": {
        const nama = isi(cari(s, "m:fName")).trim();
        return `${FUNGSI_LATEX.test(nama) ? `\\${nama}` : nama} ${isi(e)}`;
      }
      case "m:limLow": {
        const dasar = isi(e).trim();
        return `${dasar === "lim" ?"\\lim" : `{${dasar}}`}_${g(cari(s, "m:lim"))}`;
      }
      case "m:acc": {
        const a = AKSEN_LATEX[nilai(s, "m:accPr", "m:chr") ?? ""] ?? "hat";
        return `\\${a}${g(e)}`;
      }
      case "m:bar":
        return `\\overline${g(e)}`;
      default:
        return s.tag.endsWith("Pr") ? "" : isi(s); // ...Pr = pengaturan tampilan, bukan isi
    }
  }
  return isi(pohon(xml)).replace(/\s+/g, " ").trim();
}

/** Setiap rumus Word/PowerPoint (m:oMath) diganti satu potongan teks "$LaTeX$" di tempatnya. */
function rumusJadiTeks(xml: string, ns: string): string {
  return xml.replace(/<m:oMath(?:\s[^>]*)?>[\s\S]*?<\/m:oMath>/g, (m) => {
    const tex = ommlKeLatex(m);
    return tex ? `<${ns}:t>${`$${tex}$`.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</${ns}:t>` : "";
  });
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
 * `pangkat` (0.33.2, contekan untuk AI): huruf kecil yang naik/turun dari garis baris ditulis `^{...}` / `_{...}`
 * (buku Fisika: "10" + "-30" kecil = 10^{-30}; minus sekecil itu sering terlewat saat AI membaca foto halaman).
 */
export function paragrafPdf(items: ItemPdf[], pangkat = false): string[] {
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
    const dasar = b.item.reduce((p, q) => (q.height > p.height ? q : p)); // huruf terbesar = garis baris
    b.item.forEach((it, n) => {
      const sebelum = b.item[n - 1];
      // Spasi hanya bila ada celah: kata yang terpotong jadi beberapa item ("a" + "ku") tetap menyatu.
      const celah = !sebelum ? 0 : arab ? x(sebelum) - (x(it) + it.width) : x(it) - (x(sebelum) + sebelum.width);
      let s = it.str;
      if (pangkat && !arab && s.trim() && it.height < 0.75 * dasar.height) {
        const naik = it.transform[5] - dasar.transform[5];
        if (naik > 0.15 * dasar.height) s = `^{${s.trim()}}`;
        else if (naik < -0.1 * dasar.height) s = `_{${s.trim()}}`;
      }
      t += (celah > 0.15 * b.tinggi ? " " : "") + s;
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

/** Buka PDF dengan pdf.js (dimuat hanya saat guru memilih PDF). Melempar Error berbahasa Indonesia. */
export async function bukaPdf(data: ArrayBuffer | Uint8Array) {
  const diBrowser = typeof window !== "undefined";
  // Versi "legacy" hanya untuk npm test (Node); di browser guru dipakai versi biasa + worker.
  const pdfjs = diBrowser ? await import("pdfjs-dist") : await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (diBrowser) pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  // wasmUrl (0.32.1): pembaca gambar JPEG 2000/JBIG2 (public/pdfjs-wasm, disalin scripts/salin-wasm-pdf.mjs). Tanpa ini
  // PDF scan bergambar JPX terfoto putih kosong (buku "Al-Muyassar fi Ilmi an-Nahwi", LuraDocument). Diunduh hanya bila perlu.
  const wasmUrl = diBrowser ? new URL("/pdfjs-wasm/", location.href).href : undefined;
  const tugas = pdfjs.getDocument({ data: new Uint8Array(data), verbosity: 0, wasmUrl });
  let doc;
  try {
    doc = await tugas.promise;
  } catch (e) {
    if ((e as Error)?.name === "PasswordException") throw new Error("PDF ini dikunci kata sandi. Buka kuncinya dulu.");
    throw new Error("File PDF tidak bisa dibaca (rusak atau bukan PDF).");
  }
  return { doc, tutup: () => tugas.destroy() };
}

type DokumenPdf = Awaited<ReturnType<typeof bukaPdf>>["doc"];

/** Teks satu halaman PDF dengan cara lama (pdf.js): paragraf Latin + blok Arab bertanda TANDA_PDF. */
export async function teksHalamanPdf(doc: DokumenPdf, n: number, pangkat = false) {
  const isi = await (await doc.getPage(n)).getTextContent();
  return paragrafPdf(isi.items.filter((i): i is ItemPdf & typeof i => "str" in i), pangkat);
}

/**
 * 0.33.2: buang kepala/kaki halaman (judul buku, "Bab 1 | Menjelajah Sel", nomor halaman) dari paragraf hasil baca
 * per halaman. Patokannya teks asli PDF (AI kadang membuangnya, kadang tidak): paragraf pendek yang juga menjadi
 * paragraf pendek teks asli di >= 40% halaman = kepala halaman (buku genap/ganjil beda kepala). Minimal 4 halaman.
 * Dicocokkan huruf saja (nomor halaman & tanda baca diabaikan). Judul bab yang sama persis dengan kepala ikut terbuang
 * (judul sudah ada di kolom judul materi).
 */
export function buangKepalaHalaman(halaman: string[][], asli: string[][]): string[][] {
  const huruf = (t: string) => t.toLowerCase().replace(/[^a-z]/g, "");
  const pinggir = asli.map((a) => a.filter((p) => !p.startsWith(TANDA_PDF)).map(huruf).filter(Boolean)).filter((a) => a.length);
  const kepala = (p: string) => {
    const k = huruf(p);
    // Paragraf asli juga harus pendek: paragraf isi yang kebetulan berakhir "... penjumlahan vektor." bukan kepala.
    const cocok = (t: string) => t.length <= k.length + 20 && (t.startsWith(k) || t.endsWith(k));
    return k.length >= 12 && k.length <= 80 && pinggir.filter((a) => a.some(cocok)).length >= 0.4 * pinggir.length;
  };
  return halaman.map((h) => h.filter((p) => !/^\s*\d{1,4}\s*$/.test(p) && !(pinggir.length >= 4 && kepala(p))));
}

/**
 * 0.31.0: bagian kata Latin (>= 3 huruf) dari teks asli PDF yang juga ada di bacaan AI (0–1). Untuk memastikan AI tidak
 * diam-diam melewatkan isi halaman; di uji 2026-11-11 hasilnya 99–100% (yang hilang hanya kaki halaman berulang).
 * `null` = teks asli terlalu sedikit untuk dinilai (mis. PDF hasil scan).
 */
export function cakupanKata(asli: string[], bacaan: string[]): number | null {
  const kata = (t: string[]) => t.filter((p) => !p.startsWith(TANDA_PDF)).join(" ").toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const a = kata(asli);
  if (a.length < 30) return null;
  const b = new Set(kata(bacaan));
  return a.filter((k) => b.has(k)).length / a.length;
}

async function bacaPdf(data: ArrayBuffer | Uint8Array): Promise<string[]> {
  const { doc, tutup } = await bukaPdf(data);
  // Hanya cara lama (semua halaman dibaca). Pilih halaman + Baca dengan AI tidak dibatasi tebal buku (0.33.0).
  if (doc.numPages > 300) {
    await tutup();
    throw new Error("PDF lebih dari 300 halaman tidak bisa dibaca semuanya. Pilih halaman bab yang diperlukan, lalu Baca dengan AI.");
  }
  const halaman: string[][] = [];
  for (let n = 1; n <= doc.numPages; n++) halaman.push(await teksHalamanPdf(doc, n));
  await tutup();
  const semua = buangKepalaHalaman(halaman, halaman).flat();
  if (!semua.join("").replace(/\s/g, "")) throw new Error("PDF ini berupa gambar (hasil scan), tidak ada teks yang bisa diambil. Ketik atau tempel materinya.");
  return semua;
}

/** Gambar dari file materi (0.30.0): calon yang ditawarkan ke guru, belum diunggah. */
export type GambarFile = { nama: string; data: Uint8Array };
const JENIS_GAMBAR = /\.(png|jpe?g|gif|bmp|webp)$/i; // yang bisa dibaca browser (EMF/WMF/SVG dilewati)
const BATAS_CALON = 30;

/**
 * Gambar yang dipakai di bagian-bagian `xmlNama` (document.xml / slideN.xml), urut sesuai kemunculannya, tanpa dobel.
 * Gambar sangat kecil (< 3 KB, biasanya ikon/hiasan) dilewati. `nomor` = per bagian: id relasi (rIdN) → nomor gambar
 * (1, 2, ...; sama dengan urutan `gambar`), untuk menandai letak gambar di teks (tandaiGambar).
 */
async function gambarZip(zip: JSZip, xmlNama: string[]) {
  const urut: string[] = [];
  const relasi = new Map<string, Map<string, string>>(); // bagian → rIdN → jalur file gambar
  for (const nama of xmlNama) {
    const dir = nama.slice(0, nama.lastIndexOf("/") + 1);
    const [xml, rels] = await Promise.all([zip.file(nama)?.async("string"), zip.file(`${dir}_rels/${nama.slice(dir.length)}.rels`)?.async("string")]);
    if (!xml || !rels) continue;
    const target = new Map<string, string>();
    for (const r of rels.match(/<Relationship\b[^>]*>/g) ?? []) {
      const id = /\bId="([^"]+)"/.exec(r)?.[1];
      const t = /\bTarget="([^"]+)"/.exec(r)?.[1];
      if (!id || !t || !/\/image"/.test(r) || /TargetMode="External"/.test(r)) continue;
      // "media/image1.png" relatif ke folder bagian itu; "../media/x.png" naik satu folder.
      const bagian = (t.startsWith("/") ? t.slice(1) : dir + t).split("/");
      const jalur: string[] = [];
      for (const b of bagian) {
        if (b === "..") jalur.pop();
        else if (b !== ".") jalur.push(b);
      }
      target.set(id, jalur.join("/"));
    }
    relasi.set(nama, target);
    for (const m of xml.matchAll(/\br:(?:embed|id)="([^"]+)"/g)) {
      const j = target.get(m[1]);
      if (j && JENIS_GAMBAR.test(j) && !urut.includes(j)) urut.push(j);
    }
  }
  const gambar: GambarFile[] = [];
  const nomorJalur = new Map<string, number>();
  for (const j of urut) {
    const data = await zip.file(j)?.async("uint8array");
    if (data && data.length >= 3 * 1024) nomorJalur.set(j, gambar.push({ nama: j.split("/").pop()!, data }));
    if (gambar.length >= BATAS_CALON) break;
  }
  const nomor = new Map([...relasi].map(([b, t]) => [b, new Map([...t].flatMap(([id, j]) => (nomorJalur.has(j) ? [[id, nomorJalur.get(j)!] as const] : [])))]));
  return { gambar, nomor };
}

/**
 * Sisipkan tanda [[GAMBAR n]] tepat di tempat gambar n muncul (0.30.0), supaya AI analisa tahu gambar itu dibahas di
 * bagian materi yang mana. Word: teks di dalam paragraf gambarnya; PowerPoint: paragraf sendiri (gambar slide berada di
 * luar kotak teks). Tanda dibuang lagi dari isi materi yang disimpan (susunDraf).
 */
function tandaiGambar(xml: string, nomor: Map<string, number> | undefined, ns: "w" | "a") {
  if (!nomor?.size) return xml;
  return xml.replace(/<(?:a:blip|v:imagedata)\b[^>]*?\br:(?:embed|id)="([^"]+)"[^>]*>/g, (tag, id: string) => {
    const n = nomor.get(id);
    if (!n) return tag;
    return ns === "w" ? `${tag}<w:t> ${tandaGambar(n)} </w:t>` : `${tag}<a:p><a:t>${tandaGambar(n)}</a:t></a:p>`;
  });
}

/**
 * Baca .docx / .pptx / .pdf: `teks` = paragraf Latin (untuk kotak Isi materi), `arab` = paragraf Arab (USULAN ayat/hadis,
 * wajib diperiksa guru sebelum dipercaya, aturan 5). Melempar Error berbahasa Indonesia kalau file tidak didukung.
 * Paragraf Arab dari PDF bertanda TANDA_PDF (lihat di atas).
 */
export async function bacaFileOffice(data: ArrayBuffer | Uint8Array, nama: string): Promise<{ teks: string[]; arab: string[]; semua: string[]; gambar: GambarFile[] }> {
  const akhiran = nama.toLowerCase().split(".").pop();
  if (akhiran === "doc" || akhiran === "ppt") throw new Error("Format lama (.doc/.ppt) tidak didukung. Simpan ulang sebagai .docx/.pptx (File → Save As).");
  if (akhiran === "pdf") {
    const semua = await bacaPdf(data);
    // `arab` sengaja kosong: teks Arab PDF tidak boleh jadi usulan ayat/hadis, hanya dicocokkan ke mushaf di server.
    // ponytail: gambar PDF belum diambil (guru bisa menempel tangkapan layar); halaman PDF → gambar menyusul (0.31.0).
    return { teks: semua.filter((t) => !t.startsWith(TANDA_PDF)), arab: [], semua, gambar: [] };
  }
  if (akhiran !== "docx" && akhiran !== "pptx") throw new Error("Pilih file Word (.docx), PowerPoint (.pptx), atau PDF.");

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error("File tidak bisa dibaca (rusak atau bukan file Word/PowerPoint).");
  }

  let semua: string[] = [];
  let gambar: GambarFile[];
  if (akhiran === "docx") {
    const xml = await zip.file("word/document.xml")?.async("string");
    if (!xml) throw new Error("Isi dokumen Word tidak ditemukan.");
    const g = await gambarZip(zip, ["word/document.xml"]);
    gambar = g.gambar;
    semua = paragraf(tabelJadiBaris(rumusJadiTeks(tandaiGambar(xml, g.nomor.get("word/document.xml"), "w"), "w"), "w"), "w:p", "w:t");
  } else {
    // Slide diurutkan menurut nomornya (slide2 sebelum slide10).
    const slide = zip.file(/^ppt\/slides\/slide\d+\.xml$/).sort((a, b) => Number(a.name.match(/\d+/)![0]) - Number(b.name.match(/\d+/)![0]));
    if (!slide.length) throw new Error("Slide PowerPoint tidak ditemukan.");
    const g = await gambarZip(zip, slide.map((x) => x.name));
    gambar = g.gambar;
    for (const s of slide) semua.push(...paragraf(tabelJadiBaris(rumusJadiTeks(tandaiGambar(await s.async("string"), g.nomor.get(s.name), "a"), "a"), "a"), "a:p", "a:t"));
  }

  const teks = semua.map((t) => t.normalize("NFC"));
  return {
    teks: teks.map(buangTandaGambar).filter((t) => t && !paragrafArab(t)),
    arab: [...new Set(teks.filter(paragrafArab))],
    semua: teks, // urut seperti di file (untuk analisa materi: terjemah biasanya tepat setelah ayatnya), dengan tanda [[GAMBAR n]]
    gambar,
  };
}
