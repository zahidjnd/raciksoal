// Ekspor ke Word (library docx). Lembar soal memakai cetakan dari format AFTS madrasah
// (public/word/template-soal.docx, dibuat oleh scripts/buat-template-word.py), jadi kopnya persis aslinya.
// Kunci jawaban dan kisi-kisi untuk guru dibuat sebagai dokumen terpisah.
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import path from "node:path";
import {
  AlignmentType,
  Document,
  ImageRun,
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
import { ChartRun, type ChartRunOptions } from "docx/charts";
import { ukuranWord } from "./gambar";
import { adalahGambar, bacaAngka, dataGrafik, skala, skalaPencar, skalaPiramida, svgGrafik } from "./grafik";
import { MAPEL_INGGRIS } from "./mapel";
import { hariTanggal, mapelTka, NAMA_BENTUK, semesterDari, TKA, WAKTU_BAWAAN, type Pengaturan } from "./prompt";
import { kunciSatu } from "./kunci";
import { rumusWord } from "./rumus";
import { dalilKunci, identitasBab, JOROK, JUMLAH_PREMIS, kategoriBaru, mjLama, paragrafArab, pecahBaris, pecahGaris, POLA_ARAB, pisahPengantar, POLA_RUMUS, tampilanDalil, type Bab, type Baris, type BarisKisi, type Bentuk, type Soal } from "./soal";

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
const PECAH_RUMUS = new RegExp(`(${POLA_RUMUS})`);

type Gaya = { bold?: boolean; italics?: boolean; color?: string; size?: number; underline?: object };

/** Teks Latin dengan huruf tetap Times New Roman (cetakan bawaan memakai Calibri). */
const r = (text: string, gaya: Gaya = {}) => new TextRun({ font: FONT, size: UKURAN, ...gaya, text });

/**
 * Teks campuran Latin + Arab + rumus: bagian Arab memakai font Arab dan arah kanan-ke-kiri; "$...$" jadi rumus Word asli
 * (LaTeX yang belum didukung `rumusWord` tercetak apa adanya). Baris baru ("\n", mis. dialog/hiwar satu penutur per
 * baris) menjadi pindah baris di paragraf yang sama.
 */
export function teks(isi: string, gaya: Gaya = {}): ParagraphChild[] {
  return String(isi ?? "")
    .split(/\r?\n/)
    .flatMap((baris, n) => [
      ...(n ? [new TextRun({ break: 1 })] : []),
      ...baris.split(PECAH_RUMUS).flatMap((potong, m) =>
        m % 2
          ? (rumusWord(potong.slice(1, -1)) ?? r(potong.slice(1, -1), gaya))
          : potong
              .split(PECAH_ARAB)
              .flatMap((b, i) =>
                !b ? [] : i % 2 ? new TextRun({ ...gaya, text: b, font: FONT_ARAB, size: UKURAN_ARAB, rightToLeft: true, language: { bidirectional: "ar-SA" } }) : r(b, gaya),
              ),
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
function butirBaris(label: string, isi: string, kiri = 400, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}): (Paragraph | Table)[] {
  const baris = pecahBaris(isi);
  if (baris.length <= 1 && !baris[0]?.tabel) return [bernomor(label, teks(isi), kiri, opsi)];
  const dalam = { ...opsi, spacing: { after: 0 }, keepNext: true }; // semua paragraf kecuali yang terakhir
  const akhir = baris.length - 1;
  return [
    ...(baris[0].tabel ? [bernomor(label, [], kiri, dalam)] : []), // soal yang diawali tabel: nomor di baris sendiri
    ...baris.map((b, i) =>
      b.tabel ? tabelAtauGrafik(b, kiri) : i === 0 ? bernomor(label, teks(b.teks), kiri, dalam) : parBaris(b, kiri, i === akhir ? opsi : dalam),
    ),
  ];
}

/** Teks lanjutan tanpa nomor (sisa pertanyaan setelah kotak dalil/gambar): baris & tabel seperti butirBaris. */
function barisLanjut(isi: string, kiri: number, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}): (Paragraph | Table)[] {
  const baris = pecahBaris(isi);
  return baris.map((b, i) => (b.tabel ? tabelAtauGrafik(b, kiri) : parBaris(b, kiri, i === baris.length - 1 ? opsi : { ...opsi, spacing: { after: 0 }, keepNext: true })));
}

/** Lebar satu kolom lembar soal (2 kolom) dihitung dari tepi kiri kolom, sama dengan tabel Kategori (400 + 4.600). */
const LEBAR_KOLOM = 5000;

/**
 * Tabel data dari teks soal "| a | b |" (0.28.0, lihat pecahBaris): judul kolom tebal berlatar abu, lebar kolom dibagi
 * rata, huruf 10 pt supaya 6 kolom muat di satu kolom lembar soal. `kiri` = indentasi (sejajar teks soal).
 */
function tabelData(isi: string[][], kiri: number, lebar = LEBAR_KOLOM) {
  const w = Math.floor((lebar - kiri) / isi[0].length);
  return new Table({
    width: { size: w * isi[0].length, type: WidthType.DXA },
    indent: { size: kiri, type: WidthType.DXA },
    columnWidths: isi[0].map(() => w),
    rows: isi.map(
      (b, i) =>
        new TableRow({
          tableHeader: i === 0,
          cantSplit: true,
          children: b.map(
            (t) =>
              new TableCell({
                // Sel menjorok (0.41.0, akun kredit jurnal): ±0,6 cm dari tepi kiri sel
                children: [par(teks(t.replace(JOROK, ""), { size: 20, bold: i === 0 }), { spacing: { after: 0 }, ...(t.startsWith(JOROK) && { indent: { left: 340 } }) })],
                width: { size: w, type: WidthType.DXA },
                shading: i === 0 ? { fill: "E7E6E6" } : undefined,
                margins: { left: 60, right: 60 },
              }),
          ),
        }),
    ),
  });
}

// Grafik hitam-putih (lembar soal difotokopi), sama dengan web: tanpa isi putih karena batang/iris Word tanpa garis tepi.
const ISI_BATANG = ["404040", "A6A6A6", "E0E0E0"];
const PUTUS = ["solid", "dash", "shortDot"] as const;
const TITIK = ["circle", "square", "triangle"] as const;
const ISI_IRIS = ["404040", "BFBFBF", "808080", "E6E6E6", "1A1A1A", "A6A6A6", "595959", "D9D9D9"];
/** Format angka Excel ber-ribuan dengan desimal secukupnya (maks 2); pemisah titik/koma ikut bahasa Windows pembaca. */
const formatAngka = (ns: number[]) => {
  const k = Math.min(2, Math.max(0, ...ns.map((n) => (String(Math.round(n * 100) / 100).split(".")[1] ?? "").length)));
  return "#,##0" + (k ? "." + "0".repeat(k) : "");
};

/**
 * Tabel bertanda grafik (0.52.0, ATURAN-SOAL 4.9) → grafik asli Word (guru bisa "Edit Data"; tampil juga di WPS/LibreOffice),
 * sumbu & angka sama dengan web (`skala`). Tanpa penanda / data tak bisa digambar → tabel biasa.
 */
function tabelAtauGrafik(b: Baris, kiri: number, lebar = LEBAR_KOLOM): Paragraph | Table {
  const isi = b.tabel!;
  if (b.grafik && adalahGambar(b.grafik.jenis)) return baganWord(isi, b.grafik, kiri, lebar);
  const d = b.grafik && dataGrafik(isi, b.grafik.jenis);
  if (!b.grafik || !d) return tabelData(isi, kiri, lebar);
  const w = Math.round((lebar - kiri) / 15); // twip → piksel (96 dpi)
  const kecil = { size: 8 };
  const dasar = {
    title: b.grafik.judul ? { text: b.grafik.judul, font: { size: 10, bold: true } } : undefined,
    font: { name: "Arial", color: "000000" },
    chartArea: { fill: "FFFFFF", border: "none" as const },
  };
  let opsi: ChartRunOptions;
  if (b.grafik.jenis === "lingkaran") {
    const total = d.seri[0].nilai.reduce((x, y) => x + y, 0);
    const bulat = d.seri[0].nilai.every((v) => Number.isInteger(Math.round((v / total) * 1000) / 10));
    opsi = {
      ...dasar,
      type: "pie",
      transformation: { width: w, height: Math.round(w * 0.8) },
      categories: d.label,
      series: [{ name: d.seri[0].nama, values: d.seri[0].nilai, colors: ISI_IRIS.slice(0, d.label.length) }],
      legend: false,
      dataLabels: { category: true, percentage: true, numberFormat: bulat ? "0%" : "0.0%", position: "outsideEnd", font: kecil },
    };
  } else {
    const jenis = b.grafik.jenis;
    const satu = d.seri.length === 1;
    const semua = d.seri.flatMap((s) => s.nilai);
    const { a, b: atas, langkah } = skala(jenis === "piramida" ? 0 : Math.min(...semua), Math.max(...semua), jenis !== "garis" && jenis !== "pencar");
    const nilaiTampil = d.label.length * d.seri.length <= 24; // sama dengan web
    const label = { value: true, numberFormat: formatAngka(semua), font: { size: 7 } };
    const judulSumbu = (t: string) => (t ? { text: t, font: kecil } : undefined);
    const umum = {
      ...dasar,
      transformation: { width: w, height: Math.round(w * (jenis === "piramida" ? 0.8 : 0.68)) },
      categories: d.label,
      legend: satu ? (false as const) : { position: "top" as const, font: kecil },
      categoryAxis: { title: judulSumbu(d.sumbuX), font: kecil },
      valueAxis: { minimum: a, maximum: atas, interval: langkah, numberFormat: formatAngka([a, langkah]), title: judulSumbu(satu ? d.seri[0].nama : ""), font: kecil },
    };
    if (jenis === "pencar") {
      const xs = d.label.map(bacaAngka);
      const sx = skalaPencar(xs);
      const sy = skalaPencar(semua);
      opsi = {
        ...dasar,
        type: "scatter",
        transformation: umum.transformation,
        legend: umum.legend,
        series: d.seri.map((s, k) => ({ name: s.nama, color: "000000", markers: { shape: TITIK[k], size: 5 }, points: s.nilai.map((y, i) => ({ x: xs[i], y })) })),
        xAxis: { minimum: sx.a, maximum: sx.b, interval: sx.langkah, numberFormat: formatAngka([sx.a, sx.langkah]), title: judulSumbu(d.sumbuX), font: kecil },
        yAxis: { minimum: sy.a, maximum: sy.b, interval: sy.langkah, numberFormat: formatAngka([sy.a, sy.langkah]), title: judulSumbu(satu ? d.seri[0].nama : ""), font: kecil },
      };
    } else if (jenis === "piramida") {
      // Batang mendatar: kelompok pertama dibuat minus supaya ke kiri; format "#,##0;#,##0" menampilkannya tanpa tanda minus.
      // Umur termuda di bawah (kategori pertama Word = paling bawah). Label umur dipindah ke tepi kiri oleh `labelPiramida`.
      const mutlak = (f: string) => `${f};${f}`;
      const sp = skalaPiramida(Math.max(...semua));
      const umur = (t: string) => Number(/\d+/.exec(t)?.[0] ?? NaN);
      const balik = umur(d.label[0]) > umur(d.label[d.label.length - 1]);
      const urut = <T,>(x: T[]) => (balik ? [...x].reverse() : x);
      opsi = {
        ...umum,
        type: "bar",
        gapWidth: 20,
        overlap: 100,
        categories: urut(d.label),
        legend: { position: "top", font: kecil },
        categoryAxis: { font: kecil },
        valueAxis: { minimum: -sp.b, maximum: sp.b, interval: sp.tiap, numberFormat: mutlak(formatAngka([sp.tiap])), font: kecil },
        series: d.seri.map((s, k) => ({ name: s.nama, values: urut(s.nilai.map((v) => (k === 0 ? -v : v))), color: ISI_BATANG[k] })),
        dataLabels: d.label.length <= 10 ? { ...label, numberFormat: mutlak(label.numberFormat) } : undefined,
      };
    } else
      opsi =
        jenis === "garis"
          ? {
              ...umum,
              type: "line",
              series: d.seri.map((s, k) => ({ name: s.nama, values: s.nilai, color: "000000", line: { color: "000000", width: 1.5, dash: PUTUS[k] }, markers: { shape: TITIK[k], size: 5 } })),
              dataLabels: nilaiTampil && satu ? { ...label, position: "above" } : undefined,
            }
          : {
              // batang & histogram (histogram: celah tipis supaya batang abu tetap terpisah, Word tanpa garis tepi batang)
              ...umum,
              type: "column",
              gapWidth: jenis === "histogram" ? 4 : 60,
              series: d.seri.map((s, k) => ({ name: s.nama, values: s.nilai, color: jenis === "histogram" ? "A6A6A6" : ISI_BATANG[k] })),
              dataLabels: nilaiTampil ? label : undefined,
            };
  }
  try {
    return par([new ChartRun(opsi)], { indent: { left: kiri }, spacing: { before: 40, after: 60 } });
  } catch {
    return tabelData(isi, kiri, lebar); // pemeriksa docx menolak data → unduhan tetap jalan, tampil tabel
  }
}

/**
 * Bagan (0.53.0, ATURAN-SOAL 4.10) & geometri (0.54.0, 4.11): gambar SVG yang sama dengan web (Word 2016 ke atas). Library docx mewajibkan
 * gambar cadangan; aplikasi yang tidak bisa membaca SVG (Word lama, sebagian WPS) menampilkan `bagan-cadangan.png`
 * ("Buka file dengan Microsoft Word 2016 ke atas"). Lebar = satu kolom (bagan 360 px dikecilkan ±0,85). Tak bisa digambar → tabel.
 */
function baganWord(isi: string[][], grafik: NonNullable<Baris["grafik"]>, kiri: number, lebar: number): Paragraph | Table {
  const svg = svgGrafik(isi, grafik);
  if (!svg) return tabelData(isi, kiri, lebar);
  const [, lw, lh] = /width="(\d+)" height="(\d+)"/.exec(svg)!.map(Number);
  const w = Math.min(Math.round((lebar - kiri) / 15), lw);
  return par([new ImageRun({ type: "svg", data: Buffer.from(svg), fallback: { type: "png", data: aset("bagan-cadangan.png") }, transformation: { width: w, height: Math.round((w * lh) / lw) } })], {
    indent: { left: kiri },
    spacing: { before: 40, after: 60 },
  });
}

/**
 * Piramida penduduk (0.52.0): library docx selalu menulis label kategori "nextTo" (menempel garis nol = di tengah,
 * menumpuk di atas batang). Di grafik batang mendatar (hanya dipakai piramida) label sumbu kategori dipindah ke "low"
 * (tepi kiri). File tanpa grafik seperti itu dikembalikan apa adanya.
 */
async function labelPiramida(buf: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buf);
  let ubah = false;
  for (const f of zip.file(/^word\/charts\/chart\d+\.xml$/)) {
    const xml = await f.async("string");
    if (!xml.includes('<c:barDir val="bar"/>')) continue;
    zip.file(f.name, xml.replace(/<c:catAx>[\s\S]*?<\/c:catAx>/, (ax) => ax.replace('<c:tickLblPos val="nextTo"/>', '<c:tickLblPos val="low"/>')));
    ubah = true;
  }
  return ubah ? zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }) : buf;
}

/** Teks yang boleh berisi tabel (pembahasan di file kunci): `awal` (mis. "Pembahasan: ") di depan paragraf pertama. */
function teksCampur(awal: ParagraphChild[], isi: string, kiri: number, lebar: number): (Paragraph | Table)[] {
  const hasil: (Paragraph | Table)[] = [];
  let kumpul: string[] = [];
  const tutup = () => {
    hasil.push(par([...(hasil.length ? [] : awal), ...teks(kumpul.join("\n"))], { indent: { left: kiri }, spacing: { after: 0 } }));
    kumpul = [];
  };
  for (const b of pecahBaris(isi)) {
    if (!b.tabel) kumpul.push(b.teks);
    else {
      if (kumpul.length || !hasil.length) tutup();
      hasil.push(tabelAtauGrafik(b, kiri, lebar));
    }
  }
  if (kumpul.length || !hasil.length) tutup();
  return hasil;
}

/** Judul ujian & tahun pelajaran: dari identitas ujian (diisi guru), selain itu dari tanggal pembuatan set. */
function judulAsesmen(p: Pengaturan, tanggal: Date, bab: Bab) {
  const awal = semesterDari(tanggal);
  const semester = (p.identitas?.semester ?? awal.semester).toUpperCase();
  // Mapel di luar TKA (mis. Qurdis): jangan menyebut "Tes Kemampuan Akademik" di dokumen.
  const judul = p.tujuan === TKA && !mapelTka(identitasBab(bab).mapel) ? "LATIHAN SOAL GAYA TKA" : (JUDUL[p.tujuan] ?? "SOAL");
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

/**
 * Lembar soal untuk siswa: kop asli format AFTS + soal 2 kolom (tanpa kunci).
 * `paket` (A–D, bila guru membuat beberapa paket): tulisan "PAKET B" di atas soal pertama, sengaja TIDAK di kop
 * supaya kop asli madrasah tidak berubah. `soal` sudah disusun per paket oleh `susunPaket` (paket.ts).
 */
/** Isi gambar soal untuk Word (id → JPEG + ukuran asli), diambil rute unduh dari tabel `gambar`. */
export type GambarWord = Map<number, { data: Buffer; lebar: number; tinggi: number }>;

export async function buatWordSoal(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date, sekolah = "MADRASAH ALIYAH AL-FATAH", paket?: string, gambar: GambarWord = new Map()) {
  const isi: (Paragraph | Table)[] = [];
  if (paket) isi.push(par([r(`PAKET ${paket}`, { bold: true, size: 28 })], { alignment: AlignmentType.RIGHT, keepNext: true, spacing: { after: 120 } }));
  const L: Lembar = LEMBAR[MAPEL_INGGRIS.test(identitasBab(bab).mapel) ? "en" : "id"];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    const kategori = bentuk === "BS" && butir.some((x) => kategoriBaru(x.s));
    isi.push(par([r(`${ROMAWI[k]}. ${kategori ? L.kategori : L.bagian[bentuk]}`, { bold: true })], { keepNext: true, spacing: { before: k ? 200 : 0, after: 40 } }));
    isi.push(par([r(kategori ? L.petunjukKategori : L.petunjuk[bentuk], { italics: true })], { keepNext: true, spacing: { after: 120 } }));
    for (const [j, { s, no }] of butir.entries()) {
      // Menjodohkan gaya lama: satu tabel per blok (pernyataan bernomor soal + daftar jawaban bersama), dicetak sekali.
      if (mjLama(s)) {
        if (s.grup && mjLama(butir[j - 1]?.s ?? s) && butir[j - 1]?.s.grup === s.grup) continue;
        const blok = [butir[j]];
        while (s.grup && butir[j + blok.length] && mjLama(butir[j + blok.length].s) && butir[j + blok.length].s.grup === s.grup) blok.push(butir[j + blok.length]);
        isi.push(tabelMenjodohkan({ ...s, premis: blok.map((x) => x.s.pertanyaan) }, blok.map((x) => x.no), L));
        isi.push(par([], { spacing: { after: 80 } }));
        continue;
      }
      // Soal grup: wacana bersama sekali, sebelum soal pertama grupnya.
      if (s.grup && s.wacana && butir[j - 1]?.s.grup !== s.grup) {
        const akhir = butir.slice(j).findLast((x) => x.s.grup === s.grup)!.no;
        isi.push(par([r(`${L.bacalah} ${no}${akhir > no ? `–${akhir}` : ""}!`, { bold: true, italics: true })], { keepNext: true, spacing: { before: 60, after: 40 } }));
        // Wacana boleh terpotong di tengah; hanya TIGA baris terakhirnya (+ jarak) ditahan bersama soal pertama grup.
        const barisWacana = pecahBaris(s.wacana);
        barisWacana.forEach((baris, n) =>
          isi.push(baris.tabel ? tabelAtauGrafik(baris, 200) : parBaris(baris, 200, { keepNext: n >= barisWacana.length - TAHAN_WACANA, spacing: { after: 40 } })),
        );
        isi.push(par([], { keepNext: true, spacing: { after: 40 } }));
      }
      const dalil = tampilanDalil(s, bab);
      // 0.44.1: "Perhatikan hadis berikut!" → kotak dalil/gambar → sisa pertanyaan (sama dengan tampilan web).
      const awalan = pisahPengantar(s.pertanyaan, { dalil: !!dalil, gambar: !!s.gambar_id });
      isi.push(...butirBaris(`${no}.`, awalan ? awalan.pengantar : s.pertanyaan, 400, { keepNext: true }));
      // Gambar soal (0.30.0): di bawah pokok soal, muat satu kolom lembar soal.
      const g = s.gambar_id ? gambar.get(s.gambar_id) : undefined;
      if (g) isi.push(par([new ImageRun({ type: "jpg", data: g.data, transformation: ukuranWord(g.lebar, g.tinggi) })], { indent: { left: 400 }, keepNext: true, spacing: { before: 40, after: 60 } }));
      // 0.42.0: bagian dalil yang tampil mengikuti cara tampilnya (Arab / terjemah / potongan; sumber disembunyikan bila ditanyakan).
      if (dalil) {
        // 0.49.0: cara "garis bawah": lafaz terpilih bergaris bawah di dalam dalil utuh.
        const g = pecahGaris(dalil);
        const arab = g ? [...teks(g[0] ? `${g[0]} ` : ""), ...teks(g[1], { underline: {} }), ...teks(g[2] ? ` ${g[2]}` : "")] : dalil.arab ? teks(dalil.arab) : [];
        if (dalil.arab) isi.push(par(arab, { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: true, spacing: { after: 0 } }));
        // 0.43.0: menyusun urutan: bagian-bagian berlabel (1), (2), ... satu per baris, kanan ke kiri.
        dalil.urutan?.forEach((b, n) => isi.push(par([r(`(${n + 1}) `, { bold: true }), ...teks(b)], { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: true, spacing: { after: 0 } })));
        if (dalil.terjemah) isi.push(par(teks(`“${dalil.terjemah}”`, { italics: true }), { indent: { left: 400 }, keepNext: true, spacing: { before: dalil.arab ? 40 : 0, after: 0 } }));
        // Teks Arab materi yang ditandai "Bukan ayat/hadis": tanpa keterangan sumber di lembar siswa.
        if (dalil.sumber) isi.push(par([r(`(${dalil.sumber})`, { italics: true, size: 18 })], { alignment: AlignmentType.RIGHT, keepNext: true }));
      }
      if (awalan?.sisa) isi.push(...barisLanjut(awalan.sisa, 400, { keepNext: true }));
      if (s.pilihan) s.pilihan.forEach((o, i) => isi.push(...butirBaris(`${HURUF[i]}.`, o, 800, { spacing: { after: 0 }, keepNext: i === 0 || i === 3 })));
      if (bentuk === "MJ") isi.push(tabelMenjodohkan(s, undefined, L));
      else if (kategoriBaru(s)) isi.push(tabelKategori(s, L));
      else if (bentuk === "BS") isi.push(par([r("A.", { bold: true }), r(` ${L.benar}\t\t`), r("B.", { bold: true }), r(` ${L.salah}`)], { indent: { left: 400 } }));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });

  const { judul, tp } = judulAsesmen(p, tanggal, bab);
  const { mapel, kelas } = identitasBab(bab);
  const hasil = await patchDocument({
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
  return labelPiramida(hasil);
}

const sel = (anak: Paragraph[], lebar: number) =>
  new TableCell({ children: anak, width: { size: lebar, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER });

// Lembar soal 2 kolom: satu kolom ±4.900 twip, tabel diberi sedikit indentasi seperti pilihan jawaban.
const KOLOM_KATEGORI = [400, 2500, 850, 850];
const PETUNJUK_KATEGORI = "Berilah tanda centang (✓) pada kolom yang sesuai untuk setiap pernyataan!";

/**
 * Teks lembar siswa yang ditulis APLIKASI (bukan AI). Mapel Bahasa Inggris memakai versi Inggris (keluhan guru 2026-11-09:
 * soal sudah berbahasa Inggris, tetapi judul bagian & petunjuk masih Indonesia). Kop dan judul asesmen tetap.
 */
const LEMBAR = {
  id: {
    bagian: NAMA_BAGIAN, petunjuk: PETUNJUK, kategori: "PILIHAN GANDA KOMPLEKS KATEGORI", petunjukKategori: PETUNJUK_KATEGORI,
    benar: "Benar", salah: "Salah", bacalah: "Bacalah teks berikut untuk menjawab soal nomor", jawab: "Jawab", premis: "Premis", jawaban: "Jawaban", pernyataan: "Pernyataan",
  },
  en: {
    bagian: { PG: "MULTIPLE CHOICE", PGK: "COMPLEX MULTIPLE CHOICE", BS: "TRUE / FALSE", MJ: "MATCHING", ISIAN: "SHORT ANSWER", URAIAN: "ESSAY" } as Record<Bentuk, string>,
    petunjuk: {
      PG: "Choose the best answer (A, B, C, D, or E)!",
      PGK: "Choose all the correct answers from options A, B, C, D, or E (more than one answer is correct)!",
      BS: "Choose A if the statement is TRUE, or B if it is FALSE!",
      MJ: "Match each statement in the left column with the correct answer in the right column! Write the letter of the answer in the 'Answer' column.",
      ISIAN: "Fill in the blanks with short and correct answers!",
      URAIAN: "Answer the following questions briefly, clearly, and correctly!",
    } as Record<Bentuk, string>,
    kategori: "COMPLEX MULTIPLE CHOICE (CATEGORY)", petunjukKategori: "Put a tick (✓) in the correct column for each statement!",
    benar: "True", salah: "False", bacalah: "Read the following text to answer questions number", jawab: "Answer", premis: "Statement", jawaban: "Options", pernyataan: "Statement",
  },
};
type Lembar = (typeof LEMBAR)["id"];

// Menjodohkan di lembar siswa: Jawab (kosong, diisi huruf) | No | Premis | Huruf | Jawaban. Total sama dengan tabel Kategori.
const KOLOM_MJ = [650, 400, 1650, 400, 1500];

/** Isi sel satu teks: teks yang hampir seluruhnya Arab menjadi paragraf kanan-ke-kiri rata kanan. */
const parSel = (isi: string, opsi: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) =>
  paragrafArab(isi)
    ? par(teks(isi), { bidirectional: true, alignment: AlignmentType.START, spacing: { after: 0 }, ...opsi })
    : par(teks(isi), { spacing: { after: 0 }, ...opsi });

/**
 * Soal Menjodohkan di lembar siswa: premis di kiri (dengan kolom kosong untuk huruf jawaban), jawaban A–F di kanan.
 * `nomor`: nomor soal tiap premis (menjodohkan gaya lama: satu premis = satu nomor soal); tanpa itu 1, 2, 3, ...
 */
function tabelMenjodohkan(s: Soal, nomor?: number[], L: Lembar = LEMBAR.id) {
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
      baris([[kecil(L.jawab)], [kecil("No")], [kecil(L.premis)], [kecil("")], [kecil(L.jawaban)]], true),
      ...Array.from({ length: n }, (_, i) =>
        baris([
          [par([], { spacing: { after: 0 } })],
          [i < premis.length ? tengah(String(nomor?.[i] ?? i + 1)) : par([])],
          [i < premis.length ? parSel(premis[i]) : par([])],
          [i < jawaban.length ? tengah(`${HURUF[i]}.`) : par([])],
          [i < jawaban.length ? parSel(jawaban[i]) : par([])],
        ]),
      ),
    ],
  });
}

/** Soal Kategori di lembar siswa: No | Pernyataan | label 1 | label 2 (kolom label dikosongkan untuk dicentang). */
function tabelKategori(s: Soal, L: Lembar = LEMBAR.id) {
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
      baris([[kecil("No")], [kecil(L.pernyataan, AlignmentType.LEFT)], [kecil(label[0])], [kecil(label[1])]], true),
      ...(s.pernyataan ?? []).map((p, i) => baris([[par([r(String(i + 1))], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })], [par(teks(p), { spacing: { after: 0 } })], [par([])], [par([])]])),
    ],
  });
}

/** Kunci jawaban, pembahasan, dan pedoman penskoran untuk guru. */
/**
 * Kunci & pembahasan. `paket` + `asal` (bila beberapa paket): judul memuat "PAKET B" dan di akhir ada padanan nomor
 * soal paket ini dengan Paket A (asal[i] = indeks soal di Paket A), supaya kisi-kisi (urutan Paket A) tetap terpakai.
 */
export function buatWordKunci(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date, paket?: string, asal?: number[]) {
  const { judul, tp } = judulAsesmen(p, tanggal, bab);
  const total = soal.reduce((n, s) => n + (Number(s.skor) || 0), 0);
  const tengah = (t: string, size = UKURAN, bold = true) => par([new TextRun({ text: t, bold, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const kecil = (t: string) => par([new TextRun({ text: t, size: 18, color: "666666" })], { indent: { left: 400 }, spacing: { after: 0 } });

  const isi: (Paragraph | Table)[] = [
    tengah(`KUNCI JAWABAN & PEDOMAN PENSKORAN (PEGANGAN GURU)${paket ? ` — PAKET ${paket}` : ""}`, 26),
    tengah(`${judul} ${identitasBab(bab).mapel.toUpperCase()} KELAS ${identitasBab(bab).kelas} (TP ${tp})`),
    tengah(`${bab.judul} | ${soal.length} soal | Total skor: ${total}`, UKURAN, false),
    par([new TextRun({ text: `⚠️ ${PERINGATAN}`, bold: true, color: "C00000" })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 } }),
  ];

  const rekap: string[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    const skor = butir.reduce((n, x) => n + (Number(x.s.skor) || 0), 0);
    const nama = bentuk === "BS" && butir.some((x) => kategoriBaru(x.s)) ? "PG Kompleks Kategori" : NAMA_BENTUK[bentuk];
    rekap.push(`${nama} (${skor})`);
    isi.push(par([new TextRun({ text: `${HURUF[k]}. KUNCI BAGIAN ${ROMAWI[k]}: ${nama.toUpperCase()} (${butir.length} soal, skor ${skor})`, bold: true })], { spacing: { before: 200, after: 80 } }));
    if (bentuk === "PGK") {
      const penuh = Number(butir[0].s.skor) || 0;
      // ATURAN-SOAL.md bagian 3: penskoran resmi PG kompleks 1/0 per butir (seperti TKA).
      isi.push(par([r(`Penskoran per soal: memilih SEMUA jawaban benar tanpa pilihan salah = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
    }
    if (bentuk === "MJ" && mjLama(butir[0].s)) {
      const penuh = Number(butir[0].s.skor) || 0;
      isi.push(par([r(`Penskoran per nomor: pasangan tepat = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
    } else if (bentuk === "MJ") {
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
    } else if (bentuk === "BS") {
      const penuh = Number(butir[0].s.skor) || 0;
      isi.push(par([r(`Penskoran per nomor: jawaban tepat = ${penuh} poin; selain itu = 0 poin.`, { italics: true })]));
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
      } else if (mjLama(s)) {
        const h = String(kunci[0] ?? "?").toUpperCase();
        isi.push(bernomor(`${no}.`, [new TextRun({ text: "Kunci: ", bold: true }), ...teks(`${h} (${s.jawaban?.[HURUF.indexOf(h)] ?? "?"})`)]));
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
      if (s.pembahasan) isi.push(...teksCampur([new TextRun({ text: "Pembahasan: ", bold: true })], s.pembahasan, 400, LEBAR));
      // 0.42.0: dalil lengkap bila di soal hanya potongan/Arab/terjemah/nama sumber/di pembahasan.
      const dalil = dalilKunci(s, bab);
      if (dalil) {
        isi.push(par([r(`Dalil (${dalil.sumber}):`, { bold: true })], { indent: { left: 400 }, keepNext: true, spacing: { after: 0 } }));
        isi.push(par(teks(dalil.arab), { bidirectional: true, alignment: AlignmentType.START, indent: { right: 400 }, keepNext: !!dalil.terjemah, spacing: { after: 0 } }));
        if (dalil.terjemah) isi.push(par(teks(`“${dalil.terjemah}”`, { italics: true }), { indent: { left: 400 }, spacing: { after: 0 } }));
      }
      isi.push(kecil(`${s.level} · ${s.tp} · skor ${s.skor}`));
      isi.push(par([], { spacing: { after: 80 } }));
    }
  });
  isi.push(par([new TextRun({ text: `REKAPITULASI SKOR: ${rekap.join(" + ")} = ${total}`, bold: true })], { spacing: { before: 200 } }));
  if (paket && paket !== "A" && asal) {
    isi.push(par([new TextRun({ text: `PADANAN NOMOR PAKET ${paket} → PAKET A (untuk kisi-kisi)`, bold: true })], { spacing: { before: 200, after: 40 } }));
    isi.push(par([r(asal.map((a, i) => `${i + 1}→${a + 1}`).join(",  "))]));
  }

  return Packer.toBuffer(
    new Document({
      creator: "Racik Soal",
      styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 850, bottom: 900, left: 850 } } }, children: isi }],
    }),
  ).then(labelPiramida);
}

/**
 * Kunci ringkas versi Word (0.35.0, permintaan pemilik; isinya = kotak "Kunci ringkas" di web): satu lembar koreksi cepat. Bentuk berkunci huruf (PG, PGK, B/S dan
 * Menjodohkan gaya lama) dalam tabel 5 kolom "1. C"; bentuk berkunci panjang (Kategori, Menjodohkan blok, Isian,
 * Uraian) satu baris per nomor. Tanpa pembahasan & rubrik (ada di file Kunci & pembahasan). Ikut urutan paket.
 */
export function buatWordKunciRingkas(soal: Soal[], bab: Bab, p: Pengaturan, tanggal: Date, paket?: string) {
  const { judul, tp } = judulAsesmen(p, tanggal, bab);
  const { mapel, kelas } = identitasBab(bab);
  const total = soal.reduce((n, s) => n + (Number(s.skor) || 0), 0);
  const tengah = (t: string, size = UKURAN, bold = true) => par([r(t, { bold, size })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } });
  const isi: (Paragraph | Table)[] = [
    tengah(`KUNCI JAWABAN RINGKAS${paket ? ` — PAKET ${paket}` : ""}`, 26),
    tengah(`${judul} ${mapel.toUpperCase()} KELAS ${kelas} (TP ${tp})`),
    tengah(`${bab.judul} | ${soal.length} soal | Total skor: ${total}`, UKURAN, false),
    par([r(`⚠️ ${PERINGATAN}`, { bold: true, color: "C00000" })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 } }),
  ];
  const KOLOM = 5;
  const lebarSel = Math.floor(LEBAR / KOLOM);
  const rekap: string[] = [];
  kelompok(soal).forEach(({ bentuk, butir }, k) => {
    const skor = butir.reduce((n, x) => n + (Number(x.s.skor) || 0), 0);
    const nama = bentuk === "BS" && butir.some((x) => kategoriBaru(x.s)) ? "PG Kompleks Kategori" : NAMA_BENTUK[bentuk];
    rekap.push(`${nama} (${skor})`);
    isi.push(par([r(`${ROMAWI[k]}. ${nama.toUpperCase()} (${butir.length} soal, skor ${skor})`, { bold: true })], { spacing: { before: 200, after: 80 } }));
    const huruf: { no: number; kunci: string }[] = [];
    for (const { s, no } of butir) {
      // Isi kunci sama dengan kotak "Kunci ringkas" di web (kunciSatu); uraian diberi jawaban ideal, bukan "lihat rubrik".
      if (bentuk === "PG" || bentuk === "PGK" || mjLama(s) || (bentuk === "BS" && !kategoriBaru(s))) huruf.push({ no, kunci: kunciSatu(s) });
      else if (bentuk === "URAIAN") isi.push(bernomor(`${no}.`, teks(String([s.kunci].flat()[0] ?? ""))));
      else {
        isi.push(bernomor(`${no}.`, teks(kunciSatu(s))));
        if (bentuk === "ISIAN" && s.kunciAlt?.length) isi.push(par([r("Juga diterima: ", { italics: true }), ...teks(s.kunciAlt.join("; "))], { indent: { left: 400 }, spacing: { after: 0 } }));
      }
    }
    if (huruf.length)
      isi.push(
        new Table({
          width: { size: lebarSel * KOLOM, type: WidthType.DXA },
          rows: Array.from({ length: Math.ceil(huruf.length / KOLOM) }, (_, b) =>
            new TableRow({
              children: Array.from({ length: KOLOM }, (_, j) => {
                const x = huruf[b * KOLOM + j];
                return sel([par(x ? [r(`${x.no}.  `, { bold: true }), ...teks(x.kunci)] : [], { spacing: { before: 40, after: 40 } })], lebarSel);
              }),
            }),
          ),
        }),
      );
    const merah = butir.filter((x) => x.s.peringatan?.length).map((x) => x.no);
    if (merah.length) isi.push(par([r(`⚠️ Soal ${merah.join(", ")} masih bertanda peringatan; lihat file Kunci & pembahasan.`, { bold: true, color: "C00000" })], { spacing: { before: 60 } }));
  });
  isi.push(par([r(`REKAPITULASI SKOR: ${rekap.join(" + ")} = ${total}`, { bold: true })], { spacing: { before: 200 } }));
  isi.push(par([r("Pembahasan dan pedoman penskoran uraian ada di file Kunci & pembahasan.", { italics: true, color: "666666" })]));

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
  const { judul, tp } = judulAsesmen(p, tanggal, bab);
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
