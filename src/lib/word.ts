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
import { hariTanggal, NAMA_BENTUK, semesterDari, WAKTU_BAWAAN, type Pengaturan } from "./prompt";
import { identitasBab, JUMLAH_PREMIS, kategoriBaru, paragrafArab, pecahBaris, POLA_ARAB, type Bab, type BarisKisi, type Bentuk, type Soal } from "./soal";

const PERINGATAN = "Soal dibuat AI, wajib diperiksa guru sebelum dipakai.";

const FONT = "Times New Roman";
// Permintaan pemilik: di Word pakai Traditional Arabic 16 pt (bawaan Windows, sama dengan format AFTS).
// Tampilan web tetap Amiri.
const FONT_ARAB = "Traditional Arabic";
const UKURAN = 22; // setengah poin: 22 = 11 pt
const UKURAN_ARAB = 32; // 16 pt
const HURUF = ["A", "B", "C", "D", "E", "F", "G"]; // A–E pilihan soal; A–F juga huruf bagian dan jawaban Menjodohkan
const ROMAWI = ["I", "II", "III", "IV", "V", "VI"];
const LEBAR = 10206; // lebar isi A4 (twip) dengan margin kiri-kanan 850

const JUDUL: Record<string, string> = {
  "Ulangan Harian": "ULANGAN HARIAN",
  PTS: "ASESMEN FORMATIF TENGAH SEMESTER",
  PAS: "ASESMEN SUMATIF AKHIR SEMESTER",
  Latihan: "LATIHAN SOAL",
  "Latihan TKA": "LATIHAN TES KEMAMPUAN AKADEMIK (TKA)",
};
const NAMA_BAGIAN: Record<Bentuk, string> = {
  PG: "PILIHAN GANDA (PG)",
  PGK: "PILIHAN GANDA KOMPLEKS (PGK)",
  BS: "BENAR / SALAH (B / S)",
  MJ: "MENJODOHKAN",
  ISIAN: "ISIAN SINGKAT",
  URAIAN: "URAIAN / ESAI",
};
const PETUNJUK: Record<Bentuk, string> = {
  PG: "Pilihlah salah satu jawaban yang paling tepat (A, B, C, D, atau E)!",
  PGK: "Pilihlah semua jawaban yang tepat dari pilihan A, B, C, D, atau E (jawaban benar lebih dari satu)!",
  BS: "Pilihlah jawaban A jika pernyataan bernilai BENAR, atau jawaban B jika SALAH!",
  MJ: "Jodohkanlah setiap pernyataan di lajur kiri dengan jawaban yang tepat di lajur kanan! Tulis huruf jawabannya pada kolom \"Jawab\".",
  ISIAN: "Isilah titik-titik berikut dengan jawaban yang singkat dan tepat!",
  URAIAN: "Jawablah pertanyaan berikut dengan singkat, jelas, dan tepat!",
};

const NAMA_KELAS: Record<string, string> = { X: "Sepuluh", XI: "Sebelas", XII: "Dua Belas" };

const aset = (nama: string) => readFileSync(path.join(process.cwd(), "public", "word", nama));
const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);

type Gaya = { bold?: boolean; italics?: boolean; color?: string; size?: number };

/** Teks Latin dengan huruf tetap Times New Roman (cetakan bawaan memakai Calibri). */
const r = (text: string, gaya: Gaya = {}) => new TextRun({ font: FONT, size: UKURAN, ...gaya, text });

/**
 * Teks campuran Latin + Arab: bagian Arab memakai font Arab dan arah kanan-ke-kiri.
 * Baris baru ("\n", mis. dialog/hiwar satu penutur per baris) menjadi pindah baris di paragraf yang sama.
 */
export function teks(isi: string, gaya: Gaya = {}): TextRun[] {
  return String(isi ?? "")
    .split(/\r?\n/)
    .flatMap((baris, n) => [
      ...(n ? [new TextRun({ break: 1 })] : []),
      ...baris
        .split(PECAH_ARAB)
        .flatMap((b, i) =>
          !b ? [] : i % 2 ? new TextRun({ ...gaya, text: b, font: FONT_ARAB, size: UKURAN_ARAB, rightToLeft: true, language: { bidirectional: "ar-SA" } }) : r(b, gaya),
        ),
    ]);
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

/**
 * Satu baris teks soal: baris Arab = paragraf kanan-ke-kiri rata kanan, selain itu paragraf biasa.
 * Isi baris tetap dipecah oleh `teks()`: potongan Arab berfont Arab 16 pt, sedangkan angka, kata Latin, dan titik dua
 * tetap Times New Roman 11 pt (satu run Arab utuh membuat "(1)" dan "Teks 1" ikut berukuran besar). Urutan tampilan
 * ditentukan arah paragraf, bukan run.
 */
const parBaris = (b: { teks: string; arab: boolean }, kiri: number, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) =>
  b.arab
    ? par(teks(b.teks), { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, ...opsi })
    : par(teks(b.teks), { alignment: AlignmentType.JUSTIFIED, indent: { left: kiri }, ...opsi });

/**
 * Butir bernomor dengan teks berbaris (dialog/hiwar): baris pertama sebaris dengan nomor, tiap baris berikutnya
 * satu paragraf (Arab → kanan-ke-kiri). Teks satu baris tetap satu paragraf seperti sebelumnya.
 */
function butirBaris(label: string, isi: string, kiri = 400, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}): Paragraph[] {
  const baris = pecahBaris(isi);
  if (baris.length <= 1) return [bernomor(label, teks(isi), kiri, opsi)];
  const dalam = { ...opsi, spacing: { after: 0 }, keepNext: true }; // semua paragraf kecuali yang terakhir
  return [
    bernomor(label, teks(baris[0].teks), kiri, dalam),
    ...baris.slice(1).map((b, i) => parBaris(b, kiri, i === baris.length - 2 ? opsi : dalam)),
  ];
}

/** Judul ujian & tahun pelajaran: dari identitas ujian (diisi guru), selain itu dari tanggal pembuatan set. */
function judulAsesmen(p: Pengaturan, tanggal: Date) {
  const awal = semesterDari(tanggal);
  const semester = (p.identitas?.semester ?? awal.semester).toUpperCase();
  const judul = JUDUL[p.tujuan] ?? "SOAL";
  return { judul: p.tujuan === "PTS" || p.tujuan === "PAS" ? `${judul} ${semester}` : judul, tp: p.identitas?.tahun ?? awal.tahun };
}

/** "2026-12-07" → "Senin, 7 Desember 2026"; kosong → "" (diisi tangan di kertas). */
/** Urutan bentuk yang ada di set, dengan nomor soal global (1, 2, 3, ...). */
function kelompok(soal: Soal[]) {
  return (Object.keys(NAMA_BENTUK) as Bentuk[])
    .map((b) => ({ bentuk: b, butir: soal.map((s, i) => ({ s, no: i + 1 })).filter((x) => x.s.bentuk === b) }))
    .filter((k) => k.butir.length);
}

/**
 * Aturan tahan-bersama (keepNext) yang DILONGGARKAN supaya kolom terisi penuh (0.9.6): teks soal + pilihan A + B tetap
 * satu rombongan, pilihan D + E tetap berdua (tidak ada pilihan sendirian di kolom berikutnya), sisanya boleh pindah
 * kolom/halaman. Word tidak membedakan pindah kolom dan pindah halaman, jadi soal bisa terbelah di dasar halaman.
 */
const TAHAN_WACANA = 3;

/** Lembar soal untuk siswa: kop asli format AFTS + soal 2 kolom (tanpa kunci). */
export async function buatWordSoal(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date, sekolah = "MADRASAH ALIYAH AL-FATAH") {
  const isi: (Paragraph | Table)[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    const kategori = bentuk === "BS" && butir.some((x) => kategoriBaru(x.s));
    isi.push(par([r(`${ROMAWI[k]}. ${kategori ? "PILIHAN GANDA KOMPLEKS KATEGORI" : NAMA_BAGIAN[bentuk]}`, { bold: true })], { keepNext: true, spacing: { before: k ? 200 : 0, after: 40 } }));
    isi.push(par([r(kategori ? PETUNJUK_KATEGORI : PETUNJUK[bentuk], { italics: true })], { keepNext: true, spacing: { after: 120 } }));
    for (const [j, { s, no }] of butir.entries()) {
      // Soal grup: wacana bersama sekali, sebelum soal pertama grupnya.
      if (s.grup && s.wacana && butir[j - 1]?.s.grup !== s.grup) {
        const akhir = butir.slice(j).findLast((x) => x.s.grup === s.grup)!.no;
        isi.push(par([r(`Bacalah teks berikut untuk menjawab soal nomor ${no}${akhir > no ? `–${akhir}` : ""}!`, { bold: true, italics: true })], { keepNext: true, spacing: { before: 60, after: 40 } }));
        // Wacana boleh terpotong di tengah; hanya TIGA baris terakhirnya (+ jarak) ditahan bersama soal pertama grup.
        const barisWacana = pecahBaris(s.wacana);
        barisWacana.forEach((baris, n) => isi.push(parBaris(baris, 200, { keepNext: n >= barisWacana.length - TAHAN_WACANA, spacing: { after: 40 } })));
        isi.push(par([], { keepNext: true, spacing: { after: 40 } }));
      }
      isi.push(...butirBaris(`${no}.`, s.pertanyaan, 400, { keepNext: true }));
      const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
      if (dalil) {
        isi.push(par(teks(dalil.arab), { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: true, spacing: { after: 0 } }));
        isi.push(par([r(`(${dalil.sumber})`, { italics: true, size: 18 })], { alignment: AlignmentType.RIGHT, keepNext: true }));
      }
      if (s.pilihan) s.pilihan.forEach((o, i) => isi.push(...butirBaris(`${HURUF[i]}.`, o, 800, { spacing: { after: 0 }, keepNext: i === 0 || i === 3 })));
      if (bentuk === "MJ") isi.push(tabelMenjodohkan(s));
      else if (kategoriBaru(s)) isi.push(tabelKategori(s));
      else if (bentuk === "BS") isi.push(par([r("A.", { bold: true }), r(" Benar\t\t"), r("B.", { bold: true }), r(" Salah")], { indent: { left: 400 } }));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });

  const { judul, tp } = judulAsesmen(p, tanggal);
  const { mapel, kelas } = identitasBab(bab);
  return patchDocument({
    outputType: "nodebuffer",
    data: aset("template-soal.docx"),
    keepOriginalStyles: true, // judul & tahun mengikuti huruf asli di kop
    patches: {
      judul: { type: PatchType.PARAGRAPH, children: [new TextRun(judul)] },
      tp: { type: PatchType.PARAGRAPH, children: [new TextRun(tp)] },
      mapel: { type: PatchType.PARAGRAPH, children: [new TextRun(mapel)] },
      kelas: { type: PatchType.PARAGRAPH, children: [new TextRun(`${kelas} (${NAMA_KELAS[kelas]})`)] },
      sekolah: { type: PatchType.PARAGRAPH, children: [new TextRun(sekolah)] },
      hari: { type: PatchType.PARAGRAPH, children: [new TextRun(hariTanggal(p.identitas?.tanggal))] },
      waktu: { type: PatchType.PARAGRAPH, children: [new TextRun(String(p.identitas?.waktu ?? WAKTU_BAWAAN))] },
      isi: { type: PatchType.DOCUMENT, children: isi },
    },
  });
}

const sel = (anak: Paragraph[], lebar: number) =>
  new TableCell({ children: anak, width: { size: lebar, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER });

// Lembar soal 2 kolom: satu kolom ±4.900 twip, tabel diberi sedikit indentasi seperti pilihan jawaban.
const KOLOM_KATEGORI = [400, 2500, 850, 850];
const PETUNJUK_KATEGORI = "Berilah tanda centang (✓) pada kolom yang sesuai untuk setiap pernyataan!";

// Menjodohkan di lembar siswa: Jawab (kosong, diisi huruf) | No | Premis | Huruf | Jawaban. Total sama dengan tabel Kategori.
const KOLOM_MJ = [650, 400, 1650, 400, 1500];

/** Isi sel satu teks: teks yang hampir seluruhnya Arab menjadi paragraf kanan-ke-kiri rata kanan. */
const parSel = (isi: string, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) =>
  paragrafArab(isi)
    ? par(teks(isi), { bidirectional: true, alignment: AlignmentType.START, spacing: { after: 0 }, ...opsi })
    : par(teks(isi), { spacing: { after: 0 }, ...opsi });

/** Soal Menjodohkan di lembar siswa: premis di kiri (dengan kolom kosong untuk huruf jawaban), jawaban A–F di kanan. */
function tabelMenjodohkan(s: Soal) {
  const premis = s.premis ?? [];
  const jawaban = s.jawaban ?? [];
  const kecil = (t: string) => par([r(t, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const tengah = (t: string) => par([r(t)], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const baris = (isi: Paragraph[][], judul = false) =>
    new TableRow({
      tableHeader: judul,
      cantSplit: true,
      children: isi.map((anak, i) => new TableCell({ children: anak, width: { size: KOLOM_MJ[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: { left: 60, right: 60 } })),
    });
  const n = Math.max(premis.length, jawaban.length);
  return new Table({
    width: { size: KOLOM_MJ.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    indent: { size: 400, type: WidthType.DXA },
    rows: [
      baris([[kecil("Jawab")], [kecil("No")], [kecil("Premis")], [kecil("")], [kecil("Jawaban")]], true),
      ...Array.from({ length: n }, (_, i) =>
        baris([
          [par([], { spacing: { after: 0 } })],
          [i < premis.length ? tengah(String(i + 1)) : par([])],
          [i < premis.length ? parSel(premis[i]) : par([])],
          [i < jawaban.length ? tengah(`${HURUF[i]}.`) : par([])],
          [i < jawaban.length ? parSel(jawaban[i]) : par([])],
        ]),
      ),
    ],
  });
}

/** Soal Kategori di lembar siswa: No | Pernyataan | label 1 | label 2 (kolom label dikosongkan untuk dicentang). */
function tabelKategori(s: Soal) {
  const label = s.label?.length === 2 ? s.label : ["", ""];
  const kecil = (t: string, rata: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER) =>
    par([r(t, { bold: true, size: 18 })], { alignment: rata, spacing: { after: 0 } });
  const baris = (isi: Paragraph[][], judul = false) =>
    new TableRow({
      tableHeader: judul,
      cantSplit: true,
      children: isi.map((anak, i) => new TableCell({ children: anak, width: { size: KOLOM_KATEGORI[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: { left: 60, right: 60 } })),
    });
  return new Table({
    width: { size: KOLOM_KATEGORI.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    indent: { size: 400, type: WidthType.DXA },
    rows: [
      baris([[kecil("No")], [kecil("Pernyataan", AlignmentType.LEFT)], [kecil(label[0])], [kecil(label[1])]], true),
      ...(s.pernyataan ?? []).map((p, i) => baris([[par([r(String(i + 1))], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })], [par(teks(p), { spacing: { after: 0 } })], [par([])], [par([])]])),
    ],
  });
}

/** Kunci jawaban, pembahasan, dan pedoman penskoran untuk guru. */
export function buatWordKunci(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date) {
  const { judul, tp } = judulAsesmen(p, tanggal);
  const total = soal.reduce((n, s) => n + (Number(s.skor) || 0), 0);
  const tengah = (t: string, size = UKURAN, bold = true) => par([new TextRun({ text: t, bold, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const kecil = (t: string) => par([new TextRun({ text: t, size: 18, color: "666666" })], { indent: { left: 400 }, spacing: { after: 0 } });

  const isi: (Paragraph | Table)[] = [
    tengah("KUNCI JAWABAN & PEDOMAN PENSKORAN (PEGANGAN GURU)", 26),
    tengah(`${judul} ${identitasBab(bab).mapel.toUpperCase()} KELAS ${identitasBab(bab).kelas} (TP ${tp})`),
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
      // ATURAN-SOAL.md bagian 3: penskoran resmi PG kompleks 1/0 per butir (seperti TKA).
      isi.push(par([r(`Penskoran per soal: memilih SEMUA jawaban benar tanpa pilihan salah = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
    }
    if (bentuk === "MJ") {
      const penuh = Number(butir[0].s.skor) || 0;
      const perPasangan = Math.round((penuh / JUMLAH_PREMIS) * 100) / 100;
      isi.push(par([r(`Penskoran per soal: tiap pasangan yang benar = ${String(perPasangan).replace(".", ",")} poin (5 pasangan benar = ${penuh} poin); pasangan yang salah = 0 poin.`, { italics: true })]));
    }
    if (bentuk === "ISIAN") {
      const penuh = Number(butir[0].s.skor) || 0;
      isi.push(par([r(`Penskoran per soal: jawaban tepat = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
    }
    if (bentuk === "BS" && butir.some((x) => kategoriBaru(x.s))) {
      const penuh = Number(butir[0].s.skor) || 0;
      isi.push(par([r(`Penskoran per soal: SEMUA pernyataan dikategorikan dengan benar = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
    }

    for (const { s, no } of butir) {
      for (const w of s.peringatan ?? []) isi.push(par([new TextRun({ text: `⚠️ Soal ${no}: ${w}`, bold: true, color: "C00000" })]));
      const kunci = [s.kunci].flat();
      if (bentuk === "PG" || bentuk === "PGK") {
        const isiKunci = kunci.map((h) => `${h} (${s.pilihan?.[HURUF.indexOf(h)] ?? "?"})`).join(" dan ");
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks(isiKunci)]));
      } else if (kategoriBaru(s)) {
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks((s.pernyataan ?? []).map((p, i) => `(${i + 1}) ${kunci[i] ?? "?"}`).join("; "))]));
      } else if (bentuk === "BS") {
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), new TextRun(kunci[0] === "Benar" ? "A (Benar)" : "B (Salah)")]));
      } else if (bentuk === "MJ") {
        const huruf = (h: string) => HURUF.indexOf(String(h).trim().toUpperCase());
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks(kunci.map((h, i) => `${i + 1}-${h}`).join(", "))]));
        (s.premis ?? []).forEach((pm, i) => isi.push(par([r(`${i + 1}. `), ...teks(pm), r(`  →  ${kunci[i] ?? "?"}. `), ...teks(s.jawaban?.[huruf(kunci[i] ?? "")] ?? "?")], { indent: { left: 800 }, spacing: { after: 0 } })));
      } else if (bentuk === "ISIAN") {
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks(kunci[0] ?? "")]));
        if (s.kunciAlt?.length) isi.push(par([r("Jawaban lain yang diterima: ", { italics: true }), ...teks(s.kunciAlt.join("; "))], { indent: { left: 400 }, spacing: { after: 0 } }));
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
    par([r("Mata Pelajaran\t: ", { bold: true }), r(`${identitasBab(bab).mapel} — Kelas ${identitasBab(bab).kelas}`)], { tabStops: [{ type: TabStopType.LEFT, position: 2000 }], spacing: { after: 0 } }),
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
