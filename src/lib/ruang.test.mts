import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanRuang, CONTOH_RUANG, svgRuang } from "./ruang.ts";
import { bacaPenanda, isiTampil, tulisPenanda } from "./grafik.ts";

const K = ["Bagian", "Isi"];
const ruang = (...b: string[][]) => alasanRuang([K, ...b]);
const putus = (svg: string) => (svg.match(/stroke-dasharray="4 3"/g) ?? []).length;

test("semua contoh sah; rusuk tersembunyi putus-putus", () => {
  for (const [nama, isi] of Object.entries(CONTOH_RUANG)) {
    assert.equal(alasanRuang(isi), null, nama);
    assert.match(svgRuang(isi, "J")!, /^<svg[\s\S]*<\/svg>$/, nama);
  }
  assert.equal(putus(svgRuang(CONTOH_RUANG.balok, "")!), 3); // DA, DC, DH
});

test("pemeriksa jarak 3D", () => {
  assert.equal(ruang(["bangun", "balok"], ["AB", "4"], ["BC", "3"], ["AE", "12"], ["AG", "13 cm"]), null);
  assert.match(ruang(["bangun", "balok"], ["AB", "4"], ["BC", "3"], ["AE", "12"], ["AG", "14 cm"])!, /AG tertulis 14 cm.*AG = 13/);
  assert.equal(ruang(["bangun", "kubus"], ["rusuk", "6 cm"], ["AC", "8,49 cm"]), null); // 6√2
  assert.equal(ruang(["bangun", "kubus"], ["AG", "6√3 cm"], ["rusuk", "6"]), null); // akar = label saja
  assert.equal(ruang(["bangun", "limas segiempat"], ["AB", "6"], ["BC", "6"], ["TA", "5"], ["tinggi", "2,65 cm"]), null); // √(25 − 18)
  assert.match(ruang(["bangun", "kerucut"], ["jari-jari", "6"], ["tinggi", "8"], ["garis pelukis", "11"])!, /= 10/);
  assert.match(ruang(["bangun", "bola"], ["jari-jari", "7"], ["diameter", "15"])!, /2 × jari-jari = 14/);
  assert.match(ruang(["bangun", "limas segiempat"], ["AB", "8"], ["TA", "3"])!, /terlalu pendek/);
  assert.match(ruang(["bangun", "prisma segitiga"], ["AB", "3"], ["BC", "4"], ["AC", "9"])!, /Alas: .*tidak bisa membentuk segitiga/);
});

test("titik tengah, nama titik lain, salah tulis", () => {
  assert.equal(ruang(["bangun", "kubus"], ["rusuk", "4"], ["titik P", "tengah EH"], ["AP", "?"], ["PG", "?"]), null);
  assert.equal(ruang(["bangun", "kubus"], ["rusuk", "4"], ["titik P", "tengah AB"], ["PE", "4,47 cm"]), null); // √(4 + 16)
  assert.match(ruang(["bangun", "kubus"], ["titik P", "tengah XY"])!, /tidak ada/);
  assert.equal(ruang(["bangun", "balok"], ["titik", "PQRS.TUVW"], ["PQ", "10"], ["QR", "4"], ["PT", "5"], ["PV", "?"]), null);
  assert.match(ruang(["bangun", "kubus"], ["AZ", "3"])!, /titik Z tidak ada/);
  assert.match(ruang(["bangun", "silinder"])!, /tidak dikenal/);
  assert.match(ruang(["bangun", "tabung"], ["AB", "3"])!, /jari-jari, diameter, tinggi/);
});

test("penanda & contoh abu-abu ikut bangun", () => {
  const p = bacaPenanda("[[GEOMETRI ruang: Kubus ABCD.EFGH]]")!;
  assert.deepEqual(p, { jenis: "ruang", judul: "Kubus ABCD.EFGH" });
  assert.equal(tulisPenanda(p), "[[GEOMETRI ruang: Kubus ABCD.EFGH]]");
  const t = isiTampil([["", ""], ["bangun", "kerucut"], ["", ""], ["", ""], ["", ""]], "ruang");
  assert.deepEqual(t[2], CONTOH_RUANG.kerucut[2]);
  assert.equal(alasanRuang(t), null);
});
