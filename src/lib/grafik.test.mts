import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaAngka, bacaPenanda, dataGrafik, skala, svgGrafik } from "./grafik.ts";
import { cariTabel, pecahBaris } from "./soal.ts";

const SOAL = "Perhatikan grafik berikut!\n[[GRAFIK batang: Penjualan buku]]\n| Bulan | Kelas X | Kelas XI |\n|---|---|---|\n| Jan | 40 | 35 |\n| Feb | 65 | 50 |\n| Mar | 30 | 45 |\nSelisih terbesar ....";

test("bacaAngka: angka gaya Indonesia", () => {
  assert.equal(bacaAngka("30.000"), 30000);
  assert.equal(bacaAngka("Rp 1.500.000"), 1500000);
  assert.equal(bacaAngka("Rp. 1.500"), 1500);
  assert.equal(bacaAngka("2,5"), 2.5);
  assert.equal(bacaAngka("1.250,75"), 1250.75);
  assert.equal(bacaAngka("45%"), 45);
  assert.equal(bacaAngka("−3"), -3);
  assert.ok(Number.isNaN(bacaAngka("-")));
  assert.ok(Number.isNaN(bacaAngka("banyak")));
});

test("bacaPenanda: jenis & judul; selain itu bukan penanda", () => {
  assert.deepEqual(bacaPenanda("[[GRAFIK Garis: Harga cabai 2026]]"), { jenis: "garis", judul: "Harga cabai 2026" });
  assert.deepEqual(bacaPenanda("[[GRAFIK lingkaran]]"), { jenis: "lingkaran", judul: "" });
  assert.equal(bacaPenanda("[[GRAFIK pie]]"), null);
  assert.equal(bacaPenanda("[[A 3-4]]"), null);
});

test("pecahBaris: penanda menempel ke tabel di bawahnya; urutan tabel cariTabel tetap sama", () => {
  const b = pecahBaris(SOAL);
  assert.deepEqual(b.map((x) => x.teks), ["Perhatikan grafik berikut!", "", "Selisih terbesar ...."]);
  assert.deepEqual(b[1].grafik, { jenis: "batang", judul: "Penjualan buku" });
  assert.deepEqual(b[1].tabel?.[1], ["Jan", "40", "35"]);
  assert.deepEqual(cariTabel(SOAL)[0].isi, b[1].tabel);
  // Penanda tanpa tabel = teks biasa (terlihat guru, tidak hilang diam-diam)
  assert.deepEqual(pecahBaris("[[GRAFIK garis]]\nteks").map((x) => x.teks), ["[[GRAFIK garis]]", "teks"]);
});

test("dataGrafik: batas kolom/baris & angka; tak bisa digambar → null", () => {
  const isi = pecahBaris(SOAL)[1].tabel!;
  assert.deepEqual(dataGrafik(isi, "batang")?.seri.map((s) => s.nilai), [[40, 65, 30], [35, 50, 45]]);
  assert.equal(dataGrafik(isi, "lingkaran"), null, "lingkaran hanya 1 kelompok data");
  assert.equal(dataGrafik([["A", "B"], ["x", "1"]], "batang"), null, "minimal 2 baris data");
  assert.equal(dataGrafik([["A", "B"], ["x", "1"], ["y", "-"]], "garis"), null, "sel bukan angka");
  assert.equal(dataGrafik([["A", "B"], ["x", "0"], ["y", "0"]], "lingkaran"), null, "lingkaran semua nol");
});

test("skala: langkah rapi, batang memuat 0", () => {
  assert.deepEqual(skala(30, 65, true), { a: 0, b: 70, langkah: 10 });
  assert.deepEqual(skala(30000, 45000, false), { a: 30000, b: 46000, langkah: 2000 });
  assert.deepEqual(skala(-4, 12, true), { a: -4, b: 12, langkah: 2 });
  assert.deepEqual(skala(0, 0, true), { a: 0, b: 1, langkah: 0.2 });
});

test("svgGrafik: batang/garis/lingkaran tergambar, teks di-escape", () => {
  const isi = pecahBaris(SOAL)[1].tabel!;
  const batang = svgGrafik(isi, { jenis: "batang", judul: "A < B & C" })!;
  assert.equal(batang.match(/<rect /g)!.length, 1 + 6 + 2, "latar + 6 batang + 2 kotak keterangan");
  assert.match(batang, /A &lt; B &amp; C/);
  const garis = svgGrafik(isi, { jenis: "garis", judul: "" })!;
  assert.equal(garis.match(/<polyline /g)!.length, 2);
  assert.match(garis, /stroke-dasharray="6 4"/, "kelompok kedua garis putus-putus");
  const iris = svgGrafik([["Sektor", "Persen"], ["Tani", "50"], ["Dagang", "25"], ["Jasa", "25"]], { jenis: "lingkaran", judul: "" })!;
  assert.equal(iris.match(/<path /g)!.length, 3);
  assert.match(iris, /Tani \(50%\)/);
  assert.equal(svgGrafik([["A", "B"], ["x", "?"], ["y", "1"]], { jenis: "batang", judul: "" }), null);
});
