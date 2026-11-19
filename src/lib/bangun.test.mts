import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanBangun, CONTOH_BANGUN, contohBangun, svgBangun } from "./bangun.ts";
import { bacaPenanda, isiTampil, tulisPenanda } from "./grafik.ts";

const K = ["Bagian", "Isi"];
const datar = (...b: string[][]) => alasanBangun([K, ...b], "datar");
const sudut = (...b: string[][]) => alasanBangun([K, ...b], "sudut");

test("semua contoh sah & tergambar", () => {
  for (const [nama, isi] of Object.entries(CONTOH_BANGUN)) {
    const jenis = isi.some((b) => b[0] === "bentuk") ? "sudut" : "datar";
    assert.equal(alasanBangun(isi, jenis), null, nama);
    assert.match(svgBangun(isi, jenis, "J")!, /^<svg[\s\S]*<\/svg>$/, nama);
  }
});

test("segitiga: aturan sinus/cosinus & ukuran mustahil", () => {
  assert.equal(datar(["bangun", "segitiga siku-siku"], ["AB", "8 cm"], ["BC", "6 cm"], ["AC", "10 cm"]), null);
  assert.match(datar(["bangun", "segitiga siku-siku"], ["AB", "8 cm"], ["BC", "6 cm"], ["AC", "11 cm"])!, /tidak membentuk sudut siku-siku/);
  assert.match(datar(["bangun", "segitiga siku-siku"], ["sudut B", "siku-siku"], ["AB", "8"], ["BC", "6"], ["AC", "11"])!, /tidak cocok: sudut B tertulis siku-siku/);
  assert.match(datar(["bangun", "segitiga"], ["AB", "3"], ["BC", "4"], ["AC", "10"])!, /tidak bisa membentuk segitiga/);
  assert.match(datar(["bangun", "segitiga"], ["sudut A", "60°"], ["sudut B", "70°"], ["sudut C", "60°"])!, /180°/);
  assert.equal(datar(["bangun", "segitiga"], ["AB", "7"], ["AC", "5"], ["sudut A", "60°"], ["BC", "6,24 cm"]), null); // cosinus: √39 ≈ 6,245
  assert.match(datar(["bangun", "segitiga sama kaki"], ["AB", "6"], ["AC", "5"], ["BC", "7"])!, /sama kaki/);
  assert.equal(datar(["bangun", "segitiga"], ["sudut A", "30°"], ["sudut B", "60°"], ["AB", "10"], ["BC", "5 cm"]), null); // sinus
});

test("segiempat & lingkaran: hitungan dicocokkan", () => {
  assert.match(datar(["bangun", "persegi panjang"], ["AB", "8"], ["BC", "6"], ["AC", "9"])!, /AC tertulis 9/);
  assert.equal(datar(["bangun", "belah ketupat"], ["AC", "16"], ["BD", "12"], ["AB", "10 cm"]), null);
  assert.equal(datar(["bangun", "trapesium sama kaki"], ["AB", "14"], ["CD", "8"], ["AD", "5"], ["tinggi", "4 cm"]), null);
  assert.match(datar(["bangun", "trapesium sama kaki"], ["AB", "14"], ["CD", "8"], ["AD", "5"], ["tinggi", "3 cm"])!, /tidak cocok: AD tertulis 5/);
  assert.match(datar(["bangun", "jajargenjang"], ["AB", "10"], ["AD", "4"], ["tinggi", "5"])!, /Tinggi jajargenjang/);
  assert.match(datar(["bangun", "segilima"])!, /tidak dikenal/);
  assert.match(datar(["AB", "5"])!, /Tulis baris "bangun"/);
  assert.match(datar(["bangun", "persegi"], ["sudut E", "90°"])!, /titik "E" tidak ada/);
  assert.match(datar(["bangun", "persegi"], ["AB", "أ"])!, /huruf Arab/);
  assert.match(datar(["bangun", "lingkaran"], ["juring", "60°"], ["diameter", "14"])!, /salah satu/);
  assert.equal(datar(["bangun", "segitiga"], ["titik", "P, Q, R"], ["PQ", "5"], ["sudut Q", "90°"], ["QR", "12"], ["PR", "13"]), null);
});

test("sudut: berpelurus, bertolak belakang, sejajar dicocokkan", () => {
  assert.match(sudut(["bentuk", "berpelurus"], ["sudut 1", "70°"], ["sudut 2", "100°"])!, /180°.*sudut 2 = 110°/);
  assert.equal(sudut(["bentuk", "bertolak belakang"], ["sudut 1", "70°"], ["sudut 3", "70°"], ["sudut 2", "110°"]), null);
  assert.match(sudut(["bentuk", "sejajar"], ["sudut A1", "65°"], ["sudut B1", "60°"])!, /sehadap/);
  assert.equal(sudut(["bentuk", "sejajar"], ["sudut A1", "65°"], ["sudut B3", "65°"], ["sudut B2", "115°"]), null);
  assert.match(sudut(["bentuk", "sejajar"], ["sudut C1", "65°"])!, /sudut A1/);
  assert.match(sudut(["bentuk", "berpenyiku"], ["sudut 1", "95°"])!, /kurang dari 90°/);
});

test("penanda & contoh abu-abu mengikuti bangun yang diketik", () => {
  const p = bacaPenanda("[[GEOMETRI datar: Segitiga ABC]]")!;
  assert.deepEqual(p, { jenis: "datar", judul: "Segitiga ABC" });
  assert.equal(tulisPenanda(p), "[[GEOMETRI datar: Segitiga ABC]]");
  assert.equal(contohBangun([K, ["bangun", "Persegi Panjang"]], "datar"), CONTOH_BANGUN["persegi panjang"]);
  const t = isiTampil([["", ""], ["bangun", "lingkaran"], ["", ""], ["", ""]], "datar");
  assert.deepEqual(t[2], CONTOH_BANGUN.lingkaran[2]);
  assert.equal(alasanBangun(t, "datar"), null);
});
