import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanSkema, ATURAN_SKEMA, svgSkema } from "./skema.ts";
import { bacaPenanda, tulisPenanda } from "./grafik.ts";

const K = ["Bagian", "Isi"];
type J = "shaf" | "waris" | "arah";
const cek = (j: J, ...b: string[][]) => alasanSkema([K, ...b], j);

test("contoh sah & tergambar; penanda SKEMA waris", () => {
  for (const j of ["shaf", "waris", "arah"] as const) {
    assert.equal(alasanSkema(ATURAN_SKEMA[j].contoh, j), null, j);
    assert.match(svgSkema(ATURAN_SKEMA[j].contoh, j, "J")!, /^<svg[\s\S]*<\/svg>$/, j);
  }
  const p = bacaPenanda("[[SKEMA waris: Pembagian warisan]]")!;
  assert.deepEqual(p, { jenis: "waris", judul: "Pembagian warisan" });
  assert.equal(tulisPenanda(p), "[[SKEMA waris: Pembagian warisan]]");
});

test("waris: hijab, bagian pasti, 'aul", () => {
  const w = (...b: string[][]) => cek("waris", ...b);
  assert.match(w(["anak laki-laki", "ashabah"], ["saudara laki-laki", "ashabah"])!, /saudara laki-laki terhalang.*anak laki-laki/);
  assert.match(w(["ayah", "ashabah"], ["kakek", "1/6"])!, /kakek terhalang.*ayah/);
  assert.match(w(["ibu", "1/3"], ["nenek", "1/6"])!, /nenek terhalang.*ibu/);
  assert.match(w(["istri", "1/4"], ["anak laki-laki", "ashabah"])!, /istri bila ada anak\/cucu adalah 1\/8/);
  assert.match(w(["suami", "1/4"], ["ayah", "ashabah"])!, /suami bila tidak ada anak\/cucu adalah 1\/2/);
  assert.match(w(["ibu", "1/3"], ["anak perempuan", "1/2"])!, /ibu bila ada anak\/cucu adalah 1\/6/);
  assert.match(w(["anak perempuan (2)", "1/2"], ["ayah", "1/6 + sisa"])!, /2\/3/);
  assert.match(w(["anak perempuan", "1/2"], ["anak laki-laki", "ashabah"])!, /ashabah/);
  assert.match(w(["suami", "1/2"], ["istri", "1/4"])!, /tidak mungkin/);
  assert.match(w(["mayit", "laki-laki"], ["suami", "1/2"])!, /tulis istri/);
  assert.match(w(["suami", "1/2"], ["saudara perempuan (2)", "2/3"], ["ibu", "1/6"])!, /lebih dari 1.*aul/);
  assert.equal(w(["suami", "1/2"], ["saudara perempuan (2)", "2/3"], ["ibu", "1/6"], ["aul", "ya"]), null);
  assert.equal(w(["istri", "1/8"], ["anak laki-laki", "?"], ["saudara laki-laki", "?"]), null); // "?" tidak diperiksa
  assert.match(w(["tetangga", "1/2"], ["ibu", "1/6"])!, /bukan ahli waris/);
  assert.match(w(["ibu", "1/6"], ["ibu", "1/6"])!, /dua kali/);
});

test("shaf & arah", () => {
  assert.equal(cek("shaf", ["bentuk", "berdua"], ["makmum laki-laki", "1"]), null);
  assert.match(cek("shaf", ["bentuk", "berdua"], ["makmum laki-laki", "3"])!, /satu makmum/);
  assert.match(cek("shaf", ["makmum laki-laki", "20"])!, /1–12/);
  assert.match(cek("shaf", ["bentuk", "berjamaah"])!, /minimal satu barisan/);
  assert.equal(cek("arah", ["kiblat", "barat laut"], ["rumah", "135°"]), null);
  assert.match(cek("arah", ["kiblat", "kiri"])!, /nama arah/);
  // nama arah kapital per kata (bukan semua huruf)
  assert.match(svgSkema([K, ["kiblat", "295°"]], "arah", "")!, />Barat Laut</);
});
