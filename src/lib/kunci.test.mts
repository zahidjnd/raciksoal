import { test } from "node:test";
import assert from "node:assert/strict";
import { kunciRingkas } from "./kunci.ts";
import type { Soal } from "./soal.ts";

const s = (x: Partial<Soal>) => ({ dalil_id: null, pertanyaan: "?", pembahasan: "", level: "C1", tp: "TP 1", skor: 1, ...x }) as Soal;

test("kunciRingkas: PG sebaris, bentuk lain per nomor, nomor global ikut urutan set", () => {
  const teks = kunciRingkas(
    [
      s({ bentuk: "PG", kunci: "A" }),
      s({ bentuk: "PG", kunci: "C" }),
      s({ bentuk: "PGK", kunci: ["A", "D"] }),
      s({ bentuk: "BS", kunci: ["Benar", "Salah", "Benar", "Salah"], pernyataan: ["a", "b", "c", "d"], label: ["Benar", "Salah"] }),
      s({ bentuk: "MJ", kunci: ["B", "A", "E", "C", "D"] }),
      s({ bentuk: "ISIAN", kunci: "Madinah" }),
      s({ bentuk: "URAIAN", kunci: "panjang" }),
    ],
    "Bab 3",
  );
  assert.equal(
    teks,
    [
      "Kunci jawaban: Bab 3",
      "",
      "Pilihan Ganda: 1. A  2. C",
      "Pilihan Ganda Kompleks:",
      "  3. A, D",
      "Kategori (Benar/Salah):",
      "  4. Benar, Salah, Benar, Salah",
      "Menjodohkan:",
      "  5. 1-B 2-A 3-E 4-C 5-D",
      "Isian Singkat:",
      "  6. Madinah",
      "Uraian:",
      "  7. (uraian, lihat rubrik)",
    ].join("\n"),
  );
});
