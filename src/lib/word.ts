// Ekspor ke Word (library docx). Lembar soal memakai cetakan dari format AFTS madrasah
// (public/word/template-soal.docx, dibuat oleh scripts/buat-template-word.py), jadi kopnya persis aslinya.
// Kunci jawaban dan kisi-kisi untuk guru dibuat sebagai dokumen terpisah.
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  Document,
  Packer,
  PageOrientation,
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
import { POLA_ARAB, type Bab, type BarisKisi, type Bentuk, type Soal } from "./soal";

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
    if (bentuk === "PGK") {
      const penuh = Number(butir[0].s.skor) || 0;
      isi.push(par([r(`Penskoran per soal: benar kedua opsi = ${penuh} poin, benar 1 opsi = ${penuh / 2} poin, salah = 0 poin.`, { italics: true })]));
    }

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

// Kolom kisi-kisi (lebar total = lebar isi A4 mendatar dengan margin 850: 16838 - 1700).
const KOLOM_KISI: [string, number][] = [
  ["No. Soal", 900],
  ["TP", 1000],
  ["Materi", 2800],
  ["Indikator Soal", 7438],
  ["Level Kognitif", 1400],
  ["Bentuk Soal", 1600],
];
const KATEGORI = (level: string) => (["C1", "C2"].includes(level) ? "LOTS" : level === "C3" ? "MOTS" : "HOTS");

/** Kisi-kisi untuk guru (langkah 6): A4 mendatar, satu baris per soal, baris judul diulang di tiap halaman. */
export function buatWordKisi(kisi: BarisKisi[], bab: Bab, p: Pengaturan, tanggal: Date) {
  const { judul, tp } = judulAsesmen(p, tanggal);
  const tengah = (t: string, size = UKURAN, bold = true) => par([r(t, { bold, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const isiSel = (anak: ParagraphChild[], rata: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) =>
    [par(anak, { alignment: rata, spacing: { after: 0 } })];
  const baris = (isi: Paragraph[][], judulKolom = false) =>
    new TableRow({
      tableHeader: judulKolom,
      cantSplit: true,
      children: isi.map((anak, i) => new TableCell({ children: anak, width: { size: KOLOM_KISI[i][1], type: WidthType.DXA }, shading: judulKolom ? { fill: "E7E6E6" } : undefined, margins: { left: 80, right: 80, top: 40, bottom: 40 } })),
    });

  const hitung = { LOTS: 0, MOTS: 0, HOTS: 0 };
  for (const k of kisi) hitung[KATEGORI(k.level)]++;
  const persen = (n: number) => `${Math.round((n * 100) / kisi.length)}%`;

  const tabel = new Table({
    width: { size: KOLOM_KISI.reduce((n, [, l]) => n + l, 0), type: WidthType.DXA },
    rows: [
      baris(KOLOM_KISI.map(([j]) => isiSel([r(j, { bold: true })], AlignmentType.CENTER)), true),
      ...kisi.map((k) =>
        baris([
          isiSel([r(String(k.no))], AlignmentType.CENTER),
          isiSel([r(k.tp)], AlignmentType.CENTER),
          isiSel(teks(k.materi)),
          [
            ...(k.peringatan ?? []).map((w) => par([r(`⚠️ ${w}`, { bold: true, color: "C00000" })], { spacing: { after: 0 } })),
            par(teks(k.indikator), { alignment: AlignmentType.JUSTIFIED, spacing: { after: 0 } }),
          ],
          isiSel([r(`${k.level} (${KATEGORI(k.level)})`)], AlignmentType.CENTER),
          isiSel([r(NAMA_BENTUK[k.bentuk])], AlignmentType.CENTER),
        ]),
      ),
    ],
  });

  const isi: (Paragraph | Table)[] = [
    tengah("KISI-KISI PENULISAN SOAL", 26),
    tengah(`${judul} TAHUN PELAJARAN ${tp}`),
    par([], { spacing: { after: 120 } }),
    par([r("Mata Pelajaran\t: ", { bold: true }), r(`${MAPEL} — Kelas XI`)], { tabStops: [{ type: TabStopType.LEFT, position: 2000 }], spacing: { after: 0 } }),
    par([r("Materi\t: ", { bold: true }), r(bab.judul)], { tabStops: [{ type: TabStopType.LEFT, position: 2000 }], spacing: { after: 0 } }),
    par([r("Jumlah Soal\t: ", { bold: true }), r(kelompokKisi(kisi))], { tabStops: [{ type: TabStopType.LEFT, position: 2000 }], spacing: { after: 0 } }),
    par([r("Level Kognitif\t: ", { bold: true }), r(`LOTS ${hitung.LOTS} (${persen(hitung.LOTS)}), MOTS ${hitung.MOTS} (${persen(hitung.MOTS)}), HOTS ${hitung.HOTS} (${persen(hitung.HOTS)})`)], { tabStops: [{ type: TabStopType.LEFT, position: 2000 }], spacing: { after: 120 } }),
    par([r("Tujuan Pembelajaran:", { bold: true })], { spacing: { after: 0 } }),
    ...bab.tp.map((t) => bernomor(t.kode, teks(t.teks), 1000, { spacing: { after: 0 } })),
    par([r(`⚠️ ${PERINGATAN}`, { bold: true, color: "C00000" })], { spacing: { before: 120, after: 120 } }),
    tabel,
  ];

  return Packer.toBuffer(
    new Document({
      creator: "Racik Soal",
      styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, right: 850, bottom: 720, left: 850 } } }, children: isi }],
    }),
  );
}

/** "40 soal (PG 20, PGK 10, B/S 5, Uraian 5)" */
function kelompokKisi(kisi: BarisKisi[]) {
  const per = (Object.keys(NAMA_BENTUK) as Bentuk[]).map((b) => [b, kisi.filter((k) => k.bentuk === b).length] as const).filter(([, n]) => n);
  return `${kisi.length} soal (${per.map(([b, n]) => `${NAMA_BENTUK[b]} ${n}`).join(", ")})`;
}
