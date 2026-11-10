import { test } from "node:test";
import assert from "node:assert/strict";
import { betulkanGarisMiring, buangPagar } from "./ai.ts";

test("buangPagar: pembungkus ```json dibuang, JSON murni tidak berubah", () => {
  assert.equal(buangPagar('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(buangPagar('```\n{"a":"x ``` y"}\n```\n'), '{"a":"x ``` y"}');
  assert.equal(buangPagar('  {"a":1} '), '{"a":1}');
  assert.equal(buangPagar('{"kode":"```"}'), '{"kode":"```"}');
});

test("betulkanGarisMiring: \ di rumus $...$ digandakan, escape JSON di luar rumus tetap", () => {
  const p = (t: string) => JSON.parse(betulkanGarisMiring(t));
  // AI lupa menggandakan: \frac (form-feed), \times (tab), \neq (baris baru), \sqrt (escape tidak sah)
  assert.deepEqual(p(String.raw`{"a":"Jika $v = \frac{s}{t} \times 2$ dan $x \neq \sqrt{4}$\nmaka"}`), { a: String.raw`Jika $v = \frac{s}{t} \times 2$ dan $x \neq \sqrt{4}$` + "\nmaka" });
  // sudah benar (\frac) tidak berubah
  assert.deepEqual(p(String.raw`{"a":"$\frac{1}{2}$","b":["$5$","$\alpha$"]}`), { a: String.raw`$\frac{1}{2}$`, b: ["$5$", String.raw`$\alpha$`] });
  // \alpha di luar $ (escape tidak sah) tidak membuat JSON rusak; "US$ 5" bukan rumus
  assert.deepEqual(p(String.raw`{"a":"\alpha US$ 5 dan US$ 10\t."}`), { a: String.raw`\alpha US$ 5 dan US$ 10` + "\t." });
  assert.deepEqual(p('{"a":"\u00e9"}'), { a: "é" });
});
