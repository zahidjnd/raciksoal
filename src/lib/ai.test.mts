import { test } from "node:test";
import assert from "node:assert/strict";
import { buangPagar } from "./ai.ts";

test("buangPagar: pembungkus ```json dibuang, JSON murni tidak berubah", () => {
  assert.equal(buangPagar('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(buangPagar('```\n{"a":"x ``` y"}\n```\n'), '{"a":"x ``` y"}');
  assert.equal(buangPagar('  {"a":1} '), '{"a":1}');
  assert.equal(buangPagar('{"kode":"```"}'), '{"kode":"```"}');
});
