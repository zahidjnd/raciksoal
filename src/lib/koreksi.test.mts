import { test } from "node:test";
import assert from "node:assert/strict";
import { analisisButir, bacaDaftarSiswa, bagianBenar, FORMAT_ASAS, kunciDariSet, nilaiAkhir, rapikanJawab, rapikanKunci, skorObjektif, totalObjektif } from "./koreksi.ts";
import type { Soal } from "./soal.ts";

const soal = (bentuk: Soal["bentuk"], kunci: Soal["kunci"], skor: number, lain: Partial<Soal> = {}) => ({ bentuk, kunci, skor, ...lain }) as Soal;

test("koreksi: kunci dari set (PG, PGK, B/S gaya lama di LJK; uraian jadi esai)", () => {
  const r = kunciDariSet([soal("PG", "C", 2), soal("PGK", ["D", "A"], 5), soal("BS", "Salah", 3), soal("URAIAN", "", 8), soal("URAIAN", "", 8)]);
  assert.ok(!("pesan" in r));
  assert.deepEqual(r.kunci, [
    { bentuk: "PG", kunci: [2], skor: 2 },
    { bentuk: "PGK", kunci: [0, 3], skor: 5 },
    { bentuk: "BS", kunci: [1], skor: 3 },
  ]);
  assert.equal(r.esaiMaks, 16);
  // soal pilihan sesudah uraian tidak bisa dipetakan ke nomor LJK
  assert.ok("pesan" in kunciDariSet([soal("URAIAN", "", 8), soal("PG", "A", 2)]));
  assert.ok("pesan" in kunciDariSet(Array.from({ length: 41 }, () => soal("PG", "A", 2))));
});

test("koreksi: format ASAS madrasah = total 100", () => {
  for (const f of Object.values(FORMAT_ASAS)) {
    const pilihan = (["PG", "PGK", "BS"] as const).reduce((n, b) => n + f.jumlah[b] * f.skor[b], 0);
    assert.equal(pilihan + f.esai.jumlah * f.esai.skor, 100, f.nama);
  }
});

test("koreksi: nilai (PG kompleks sebagian, kosong/dua jawaban PG = salah)", () => {
  const kunci = rapikanKunci([{ bentuk: "PG", kunci: [0], skor: 2 }, { bentuk: "PGK", kunci: [3, 1], skor: 4 }, { bentuk: "BS", kunci: [1], skor: 2 }])!;
  assert.equal(totalObjektif(kunci), 8);
  assert.deepEqual(skorObjektif(kunci, [[0], [1, 3], [1]]), { skor: 8, bagian: [1, 1, 1] });
  assert.equal(skorObjektif(kunci, [[0, 1], [1], []]).skor, 2); // PGK benar satu = ½ × 4
  const pgk = kunci[1];
  assert.equal(bagianBenar(pgk, [1, 2]), 0.5); // satu benar, satu salah (tidak lebih dari jumlah kunci)
  assert.equal(bagianBenar(pgk, [1, 2, 3]), 0.5); // tiga dihitamkan untuk dua kunci: lebih satu, dikurangi satu
  assert.equal(bagianBenar(pgk, [0, 1, 2, 3, 4]), 0); // semua dihitamkan = 0
  assert.equal(bagianBenar(pgk, [0, 2]), 0);
  assert.equal(nilaiAkhir(52, 30.5), 82.5);
  assert.equal(nilaiAkhir(null, null), null);
  // kiriman aneh ditolak / dirapikan
  assert.equal(rapikanKunci([{ bentuk: "PG", kunci: [0, 1], skor: 2 }]), null);
  assert.deepEqual(rapikanKunci([{ bentuk: "BS", kunci: [3], skor: 2 }]), [{ bentuk: "BS", kunci: [3], skor: 2 }]); // B/S boleh huruf apa pun A–E
  assert.equal(rapikanKunci([{ bentuk: "BS", kunci: [5], skor: 2 }]), null);
  assert.deepEqual(rapikanJawab([[4, 4, 9], ["2"], null], 3), [[4], [2], []]);
  assert.equal(rapikanJawab([[1]], 3), null);
});

test("koreksi: tempelan daftar siswa dari Excel", () => {
  const r = bacaDaftarSiswa("Kelas\tNo\tNama\nXI A\t1\tAhmad Fauzi\nxi a\t2\t Bilal  Rahman \nXI B\tCitra Amalia\nXI B\tDina\n\nXI A\t1\tAhmad Fauzi");
  assert.deepEqual(r, [
    { kelas: "XI A", nomor: 1, nama: "Ahmad Fauzi" },
    { kelas: "XI A", nomor: 2, nama: "Bilal Rahman" },
    { kelas: "XI B", nomor: 1, nama: "Citra Amalia" },
    { kelas: "XI B", nomor: 2, nama: "Dina" },
  ]);
  assert.ok("pesan" in (bacaDaftarSiswa("XI A\tAhmad\nhanya satu kolom") as object));
});

test("koreksi: analisis butir (kesukaran, daya beda, sebaran, pengecoh lemah)", () => {
  const kunci = rapikanKunci([{ bentuk: "PG", kunci: [0], skor: 1 }, { bentuk: "PG", kunci: [2], skor: 1 }, { bentuk: "PGK", kunci: [1, 3], skor: 2 }])!;
  // 10 siswa: 5 pandai menjawab semua benar; 5 lemah: no.1 benar, no.2 salah (B), no.3 setengah / kosong
  const pandai = Array.from({ length: 5 }, () => [[0], [2], [1, 3]]);
  const lemah = Array.from({ length: 5 }, (_, i) => [[0], [1], i % 2 ? [1] : []]);
  const a = analisisButir(kunci, [...pandai, ...lemah]);
  assert.equal(a[0].p, 1);
  assert.equal(a[0].kategoriP, "Mudah");
  assert.equal(a[0].d, 0); // semua benar = tidak membedakan
  assert.equal(a[0].kategoriD, "Perlu diperbaiki");
  assert.equal(a[1].p, 0.5);
  assert.equal(a[1].kategoriP, "Sedang");
  assert.equal(a[1].d, 1);
  assert.equal(a[1].kategoriD, "Baik");
  assert.deepEqual(a[1].sebaran, [0, 5, 5, 0, 0, 0]);
  assert.deepEqual(a[1].pengecohLemah, [0, 3, 4]); // A, D, E tak dipilih siapa pun
  assert.deepEqual(a[2].sebaran, [0, 7, 0, 5, 0, 3]); // PGK: tiap huruf dihitung, 3 kosong
  assert.equal(a[2].p, 0.6); // (5×1 + 2×½) / 10
  // siswa < 10: daya beda belum dihitung
  assert.equal(analisisButir(kunci, pandai)[0].d, null);
});
