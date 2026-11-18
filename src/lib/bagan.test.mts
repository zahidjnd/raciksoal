import { test } from "node:test";
import assert from "node:assert/strict";
import { alasanBagan, ATURAN_BAGAN, bungkus, svgBagan } from "./bagan.ts";
import { bacaPenanda, isiTampil, svgGrafik, tulisPenanda } from "./grafik.ts";
import { pecahBaris, periksaGrafik } from "./soal.ts";

const POHON = [["Bagian", "Induk"], ["Kalimat", ""], ["Isim", "Kalimat"], ["Fi'il", "Kalimat"], ["Huruf", "Kalimat"]];

test("penanda BAGAN dibaca & ditulis ulang dengan kata BAGAN", () => {
  const p = bacaPenanda("[[BAGAN pohon: Pembagian Kalimat]]")!;
  assert.deepEqual(p, { jenis: "pohon", judul: "Pembagian Kalimat" });
  assert.equal(tulisPenanda(p), "[[BAGAN pohon: Pembagian Kalimat]]");
  assert.equal(tulisPenanda({ jenis: "batang", judul: "" }), "[[GRAFIK batang]]");
  // tabel satu kolom (alur) tetap terbaca sebagai tabel bergrafik
  const b = pecahBaris("[[BAGAN alur]]\n| Langkah |\n|---|\n| Niat |\n| Membasuh muka |");
  assert.deepEqual(b[0].tabel, [["Langkah"], ["Niat"], ["Membasuh muka"]]);
});

test("alasanBagan: kolom, baris, kosong, Arab, panjang, pohon", () => {
  for (const j of ["waktu", "alur", "siklus", "pohon"] as const) assert.equal(alasanBagan(ATURAN_BAGAN[j].contoh, j), null, `contoh ${j} sah`);
  assert.match(alasanBagan([["A", "B"], ["x", "y"], ["z", "w"]], "alur")!, /tepat 1 kolom/);
  assert.match(alasanBagan([["T"], ["a"], ["b"]], "siklus")!, /Isi 3–8 baris/);
  assert.match(alasanBagan([["T"], ["a"], [""]], "alur")!, /Baris 2 kolom 1 masih kosong/);
  assert.match(alasanBagan([["T"], ["كلمة"], ["b"]], "alur")!, /huruf Arab/);
  assert.match(alasanBagan([["T", "P"], ["1", "x".repeat(121)], ["2", "y"]], "waktu")!, /terlalu panjang/);
  assert.match(alasanBagan([["N", "I"], ["A", ""], ["B", ""]], "pohon")!, /tepat satu kotak puncak/);
  assert.match(alasanBagan([["N", "I"], ["A", ""], ["B", "C"]], "pohon")!, /Induk "C"/);
  assert.match(alasanBagan([["N", "I"], ["A", ""], ["A", "A"]], "pohon")!, /dua kali/);
  assert.match(alasanBagan([["N", "I"], ["A", ""], ["B", "C"], ["C", "B"]], "pohon")!, /berputar/);
  assert.match(alasanBagan([["N", "I"], ["A", ""], ["B", "A"], ["C", "B"], ["D", "C"], ["E", "D"]], "pohon")!, /4 tingkat/);
});

test("svgBagan: 4 jenis tergambar, teks di-escape; pohon lebar → mendatar", () => {
  const waktu = svgBagan([["Tahun", "Peristiwa"], ["622 M", "Hijrah <Madinah> & sekitarnya"], ["624 M", "Badar"]], "waktu", "Sirah")!;
  assert.equal(waktu.match(/<circle /g)!.length, 2);
  assert.match(waktu, /Hijrah &lt;Madinah&gt; &amp;/);
  const alur = svgBagan(ATURAN_BAGAN.alur.contoh, "alur", "")!;
  assert.equal(alur.match(/<polygon /g)!.length, 4, "5 kotak = 4 panah");
  const siklus = svgBagan(ATURAN_BAGAN.siklus.contoh, "siklus", "")!;
  assert.equal(siklus.match(/<polygon /g)!.length, 4, "siklus: panah terakhir kembali ke awal");
  const pohon = svgBagan(POHON, "pohon", "")!;
  assert.equal(pohon.match(/<rect [^>]*rx="4"/g)!.length, 4);
  const lebar = [["N", "I"], ["Hewan", ""], ...["A", "B", "C", "D", "E"].map((x) => [x, "Hewan"])];
  const mendatar = svgBagan(lebar, "pohon", "")!;
  assert.match(mendatar, /width="360"/, "5 ujung: digambar mendatar, tetap selebar 360");
  assert.equal(svgGrafik(POHON, { jenis: "pohon", judul: "" }), svgBagan(POHON, "pohon", ""), "svgGrafik meneruskan bagan");
});

test("bungkus & isiTampil pohon; periksaGrafik mengenali BAGAN", () => {
  assert.deepEqual(bungkus("Membasuh kedua tangan sampai siku", 15), ["Membasuh kedua", "tangan sampai", "siku"]);
  assert.deepEqual(bungkus("abcdefghij", 4), ["abcd", "efgh", "ij"]);
  // nama puncak diganti guru, baris lain masih kosong → contoh menunjuk puncak baru
  const t = isiTampil([["", ""], ["Hewan", ""], ["", ""], ["", ""]], "pohon");
  assert.deepEqual(t.map((b) => b[1]), ["Induk", "", "Hewan", "Hewan"]);
  assert.equal(alasanBagan(t, "pohon"), null);
  assert.match(periksaGrafik({ pertanyaan: "[[BAGAN alur]]\n| L |\n| a |\n| ب |", pembahasan: "" })[0], /huruf Arab/);
  assert.match(periksaGrafik({ pertanyaan: "x", pembahasan: "", pilihan: ["[[BAGAN alur]]"] })[0], /pilihan/);
});
