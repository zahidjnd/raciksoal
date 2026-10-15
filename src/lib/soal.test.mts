import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arabTakTerverifikasi, korpusArab, periksaKisi, periksaSoal, rapikanSoal, ratakanKunci, samakanDenganKisi, terapkanBobot, type Bab, type Soal } from "./soal.ts";
import { bagiTahap, bersihkanPengaturan, buatPengguna, hitungLevel, MAKS_CATATAN, rencanaLevel, type Pengaturan } from "./prompt.ts";
import { bolehAkses, rapikanUsername } from "./akses.ts";
import { keIsian, rapikanMateri } from "./materi.ts";

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

test("hitungLevel mengubah persen jadi jumlah soal yang totalnya tepat", () => {
  assert.deepEqual(hitungLevel(25, { LOTS: 40, MOTS: 40, HOTS: 20 }), { LOTS: 10, MOTS: 10, HOTS: 5 });
  assert.deepEqual(hitungLevel(7, { LOTS: 30, MOTS: 40, HOTS: 30 }), { LOTS: 2, MOTS: 3, HOTS: 2 });
  for (const n of [1, 3, 11, 40]) {
    const h = hitungLevel(n, { LOTS: 33, MOTS: 33, HOTS: 34 });
    assert.equal(h.LOTS + h.MOTS + h.HOTS, n);
  }
});

test("rencanaLevel: komposisi tepat, tersebar ke semua bentuk, dan urut mudah → sulit di tiap bentuk", () => {
  const jumlah = { PG: 20, PGK: 10, BS: 5, URAIAN: 5 };
  const r = rencanaLevel(jumlah, { LOTS: 30, MOTS: 40, HOTS: 30 });
  const hitung = (a: string[]) => ({ LOTS: a.filter((x) => x === "LOTS").length, MOTS: a.filter((x) => x === "MOTS").length, HOTS: a.filter((x) => x === "HOTS").length });
  assert.equal(r.length, 40);
  assert.deepEqual(hitung(r), { LOTS: 12, MOTS: 16, HOTS: 12 });
  assert.deepEqual(hitung(r.slice(0, 20)), { LOTS: 6, MOTS: 8, HOTS: 6 }); // PG kebagian sesuai porsi
  const nilai = { LOTS: 0, MOTS: 1, HOTS: 2 };
  for (const [a, b] of [[0, 20], [20, 30], [30, 35], [35, 40]]) {
    const bagian = r.slice(a, b).map((x) => nilai[x]);
    assert.deepEqual(bagian, [...bagian].sort()); // mudah → sulit
  }
  assert.deepEqual(rencanaLevel({ PG: 1, PGK: 0, BS: 0, URAIAN: 0 }, { LOTS: 0, MOTS: 0, HOTS: 100 }), ["HOTS"]);
});

test("periksaKisi mengurutkan per bentuk, memotong kelebihan, menomori, dan membuang dalil tak dikenal", () => {
  const baris = (bentuk: string, dalil_id: string | null = "nur-2") => ({ bentuk, tp: "TP 3.1", materi: "m", indikator: "i", level: "c2", dalil_id, stimulus: "s" });
  const kisi = periksaKisi(
    [baris("URAIAN"), baris("pg"), baris("PG", "ngarang-1"), baris("PG"), baris("BS")],
    { PG: 2, PGK: 0, BS: 1, URAIAN: 1 },
    bab,
  );
  assert.deepEqual(kisi.map((k) => `${k.no}${k.bentuk}`), ["1PG", "2PG", "3BS", "4URAIAN"]);
  assert.equal(kisi[1].dalil_id, null); // "ngarang-1" tidak ada di data bab
  assert.equal(kisi[0].level, "C2");
  assert.deepEqual(kisi[0].peringatan, []);
  // aturan 5: teks Arab di kisi-kisi juga dicek ke data terverifikasi
  const lafazAsli = bab.dalil[0].mufradat[0].arab;
  const [arab] = periksaKisi([{ ...baris("PG"), indikator: `memaknai ${lafazAsli} dan بِسْمِ اللّٰهِ` }], { PG: 1, PGK: 0, BS: 0, URAIAN: 0 }, bab);
  assert.equal(arab.peringatan?.length, 1);
  assert.ok(!arab.peringatan![0].includes(lafazAsli) && arab.peringatan![0].includes("بِسْمِ"));
  // bentuk yang kurang → error, supaya model cadangan dicoba
  assert.throws(() => periksaKisi([baris("PG")], { PG: 2, PGK: 0, BS: 0, URAIAN: 0 }, bab), /PG hanya 1 dari 2/);
  assert.throws(() => periksaKisi(null, { PG: 1, PGK: 0, BS: 0, URAIAN: 0 }, bab));
});

test("soal mengikuti TP dan level kisi-kisi; permintaan soal memuat indikator dan skenarionya", () => {
  const [k] = periksaKisi([{ bentuk: "PG", tp: "TP 3.2", materi: "m", indikator: "Peserta didik dapat menjelaskan", level: "C4", dalil_id: null, stimulus: "unggahan media sosial X" }], { PG: 1, PGK: 0, BS: 0, URAIAN: 0 }, bab);
  const s = samakanDenganKisi({ bentuk: "PG", dalil_id: null, pertanyaan: "?", kunci: "A", pembahasan: "", level: "C1", tp: "TP 3.1", skor: 2 }, k);
  assert.equal(s.tp, "TP 3.2");
  assert.equal(s.level, "C4");
  const p = { babId: "qurdis11-bab3", tujuan: "PAS", kesulitan: "Sedang", jumlah: { PG: 1, PGK: 0, BS: 0, URAIAN: 0 }, level: { LOTS: 30, MOTS: 40, HOTS: 30 } } as Pengaturan;
  const permintaan = buatPengguna(p, p.jumlah, [], "", [k]);
  assert.ok(permintaan.includes("unggahan media sosial X") && permintaan.includes("Peserta didik dapat menjelaskan"));
  assert.ok(!permintaan.includes("Komposisi level")); // level sudah ditentukan kisi-kisi
});

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

test("materi sendiri: TP diberi kode, teks Arab hanya dipercaya dari kotak ayat terverifikasi (aturan 5)", () => {
  const ayat = bab.dalil[0].arab; // teks Arab asli (anggap ditempel guru)
  const potongan = ayat.split(" ").slice(0, 2).join(" ");
  const isian = {
    judul: "Bab 1: Menjaga Kehormatan",
    tp: "TP 1.1: Peserta didik mampu menjelaskan isi ayat\nPeserta didik mampu menyebutkan hikmah",
    isi: `Lafaz ${potongan} artinya janganlah mendekati. Karangan بِسْمِ اللّٰهِ dibuang. ${"Penjelasan materi. ".repeat(10)}`,
    dalil: [{ sumber: "QS. Al-Isra: 32", arab: ayat, terjemah: "Janganlah kamu mendekati zina" }, { sumber: "", arab: "", terjemah: "" }],
    diverifikasi: true,
  };
  const r = rapikanMateri(isian, "materi-7");
  assert.ok(typeof r !== "string", String(r));
  assert.deepEqual(r.bab.tp.map((t) => t.kode), ["TP 1.1", "TP 2"]);
  assert.equal(r.bab.dalil.length, 1); // baris kosong diabaikan
  assert.equal(r.bab.dalil[0].id, "dalil-1");
  assert.ok(r.bab.materi[0].includes(potongan)); // ada di kotak ayat → dipertahankan
  assert.ok(!r.bab.materi[0].includes("بِسْمِ")); // karangan → dibuang
  assert.equal(r.dihapus.length, 1);
  // tanpa centang verifikasi → ditolak
  assert.match(String(rapikanMateri({ ...isian, diverifikasi: false }, "x")), /Centang/);
  // kolom Arab tanpa huruf Arab → ditolak
  assert.match(String(rapikanMateri({ ...isian, dalil: [{ sumber: "QS", arab: "la taqrabu", terjemah: "t" }] }, "x")), /tidak berisi huruf Arab/);
  assert.match(String(rapikanMateri({ ...isian, tp: " " }, "x")), /TP/);
  assert.match(String(rapikanMateri({ ...isian, isi: "pendek" }, "x")), /terlalu pendek/);
  // tanpa ayat sama sekali: boleh, dan semua teks Arab dibuang
  const tanpa = rapikanMateri({ ...isian, dalil: [], diverifikasi: false }, "x");
  assert.ok(typeof tanpa !== "string" && !/[؀-ۿ]/.test(JSON.stringify(tanpa.bab)));
  // bolak-balik ke form edit
  assert.ok(typeof r !== "string" && keIsian(r.bab).tp.startsWith("TP 1.1: "));
});
