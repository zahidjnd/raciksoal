import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { bacaXlsx, isiXlsx } from "./xlsx.ts";

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

test("xlsx: dibaca balik (inlineStr, teks bersama, sel kosong di tengah, kolom Teks)", async () => {
  const isi = await isiXlsx([
    { nama: "A", teks: [2], baris: [["No", "Nama", "NISN"], [1, "Ahmad & Bilal", "0012345678"], [2, null, "0099"]] },
    { nama: "B", baris: [["x"]] },
  ]);
  const z = await JSZip.loadAsync(isi);
  assert.match(await z.file("xl/worksheets/sheet1.xml")!.async("string"), /<c r="C2" s="2" t="inlineStr">/);
  // file Excel asli memakai sharedStrings: tiru satu sel
  const l1 = (await z.file("xl/worksheets/sheet1.xml")!.async("string")).replace('<c r="B2" t="inlineStr"><is><t xml:space="preserve">Ahmad &amp; Bilal</t></is></c>', '<c r="B2" t="s"><v>0</v></c>');
  z.file("xl/worksheets/sheet1.xml", l1);
  z.file("xl/sharedStrings.xml", '<sst><si><r><t>Ahmad </t></r><r><t>&amp; Bilal</t></r></si></sst>');
  const balik = await bacaXlsx(await z.generateAsync({ type: "uint8array" }));
  assert.deepEqual(balik, [
    [["No", "Nama", "NISN"], [1, "Ahmad & Bilal", "0012345678"], [2, null, "0099"]],
    [["x"]],
  ]);
});
