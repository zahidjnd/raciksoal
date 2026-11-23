import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaRentang, rentang, tulisRentang } from "./halaman.ts";

test("rentang halaman PDF: baca & tulis bolak-balik", () => {
  assert.deepEqual(bacaRentang("3-5, 9", 100), [3, 4, 5, 9]);
  assert.deepEqual(bacaRentang("5–3; 4 sampai 6, x, 0, 200", 100), [3, 4, 5, 6]);
  assert.deepEqual(bacaRentang("98-105", 100), [98, 99, 100]);
  assert.equal(tulisRentang([...rentang(15, 30), ...rentang(70, 85), 90]), "15–30, 70–85, 90");
  assert.equal(tulisRentang([9, 3, 4, 3], "-"), "3-4, 9");
  assert.deepEqual(bacaRentang(tulisRentang(rentang(1, 7), "-"), 10), rentang(1, 7));
  assert.equal(tulisRentang([]), "");
});
