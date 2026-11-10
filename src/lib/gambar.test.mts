import { test } from "node:test";
import assert from "node:assert/strict";
import { rapikanGambar, ukuranJpeg, ukuranWord } from "./gambar.ts";

// JPEG mini: SOI, APP0 (panjang 16), SOF0 600×400 (lebar 600, tinggi 400). Isi gambar tidak perlu untuk membaca ukuran.
const app0 = [0xff, 0xe0, 0x00, 0x10, ...Array(14).fill(0)];
const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x90, 0x02, 0x58, 0x03, ...Array(9).fill(0)];
const jpeg = new Uint8Array([0xff, 0xd8, ...app0, ...sof0, 0xff, 0xd9]);

test("ukuran JPEG dibaca dari penanda SOF, melewati segmen lain", () => {
  assert.deepEqual(ukuranJpeg(jpeg), { lebar: 600, tinggi: 400 });
});

test("bukan JPEG atau JPEG rusak → null", () => {
  assert.equal(ukuranJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...Array(20).fill(0)])), null); // PNG
  assert.equal(ukuranJpeg(jpeg.slice(0, 20)), null); // terpotong sebelum SOF
  assert.equal(ukuranJpeg(new Uint8Array([0xff, 0xd8, 0x00, ...Array(20).fill(0)])), null);
});

test("daftar gambar dari browser dirapikan", () => {
  const r = rapikanGambar([{ id: 5, keterangan: "  Sel   hewan " }, { id: 5 }, { id: "x" }, { id: -1 }, { id: 7.5 }, { id: "9" }]);
  assert.deepEqual(r, [{ id: 5, keterangan: "Sel hewan" }, { id: 9, keterangan: "" }]);
  assert.equal(rapikanGambar(Array.from({ length: 15 }, (_, i) => ({ id: i + 1 }))).length, 10);
  assert.deepEqual(rapikanGambar("bukan daftar"), []);
});

test("ukuran Word muat di satu kolom, perbandingan sisi tetap", () => {
  assert.deepEqual(ukuranWord(1280, 960), { width: 280, height: 210 });
  assert.deepEqual(ukuranWord(400, 1280), { width: 69, height: 220 });
  assert.deepEqual(ukuranWord(100, 50), { width: 100, height: 50 }); // gambar kecil tidak diperbesar
});
