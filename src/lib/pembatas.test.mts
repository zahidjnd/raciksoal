import { test } from "node:test";
import assert from "node:assert/strict";
import { BATAS_NAMA, BATAS_PERANGKAT, buatPembatas, ipDari, LAMA_KUNCI } from "./pembatas.ts";

test("pembatas login: perangkat lain tidak ikut terkunci; kunci habis setelah 15 menit", () => {
  let jam = 0;
  const b = buatPembatas(() => jam);
  for (let i = 0; i < BATAS_PERANGKAT; i++) b.gagal("1.1.1.1", "guru.a");
  assert.equal(b.terkunci("1.1.1.1", "guru.a"), true);
  assert.equal(b.terkunci("2.2.2.2", "guru.a"), false); // guru tetap bisa masuk dari HP-nya
  jam += LAMA_KUNCI + 1;
  assert.equal(b.terkunci("1.1.1.1", "guru.a"), false);
});

test("pembatas login: tebakan dari banyak perangkat tetap mengunci nama itu", () => {
  const b = buatPembatas(() => 0);
  for (let i = 0; i < BATAS_NAMA; i++) b.gagal(`10.0.0.${i}`, "guru.b");
  assert.equal(b.terkunci("99.9.9.9", "guru.b"), true);
  assert.equal(b.terkunci("99.9.9.9", "guru.c"), false);
});

test("pembatas login: berhasil masuk menghapus catatan perangkat itu", () => {
  const b = buatPembatas(() => 0);
  for (let i = 0; i < BATAS_PERANGKAT - 1; i++) b.gagal("1.1.1.1", "guru.a");
  b.berhasil("1.1.1.1", "guru.a");
  b.gagal("1.1.1.1", "guru.a");
  assert.equal(b.terkunci("1.1.1.1", "guru.a"), false);
});

test("ipDari: ambil IP terakhir (dari proxy hosting), bukan yang bisa dipalsukan pengirim", () => {
  assert.equal(ipDari("6.6.6.6, 203.0.113.5"), "203.0.113.5");
  assert.equal(ipDari("203.0.113.5"), "203.0.113.5");
  assert.equal(ipDari(null), "?");
});
