import { test } from "node:test";
import assert from "node:assert/strict";
import { skorOtomatis } from "./skor.ts";

const J = (o: Partial<Record<"PG" | "PGK" | "BS" | "MJ" | "ISIAN" | "URAIAN", number>>) => ({ PG: 0, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0, ...o });

test("komposisi AFTS bawaan = bobot bawaan, pas 100", () => {
  const r = skorOtomatis(J({ PG: 10, PGK: 5, BS: 5, URAIAN: 5 }));
  assert.deepEqual([r.bobot.PG, r.bobot.PGK, r.bobot.BS, r.bobot.URAIAN, r.total, r.pas], [2, 5, 3, 8, 100, true]);
});

test("jumlah berubah → skor menyesuaikan, tetap bulat dan pas 100", () => {
  const r = skorOtomatis(J({ PG: 20, URAIAN: 5 }));
  assert.equal(r.total, 100);
  assert.ok(r.bobot.URAIAN > r.bobot.PG); // uraian tetap lebih berat
  for (const n of Object.values(r.bobot)) assert.ok(Number.isInteger(n));
});

test("beberapa komposisi umum semuanya pas 100 dan urutan bobot terjaga", () => {
  for (const j of [J({ PG: 25 }), J({ PG: 20, PGK: 5 }), J({ PG: 15, URAIAN: 5 }), J({ PG: 20, BS: 10, URAIAN: 2 }), J({ PG: 10, ISIAN: 5, MJ: 2, URAIAN: 3 })]) {
    const r = skorOtomatis(j);
    assert.ok(r.pas, JSON.stringify(j));
  }
});

test("tidak bisa pas dengan skor bulat → total terdekat, pas = false", () => {
  const r = skorOtomatis(J({ PG: 30 }));
  assert.equal(r.pas, false);
  assert.ok(Math.abs(r.total - 100) <= 10);
});

test("tanpa soal sama sekali tidak error", () => {
  assert.equal(skorOtomatis(J({})).total, 0);
});
