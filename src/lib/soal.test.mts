import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arabTakTerverifikasi, korpusArab, periksaSoal, rapikanSoal, ratakanKunci, terapkanBobot, type Bab, type Soal } from "./soal.ts";
import { bagiTahap, bersihkanPengaturan, buatPengguna, MAKS_CATATAN, type Pengaturan } from "./prompt.ts";
import { bolehAkses, rapikanUsername } from "./akses.ts";

test("aturan 3: guru hanya boleh membuka set miliknya, admin boleh semua", () => {
  const guruA = { id: "a", peran: "guru" as const };
  const guruB = { id: "b", peran: "guru" as const };
  const admin = { id: "z", peran: "admin" as const };
  assert.equal(bolehAkses("a", guruA), true);
  assert.equal(bolehAkses("a", guruB), false); // guru B tidak boleh membuka milik guru A
  assert.equal(bolehAkses("a", admin), true);
  assert.equal(bolehAkses(null, guruA), false); // set tanpa pemilik hanya untuk admin
  assert.equal(bolehAkses(null, admin), true);
  assert.equal(bolehAkses("a", null), false); // belum masuk
});

test("nama pengguna dirapikan dan dibatasi karakternya", () => {
  assert.equal(rapikanUsername("  Ustadz.Ahmad "), "ustadz.ahmad");
  assert.equal(rapikanUsername("ab"), null); // terlalu pendek
  assert.equal(rapikanUsername("ahmad zaki"), null); // ada spasi
  assert.equal(rapikanUsername("ahmad'--"), null);
});

test("catatan guru dirapikan, dibatasi panjangnya, dan masuk ke permintaan AI", () => {
  const isian = {
    babId: "qurdis11-bab3", tujuan: "Latihan", kesulitan: "Sedang",
    jumlah: { PG: 2, PGK: 0, BS: 0, URAIAN: 0 }, level: { LOTS: 40, MOTS: 40, HOTS: 20 },
    catatan: `  fokus pada QS. An-Nur ayat 2 ${"x".repeat(1000)}`,
  } as Pengaturan;
  const p = bersihkanPengaturan(isian) as Pengaturan;
  assert.equal(p.catatan!.length, MAKS_CATATAN);
  assert.ok(p.catatan!.startsWith("fokus pada QS. An-Nur ayat 2"));
  assert.ok(buatPengguna(p, p.jumlah, []).includes("fokus pada QS. An-Nur ayat 2"));
  const tanpa = bersihkanPengaturan({ ...isian, catatan: "   " }) as Pengaturan;
  assert.ok(!buatPengguna(tanpa, tanpa.jumlah, []).includes("Catatan tambahan dari guru"));
});

test("bagiTahap membagi soal maks 10 per tahap dengan urutan bentuk tetap", () => {
  const nol = { PG: 0, PGK: 0, BS: 0, URAIAN: 0 };
  assert.deepEqual(bagiTahap({ PG: 10, PGK: 5, BS: 5, URAIAN: 5 }), [
    { ...nol, PG: 10 },
    { ...nol, PGK: 5, BS: 5 },
    { ...nol, URAIAN: 5 },
  ]);
  assert.deepEqual(bagiTahap({ PG: 25, PGK: 0, BS: 0, URAIAN: 3 }), [
    { ...nol, PG: 10 },
    { ...nol, PG: 10 },
    { ...nol, PG: 5, URAIAN: 3 },
  ]);
  assert.deepEqual(bagiTahap({ PG: 4, PGK: 0, BS: 0, URAIAN: 0 }), [{ ...nol, PG: 4 }]);
});

const bab: Bab = JSON.parse(readFileSync(new URL("../data/qurdis11-bab3.json", import.meta.url), "utf8"));
const korpus = korpusArab(bab);

test("teks Arab yang sama persis dengan data lolos", () => {
  assert.deepEqual(arabTakTerverifikasi(`Makna lafaz ${bab.dalil[0].mufradat[0].arab} adalah ....`, korpus), []);
  assert.deepEqual(arabTakTerverifikasi(bab.dalil[1].arab, korpus), []);
  assert.deepEqual(arabTakTerverifikasi("Soal tanpa huruf Arab", korpus), []);
});

test("teks Arab dengan harakat berbeda atau karangan AI ditandai", () => {
  const tanpaHarakat = bab.dalil[0].mufradat[0].arab.replace(/[ً-ْ]/g, "");
  assert.equal(arabTakTerverifikasi(`Lafaz ${tanpaHarakat}`, korpus).length, 1);
  assert.equal(arabTakTerverifikasi("قَالَ رَسُولُ اللَّهِ", korpus).length, 1);
});

test("rapikanSoal merapikan isian guru dan menghitung skor uraian dari rubrik", () => {
  const isian = {
    bentuk: "PG", pertanyaan: "  Apa?  ", kunci: ["B"], pilihan: ["a", "b"], skor: "2",
    rubrik: [{ kriteria: "x", skor: 3 }], peringatan: ["lama"],
  } as unknown as Soal;
  const pg = rapikanSoal(isian, "PG");
  assert.equal(pg.pertanyaan, "Apa?");
  assert.equal(pg.kunci, "B");
  assert.deepEqual(pg.pilihan, ["a", "b", "", "", ""]);
  assert.equal(pg.skor, 2);
  assert.equal(pg.rubrik, undefined);

  const uraian = rapikanSoal({ pertanyaan: "Jelaskan!", kunci: "jawab", rubrik: [{ kriteria: "a", skor: 3 }, { kriteria: "", skor: 9 }, { kriteria: "b", skor: 2 }] }, "URAIAN");
  assert.equal(uraian.skor, 5); // kriteria kosong dibuang
  assert.equal(uraian.pilihan, undefined);
});

test("terapkanBobot mengisi skor per bentuk dan menskalakan rubrik uraian tepat ke bobot", () => {
  const dasar = { dalil_id: null, pertanyaan: "x", pembahasan: "", level: "C1", tp: "TP 3.1" };
  const soal: Soal[] = [
    { ...dasar, bentuk: "PG", kunci: "A", pilihan: ["a", "b", "c", "d", "e"], skor: 1 },
    { ...dasar, bentuk: "BS", kunci: "Benar", skor: 1 },
    { ...dasar, bentuk: "URAIAN", kunci: "j", skor: 6, rubrik: [{ kriteria: "a", skor: 3 }, { kriteria: "b", skor: 2 }, { kriteria: "c", skor: 1 }] },
  ];
  terapkanBobot(soal, { PG: 2, PGK: 5, BS: 3, URAIAN: 8 });
  assert.deepEqual(soal.map((s) => s.skor), [2, 3, 8]);
  assert.equal(soal[2].rubrik!.reduce((n, r) => n + r.skor, 0), 8);
  assert.deepEqual(soal[2].rubrik!.map((r) => r.skor), [4, 3, 1]); // 4, 2.67→3, 1.33→1
});

test("periksaSoal membuang kode dalil yang bocor ke teks soal", () => {
  const dasar = { bentuk: "PG", kunci: "A", pembahasan: "Lihat [dalil_id: nur-2] ya.", level: "C2", tp: "TP 3.2", skor: 1 } as const;
  const pilihan = ["a", "b", "c", "d", "e"];
  const [s1, s2, s3] = periksaSoal(
    [
      { ...dasar, pilihan, dalil_id: "isra-32", pertanyaan: "Perhatikan firman Allah Swt. berikut!\n\n(dalil: isra-32)\n\nMakna lafaz itu adalah ...." },
      { ...dasar, pilihan, dalil_id: null, pertanyaan: "Perhatikan hadis berikut! (dalil: hadis-iman) Pesannya adalah ...." },
      { ...dasar, pilihan, dalil_id: null, pertanyaan: "Dalil: tidak ada yang cocok (dalil: ngarang-9)." },
    ],
    bab,
  );
  assert.equal(s1.pertanyaan, "Perhatikan firman Allah Swt. berikut!\n\nMakna lafaz itu adalah ....");
  assert.equal(s1.pembahasan, "Lihat ya.");
  assert.equal(s2.dalil_id, "hadis-iman"); // AI lupa mengisi dalil_id → diambil dari teks
  assert.ok(!s2.pertanyaan.includes("dalil"));
  assert.equal(s3.pertanyaan, "Dalil: tidak ada yang cocok (dalil: ngarang-9)."); // kode tak dikenal tidak disentuh
});

test("periksaSoal memberi peringatan dalil tak dikenal", () => {
  const s: Soal = { bentuk: "BS", dalil_id: "ngarang-1", pertanyaan: "x", kunci: "Benar", pembahasan: "", level: "C1", tp: "TP 3.1", skor: 1 };
  assert.equal(periksaSoal([s], bab)[0].peringatan!.length, 1);
});

test("ratakanKunci menyebar pasangan kunci PG kompleks merata tanpa mengubah jawaban benar", () => {
  // AI cenderung selalu memberi kunci A dan B
  const soal: Soal[] = Array.from({ length: 10 }, (_, i) => ({
    bentuk: "PGK", dalil_id: null, pertanyaan: `soal ${i}`, kunci: ["A", "B"],
    pilihan: [`benar1 ${i}`, `benar2 ${i}`, "x", "y", "z"], pembahasan: "", level: "C2", tp: "TP 3.1", skor: 1,
  }));
  ratakanKunci(soal);
  const pasangan = soal.map((s) => (s.kunci as string[]).join(""));
  assert.equal(new Set(pasangan).size, 10); // AB, AC, ..., DE masing-masing sekali
  for (const h of "ABCDE") assert.equal(pasangan.filter((p) => p.includes(h)).length, 4);
  soal.forEach((s, i) => {
    const isiKunci = (s.kunci as string[]).map((h) => s.pilihan!["ABCDE".indexOf(h)]);
    assert.deepEqual(isiKunci, [`benar1 ${i}`, `benar2 ${i}`]);
    assert.equal(s.pilihan!.length, 5);
  });
});

test("ratakanKunci tidak mengubah soal yang kuncinya tidak valid", () => {
  const s: Soal = { bentuk: "PGK", dalil_id: null, pertanyaan: "x", kunci: ["A"], pilihan: ["a", "b", "c", "d", "e"], pembahasan: "", level: "C1", tp: "TP 3.1", skor: 1 };
  ratakanKunci([s]);
  assert.deepEqual(s.kunci, ["A"]);
  assert.deepEqual(s.pilihan, ["a", "b", "c", "d", "e"]);
});

test("ratakanKunci menyebar kunci A–E merata tanpa mengubah jawaban benar", () => {
  const soal: Soal[] = Array.from({ length: 10 }, (_, i) => ({
    bentuk: "PG", dalil_id: null, pertanyaan: `soal ${i}`, kunci: "A",
    pilihan: [`benar ${i}`, "x", "y", "z", "w"], pembahasan: "", level: "C1", tp: "TP 3.1", skor: 1,
  }));
  ratakanKunci(soal);
  for (const h of "ABCDE") assert.equal(soal.filter((s) => s.kunci === h).length, 2);
  soal.forEach((s, i) => assert.equal(s.pilihan!["ABCDE".indexOf(s.kunci as string)], `benar ${i}`));
});
