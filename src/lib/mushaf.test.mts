import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bacaRujukan, cariSurah, NAMA_SURAH } from "./surah.ts";
import { mushaf, normalArab, potongAyat } from "./mushaf.ts";
import { ayatDariPdf, keIsian, rapikanBacaanHalaman, rapikanMateri, susunDraf, TANDA_PDF } from "./materi.ts";
import { paragrafPdf } from "./office.ts";
import type { Bab } from "./soal.ts";

const bab: Bab = JSON.parse(readFileSync(new URL("../data/qurdis11-bab3.json", import.meta.url), "utf8"));
const dalil = (id: string) => bab.dalil.find((d) => d.id === id)!;

test("nama surah: 114, semuanya bisa dicari, ejaan longgar", () => {
  assert.equal(NAMA_SURAH.length, 114);
  NAMA_SURAH.forEach((n, i) => assert.equal(cariSurah(n), i + 1, n));
  assert.equal(cariSurah("an nur"), 24);
  assert.equal(cariSurah("Annur") ?? cariSurah("An-Nuur"), 24);
  assert.equal(cariSurah("Al-Isra"), 17);
  assert.equal(cariSurah("yaasiin"), 36);
  assert.equal(cariSurah("Al-Jatsiyah"), 45);
  assert.equal(cariSurah("Al Insyirah"), 94);
  assert.equal(cariSurah("Ali Imran"), 3);
  assert.equal(cariSurah("Al-Ghasyiyah"), 88);
  assert.equal(cariSurah("bukan surah"), null);
});

test("rujukan ayat dibaca dari berbagai gaya tulisan", () => {
  const r = (dari: number, sampai = dari, surah = 24) => ({ surah, dari, sampai });
  assert.deepEqual(bacaRujukan("QS An-Nur: 2"), r(2));
  assert.deepEqual(bacaRujukan("QS. An-Nūr [24]: 2"), r(2));
  assert.deepEqual(bacaRujukan("Q.S. An-Nur/24: 2-3"), r(2, 3));
  assert.deepEqual(bacaRujukan("surat an nur ayat 30 (potongan)"), r(30));
  assert.deepEqual(bacaRujukan("24:2–4"), r(2, 4));
  assert.deepEqual(bacaRujukan("QS. Al-Isrā' (17): 32"), r(32, 32, 17));
  assert.equal(bacaRujukan("An-Nur/23: 2"), null); // nomor tidak cocok dengan nama
  assert.equal(bacaRujukan("HR. Bukhari"), null);
  assert.equal(bacaRujukan("24:5-2"), null);
  assert.equal(bacaRujukan("200:1"), null);
});

const m = mushaf();

test("data mushaf lengkap dan ambil ayat lewat rujukan", () => {
  assert.equal(m.jumlahAyat, 6236);
  const a = m.ambil("QS An-Nur: 2");
  assert.ok(typeof a !== "string");
  assert.equal(a.sumber, "QS. An-Nūr [24]: 2");
  assert.equal(normalArab(a.arab), normalArab(dalil("nur-2").arab));
  const dua = m.ambil("17:32-33");
  assert.ok(typeof dua !== "string" && dua.sumber === "QS. Al-Isrā' [17]: 32-33");
  assert.match(String(m.ambil("QS Al-Ikhlas: 5")), /hanya 4 ayat/);
  // basmalah kepala surah tidak ikut ayat 1 (kecuali Al-Fatihah)
  assert.ok((m.ambil("112:1") as { arab: string }).arab.startsWith("قُلْ"));
  assert.ok((m.ambil("97:1") as { arab: string }).arab.startsWith("إِنَّا"));
  assert.ok(m.basmalah((m.ambil("1:1") as { arab: string }).arab));
  assert.match(String(m.ambil("QS Al-Baqarah: 1-30")), /Maksimal 20/);
  assert.match(String(m.ambil("Hadis Bukhari")), /tidak dikenali/);
});

test("teks Arab guru dicocokkan ke mushaf: ejaan/harakat berbeda tetap ketemu, teks diganti teks resmi", () => {
  const isra = m.cari(dalil("isra-32").arab);
  assert.equal(isra?.sumber, "QS. Al-Isrā' [17]: 32");
  assert.notEqual(isra?.arab, dalil("isra-32").arab); // الزنى (PPT) → الزنا (mushaf)
  assert.equal(isra?.arab, (m.ambil("17:32") as { arab: string }).arab);

  assert.equal(m.cari(dalil("nur-2").arab)?.sumber, "QS. An-Nūr [24]: 2");
  const nur30 = m.cari(dalil("nur-30").arab);
  assert.equal(nur30?.sumber, "QS. An-Nūr [24]: 30 (potongan)");
  assert.ok((m.ambil("24:30") as { arab: string }).arab.startsWith(nur30!.arab));
  assert.match(nur30!.arab, /فُرُوجَهُمْ$/); // kata terakhir utuh dengan harakatnya

  // tanpa harakat sama sekali, dan dua ayat berurutan sekaligus
  assert.equal(m.cari("ولا تقربوا الزنى انه كان فاحشة وساء سبيلا")?.sumber, "QS. Al-Isrā' [17]: 32");
  const duaAyat = (m.ambil("QS Al-Ikhlas: 1-2") as { arab: string }).arab;
  assert.equal(m.cari(duaAyat)?.sumber, "QS. Al-Ikhlāṣ [112]: 1-2");

  // hadis, teks pendek, dan basmalah
  assert.equal(m.cari(dalil("hadis-iman").arab), null);
  assert.equal(m.cari("الله"), null);
  assert.ok(m.basmalah("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"));
  assert.ok(!m.basmalah(dalil("isra-32").arab));
});

test("aturan 5: ayat dari mushaf tidak perlu centang, hadis tetap wajib dicentang", () => {
  const isian = {
    mapel: "Al-Qur'an Hadis",
    kelas: "XI",
    judul: "Uji",
    tp: "TP 1.1: Memahami larangan zina",
    isi: "Isi materi ".repeat(20),
    dalil: [{ sumber: "", arab: dalil("isra-32").arab, terjemah: "Janganlah mendekati zina" }],
    diverifikasi: false,
  };
  const r = rapikanMateri(isian, "x", m.cari);
  assert.ok(typeof r !== "string", String(r));
  assert.equal(r.bab.dalil[0].sumber, "QS. Al-Isrā' [17]: 32"); // sumber diisi otomatis
  assert.equal(r.bab.dalil[0].mushaf, true);
  assert.equal(keIsian(r.bab).diverifikasi, false);

  const hadis = { sumber: "HR. Bukhari", arab: dalil("hadis-iman").arab, terjemah: "t" };
  assert.match(String(rapikanMateri({ ...isian, dalil: [...isian.dalil, hadis] }, "x", m.cari)), /Centang/);
  assert.ok(typeof rapikanMateri({ ...isian, dalil: [...isian.dalil, hadis], diverifikasi: true }, "x", m.cari) !== "string");
  // terjemah boleh kosong (2026-10-20, guru dibuat mudah); sumber tetap wajib untuk teks yang bukan dari mushaf
  assert.ok(typeof rapikanMateri({ ...isian, dalil: [{ ...isian.dalil[0], terjemah: "" }] }, "x", m.cari) !== "string");
  assert.match(String(rapikanMateri({ ...isian, dalil: [{ ...hadis, sumber: "" }], diverifikasi: true }, "x", m.cari)), /sumber dan teks Arab wajib/);
});

test("mode Bahasa Arab: kalimat Arab sehari-hari tidak dianggap ayat, ayat (beda harakat/ejaan) dikenali", () => {
  const m = mushaf();
  for (const kalimat of ["ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ", "هَذَا كِتَابٌ جَدِيْدٌ", "أَيْنَ تَسْكُنُ يَا أَحْمَدُ؟", "أَنَا أُحِبُّ اللُّغَةَ الْعَرَبِيَّةَ"])
    assert.equal(m.cari(kalimat), null, kalimat);
  assert.ok(m.cari("ولا تقربوا الزنى انه كان فاحشة")); // QS Al-Isra: 32 tanpa harakat
});

test("PDF: baris dikelompokkan, Arab kanan→kiri; ayat diganti teks mushaf, teks Arab tak dikenal dibuang", () => {
  const m = mushaf();
  const it = (str: string, x: number, y: number, width = 100) => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 12 });
  const an30 = m.ambil("24:30") as { arab: string };
  const kata = an30.arab.replace("اللَّهَ", "ّللا").split(" "); // lafaz Allah dari Word keluar terbalik "ّللا"
  const p = paragrafPdf([
    it("Allah berfirman", 50, 700), it("dalam", 160, 700, 30), // satu baris, celah → spasi
    it("surah An-", 50, 686, 60), it("Nur:", 110, 686, 30), // baris dekat → paragraf yang sama; "An-" + "Nur" menyatu
    it(kata.slice(0, 8).join(" "), 300, 650, 200), it(kata.slice(8).join(" "), 100, 650, 190), // item kanan dulu dibaca
    it("ُ", 520, 653, 5), // harakat lepas sedikit di atas baris ikut barisnya
    it("حَسَّثَىَا ِأَبُى ِوُػ َُْمٍ ِنَا َُ ِحَسَّثَىَا ِمِؼْػَطٌ", 100, 630, 300), // "hadis" rusak dari buku PDF
    it("Artinya: Katakanlah", 50, 600),
  ]);
  assert.equal(p[0], "Allah berfirman dalam surah An-Nur:");
  assert.ok(p[1].startsWith(TANDA_PDF));
  assert.equal(p[2], "Artinya: Katakanlah");

  const d = susunDraf({ mapel: "Al-Qur'an Hadis", kelas: "XI", paragraf: p }, m.cari, m.basmalah);
  assert.deepEqual(d.isian.dalil.map((x) => [x.sumber, x.arab, x.mushaf]), [[(m.cari(an30.arab) as { sumber: string }).sumber, an30.arab, true]]);
  assert.equal(d.dibuangPdf, 1);
  assert.ok(!d.isian.isi.includes("حَسَّثَىَا") && !d.untukAi.includes("حَسَّثَىَا"));

  // Arab tersimpan terbalik (kiri→kanan) tetap dikenali; basmalah dibuang tanpa dihitung.
  const balik = [...an30.arab].reverse().join("");
  assert.equal(ayatDariPdf(`${balik}\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ`, m.cari, m.basmalah).ayat[0].arab, an30.arab);
  assert.equal(ayatDariPdf("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", m.cari, m.basmalah).dibuang, 0);
});

test("PDF dibaca AI (0.31.0): ayat jadi penunjuk mushaf, lafal Arab di tabel diganti ejaan resmi, sisanya dibuang", () => {
  const m = mushaf();
  // Bentuk jawaban AI seperti uji 2026-11-11 (buku Al-Qur'an Hadis XI hlm 21), dipersingkat.
  const ai = {
    blok: [
      { jenis: "teks", isi: "1. QS al-Mu'minūn [23] ayat 12-14" },
      { jenis: "arab", isi: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِنْ سُلَالَةٍ مِّنْ طِينٍ (١٢) ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ (١٣)" },
      { jenis: "tabel", baris: [["TERJEMAHAN", "LAFAL"], ["sesuatu yang melekat", "عَلَقَةٌ"], ["air mani", "نُطفَةً"], ["kata | asing", "كِتَابٌ"]] },
      { jenis: "teks", isi: "Kata سُلَالَةٍ berarti saripati, sedangkan مَدْرَسَة bukan dari ayat ini." },
      { jenis: "gambar", kotak: [300, 70, 690, 240], keterangan: "Diagram janin", pakai: true },
      { jenis: "gambar", kotak: [100, 40, 170, 115], keterangan: "Logo", pakai: false },
      { jenis: "gambar", kotak: [5, 5, 10, 10], pakai: true }, // terlalu kecil
      { jenis: "gambar", kotak: [1, 2, "x", 4], pakai: true }, // rusak
    ],
  };
  const r = rapikanBacaanHalaman(ai, m.cari, potongAyat);
  assert.equal(r.paragraf[0], "1. QS al-Mu'minūn [23] ayat 12-14");
  assert.ok(r.paragraf[1].startsWith(TANDA_PDF)); // ayat: hanya penunjuk mushaf
  assert.equal(r.paragraf[2], "| TERJEMAHAN | LAFAL |");
  assert.equal(r.paragraf[3], "|---|---|");
  // عَلَقَةٌ tidak ada di ayat 12–13 halaman ini → dibuang; نُطفَةً → ejaan resmi mushaf; كِتَابٌ → dibuang; | di sel → /
  assert.equal(r.paragraf[4], "| sesuatu yang melekat |  |");
  assert.match(r.paragraf[5], /^\| air mani \| نُطْفَةً \|$/);
  assert.equal(r.paragraf[6], "| kata / asing |  |");
  assert.match(r.paragraf[7], /^Kata سُلَٰلَةٍ|^Kata سُلَالَةٍ|^Kata سُلَـٰلَةٍ/u);
  assert.doesNotMatch(r.paragraf[7], /مَدْرَسَة/);
  assert.equal(r.paragraf[8], "[[GAMBAR 1]]");
  assert.deepEqual(r.gambar, [{ kotak: [300, 70, 690, 240], keterangan: "Diagram janin" }]);
  assert.equal(r.paragraf.length, 9);

  // Mode bahasa (Bahasa Arab): tulisan Arab isi pelajaran dipertahankan; ayat tetap penunjuk mushaf.
  const b = rapikanBacaanHalaman({ blok: [{ jenis: "arab", isi: "ذَهَبَ أَحْمَدُ إِلَى الْمَدْرَسَةِ صَبَاحًا مَعَ أَخِيهِ" }, ai.blok[1], ai.blok[3]] }, m.cari, potongAyat, true);
  assert.equal(b.paragraf[0], "ذَهَبَ أَحْمَدُ إِلَى الْمَدْرَسَةِ صَبَاحًا مَعَ أَخِيهِ");
  assert.ok(b.paragraf[1].startsWith(TANDA_PDF));
  assert.match(b.paragraf[2], /مَدْرَسَة/);
  assert.deepEqual(rapikanBacaanHalaman("rusak", m.cari, potongAyat), { paragraf: [], gambar: [] });
  assert.equal(potongAyat("وَلَقَدْ خَلَقْنَا الْإِنسَانَ", "الانسان"), "الْإِنسَانَ");
  assert.equal(potongAyat("وَلَقَدْ خَلَقْنَا", "ق"), null); // terlalu pendek
});
