import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arabTakTerverifikasi, korpusArab, periksaSoal, ratakanKunci, type Bab, type Soal } from "./soal.ts";

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

test("periksaSoal memberi peringatan dalil tak dikenal", () => {
  const s: Soal = { bentuk: "BS", dalil_id: "ngarang-1", pertanyaan: "x", kunci: "Benar", pembahasan: "", level: "C1", tp: "TP 3.1", skor: 1 };
  assert.equal(periksaSoal([s], bab)[0].peringatan!.length, 1);
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
