import { test } from "node:test";
import assert from "node:assert/strict";
import { daftarSapaan, pilihSapaan } from "./sapaan.ts";

// Waktu WIB = UTC+7. Jumat 7 Nov 2026 07.00 WIB = 00.00 UTC.
const wib = (iso: string) => new Date(`${iso}+07:00`);

test("sapaan: mengikuti waktu WIB, hari, dan musim ujian; nama depan saja", () => {
  const jumatPagi = daftarSapaan(wib("2026-11-06T07:00:00"));
  assert.ok(jumatPagi.includes("Selamat pagi, {n}") && jumatPagi.includes("Jumat berkah, {n}") && jumatPagi.includes("Musim ASAS tiba, siap meracik, {n}?"));
  assert.ok(!jumatPagi.includes("Selamat malam, {n}"));
  const seninMalam = daftarSapaan(wib("2026-08-10T21:30:00"));
  assert.ok(seninMalam.includes("Selamat malam, {n}") && seninMalam.includes("Senin semangat, {n}!") && !seninMalam.some((s) => s.includes("ASAS")));
  assert.ok(daftarSapaan(wib("2026-08-08T16:00:00")).includes("Akhir pekan pun tetap berkarya, {n}")); // Sabtu sore
  assert.ok(daftarSapaan(wib("2026-08-11T03:00:00")).includes("Selamat malam, {n}")); // dini hari = malam
  assert.ok(daftarSapaan(wib("2026-08-11T12:00:00")).includes("Selamat siang, {n}"));
  assert.ok(!daftarSapaan(wib("2026-08-11T12:00:00")).some((s) => s.includes("Dapur soal"))); // dicoret pemilik
  assert.equal(pilihSapaan("Zahid Jundullah", wib("2026-08-11T12:00:00"), () => 0), "Assalamu'alaikum, Zahid");
  assert.equal(pilihSapaan("  ", wib("2026-08-11T12:00:00"), () => 0), "Assalamu'alaikum, Bapak/Ibu");
  assert.ok(pilihSapaan("Zahid", wib("2026-08-11T12:00:00"), () => 0.9999).includes("Zahid")); // sapaan terakhir di daftar
});
