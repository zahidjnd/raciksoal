import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanSkema, ATURAN_SKEMA, svgSkema } from "./skema.ts";
import { bacaPenanda, tulisPenanda } from "./grafik.ts";

const K = ["Bagian", "Isi"];
type J = "optik" | "gaya" | "katrol" | "tuas";
const cek = (j: J, ...b: string[][]) => alasanSkema([K, ...b], j);

test("contoh sah & tergambar; penanda SKEMA optik", () => {
  for (const j of ["optik", "gaya", "katrol", "tuas"] as const) {
    assert.equal(alasanSkema(ATURAN_SKEMA[j].contoh, j), null, j);
    assert.match(svgSkema(ATURAN_SKEMA[j].contoh, j, "J")!, /^<svg[\s\S]*<\/svg>$/, j);
  }
  const p = bacaPenanda("[[SKEMA optik: Lensa]]")!;
  assert.deepEqual(p, { jenis: "optik", judul: "Lensa" });
  assert.equal(tulisPenanda(p), "[[SKEMA optik: Lensa]]");
});

test("optik: rumus lensa & cermin dicocokkan", () => {
  const o = (...b: string[][]) => cek("optik", ...b);
  assert.equal(o(["alat", "lensa cembung"], ["fokus", "10 cm"], ["jarak benda", "15 cm"], ["jarak bayangan", "30 cm"]), null);
  assert.match(o(["alat", "lensa cembung"], ["fokus", "10 cm"], ["jarak benda", "15 cm"], ["jarak bayangan", "20 cm"])!, /= 30/);
  assert.equal(o(["alat", "cermin cekung"], ["fokus", "10 cm"], ["jarak benda", "30 cm"], ["tinggi benda", "4 cm"], ["tinggi bayangan", "2 cm"], ["perbesaran", "0,5 kali"]), null);
  assert.equal(o(["alat", "cermin cembung"], ["jari-jari", "20 cm"], ["jarak benda", "15 cm"], ["jarak bayangan", "-6 cm"]), null); // maya
  assert.equal(o(["alat", "cermin cembung"], ["fokus", "10"], ["jarak benda", "15"], ["jarak bayangan", "6 cm"]), null); // "6 cm di belakang cermin"
  assert.match(o(["alat", "lensa cembung"], ["fokus", "10"], ["jarak benda", "15"], ["jarak bayangan", "-30 cm"])!, /= 30/); // nyata, bukan minus
  assert.match(o(["alat", "cermin cembung"], ["fokus", "10"], ["jarak benda", "15"], ["jarak bayangan", "8 cm"])!, /maya/);
  assert.match(o(["alat", "lensa cembung"], ["fokus", "10"], ["jarak benda", "10"], ["jarak bayangan", "5"])!, /tak hingga/);
  assert.match(o(["alat", "kaca"], ["fokus", "10"])!, /tidak dikenal/);
  assert.match(o(["alat", "lensa cekung"], ["jarak benda", "10"])!, /fokus/);
  // bayangan disembunyikan: tanpa sinar (hanya garis sumbu, alat, benda)
  const svg = svgSkema([K, ["alat", "lensa cembung"], ["fokus", "10"], ["jarak benda", "15"], ["bayangan", "sembunyi"]], "optik", "")!;
  assert.doesNotMatch(svg, /bayangan/);
});

test("gaya, katrol, tuas", () => {
  assert.equal(cek("gaya", ["bidang", "datar"], ["F", "20 N, 37°"], ["f", "f"]), null);
  assert.match(cek("gaya", ["bidang", "miring 95°"], ["berat", "w"])!, /0° dan 90°/);
  assert.match(cek("gaya", ["bidang", "datar"], ["uraian", "ya"])!, /hanya untuk bidang miring/);
  assert.match(cek("katrol", ["bentuk", "meja"], ["m1", "2 kg"])!, /m2/);
  assert.match(cek("katrol", ["bentuk", "tetap"], ["m1", "2 kg"])!, /m2.*F/);
  assert.equal(cek("tuas", ["jenis", "1"], ["beban", "300 N"], ["kuasa", "100 N"], ["lengan beban", "0,5 m"], ["lengan kuasa", "1,5 m"]), null);
  assert.match(cek("tuas", ["jenis", "1"], ["beban", "300 N"], ["kuasa", "150 N"], ["lengan beban", "0,5 m"], ["lengan kuasa", "1,5 m"])!, /kuasa = 100/);
  assert.match(cek("tuas", ["jenis", "2"], ["lengan beban", "2 m"], ["lengan kuasa", "1 m"])!, /jenis 2/);
  // sekop jenis 3 dari uji DeepSeek: lengan kuasa dihitung 1,5 m > lengan beban 0,5 m → mustahil
  assert.match(cek("tuas", ["jenis", "3"], ["beban", "240 N"], ["kuasa", "80 N"], ["lengan beban", "0,5 m"], ["lengan kuasa", "?"])!, /jenis 3.*lengan kuasa 1,5/);
});
