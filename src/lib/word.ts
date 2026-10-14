// Ekspor ke Word (library docx), meniru format AFTS madrasah: kop + soal 2 kolom, dan kunci terpisah untuk guru.
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  CharacterSet,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  Table,
  TableBorders,
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

// ponytail: identitas madrasah masih tetap; jadi pengaturan per guru/madrasah saat dipakai banyak madrasah.
const MADRASAH = "MADRASAH ALIYAH AL-FATAH";
const MAPEL = "Al-Qur'an Hadis";
const KELAS = "XI (Sebelas)";
const BASMALAH = "بسم الله الرحمن الرحيم"; // sama dengan kop format AFTS milik madrasah
const PERINGATAN = "Soal dibuat AI, wajib diperiksa guru sebelum dipakai.";

const FONT = "Times New Roman";
const FONT_ARAB = "Amiri"; // ditanam di file Word, jadi tampil benar walau komputer tidak punya Amiri
const UKURAN = 22; // setengah poin: 22 = 11 pt
const UKURAN_ARAB = 28; // 14 pt untuk lafaz di tengah kalimat
const UKURAN_AYAT = 32; // 16 pt untuk ayat/hadis utuh
const HURUF = ["A", "B", "C", "D", "E"];
const ROMAWI = ["I", "II", "III", "IV"];
const LEBAR = 10206; // lebar isi A4 (twip) dengan margin kiri-kanan 850

const JUDUL: Record<string, string> = {
  "Ulangan Harian": "ULANGAN HARIAN",
  PTS: "ASESMEN FORMATIF TENGAH SEMESTER",
  PAS: "ASESMEN SUMATIF AKHIR SEMESTER",
  Latihan: "LATIHAN SOAL",
};
const PETUNJUK: Record<Bentuk, string> = {
  PG: "Pilihlah salah satu jawaban yang paling tepat (A, B, C, D, atau E)!",
  PGK: "Pilihlah dua jawaban yang benar dari pilihan A, B, C, D, atau E!",
  BS: "Pilihlah jawaban A jika pernyataan bernilai BENAR, atau jawaban B jika SALAH!",
  URAIAN: "Jawablah pertanyaan berikut dengan singkat, jelas, dan tepat!",
};

const aset = (nama: string) => readFileSync(path.join(process.cwd(), "public", "word", nama));
const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);

/** Teks campuran Latin + Arab: bagian Arab memakai font Arab dan arah kanan-ke-kiri. */
function teks(isi: string, gaya: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}, ukuranArab = UKURAN_ARAB): TextRun[] {
  return String(isi ?? "")
    .split(PECAH_ARAB)
    .flatMap((b, i) =>
      !b
        ? []
        : i % 2
          ? new TextRun({ ...gaya, text: b, font: FONT_ARAB, size: ukuranArab, rightToLeft: true, language: { bidirectional: "ar-SA" } })
          : new TextRun({ ...gaya, text: b, font: FONT, size: gaya.size ?? UKURAN }),
    );
}

const par = (anak: ParagraphChild[], opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) =>
  new Paragraph({ spacing: { after: 60 }, ...opsi, children: anak });

/** Paragraf bernomor dengan indentasi gantung: "12.  isi..." */
const bernomor = (label: string, isi: ParagraphChild[], kiri = 400, opsi = {}) =>
  par([new TextRun({ text: `${label}\t`, font: FONT, size: UKURAN }), ...isi], {
    indent: { left: kiri, hanging: 400 },
    tabStops: [{ type: TabStopType.LEFT, position: kiri }],
    ...opsi,
  });

function semesterDanTahun(tanggal: Date) {
  const bulan = tanggal.getMonth() + 1;
  const tahun = tanggal.getFullYear();
  return bulan >= 7 ? { semester: "GANJIL", tp: `${tahun}/${tahun + 1}` } : { semester: "GENAP", tp: `${tahun - 1}/${tahun}` };
}

function judulAsesmen(p: Pengaturan, tanggal: Date) {
  const { semester, tp } = semesterDanTahun(tanggal);
  const judul = JUDUL[p.tujuan] ?? "SOAL";
  return { judul: p.tujuan === "PTS" || p.tujuan === "PAS" ? `${judul} ${semester}` : judul, tp };
}

const sel = (anak: Paragraph[], lebar: number) =>
  new TableCell({ children: anak, width: { size: lebar, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER });

function kop(p: Pengaturan, tanggal: Date) {
  const { judul, tp } = judulAsesmen(p, tanggal);
  const tengah = (isi: string, size = 26) => par([new TextRun({ text: isi, bold: true, font: FONT, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const kopTabel = new Table({
    width: { size: LEBAR, type: WidthType.DXA },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          sel([par([new ImageRun({ type: "png", data: aset("logo-kemenag.png"), transformation: { width: 75, height: 75 } })])], 1400),
          sel(
            [
              par([new TextRun({ text: BASMALAH, font: FONT_ARAB, size: 30, rightToLeft: true, language: { bidirectional: "ar-SA" } })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
              tengah(judul),
              tengah(MADRASAH),
              tengah(`TAHUN PELAJARAN ${tp}`, 24),
            ],
            7406,
          ),
          sel([par([new ImageRun({ type: "jpg", data: aset("ornamen-masjid.jpg"), transformation: { width: 75, height: 48 } })], { alignment: AlignmentType.RIGHT })], 1400),
        ],
      }),
    ],
  });

  const baris = (a: string, b: string, c: string, d: string) =>
    new TableRow({
      children: [
        sel([par([new TextRun(a)])], 1900),
        sel([par([new TextRun(":")])], 250),
        sel([par([new TextRun(b)])], 2950),
        sel([par([new TextRun(c)])], 1900),
        sel([par([new TextRun(":")])], 250),
        sel([par([new TextRun(d)])], 2956),
      ],
    });
  const identitas = new Table({
    width: { size: LEBAR, type: WidthType.DXA },
    borders: TableBorders.NONE,
    rows: [baris("Mata Pelajaran", MAPEL, "Hari, Tanggal", ""), baris("Kelas", KELAS, "Waktu", "........ menit")],
  });

  return [
    kopTabel,
    par([], { border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: "000000", space: 1 } }, spacing: { after: 120 } }),
    identitas,
    par([new TextRun({ text: "PETUNJUK UMUM:", bold: true })], { spacing: { before: 120, after: 0 } }),
    ...[
      "Awali dengan mengucap Basmalah dan berdoa, akhiri dengan mengucap Hamdalah.",
      "Jawaban dikerjakan pada Lembar Jawab.",
      "Dahulukan menjawab soal yang mudah.",
    ].map((t, i) => bernomor(`${i + 1}.`, [new TextRun(t)], 400, { spacing: { after: 0 } })),
    par([], { border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } }, spacing: { after: 120 } }),
  ];
}

/** Urutan bentuk yang ada di set, dengan nomor soal global (1, 2, 3, ...). */
function kelompok(soal: Soal[]) {
  return (Object.keys(NAMA_BENTUK) as Bentuk[])
    .map((b) => ({ bentuk: b, butir: soal.map((s, i) => ({ s, no: i + 1 })).filter((x) => x.s.bentuk === b) }))
    .filter((k) => k.butir.length);
}

function dokumen(sections: ConstructorParameters<typeof Document>[0]["sections"]) {
  return new Document({
    creator: "Racik Soal",
    styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
    fonts: [{ name: FONT_ARAB, data: aset("Amiri-Regular.ttf"), bold: aset("Amiri-Bold.ttf"), characterSet: CharacterSet.ARABIC }],
    sections,
  });
}

const HALAMAN = { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 850, bottom: 900, left: 850 } };

/** Lembar soal untuk siswa: kop + soal dalam 2 kolom (tanpa kunci). */
export function buatWordSoal(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date) {
  const isi: Paragraph[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    isi.push(par([new TextRun({ text: `${ROMAWI[k]}. ${NAMA_BENTUK[bentuk].toUpperCase()}`, bold: true })], { spacing: { before: k ? 200 : 0, after: 40 } }));
    isi.push(par([new TextRun({ text: PETUNJUK[bentuk], italics: true })], { spacing: { after: 120 } }));
    for (const { s, no } of butir) {
      isi.push(bernomor(`${no}.`, teks(s.pertanyaan), 400, { keepNext: true }));
      const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
      if (dalil) {
        isi.push(par(teks(dalil.arab, {}, UKURAN_AYAT), { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: true, spacing: { after: 0, line: 360 } }));
        isi.push(par([new TextRun({ text: `(${dalil.sumber})`, italics: true, size: 18 })], { alignment: AlignmentType.RIGHT, keepNext: true }));
      }
      if (s.pilihan) s.pilihan.forEach((o, i) => isi.push(bernomor(`${HURUF[i]}.`, teks(o), 800, { spacing: { after: 0 }, keepNext: i < 4 })));
      if (bentuk === "BS") isi.push(par([new TextRun("A. Benar\t\tB. Salah")], { indent: { left: 400 } }));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });

  return Packer.toBuffer(
    dokumen([
      { properties: { page: HALAMAN }, children: kop(p, tanggal) },
      { properties: { page: HALAMAN, type: SectionType.CONTINUOUS, column: { count: 2, space: 500 } }, children: isi },
    ]),
  );
}

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
                ...s.rubrik.map((r) => new TableRow({ children: [sel([par(teks(r.kriteria))], LEBAR - 1600), sel([par([new TextRun(String(r.skor))], { alignment: AlignmentType.CENTER })], 1200)] })),
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

  return Packer.toBuffer(dokumen([{ properties: { page: HALAMAN }, children: isi }]));
}
