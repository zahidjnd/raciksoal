import { test } from "node:test";
import assert from "node:assert/strict";
import { formulir, hitungOptik, punyaFormulir, type Baris, type Isian } from "./formulir.ts";
import { alasanGrafik, ATURAN_GRAFIK, type JenisGrafik } from "./grafik.ts";

const JENIS = ["datar", "ruang", "sudut", "optik", "gaya", "katrol", "tuas", "atom", "arah", "langit", "ekonomi", "lapisan", "shaf"] as JenisGrafik[];
const K = ["Bagian", "Isi"];
const badan = (j: JenisGrafik): Baris[] => ATURAN_GRAFIK[j].contoh.slice(1).map((b) => [b[0], b[1] ?? ""]);
const alasan = (j: JenisGrafik, b: Baris[]) => alasanGrafik([K, ...b], j);
/** Semua isian, termasuk yang di dalam kelompok. */
const rata = (xs: Isian[]): Isian[] => xs.flatMap((x) => (x.t === "kelompok" ? [x, ...rata(x.isian)] : [x]));

test("13 jenis punya formulir; contoh terbaca habis (tanpa baris sisa)", () => {
  for (const j of JENIS) {
    assert.ok(punyaFormulir(j), j);
    const f = formulir(j, badan(j))!;
    assert.deepEqual(f.sisa, [], `${j}: baris tak dikenal ${f.sisa.map((i) => badan(j)[i].join(" | "))}`);
    assert.ok(f.isian.length > 0, j);
  }
  assert.equal(punyaFormulir("batang"), false);
});

test("setiap pilihan di setiap formulir menghasilkan tabel yang bisa digambar", () => {
  for (const j of JENIS) {
    const awal = badan(j);
    const f = formulir(j, awal)!;
    for (const x of rata(f.isian)) {
      if (x.t !== "pilih") continue;
      for (const [nilai] of x.opsi) {
        if (!nilai || nilai === "?" || nilai === "hasil") continue;
        const b = x.ubah(nilai);
        // pilihan "bangun/bentuk/alat" mengganti seluruh isi; formulir barunya juga harus terbaca habis
        assert.equal(alasan(j, b), null, `${j} → ${x.label} = ${nilai}: ${alasan(j, b)}`);
        assert.deepEqual(formulir(j, b)!.sisa, [], `${j} → ${x.label} = ${nilai}: ada baris sisa`);
      }
    }
  }
});

test("isian angka: satuan ditambahkan, ditanyakan = ?, kosong = baris dibuang", () => {
  const f = formulir("datar", badan("datar"))!; // segitiga siku-siku 8, 6, ?
  const ab = rata(f.isian).find((x) => x.t === "isi" && x.kunci === "AB");
  assert.ok(ab && ab.t === "isi");
  assert.equal(ab.nilai, "8");
  assert.deepEqual(ab.ubah("2,5").find((b) => b[0] === "AB"), ["AB", "2,5 cm"]);
  assert.deepEqual(ab.tanya!.ubah(true).find((b) => b[0] === "AB"), ["AB", "?"]);
  assert.equal(ab.ubah("").find((b) => b[0] === "AB"), undefined);
  // satuan panjang diganti → semua angka panjang ikut
  const sat = f.isian.find((x) => x.t === "pilih" && x.label === "Satuan panjang");
  assert.ok(sat && sat.t === "pilih");
  assert.deepEqual(sat.ubah("m").filter((b) => /\d/.test(b[1])).map((b) => b[1]), ["8 m", "6 m"]);
});

test("nama titik diganti → kunci sisi & sudut ikut berganti", () => {
  const f = formulir("datar", badan("datar"))!;
  const nama = rata(f.isian).find((x) => x.t === "isi" && x.label.startsWith("Nama titik"));
  assert.ok(nama && nama.t === "isi");
  const b = nama.ubah("P, Q, R");
  assert.ok(b.some((x) => x[0] === "PQ") && b.some((x) => x[0] === "sudut Q"));
  assert.equal(alasan("datar", b), null);
});

test("gaya: F (tarik) dan f (gesek) dibedakan; ruang: garis & titik tengah", () => {
  const f = formulir("gaya", [["bidang", "datar"], ["F", "20 N, 37°"], ["f", "f"]])!;
  assert.deepEqual(f.sisa, []);
  const tarik = rata(f.isian).filter((x) => x.t === "isi" && x.label === "Sudut terhadap bidang");
  assert.equal(tarik.length, 1);
  const r = formulir("ruang", [["bangun", "kubus"], ["rusuk", "6 cm"], ["titik P", "tengah EH"], ["AP", "?"]])!;
  assert.deepEqual(r.sisa, []);
  const tambah = r.isian.find((x) => x.t === "tombol" && x.label.startsWith("+ Garis"));
  assert.ok(tambah && tambah.t === "tombol");
  assert.equal(alasan("ruang", tambah.jalankan()), null);
});

test("baris tak dikenal dilaporkan sebagai sisa; hitung optik", () => {
  assert.deepEqual(formulir("katrol", [["bentuk", "meja"], ["m1", "2 kg"], ["m2", "3 kg"], ["warna", "merah"]])!.sisa, [3]);
  const h = hitungOptik("lensa cembung", 10, 15, 2);
  assert.ok(h && !h.tak);
  assert.equal(Math.round(h.si), 30);
  assert.match(h.sifat, /nyata, terbalik, diperbesar/);
});
