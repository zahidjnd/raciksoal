import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanSkema, ATURAN_SKEMA, konfigurasiBohr, svgSkema } from "./skema.ts";
import { bacaPenanda, tulisPenanda } from "./grafik.ts";
import { periksaGrafik } from "./soal.ts";

const K = ["Bagian", "Isi"];
const cek = (jenis: "listrik" | "atom" | "jaring", ...b: string[][]) => alasanSkema([K, ...b], jenis);

test("contoh sah & tergambar; penanda SKEMA", () => {
  for (const j of ["listrik", "atom", "jaring"] as const) {
    assert.equal(alasanSkema(ATURAN_SKEMA[j].contoh, j), null, j);
    assert.match(svgSkema(ATURAN_SKEMA[j].contoh, j, "J")!, /^<svg[\s\S]*<\/svg>$/, j);
  }
  const p = bacaPenanda("[[SKEMA listrik: Rangkaian]]")!;
  assert.deepEqual(p, { jenis: "listrik", judul: "Rangkaian" });
  assert.equal(tulisPenanda(p), "[[SKEMA listrik: Rangkaian]]");
  assert.match(periksaGrafik({ pertanyaan: "x", pembahasan: "", pilihan: ["[[SKEMA atom]]"] })[0], /pilihan/);
});

test("listrik: komponen, paralel, voltmeter", () => {
  assert.equal(cek("listrik", ["baterai", "6 V"], ["S", "terbuka"], ["L1", ""], ["paralel", "R1 = 2 Ω, R2, L2"], ["voltmeter", "R2"]), null);
  assert.match(cek("listrik", ["R1", "2 Ω"], ["R2", "3 Ω"])!, /baterai/);
  assert.match(cek("listrik", ["baterai", "6 V"], ["motor", "M"])!, /bukan nama komponen/);
  assert.match(cek("listrik", ["baterai", "6 V"], ["R1", "2"], ["R1", "3"])!, /dua kali/);
  assert.match(cek("listrik", ["baterai", "6 V"], ["paralel", "R1"])!, /2–4 cabang/);
  assert.match(cek("listrik", ["baterai", "6 V"], ["R1", "2"], ["voltmeter", "R9"])!, /tidak ada di rangkaian/);
  // rangkaian panjang: gambar melebar, tidak terpotong
  const svg = svgSkema([K, ["baterai", "6 V"], ...["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"].map((r) => [r, "10 Ω"]), ["voltmeter", "baterai"]], "listrik", "")!;
  assert.ok(Number(/width="(\d+)"/.exec(svg)![1]) >= 360);
});

test("atom: konfigurasi & pemeriksa", () => {
  assert.deepEqual(konfigurasiBohr(11), [2, 8, 1]);
  assert.deepEqual(konfigurasiBohr(20), [2, 8, 8, 2]);
  assert.equal(cek("atom", ["unsur", "Cl"], ["nomor atom", "17"]), null);
  assert.match(cek("atom", ["nomor atom", "11"], ["konfigurasi", "2 8 2"])!, /= 12, padahal nomor atom 11/);
  assert.match(cek("atom", ["konfigurasi", "3 8"])!, /Kulit K paling banyak berisi 2/);
  assert.match(cek("atom", ["konfigurasi", "2 8 9"])!, /terluar paling banyak 8/);
  assert.match(cek("atom", ["nomor atom", "35"])!, /lebih dari 20/);
  assert.equal(cek("atom", ["unsur", "Br"], ["nomor atom", "35"], ["konfigurasi", "2 8 18 7"]), null);
});

test("jaring: tingkat trofik & lingkaran makan-memakan", () => {
  assert.equal(cek("jaring", ["padi", "tikus"], ["tikus", "ular"], ["ular", "elang"]), null);
  assert.match(cek("jaring", ["a", "b"], ["b", "a"])!, /lingkaran makan-memakan/);
  assert.match(cek("jaring", ["rumput", "rumput"])!, /dirinya sendiri/);
  assert.match(cek("jaring", ["rumput", ""])!, /tulis pemakan/);
  assert.equal(cek("jaring", ["sawi", "ulat"], ["ulat", "burung"], ["burung", "-"]), null);
  const svg = svgSkema([K, ["rumput", "belalang, tikus"], ["belalang", "katak"], ["tikus", "ular"], ["katak", "ular"]], "jaring", "")!;
  // produsen paling bawah: y rumput > y ular
  const y = (n: string) => Number(new RegExp(`y="([\\d.]+)"[^>]*>${n}<`).exec(svg)![1]);
  assert.ok(y("rumput") > y("katak") && y("katak") > y("ular"));
});
