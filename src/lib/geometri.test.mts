import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanGeometri, ATURAN_GEOMETRI, bacaRentang, langkahRapi, bacaRumus, bacaTitik, svgGeometri } from "./geometri.ts";
import { bacaPenanda, isiTampil, tulisPenanda } from "./grafik.ts";
import { periksaGrafik } from "./soal.ts";

test("bacaRumus: tanpa eval, perkalian tanpa tanda, pangkat, fungsi, peubah sumbu", () => {
  const f = (t: string, x: number, v?: string) => bacaRumus(t, v)!(x);
  assert.equal(f("y = x^2 - 2x - 3", 3), 0);
  assert.equal(f("f(x) = -x² + 4", 1), 3);
  assert.equal(f("2(x+1)", 2), 6);
  assert.equal(f("1/2x", 4), 2); // (1/2)·x
  assert.equal(f("2,5x", 2), 5);
  assert.equal(f("sqrt(x) + abs(-3)", 4), 5);
  assert.equal(f("v = 2t + 1", 3, "t"), 7);
  assert.equal(f("-x^2", 3), -9);
  for (const salah of ["", "y = ", "2x +", "process.exit()", "x)(", "alert(1)", "y = 2q"]) assert.equal(bacaRumus(salah), null, salah);
});

test("bacaTitik & bacaRentang", () => {
  assert.deepEqual(bacaTitik("(0, 10) (10, 0)"), [[0, 10], [10, 0]]);
  assert.deepEqual(bacaTitik("(2,5; -3)"), [[2.5, -3]]);
  assert.equal(bacaTitik("(1, 2, 3)"), null);
  assert.equal(bacaTitik("(a, 2)"), null);
  assert.equal(bacaTitik("A(1, 2)"), null);
  assert.deepEqual(bacaRentang("-5 sampai 5"), [-5, 5]);
  assert.deepEqual(bacaRentang("0..10"), [0, 10]);
  assert.equal(bacaRentang("5..1"), null);
  assert.deepEqual(bacaRentang("2..", true), [2, Infinity]);
  assert.equal(bacaRentang("2.."), null);
});

test("alasanGeometri menyebut letak; contoh sah & tergambar", () => {
  for (const j of ["koordinat", "bilangan"] as const) {
    assert.equal(alasanGeometri(ATURAN_GEOMETRI[j].contoh, j), null, j);
    assert.match(svgGeometri(ATURAN_GEOMETRI[j].contoh, j, "Judul")!, /^<svg[\s\S]*Judul[\s\S]*<\/svg>$/);
  }
  const k = (...b: string[][]) => alasanGeometri([["Jenis", "Isi", "Label"], ...b], "koordinat");
  assert.match(k(["titk", "(1, 2)", ""])!, /Baris 1: jenis "titk" tidak dikenal/);
  assert.match(k(["garis", "(1, 2)", ""])!, /tepat 2 titik/);
  assert.match(k(["garis", "(1, 2) (1, 2)", ""])!, /tidak boleh sama/);
  assert.match(k(["kurva", "y = x^", ""])!, /rumus kurva tidak terbaca/);
  assert.match(k(["titik", "(1, 2)", "أ"])!, /huruf Arab/);
  assert.match(k(["sumbu x", "x", "0..5"], ["titik", "(7, 1)", ""])!, /di luar rentang/);
  assert.match(k(["sumbu x", "x", "0..5"])!, /Belum ada/);
  assert.equal(k(["vektor", "(0, 0) (3, 4)", "a"], ["fungsi", "y = x", ""]), null); // sinonim
  assert.match(alasanGeometri([["J", "I", "L"], ["titik", "dua", ""]], "bilangan")!, /satu angka/);
});

test("penanda GEOMETRI; isiTampil: label kosong di baris terisi bukan contoh; pemeriksa", () => {
  const p = bacaPenanda("[[GEOMETRI koordinat: Keseimbangan pasar]]")!;
  assert.deepEqual(p, { jenis: "koordinat", judul: "Keseimbangan pasar" });
  assert.equal(tulisPenanda(p), "[[GEOMETRI koordinat: Keseimbangan pasar]]");
  const t = isiTampil([["", "", ""], ["titik", "(1, 1)", ""], ["", "", ""]], "koordinat");
  assert.equal(t[1][2], "", "label sengaja kosong");
  assert.equal(t[2][0], ATURAN_GEOMETRI.koordinat.contoh[2][0], "baris kosong = contoh");
  assert.deepEqual(periksaGrafik({ pertanyaan: "[[GEOMETRI bilangan]]\n| J | I | L |\n|---|---|---|\n| titik | 3 | |", pembahasan: "" }), []);
  assert.match(periksaGrafik({ pertanyaan: "[[GEOMETRI koordinat]]\n| J | I | L |\n|---|---|---|\n| garis | (1, 2) | |", pembahasan: "" })[0], /tepat 2 titik/);
  assert.match(periksaGrafik({ pertanyaan: "x", pembahasan: "", pilihan: ["[[GEOMETRI koordinat]]"] })[0], /pilihan/);
});

test("langkahRapi: 1/2/5 saja, tanpa 2,5", () => {
  assert.deepEqual([20, 14, 8, 10, 7, 100, 0.5].map((l) => langkahRapi(l)), [2, 2, 1, 1, 1, 10, 0.05]);
});
