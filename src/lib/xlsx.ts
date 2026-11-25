// File Excel (.xlsx) sederhana tanpa library baru: .xlsx = ZIP berisi XML (jszip sudah terpasang).
// Isi sel: teks, angka, atau kosong. Baris pertama tiap lembar = judul kolom (tebal, dibekukan).
import JSZip from "jszip";

export type Sel = string | number | null | undefined;
// teks: nomor kolom (0 = A) yang berformat Teks di Excel, mis. NISN (supaya angka 0 di depan tidak hilang saat diketik).
export type Lembar = { nama: string; lebar?: number[]; teks?: number[]; baris: Sel[][] };

const aman = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
const kolom = (i: number): string => (i < 26 ? "" : kolom(Math.floor(i / 26) - 1)) + String.fromCharCode(65 + (i % 26));

function xmlLembar(l: Lembar): string {
  const baris = l.baris
    .map((b, r) => {
      const sel = b
        .map((v, c) => {
          if (v === null || v === undefined || v === "") return "";
          const ref = `${kolom(c)}${r + 1}`, gaya = r === 0 ? ' s="1"' : l.teks?.includes(c) ? ' s="2"' : "";
          return typeof v === "number" && Number.isFinite(v) ? `<c r="${ref}"${gaya}><v>${v}</v></c>` : `<c r="${ref}"${gaya} t="inlineStr"><is><t xml:space="preserve">${aman(String(v))}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${sel}</row>`;
    })
    .join("");
  const lebar = l.lebar?.length ? `<cols>${l.lebar.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"${l.teks?.includes(i) ? ' style="2"' : ""}/>`).join("")}</cols>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${lebar}<sheetData>${baris}</sheetData></worksheet>`;
}

export async function buatXlsx(lembar: Lembar[]): Promise<Blob> {
  return new Blob([(await isiXlsx(lembar)) as Uint8Array<ArrayBuffer>], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Isi file .xlsx sebagai byte (dipakai tes di Node, yang tidak punya Blob untuk jszip). */
export async function isiXlsx(lembar: Lembar[]): Promise<Uint8Array> {
  const z = new JSZip();
  const ns = "http://schemas.openxmlformats.org";
  z.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${lembar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  z.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  z.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${lembar.map((l, i) => `<sheet name="${aman(l.nama.replace(/[\/?*[\]:]/g, " ").slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  z.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships">${lembar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${lembar.length + 1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  z.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${ns}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  lembar.forEach((l, i) => z.file(`xl/worksheets/sheet${i + 1}.xml`, xmlLembar(l)));
  return z.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ---------- membaca .xlsx (impor daftar siswa) ----------
const urai = (t: string) =>
  t.replace(/&(lt|gt|quot|apos|amp|#x[0-9a-f]+|#\d+);/gi, (_, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" } as Record<string, string>)[e.toLowerCase()],
  );
/** Gabungan semua <t> di dalam potongan XML (teks kaya Excel dipecah per gaya). */
const teksDi = (x: string) => [...x.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => urai(m[1])).join("");
const nomorKolom = (ref: string) => [...ref.replace(/\d+$/, "")].reduce((n, h) => n * 26 + h.charCodeAt(0) - 64, 0) - 1;

/** Isi semua lembar file .xlsx (urut seperti di Excel) sebagai baris sel. Rumus = hasil terakhirnya. */
export async function bacaXlsx(data: ArrayBuffer | Uint8Array): Promise<Sel[][][]> {
  const z = await JSZip.loadAsync(data);
  const bersama = [...((await z.file("xl/sharedStrings.xml")?.async("string")) ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => teksDi(m[1]));
  const wb = (await z.file("xl/workbook.xml")?.async("string")) ?? "";
  const rels = (await z.file("xl/_rels/workbook.xml.rels")?.async("string")) ?? "";
  const tujuan = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [/Id="([^"]+)"/.exec(m[0])?.[1], /Target="([^"]+)"/.exec(m[0])?.[1]]));
  const jalur = [...wb.matchAll(/<sheet\b[^>]*>/g)]
    .map((m) => tujuan.get(/r:id="([^"]+)"/.exec(m[0])?.[1]))
    .filter((t): t is string => !!t)
    .map((t) => (t.startsWith("/") ? t.slice(1) : `xl/${t}`));
  const hasil: Sel[][][] = [];
  for (const j of jalur) {
    const x = await z.file(j)?.async("string");
    if (!x) continue;
    const baris: Sel[][] = [];
    for (const rm of x.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const no = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? baris.length + 1) - 1;
      const isi: Sel[] = [];
      for (const cm of (rm[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+\d*)"/.exec(cm[1])?.[1];
        const jenis = /\bt="(\w+)"/.exec(cm[1])?.[1];
        const dalam = cm[2] ?? "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(dalam)?.[1];
        const nilai: Sel = jenis === "s" ? bersama[Number(v)] : jenis === "inlineStr" ? teksDi(dalam) : jenis === "str" || jenis === "e" ? (v === undefined ? null : urai(v)) : jenis === "b" ? v === "1" ? "TRUE" : "FALSE" : v === undefined ? null : Number(v);
        isi[ref ? nomorKolom(ref) : isi.length] = nilai;
      }
      baris[no] = Array.from(isi, (v) => v ?? null);
    }
    hasil.push(Array.from(baris, (b) => b ?? []));
  }
  return hasil;
}
