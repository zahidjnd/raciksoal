import { test } from "node:test";
import assert from "node:assert/strict";
import { susunPaket } from "./paket.ts";
import type { Soal } from "./soal.ts";

const HURUF = "ABCDE";
const pg = (n: number, kunci = "B"): Soal =>
  ({ bentuk: "PG", dalil_id: null, pertanyaan: `PG ${n}`, pilihan: ["a", "b", "c", "d", "e"].map((x) => `${x}${n}`), kunci, pembahasan: "", level: "C1", tp: "TP 1", skor: 2 }) as Soal;
const set: Soal[] = [
  ...Array.from({ length: 8 }, (_, i) => pg(i + 1, HURUF[i % 5])),
  { ...pg(9), pilihan: ["10", "20", "30", "40", "50"], kunci: "C" },
  { bentuk: "PGK", dalil_id: null, pertanyaan: "PGK 1", pilihan: ["p", "q", "r", "s", "t"], kunci: ["A", "D"], pembahasan: "", level: "C2", tp: "TP 1", skor: 5 } as Soal,
  { bentuk: "PGK", dalil_id: null, pertanyaan: "Grup 1a", grup: 1, wacana: "W", pilihan: ["1", "2", "3", "4", "5"].map((x) => `g${x}`), kunci: ["B", "C"], pembahasan: "", level: "C2", tp: "TP 1", skor: 5 } as Soal,
  { bentuk: "PGK", dalil_id: null, pertanyaan: "Grup 1b", grup: 1, wacana: "W", pilihan: ["6", "7", "8", "9", "0"].map((x) => `g${x}`), kunci: ["A", "E"], pembahasan: "", level: "C2", tp: "TP 1", skor: 5 } as Soal,
  { bentuk: "PGK", dalil_id: null, pertanyaan: "PGK 2", pilihan: ["v", "w", "x", "y", "z"], kunci: ["C", "E"], pembahasan: "", level: "C2", tp: "TP 1", skor: 5 } as Soal,
  { bentuk: "MJ", dalil_id: null, pertanyaan: "Jodohkan", premis: ["p1", "p2", "p3", "p4", "p5"], jawaban: ["j3", "j1", "jx", "j5", "j2", "j4"], kunci: ["B", "E", "A", "F", "D"], pembahasan: "", level: "C1", tp: "TP 1", skor: 5 } as Soal,
  { bentuk: "URAIAN", dalil_id: null, pertanyaan: "Uraian", kunci: "panjang", pembahasan: "", level: "C4", tp: "TP 1", skor: 8 } as Soal,
];
// Isi yang ditunjuk kunci (bukan hurufnya): harus sama antara paket. MJ: urut per premis; PG/PGK: himpunan isi.
const isiKunci = (s: Soal) => {
  const k = [s.kunci].flat().map(String);
  if (s.bentuk === "MJ") return k.map((h) => s.jawaban!["ABCDEF".indexOf(h)]);
  if (!s.pilihan) return k;
  return k.map((h) => s.pilihan![HURUF.indexOf(h)]).sort();
};

test("paket A = urutan asli, tidak diubah", () => {
  const a = susunPaket(set, 51, "A");
  assert.deepEqual(a.soal, set);
  assert.deepEqual(a.asal, set.map((_, i) => i));
});

test("paket B: tetap (seed), bagian bentuk utuh, soal sama, kunci tetap menunjuk isi yang sama", () => {
  const b1 = susunPaket(set, 51, "B");
  const b2 = susunPaket(set, 51, "B");
  assert.deepEqual(b1, b2); // diunduh berkali-kali hasilnya sama
  assert.notDeepEqual(b1.asal, set.map((_, i) => i)); // urutan benar-benar berubah
  assert.notDeepEqual(susunPaket(set, 51, "C").asal, b1.asal); // paket lain, urutan lain
  assert.deepEqual(b1.soal.map((s) => s.bentuk), set.map((s) => s.bentuk)); // urutan bagian tidak berubah
  assert.deepEqual([...b1.asal].sort((x, y) => x - y), set.map((_, i) => i)); // tiap soal muncul tepat sekali
  b1.soal.forEach((s, i) => {
    const lama = set[b1.asal[i]];
    assert.equal(s.pertanyaan, lama.pertanyaan);
    assert.deepEqual(isiKunci(s), isiKunci(lama), `kunci soal "${s.pertanyaan}" berubah isi`);
  });
  assert.deepEqual(set[0].pilihan, ["a1", "b1", "c1", "d1", "e1"]); // soal asli tidak ikut berubah
});

test("paket B: pilihan angka tetap urut; soal grup tetap berdampingan dan urutannya terjaga", () => {
  const b = susunPaket(set, 51, "B");
  assert.deepEqual(b.soal.find((s) => s.pilihan?.[0] === "10")?.pilihan, ["10", "20", "30", "40", "50"]);
  const ia = b.soal.findIndex((s) => s.pertanyaan === "Grup 1a");
  assert.equal(b.soal[ia + 1].pertanyaan, "Grup 1b");
  for (const id of [1, 7, 99, 1234]) {
    const x = susunPaket(set, id, "D");
    const j = x.soal.findIndex((s) => s.pertanyaan === "Grup 1a");
    assert.equal(x.soal[j + 1].pertanyaan, "Grup 1b", `set ${id}`);
  }
});
