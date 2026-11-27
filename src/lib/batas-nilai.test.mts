import { test } from "node:test";
import assert from "node:assert/strict";
import { BEBAS, dihentikan, gabungBatas, NORMAL, pesanBatas, rapikanBawaan, rapikanKhusus, sampaiDari } from "./batas-nilai.ts";

test("bawaan rusak/kosong → NORMAL; angka sah dipakai; rem terbaca", () => {
  assert.deepEqual({ ...rapikanBawaan(null), rem: undefined, remPesan: undefined }, { ...NORMAL, rem: undefined, remPesan: undefined });
  const b = rapikanBawaan({ set: 3, bulan: "banyak", rem: true, remPesan: "x" });
  assert.equal(b.set, 3);
  assert.equal(b.bulan, NORMAL.bulan);
  assert.equal(b.rem, true);
});

test("tiga lapis: khusus mengalahkan bawaan, -1 = tanpa batas, kedaluwarsa kembali ke bawaan", () => {
  const sekarang = new Date("2026-11-27T05:00:00Z");
  const k = rapikanKhusus({ set: 0, ubah: BEBAS, analisa: -5, halaman: 1.5 }); // -5 & 1.5 tidak sah → diabaikan
  assert.deepEqual(k, { set: 0, ubah: BEBAS });
  const a = gabungBatas(NORMAL, k, null, sekarang);
  assert.equal(a.angka.set, 0);
  assert.equal(a.angka.ubah, Infinity);
  assert.equal(a.angka.analisa, NORMAL.analisa); // tidak diisi → ikut bawaan
  assert.equal(a.khusus, true);
  const lewat = gabungBatas(NORMAL, k, new Date("2026-11-26T00:00:00Z"), sekarang);
  assert.equal(lewat.angka.set, NORMAL.set);
  assert.equal(lewat.khusus, false);
  assert.equal(gabungBatas(NORMAL, {}, null, sekarang).khusus, false);
});

test("Stop = semua 0; pesan habis/dihentikan; tanpa batas tak pernah ditolak", () => {
  const stop = gabungBatas(NORMAL, rapikanKhusus({ set: 0, bulan: 0, ubah: 0, analisa: 0, halaman: 0 }), null).angka;
  assert.equal(dihentikan(stop), true);
  assert.match(pesanBatas("set", 0, 0, true)!, /dihentikan admin/);
  assert.match(pesanBatas("set", 10, 10, false)!, /habis/);
  assert.equal(pesanBatas("set", 10, 9, false), null);
  assert.equal(pesanBatas("set", Infinity, 9999, false), null);
  assert.match(pesanBatas("halaman", 5, 5, false)!, /teks PDF biasa/);
});

test("sampaiDari: 'hari' = 00.00 WIB berikutnya (17.00 UTC), 7 = akhir hari ke-7, selamanya = null", () => {
  const s = new Date("2026-11-27T05:00:00Z"); // 12.00 WIB
  assert.equal(sampaiDari("hari", s)!.toISOString(), "2026-11-27T17:00:00.000Z");
  assert.equal(sampaiDari("7", s)!.toISOString(), "2026-12-03T17:00:00.000Z");
  assert.equal(sampaiDari("selamanya", s), null);
  const malam = new Date("2026-11-27T17:30:00Z"); // 00.30 WIB tanggal 28
  assert.equal(sampaiDari("hari", malam)!.toISOString(), "2026-11-28T17:00:00.000Z");
});
