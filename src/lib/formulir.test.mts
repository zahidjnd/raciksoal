import { test } from "node:test";
import assert from "node:assert/strict";
import { formulir, hitungFrekuensi, hitungOptik, pakaiJudul, punyaFormulir, tempelData, type Baris, type Isian } from "./formulir.ts";
import { alasanGrafik, ATURAN_GRAFIK, type JenisGrafik } from "./grafik.ts";

const SATU = ["datar", "ruang", "sudut", "optik", "gaya", "katrol", "tuas", "atom", "arah", "langit", "ekonomi", "lapisan", "shaf"] as JenisGrafik[];
const DAFTAR = ["waktu", "alur", "siklus", "pohon", "koordinat", "bilangan", "listrik", "jaring", "waris"] as JenisGrafik[];
const DATA = ["batang", "garis", "lingkaran", "histogram", "pencar", "piramida"] as JenisGrafik[];
const JENIS = [...SATU, ...DAFTAR, ...DATA];
/** Grafik data: formulir menerima tabel lengkap dengan baris judul (nama sumbu & seri). */
const badan = (j: JenisGrafik): Baris[] => (pakaiJudul(j) ? ATURAN_GRAFIK[j].contoh : ATURAN_GRAFIK[j].contoh.slice(1)).map((b) => [...b]);
const alasan = (j: JenisGrafik, b: Baris[]) => alasanGrafik(pakaiJudul(j) ? b : [ATURAN_GRAFIK[j].contoh[0], ...b], j);
/** Semua isian, termasuk yang di dalam kelompok. */
const rata = (xs: Isian[]): Isian[] => xs.flatMap((x) => (x.t === "kelompok" ? [x, ...rata(x.isian)] : [x]));

test("28 jenis punya formulir; contoh terbaca habis (tanpa baris sisa)", () => {
  for (const j of JENIS) {
    assert.ok(punyaFormulir(j), j);
    const f = formulir(j, badan(j))!;
    assert.deepEqual(f.sisa, [], `${j}: baris tak dikenal ${f.sisa.map((i) => badan(j)[i].join(" | "))}`);
    assert.ok(f.isian.length > 0, j);
  }
  assert.equal(punyaFormulir("tabel"), false);
});

test("setiap pilihan di setiap formulir menghasilkan tabel yang bisa digambar", () => {
  for (const j of JENIS) {
    const awal = badan(j);
    const f = formulir(j, awal)!;
    for (const x of rata(f.isian)) {
      if (x.t !== "pilih") continue;
      for (const [nilai] of x.opsi) {
        if (!nilai || nilai === "?" || nilai === "hasil") continue;
        if (j === "waris" && x.label === "Bagian") continue; // bagian salah memang ditandai pemeriksa faraidh
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

test("daftar & pohon: setiap tombol, centang & aksi (+ ↑ ↓ ✕) menghasilkan tabel yang bisa digambar", () => {
  for (const j of DAFTAR) {
    const f = formulir(j, badan(j))!;
    const coba = (nama: string, b: Baris[]) => {
      assert.ok(b.every((r) => r.length === badan(j)[0].length), `${j} → ${nama}: banyak kolom berubah`);
      const salah = alasan(j, b);
      // waris: mencentang/melepas ahli waris boleh membuat bagian lain salah menurut faraidh (ditandai merah untuk guru)
      if (!(j === "waris" && salah?.startsWith("Menurut kaidah faraidh"))) assert.equal(salah, null, `${j} → ${nama}: ${salah}`);
      assert.deepEqual(formulir(j, b)!.sisa, [], `${j} → ${nama}: ada baris sisa`);
    };
    for (const x of rata(f.isian)) {
      if (x.t === "tombol") coba(x.label, x.jalankan());
      if (x.t === "centang") coba(x.label, x.ubah(!x.nilai));
      if (x.t === "kelompok" || x.t === "simpul") for (const a of x.aksi ?? []) coba(`${"label" in x ? x.label : x.nilai} ${a.judul}`, a.jalankan());
      if ((x.t === "isi" || x.t === "simpul") && x.tanya) coba(`${"label" in x ? x.label : x.nilai} ditanyakan`, x.tanya.ubah(!x.tanya.aktif));
    }
  }
});

test("pohon: + cabang menambah anak di bawah induknya; ganti nama induk ikut di anak", () => {
  const f = formulir("pohon", badan("pohon"))!;
  const akar = f.isian.find((x) => x.t === "simpul" && x.tingkat === 0);
  assert.ok(akar && akar.t === "simpul");
  const b = akar.aksi.find((a) => a.label === "+")!.jalankan();
  assert.deepEqual(b[b.length - 1], ["Cabang 1", "Kalimat"]);
  const isim = f.isian.find((x) => x.t === "simpul" && x.nilai === "Isim");
  assert.ok(isim && isim.t === "simpul");
  const c = isim.aksi.find((a) => a.label === "+")!.jalankan();
  assert.deepEqual(c[2], ["Cabang 1", "Isim"]);
  assert.ok(akar.ubah("Kata").filter((r) => r[1] === "Kata").length === 3);
});

test("garis bilangan: batas kiri/kanan & bulatan menyusun pertidaksamaan", () => {
  const f = formulir("bilangan", badan("bilangan"))!; // -1 < x <= 3
  assert.ok(f.isian.some((x) => x.t === "info" && x.teks.includes("-1 < x ≤ 3")));
  const kanan = f.isian.find((x) => x.t === "kelompok" && x.label === "Batas kanan");
  assert.ok(kanan && kanan.t === "kelompok");
  const batas = kanan.isian[0];
  assert.ok(batas.t === "pilih");
  const b = batas.ubah("tak");
  assert.deepEqual(b.find((r) => r[0] === "daerah"), ["daerah", "-1..", ""]);
  assert.ok(formulir("bilangan", b)!.isian.some((x) => x.t === "info" && x.teks.includes("x > -1")));
});

test("jaring: centang pemakan menulis ulang tabel; waris: ganti mayit menukar suami/istri", () => {
  const f = formulir("jaring", badan("jaring"))!;
  const rumput = rata(f.isian).find((x) => x.t === "kelompok" && x.label === "rumput dimakan oleh");
  assert.ok(rumput && rumput.t === "kelompok");
  const ular = rumput.isian.find((x) => x.t === "centang" && x.label === "ular");
  assert.ok(ular && ular.t === "centang" && !ular.nilai);
  assert.deepEqual(ular.ubah(true)[0], ["rumput", "belalang, tikus, ular"]);
  const w = formulir("waris", badan("waris"))!;
  const mayit = w.isian.find((x) => x.t === "pilih" && x.label.startsWith("Mayit"));
  assert.ok(mayit && mayit.t === "pilih");
  const b = mayit.ubah("perempuan");
  assert.ok(b.some((r) => r[0] === "suami") && !b.some((r) => r[0] === "istri"));
  assert.equal(alasan("waris", b), null);
});

test("grafik data: setiap tombol, aksi baris & bantuan menghasilkan grafik yang bisa digambar", () => {
  for (const j of DATA) {
    const f = formulir(j, badan(j))!;
    const coba = (nama: string, b: Baris[]) => {
      assert.equal(alasan(j, b), null, `${j} → ${nama}: ${alasan(j, b)}`);
      assert.deepEqual(formulir(j, b)!.sisa, [], `${j} → ${nama}: ada baris sisa`);
    };
    for (const x of rata(f.isian)) {
      if (x.t === "tombol") coba(x.label, x.jalankan());
      if (x.t === "kelompok") for (const a of x.aksi ?? []) coba(`${x.label} ${a.judul}`, a.jalankan());
      if (x.t === "lembar") x.isi.forEach((_, i) => x.aksi(i).forEach((a) => coba(a.judul, a.jalankan())));
    }
  }
});

test("grafik data: nama + satuan menulis judul kolom; sel lembar mengubah angka", () => {
  const f = formulir("garis", badan("garis"))!; // Bulan | Suhu (°C)
  const satuan = rata(f.isian).find((x) => x.t === "isi" && x.kunci === "satuan1");
  assert.ok(satuan && satuan.t === "isi" && satuan.nilai === "°C");
  assert.deepEqual(satuan.ubah("mm")[0], ["Bulan", "Suhu (mm)"]);
  assert.deepEqual(satuan.ubah("")[0], ["Bulan", "Suhu"]);
  const nama = rata(f.isian).find((x) => x.t === "isi" && x.label === "Nama");
  assert.ok(nama && nama.t === "isi");
  assert.deepEqual(nama.ubah("Curah hujan ")[0], ["Bulan", "Curah hujan  (°C)"]); // spasi saat mengetik tidak hilang
  const lembar = f.isian.find((x) => x.t === "lembar");
  assert.ok(lembar && lembar.t === "lembar");
  assert.deepEqual(lembar.ubah(1, 1, "31,5")[2], ["Feb", "31,5"]);
});

test("tempel dari Excel: judul dikenali, angka Indonesia, Rp & % dibersihkan", () => {
  const b = tempelData("batang", ["Kelas", "Jumlah"], "Bulan\tPenjualan (Rp)\tLaba\nJan\tRp 1.250\t20%\nFeb\t1.500,5\t25%\n");
  assert.ok(Array.isArray(b));
  assert.deepEqual(b, [["Bulan", "Penjualan (Rp)", "Laba"], ["Jan", "1.250", "20"], ["Feb", "1.500,5", "25"]]);
  assert.equal(alasanGrafik(b, "batang"), null);
  // tanpa judul: judul lama dipakai; tanpa pemisah tab: "nama angka"
  assert.deepEqual(tempelData("lingkaran", ["Pekerjaan", "Jumlah"], "Petani 45\nPedagang 30"), [["Pekerjaan", "Jumlah"], ["Petani", "45"], ["Pedagang", "30"]]);
  // tabel bergaris "|" (dari Word/Markdown)
  assert.deepEqual(tempelData("pencar", ["x", "y"], "| x | y |\n|---|---|\n| 1 | 5 |\n| 2 | 6 |\n| 3 | 8 |"), [["x", "y"], ["1", "5"], ["2", "6"], ["3", "8"]]);
  assert.match(String(tempelData("piramida", [], "0–14\t12")), /3 kolom/);
  assert.match(String(tempelData("lingkaran", [], "A\t1")), /2–8 baris/);
});

test("histogram: kelas otomatis & frekuensi dari nilai siswa", () => {
  const f = formulir("histogram", badan("histogram"))!; // 51–60 ... 81–90
  const kelas = rata(f.isian).filter((x) => x.t === "isi" && x.angka) as Extract<Isian, { t: "isi" }>[];
  assert.deepEqual(kelas.map((x) => x.nilai), ["51", "10", "4"]);
  const b = kelas[2].ubah("5");
  assert.deepEqual(b.map((r) => r[0]), ["Nilai", "51–60", "61–70", "71–80", "81–90", "91–100"]);
  assert.equal(b[5][1], "0");
  assert.deepEqual(kelas[1].ubah("5").slice(1, 3).map((r) => r[0]), ["51–55", "56–60"]);
  assert.deepEqual(hitungFrekuensi("55 60 61, 75 75,5\n90", 51, 10, 4), [2, 1, 2, 1]);
  assert.match(String(hitungFrekuensi("50 95", 51, 10, 4)), /di luar kelas \(50, 95\)/);
  const tempel = rata(f.isian).find((x) => x.t === "tempel" && x.label.startsWith("Hitung"));
  assert.ok(tempel && tempel.t === "tempel");
  assert.deepEqual((tempel.jalankan("55 65 66 85") as Baris[]).map((r) => r[1]), ["Frekuensi", "1", "2", "0", "1"]);
});

test("piramida: kelompok umur siap pakai; satuan ditulis di kedua kolom", () => {
  const f = formulir("piramida", badan("piramida"))!;
  const umur = f.isian.find((x) => x.t === "pilih" && x.label === "Kelompok umur");
  assert.ok(umur && umur.t === "pilih" && umur.nilai === "15");
  const b = umur.ubah("5");
  assert.equal(b.length, 17);
  assert.deepEqual(b[1].slice(0, 1), ["0–4"]);
  assert.equal(alasan("piramida", b), null);
  const satuan = rata(f.isian).find((x) => x.t === "isi" && x.label === "Satuan angka");
  assert.ok(satuan && satuan.t === "isi" && satuan.nilai === "ribu");
  assert.deepEqual(satuan.ubah("juta")[0], ["Umur (tahun)", "Laki-laki (juta)", "Perempuan (juta)"]);
});
