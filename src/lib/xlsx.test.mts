import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { isiXlsx } from "./xlsx.ts";

test("xlsx: lembar, angka, teks aman, judul tebal", async () => {
  const isi = await isiXlsx([{ nama: "Nilai/Ujian", lebar: [6, 30], baris: [["No", "Nama"], [1, "Ahmad & <Bilal>"], [2, null], [], [28, 82.5]] }]);
  const z = await JSZip.loadAsync(isi);
  const wb = await z.file("xl/workbook.xml")!.async("string");
  assert.match(wb, /<sheet name="Nilai Ujian"/); // garis miring tidak boleh di nama lembar
  const l = await z.file("xl/worksheets/sheet1.xml")!.async("string");
  assert.match(l, /<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">No<\/t>/);
  assert.match(l, /<c r="A2"><v>1<\/v><\/c>/);
  assert.match(l, /Ahmad &amp; &lt;Bilal&gt;/);
  assert.match(l, /<c r="B5"><v>82.5<\/v>/);
  assert.ok(!l.includes('r="B3"')); // sel kosong tidak ditulis
});
