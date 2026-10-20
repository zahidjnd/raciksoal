import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bacaRujukan, cariSurah, NAMA_SURAH } from "./surah.ts";
import { mushaf, normalArab } from "./mushaf.ts";
import { keIsian, rapikanMateri } from "./materi.ts";
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
