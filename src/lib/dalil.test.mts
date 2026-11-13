// Ayat & hadis di soal (0.42.0, ATURAN-SOAL 5a): rencana nomor berdalil, cara tampil, pemeriksa, terjemah Kemenag.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bagianUrutan, caraDalil, cocokCara, dalilKunci, korpusArab, pasangDalil, periksaSoal, RUMPANG, samakanDenganKisi, susunPilihanDalil, tampilanDalil, type Bab, type BarisKisi, type Soal } from "./soal.ts";
import { bersihkanPengaturan, buatPermintaanKisi, buatSistem, rencanaDalil, type Pengaturan } from "./prompt.ts";
import { bacaTerjemah, lengkapiTerjemah, terjemahAyat } from "./mushaf.ts";

const bab: Bab = JSON.parse(readFileSync(new URL("../data/qurdis11-bab3.json", import.meta.url), "utf8"));
const p = (jumlah: Partial<Pengaturan["jumlah"]>, porsiDalil?: Pengaturan["porsiDalil"]): Pengaturan => ({
  babId: "materi-1", tujuan: "Ulangan Harian", jumlah: { PG: 0, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0, ...jumlah }, level: { LOTS: 40, MOTS: 40, HOTS: 20 }, kesulitan: "Sedang", porsiDalil,
});
const soal = (x: Partial<Soal>): Soal => ({ bentuk: "PG", dalil_id: null, pertanyaan: "Perhatikan firman Allah Swt. berikut! Isi kandungannya adalah ....", pilihan: ["a", "b", "c", "d", "e"], kunci: "A", pembahasan: "", level: "C2", tp: "TP 1", skor: 1, ...x });

test("rencana dalil: porsi dari nomor non-menjodohkan, tersebar, cara digilir, set lama/tanpa dalil kosong", () => {
  const r = rencanaDalil(p({ PG: 20, MJ: 5 }, "sedang"), bab);
  assert.equal(r.length, 25);
  assert.equal(r.filter(Boolean).length, 6); // 30% dari 20 PG
  assert.ok(r.slice(20).every((c) => c === null)); // menjodohkan tanpa dalil
  assert.deepEqual(r.filter(Boolean).slice(0, 4), ["utuh", "rumpang", "terjemah", "pilihan"]);
  // cara PG (rumpang, pilihan, urutan) tidak jatuh ke nomor bukan PG
  const campur = rencanaDalil(p({ PG: 4, URAIAN: 6 }, "banyak"), bab);
  campur.forEach((c, i) => i >= 4 && assert.ok(!c || !["rumpang", "rumpang-terjemah", "pilihan", "pilihan-terjemah", "urutan"].includes(c), `${i} ${c}`));
  assert.equal(rencanaDalil(p({ PG: 20 }, "banyak"), bab).filter(Boolean).length, 10);
  assert.ok(rencanaDalil(p({ PG: 20 }, "tanpa"), bab).every((c) => c === null));
  assert.ok(rencanaDalil(p({ PG: 20 }), bab).every((c) => c === null)); // set lama tanpa porsi
  assert.ok(rencanaDalil(p({ PG: 20 }, "sedang"), { dalil: [] }).every((c) => c === null));
  // maks 3 nomor per dalil
  assert.equal(rencanaDalil(p({ PG: 40 }, "banyak"), { dalil: bab.dalil.slice(0, 1) }).filter(Boolean).length, 3);
  assert.equal(bersihkanPengaturan({ ...p({ PG: 5 }), babIds: ["materi-1"] } as Pengaturan) instanceof Object && (bersihkanPengaturan({ ...p({ PG: 5 }), babIds: ["materi-1"] }) as Pengaturan).porsiDalil, "sedang");
  assert.match(buatPermintaanKisi(p({ PG: 10 }, "sedang"), bab), /DALIL \(utuh\)/);
  assert.match(buatSistem(bab), /Kata Arab bernomor: 1 /);
});

test("pasang dalil: nomor berdalil wajib berdalil, lainnya tanpa dalil, cara tidak cocok → Arab saja", () => {
  const kisi = [{ dalil_id: "nur-2" }, { dalil_id: null }, { dalil_id: "isra-32" }, { dalil_id: "isra-32" }].map((k, i) => ({ no: i + 1, bentuk: "PG", tp: "TP 1", materi: "", indikator: "", level: "C2", stimulus: "", ...k }) as BarisKisi);
  const tanpaTerjemah = { ...bab, dalil: bab.dalil.map((d) => (d.id === "isra-32" ? { ...d, terjemah: "" } : d)) };
  const r = pasangDalil(kisi, ["utuh", "arab", null, "terjemah"], tanpaTerjemah);
  assert.deepEqual(r.map((k) => [k.dalil_id, k.dalil_tampil]), [["nur-2", "utuh"], [r[1].dalil_id, "arab"], [null, null], ["isra-32", "arab"]]);
  assert.ok(r[1].dalil_id && r[1].dalil_id !== "nur-2"); // AI lupa: diisi dalil yang belum dipakai
  // Ada catatan guru (mis. "tanpa teks Arab"): nomor yang sengaja dikosongkan AI dibiarkan
  assert.equal(pasangDalil(kisi, ["utuh", "arab", null, null], bab, true)[1].dalil_id, null);
  // Soal mengikuti rencana kisi; potongan AI dipertahankan hanya untuk cara potongan
  const s = samakanDenganKisi(soal({ dalil_id: "isra-32", dalil_tampil: "utuh", dalil_potong: [1, 2] }), { ...kisi[0], dalil_tampil: "potong" });
  assert.deepEqual([s.dalil_id, s.dalil_tampil, s.dalil_potong], ["nur-2", "potong", [1, 2]]);
  assert.equal(samakanDenganKisi(soal({ dalil_id: "isra-32" }), { ...kisi[1], dalil_id: null, dalil_tampil: null }).dalil_id, null);
});

test("tampilan dalil: Arab/terjemah/potongan dari data, sumber disembunyikan bila ditanyakan", () => {
  const isra = bab.dalil.find((d) => d.id === "isra-32")!;
  const t = (x: Partial<Soal>) => tampilanDalil(soal({ dalil_id: "isra-32", ...x }), bab);
  assert.deepEqual(t({}), { arab: isra.arab, sumber: isra.sumber, bukan: false }); // soal lama: Arab saja
  assert.equal(t({ dalil_tampil: "utuh" })!.terjemah, isra.terjemah);
  assert.equal(t({ dalil_tampil: "terjemah" })!.arab, undefined);
  assert.equal(t({ dalil_tampil: "potong", dalil_potong: [1, 3] })!.arab, isra.arab.split(/\s+/).slice(0, 3).join(" "));
  assert.equal(t({ dalil_tampil: "potong-terjemah", dalil_potong: [2, 2] })!.terjemah, isra.terjemah.split(/\s+/)[1]);
  assert.equal(t({ dalil_tampil: "rujukan" }), null);
  assert.equal(t({ dalil_tampil: "pembahasan" }), null);
  // jawabannya nama surah → sumber tidak tampil di soal, tetapi ada di kunci
  const surah = { dalil_tampil: "arab" as const, pilihan: ["QS. Al-Isrā' [17]: 32", "QS. An-Nūr [24]: 2", "QS. Al-Baqarah [2]: 43", "QS. Luqmān [31]: 13", "QS. Al-Ḥujurāt [49]: 12"] };
  assert.equal(t(surah)!.sumber, undefined);
  assert.equal(dalilKunci(soal({ dalil_id: "isra-32", ...surah }), bab)!.sumber, isra.sumber);
  assert.equal(dalilKunci(soal({ dalil_id: "isra-32", dalil_tampil: "utuh" }), bab), null); // sudah utuh di soal
  assert.equal(dalilKunci(soal({ dalil_id: "isra-32" }), bab), null); // soal lama tidak berubah
  assert.ok(!cocokCara("rujukan", bab.dalil.find((d) => d.id === "hadis-iman")!)); // "nama sumber saja" hanya ayat
});

test("pemeriksa dalil: asal tempel, terjemah tidak tampil, dalil hilang, potongan tidak sah", () => {
  const w = (x: Partial<Soal>) => periksaSoal([soal(x)], bab)[0].peringatan!.join(" | ");
  assert.equal(w({ dalil_id: "isra-32", dalil_tampil: "utuh" }), "");
  assert.match(w({ dalil_id: "isra-32", dalil_tampil: "utuh", pertanyaan: "Menurut al-Lihyani, kata al-Qur'an berarti ...." }), /tidak membahasnya/);
  assert.equal(w({ dalil_id: "isra-32", pertanyaan: "Menurut al-Lihyani, kata al-Qur'an berarti ...." }), ""); // soal lama: tidak ditandai
  assert.match(w({ dalil_id: "isra-32", dalil_tampil: "arab", pertanyaan: "Berdasarkan terjemah ayat tersebut, ...." }), /terjemahnya tidak ditampilkan/);
  assert.match(w({ pertanyaan: "Perhatikan firman Allah Swt. berikut! Isinya ...." }), /tidak ada yang ditampilkan/);
  assert.match(w({ dalil_id: "isra-32", dalil_tampil: "potong", dalil_potong: [5, 99], pertanyaan: "Arti potongan ayat berikut adalah ...." }), /Potongan dalil belum sah/);
  assert.match(w({ dalil_id: "isra-32", dalil_tampil: "rujukan", pertanyaan: "Isi kandungan ayat tentang zina adalah ...." }), /tidak menyebut sumbernya/);
  assert.equal(w({ dalil_id: "isra-32", dalil_tampil: "rujukan", pertanyaan: "Isi kandungan QS. Al-Isrā' [17]: 32 adalah ...." }), "");
  assert.match(w({ dalil_id: "isra-32", dalil_tampil: "pembahasan", pertanyaan: "Perhatikan firman Allah berikut! ...." }), /tidak menampilkan teks/);
  assert.equal(periksaSoal([soal({ dalil_id: "isra-32", dalil_tampil: "aneh" as never })], bab)[0].dalil_tampil, null);
});

test("terjemah Kemenag: ayat utuh dari data, potongan & rujukan tak dikenal kosong, terjemah guru didahulukan", () => {
  const data = bacaTerjemah("2|43|Dan dirikanlah shalat, tunaikanlah zakat dan ruku'lah beserta orang-orang yang ruku'.\n2|44|Ayat empat puluh empat.\n");
  assert.equal(terjemahAyat("QS. Al-Baqarah [2]: 43", data), "Dan dirikanlah shalat, tunaikanlah zakat dan ruku'lah beserta orang-orang yang ruku'.");
  assert.equal(terjemahAyat("QS. Al-Baqarah [2]: 43-44", data), "Dan dirikanlah shalat, tunaikanlah zakat dan ruku'lah beserta orang-orang yang ruku'. Ayat empat puluh empat.");
  assert.equal(terjemahAyat("QS. Al-Baqarah [2]: 43 (potongan)", data), "");
  assert.equal(terjemahAyat("QS. Al-Baqarah [2]: 45", data), "");
  const b = lengkapiTerjemah({ ...bab, dalil: [
    { id: "a", sumber: "QS. Al-Baqarah [2]: 43", arab: "x", terjemah: "", mufradat: [], mushaf: true },
    { id: "b", sumber: "QS. Al-Baqarah [2]: 43", arab: "x", terjemah: "terjemah guru", mufradat: [], mushaf: true },
    { id: "c", sumber: "HR. Bukhari", arab: "x", terjemah: "", mufradat: [], kitab: true },
  ] }, data);
  assert.deepEqual(b.dalil.map((d) => [d.terjemah.slice(0, 10), !!d.terjemahKemenag]), [["Dan dirika", true], ["terjemah g", false], ["", false]]);
  // file asli Tanzil (6236 ayat)
  assert.match(terjemahAyat("QS. Al-Fātiḥah [1]: 2"), /Segala puji bagi Allah/);
});

test("tahap 2: rumpang, pilihan, urutan disusun aplikasi dari teks terverifikasi", () => {
  const isra = bab.dalil.find((d) => d.id === "isra-32")!;
  const kata = isra.arab.split(/\s+/);
  const acak = (() => { let x = 7; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); })();
  // Rumpang: kata 2–3 dikosongkan, pilihan = kunci + 4 potongan sepanjang 2 kata (pilihan AI dulu, sisanya otomatis)
  const rumpang = soal({ dalil_id: "isra-32", dalil_tampil: "rumpang", dalil_potong: [2, 3], pilihan: [], pertanyaan: "Lengkapilah potongan ayat berikut!", dalil_pengecoh: [{ dalil_id: "nur-2", potong: [1, 2] }, { dalil_id: "isra-32", potong: [2, 3] }] });
  assert.equal(tampilanDalil(rumpang, bab)!.arab, [kata[0], RUMPANG, ...kata.slice(3)].join(" "));
  const r = susunPilihanDalil(rumpang, bab, acak);
  assert.equal(r.pilihan!.length, 5);
  assert.equal(r.pilihan![["A", "B", "C", "D", "E"].indexOf(String(r.kunci))], kata.slice(1, 3).join(" "));
  assert.ok(r.pilihan!.includes(bab.dalil.find((d) => d.id === "nur-2")!.arab.split(/\s+/).slice(0, 2).join(" "))); // pengecoh pilihan AI
  assert.equal(new Set(r.pilihan).size, 5);
  assert.equal(r.dalil_pengecoh, undefined); // bahan saja, tidak disimpan
  assert.equal(periksaSoal([r], bab, undefined)[0].peringatan!.join(" | "), ""); // semua Arab pilihan terverifikasi
  // Kunci diubah tangan sehingga tidak cocok → ditandai
  assert.match(periksaSoal([{ ...r, kunci: r.kunci === "A" ? "B" : "A" }], bab)[0].peringatan!.join(), /belum tersusun dari dalil/);
  // Pilihan: tanpa kotak dalil; pilihan terjemah dari kata terjemah
  const pt = susunPilihanDalil(soal({ dalil_id: "isra-32", dalil_tampil: "pilihan-terjemah", dalil_potong: [1, 3], pilihan: [], pertanyaan: "Terjemah lafaz pembuka ayat tersebut adalah ...." }), bab, acak);
  assert.equal(tampilanDalil(pt, bab), null);
  assert.ok(pt.pilihan!.includes(isra.terjemah.split(/\s+/).slice(0, 3).join(" ")));
  // Urutan: 4 bagian diacak (tersimpan), pilihan berupa susunan label, kunci = susunan asli
  const u = susunPilihanDalil(soal({ dalil_id: "isra-32", dalil_tampil: "urutan", pilihan: [], pertanyaan: "Susunan potongan ayat berikut yang benar adalah ...." }), bab, acak);
  const b = bagianUrutan(u, isra)!;
  assert.equal(b.segmen.join(" "), isra.arab.split(/\s+/).join(" "));
  assert.ok(b.tampil.some((x, i) => x !== i));
  assert.deepEqual(tampilanDalil(u, bab)!.urutan, b.tampil.map((j) => b.segmen[j]));
  const benar = b.segmen.map((_, i) => `(${b.tampil.indexOf(i) + 1})`).join(" – ");
  assert.equal(u.pilihan![["A", "B", "C", "D", "E"].indexOf(String(u.kunci))], benar);
  assert.equal(periksaSoal([u], bab)[0].peringatan!.join(" | "), "");
  // Bukan PG: cara PG diganti cara biasa
  assert.equal(caraDalil({ bentuk: "URAIAN", dalil_tampil: "rumpang" }, isra), "potong");
  assert.equal(susunPilihanDalil(soal({ bentuk: "URAIAN", dalil_id: "isra-32", dalil_tampil: "pilihan", dalil_potong: [1, 2] }), bab).pilihan!.length, 5); // tidak disentuh
  // Bahan tidak cukup (kunci = seluruh satu-satunya dalil) → apa adanya
  const satu = { dalil: [isra] };
  const x = soal({ dalil_id: "isra-32", dalil_tampil: "pilihan", dalil_potong: [1, kata.length], pilihan: [] });
  assert.equal(susunPilihanDalil(x, satu), x);
  assert.ok(korpusArab(bab).length > 0);
});

test("tahap 2: pengecoh yang sama dengan kunci (beda awalan/harakat saja) ditolak", () => {
  const a = { id: "a", sumber: "QS. A", arab: "وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ", terjemah: "", mufradat: [], mushaf: true };
  const b = { id: "b", sumber: "QS. B", arab: "الْفُرْقَانَ عَلَىٰ عَبْدِهِ لِيَكُونَ لِلْعَالَمِينَ نَذِيرًا", terjemah: "", mufradat: [], mushaf: true };
  const s = susunPilihanDalil(soal({ dalil_id: "a", dalil_tampil: "pilihan", dalil_potong: [4, 4], pilihan: [], pertanyaan: "Lafaz yang berarti pembeda adalah ....", dalil_pengecoh: [{ dalil_id: "b", potong: [1, 1] }] }), { dalil: [a, b] });
  assert.equal(s.pilihan!.length, 5);
  assert.ok(!s.pilihan!.includes("الْفُرْقَانَ"), s.pilihan!.join(" | "));
});
