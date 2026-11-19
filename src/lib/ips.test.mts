import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanSkema, ATURAN_SKEMA, svgSkema } from "./skema.ts";
import { bacaPenanda, tulisPenanda } from "./grafik.ts";

const K = ["Bagian", "Isi"];
type J = "lapisan" | "langit" | "ekonomi";
const cek = (j: J, ...b: string[][]) => alasanSkema([K, ...b], j);

test("contoh sah & tergambar; penanda SKEMA langit", () => {
  for (const j of ["lapisan", "langit", "ekonomi"] as const) {
    assert.equal(alasanSkema(ATURAN_SKEMA[j].contoh, j), null, j);
    assert.match(svgSkema(ATURAN_SKEMA[j].contoh, j, "J")!, /^<svg[\s\S]*<\/svg>$/, j);
  }
  const p = bacaPenanda("[[SKEMA langit: Gerhana]]")!;
  assert.deepEqual(p, { jenis: "langit", judul: "Gerhana" });
  assert.equal(tulisPenanda(p), "[[SKEMA langit: Gerhana]]");
});

test("lapisan: bentuk, jumlah, urutan atmosfer", () => {
  assert.equal(cek("lapisan", ["bentuk", "tanah"], ["horizon O", "?"], ["horizon A", "-"]), null);
  assert.match(cek("lapisan", ["bentuk", "laut"], ["a", "b"], ["c", "d"])!, /bumi.*atmosfer.*tanah/);
  assert.match(cek("lapisan", ["bentuk", "bumi"], ["kerak", "tipis"])!, /3–8 baris|2–7 lapisan/);
  assert.match(cek("lapisan", ["bentuk", "atmosfer"], ["stratosfer", "12–50 km"], ["troposfer", "0–12 km"])!, /dari bawah ke atas/);
});

test("langit & ekonomi: nama/nomor disembunyikan", () => {
  const g = svgSkema([K, ["bentuk", "gerhana bulan"], ["nama", "sembunyi"]], "langit", "")!;
  assert.doesNotMatch(g, />Matahari</);
  assert.match(g, />A</);
  const f = svgSkema([K, ["bentuk", "fase bulan"], ["nama", "sembunyi"]], "langit", "")!;
  assert.doesNotMatch(f, /purnama/);
  assert.match(cek("langit", ["bentuk", "komet"])!, /gerhana matahari/);
  const e = svgSkema([K, ["bentuk", "3 sektor"], ["label arus", "angka"]], "ekonomi", "")!;
  assert.match(e, /\(12\)/);
  assert.doesNotMatch(e, /pengeluaran/);
  assert.match(cek("ekonomi", ["bentuk", "5 sektor"])!, /2 sektor/);
  // uji DeepSeek: "label arus | 1-8" = nomor
  assert.match(svgSkema([K, ["bentuk", "2 sektor"], ["label arus", "1-8"]], "ekonomi", "")!, /\(8\)/);
  assert.match(cek("ekonomi", ["bentuk", "2 sektor"], ["label arus", "warna"])!, /angka.*kata/);
  // 4 sektor lebih lebar dari 360 (Word mengecilkannya)
  assert.ok(Number(/width="(\d+)"/.exec(svgSkema([K, ["bentuk", "4 sektor"]], "ekonomi", "")!)![1]) > 360);
});
