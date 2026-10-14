// Ekspor ke Word (library docx). Lembar soal memakai cetakan dari format AFTS madrasah
// (public/word/template-soal.docx, dibuat oleh scripts/buat-template-word.py), jadi kopnya persis aslinya.
// Kunci jawaban untuk guru dibuat sebagai dokumen terpisah.
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  patchDocument,
  PatchType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type ParagraphChild,
} from "docx";
import { NAMA_BENTUK, type Pengaturan } from "./prompt";
import { POLA_ARAB, type Bab, type Bentuk, type Soal } from "./soal";

const MAPEL = "Al-Qur'an Hadis";
const PERINGATAN = "Soal dibuat AI, wajib diperiksa guru sebelum dipakai.";

const FONT = "Times New Roman";
// Permintaan pemilik: di Word pakai Traditional Arabic 16 pt (bawaan Windows, sama dengan format AFTS).
// Tampilan web tetap Amiri.
const FONT_ARAB = "Traditional Arabic";
const UKURAN = 22; // setengah poin: 22 = 11 pt
const UKURAN_ARAB = 32; // 16 pt
const HURUF = ["A", "B", "C", "D", "E"];
const ROMAWI = ["I", "II", "III", "IV"];
const LEBAR = 10206; // lebar isi A4 (twip) dengan margin kiri-kanan 850

const JUDUL: Record<string, string> = {
  "Ulangan Harian": "ULANGAN HARIAN",
  PTS: "ASESMEN FORMATIF TENGAH SEMESTER",
  PAS: "ASESMEN SUMATIF AKHIR SEMESTER",
  Latihan: "LATIHAN SOAL",
};
const NAMA_BAGIAN: Record<Bentuk, string> = {
  PG: "PILIHAN GANDA (PG)",
  PGK: "PILIHAN GANDA KOMPLEKS (PGK)",
  BS: "BENAR / SALAH (B / S)",
  URAIAN: "URAIAN / ESAI",
};
const PETUNJUK: Record<Bentuk, string> = {
  PG: "Pilihlah salah satu jawaban yang paling tepat (A, B, C, D, atau E)!",
  PGK: "Pilihlah dua jawaban yang benar dari pilihan A, B, C, D, atau E!",
  BS: "Pilihlah jawaban A jika pernyataan bernilai BENAR, atau jawaban B jika SALAH!",
  URAIAN: "Jawablah pertanyaan berikut dengan singkat, jelas, dan tepat!",
};

const aset = (nama: string) => readFileSync(path.join(process.cwd(), "public", "word", nama));
const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);

type Gaya = { bold?: boolean; italics?: boolean; color?: string; size?: number };

/** Teks Latin dengan huruf tetap Times New Roman (cetakan bawaan memakai Calibri). */
const r = (text: string, gaya: Gaya = {}) => new TextRun({ font: FONT, size: UKURAN, ...gaya, text });

/** Teks campuran Latin + Arab: bagian Arab memakai font Arab dan arah kanan-ke-kiri. */
function teks(isi: string, gaya: Gaya = {}): TextRun[] {
  return String(isi ?? "")
    .split(PECAH_ARAB)
    .flatMap((b, i) =>
      !b ? [] : i % 2 ? new TextRun({ ...gaya, text: b, font: FONT_ARAB, size: UKURAN_ARAB, rightToLeft: true, language: { bidirectional: "ar-SA" } }) : r(b, gaya),
    );
}

const par = (anak: ParagraphChild[], opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) =>
  new Paragraph({ spacing: { after: 60 }, ...opsi, children: anak });

/** Paragraf bernomor tebal dengan indentasi gantung, rata kiri-kanan: "12.  isi..." */
const bernomor = (label: string, isi: ParagraphChild[], kiri = 400, opsi = {}) =>
  par([r(`${label}\t`, { bold: true }), ...isi], {
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: kiri, hanging: 400 },
    tabStops: [{ type: TabStopType.LEFT, position: kiri }],
    ...opsi,
  });

function judulAsesmen(p: Pengaturan, tanggal: Date) {
  const bulan = tanggal.getMonth() + 1;
  const tahun = tanggal.getFullYear();
  const { semester, tp } = bulan >= 7 ? { semester: "GANJIL", tp: `${tahun}/${tahun + 1}` } : { semester: "GENAP", tp: `${tahun - 1}/${tahun}` };
  const judul = JUDUL[p.tujuan] ?? "SOAL";
  return { judul: p.tujuan === "PTS" || p.tujuan === "PAS" ? `${judul} ${semester}` : judul, tp };
}

/** Urutan bentuk yang ada di set, dengan nomor soal global (1, 2, 3, ...). */
function kelompok(soal: Soal[]) {
  return (Object.keys(NAMA_BENTUK) as Bentuk[])
    .map((b) => ({ bentuk: b, butir: soal.map((s, i) => ({ s, no: i + 1 })).filter((x) => x.s.bentuk === b) }))
    .filter((k) => k.butir.length);
}

/** Lembar soal untuk siswa: kop asli format AFTS + soal 2 kolom (tanpa kunci). */
export async function buatWordSoal(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date) {
  const isi: Paragraph[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    isi.push(par([r(`${ROMAWI[k]}. ${NAMA_BAGIAN[bentuk]}`, { bold: true })], { spacing: { before: k ? 200 : 0, after: 40 } }));
    isi.push(par([r(PETUNJUK[bentuk], { italics: true })], { spacing: { after: 120 } }));
    for (const { s, no } of butir) {
      isi.push(bernomor(`${no}.`, teks(s.pertanyaan), 400, { keepNext: true }));
      const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
      if (dalil) {
        isi.push(par(teks(dalil.arab), { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: true, spacing: { after: 0 } }));
        isi.push(par([r(`(${dalil.sumber})`, { italics: true, size: 18 })], { alignment: AlignmentType.RIGHT, keepNext: true }));
      }
      if (s.pilihan) s.pilihan.forEach((o, i) => isi.push(bernomor(`${HURUF[i]}.`, teks(o), 800, { spacing: { after: 0 }, keepNext: i < 4 })));
      if (bentuk === "BS") isi.push(par([r("A.", { bold: true }), r(" Benar\t\t"), r("B.", { bold: true }), r(" Salah")], { indent: { left: 400 } }));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });

  const { judul, tp } = judulAsesmen(p, tanggal);
  return patchDocument({
    outputType: "nodebuffer",
    data: aset("template-soal.docx"),
    keepOriginalStyles: true, // judul & tahun mengikuti huruf asli di kop
    patches: {
      judul: { type: PatchType.PARAGRAPH, children: [new TextRun(judul)] },
      tp: { type: PatchType.PARAGRAPH, children: [new TextRun(tp)] },
      isi: { type: PatchType.DOCUMENT, children: isi },
    },
  });
}

const sel = (anak: Paragraph[], lebar: number) =>
  new TableCell({ children: anak, width: { size: lebar, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER });

/** Kunci jawaban, pembahasan, dan pedoman penskoran untuk guru. */
export function buatWordKunci(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date) {
  const { judul, tp } = judulAsesmen(p, tanggal);
  const total = soal.reduce((n, s) => n + (Number(s.skor) || 0), 0);
  const tengah = (t: string, size = UKURAN, bold = true) => par([new TextRun({ text: t, bold, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const kecil = (t: string) => par([new TextRun({ text: t, size: 18, color: "666666" })], { indent: { left: 400 }, spacing: { after: 0 } });

  const isi: (Paragraph | Table)[] = [
    tengah("KUNCI JAWABAN & PEDOMAN PENSKORAN (PEGANGAN GURU)", 26),
    tengah(`${judul} ${MAPEL.toUpperCase()} KELAS XI (TP ${tp})`),
    tengah(`${bab.judul} | ${soal.length} soal | Total skor: ${total}`, UKURAN, false),
    par([new TextRun({ text: `⚠️ ${PERINGATAN}`, bold: true, color: "C00000" })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 } }),
  ];

  const rekap: string[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    const skor = butir.reduce((n, x) => n + (Number(x.s.skor) || 0), 0);
    rekap.push(`${NAMA_BENTUK[bentuk]} (${skor})`);
    isi.push(par([new TextRun({ text: `${HURUF[k]}. KUNCI BAGIAN ${ROMAWI[k]}: ${NAMA_BENTUK[bentuk].toUpperCase()} (${butir.length} soal, skor ${skor})`, bold: true })], { spacing: { before: 200, after: 80 } }));

    for (const { s, no } of butir) {
      for (const w of s.peringatan ?? []) isi.push(par([new TextRun({ text: `⚠️ Soal ${no}: ${w}`, bold: true, color: "C00000" })]));
      const kunci = [s.kunci].flat();
      if (bentuk === "PG" || bentuk === "PGK") {
        const isiKunci = kunci.map((h) => `${h} (${s.pilihan?.[HURUF.indexOf(h)] ?? "?"})`).join(" dan ");
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks(isiKunci)]));
      } else if (bentuk === "BS") {
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), new TextRun(kunci[0] === "Benar" ? "A (Benar)" : "B (Salah)")]));
      } else {
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Jawaban ideal: ", bold: true }), ...teks(kunci[0])]));
        if (s.rubrik?.length)
          isi.push(
            new Table({
              width: { size: LEBAR - 400, type: WidthType.DXA },
              indent: { size: 400, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [sel([par([new TextRun({ text: "Kriteria penilaian", bold: true })])], LEBAR - 1600), sel([par([new TextRun({ text: "Skor", bold: true })], { alignment: AlignmentType.CENTER })], 1200)] }),
                ...s.rubrik.map((x) => new TableRow({ children: [sel([par(teks(x.kriteria))], LEBAR - 1600), sel([par([r(String(x.skor))], { alignment: AlignmentType.CENTER })], 1200)] })),
              ],
            }),
          );
      }
      if (s.pembahasan) isi.push(par([new TextRun({ text: "Pembahasan: ", bold: true }), ...teks(s.pembahasan)], { indent: { left: 400 }, spacing: { after: 0 } }));
      isi.push(kecil(`${s.level} · ${s.tp} · skor ${s.skor}`));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });
  isi.push(par([new TextRun({ text: `REKAPITULASI SKOR: ${rekap.join(" + ")} = ${total}`, bold: true })], { spacing: { before: 200 } }));

  return Packer.toBuffer(
    new Document({
      creator: "Racik Soal",
      styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 850, bottom: 900, left: 850 } } }, children: isi }],
    }),
  );
}
