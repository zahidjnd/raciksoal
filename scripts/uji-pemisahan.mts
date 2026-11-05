// Uji pemisahan data antar guru (aturan 3), lewat aplikasi yang sedang berjalan di LAPTOP:
// guru B mencoba membuka, mengubah, dan mengunduh set & materi milik guru A. Semua harus ditolak, dan isi A tetap utuh.
//
// Jalankan saat server dev menyala (dua akun GURU, bukan admin):
//   UJI_A=nama:sandi UJI_B=nama:sandi npm run uji:pemisahan
// Tidak memakai saldo AI: semua penolakan terjadi sebelum AI dipanggil. Kalau ada yang lolos, itulah bug-nya
// (dan data A di database laptop bisa ikut berubah).
// Tidak dijalankan di GitHub (di sana tidak ada server, database, dan akun).
import { readFileSync } from "node:fs";

const BASE = (process.env.UJI_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Hanya untuk server laptop (localhost).");

let gagal = 0;
const cek = (benar: boolean, apa: string, rincian = "") => {
  console.log(`${benar ? "LULUS" : "GAGAL"}  ${apa}${!benar && rincian ? `\n       ${rincian}` : ""}`);
  if (!benar) gagal++;
};

async function masuk(akun: string | undefined, label: string) {
  const i = akun?.indexOf(":") ?? -1;
  if (!akun || i < 1) throw new Error(`Isi ${label} dengan nama:sandi.`);
  const r = await fetch(`${BASE}/api/auth/sign-in/username`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ username: akun.slice(0, i), password: akun.slice(i + 1) }),
  });
  if (!r.ok) throw new Error(`${label}: gagal masuk (HTTP ${r.status}).`);
  return r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

const halaman = (cookie: string, jalur: string) => fetch(BASE + jalur, { headers: { cookie }, redirect: "manual" });

// Nomor aksi server (Next mengenal server action lewat id acak di header Next-Action). Id dibaca dari manifest
// buatan Next; di mode dev manifest baru berisi aksi dari halaman yang sudah dibuka, jadi halaman dibuka dulu.
function idAksi() {
  const m = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { workers: Record<string, { moduleId: string }> }> };
  const peta = new Map<string, string>();
  for (const a of Object.values(m.node))
    for (const w of Object.values(a.workers)) {
      const q = decodeURIComponent(w.moduleId).match(/actions=(\[.*\])/)?.[1];
      for (const [, daftar] of q ? (JSON.parse(q) as [string, { id: string; exportedName: string }[]][]) : [])
        for (const { id, exportedName } of daftar) peta.set(exportedName, id);
    }
  return peta;
}
let ID = new Map<string, string>();

/** Panggil server action seperti browser. Kembalian: teks mentah (untuk dibandingkan) dan nilai baris 1 (hasil aksi). */
async function aksi(cookie: string, nama: string, ...args: unknown[]) {
  const id = ID.get(nama);
  if (!id) throw new Error(`Aksi ${nama} tidak ada di manifest (buka halamannya dulu).`);
  const r = await fetch(`${BASE}/`, {
    method: "POST",
    headers: { cookie, "next-action": id, "content-type": "text/plain;charset=UTF-8", accept: "text/x-component", origin: BASE },
    body: JSON.stringify(args),
  });
  // Hanya baris data bernomor ("0:", "1:", ...); mode dev menambahkan baris waktu (":N...") yang selalu berbeda.
  const daftar = (await r.text()).split("\n").filter((b) => /^[0-9a-f]+:/.test(b));
  const baris = daftar.find((b) => b.startsWith("1:"));
  return { teks: daftar.join("\n"), nilai: baris ? JSON.parse(baris.slice(2)) : undefined };
}

const A = await masuk(process.env.UJI_A, "UJI_A");
const B = await masuk(process.env.UJI_B, "UJI_B");

// Buka halaman supaya aksinya dikompilasi (mode dev), sekalian cari set & materi milik A.
const riwayatA = await (await halaman(A, "/riwayat")).text();
const materiA = await (await halaman(A, "/materi")).text();
await halaman(A, "/");
await halaman(A, "/materi/baru");
ID = idAksi();

cek((await aksi(B, "ambilDaftarModel")).nilai?.length === 0, "akun B adalah guru (bukan admin)");

let setA = 0;
let isiA = "";
for (const id of new Set([...riwayatA.matchAll(/href="\/\?id=(\d+)"/g)].map((x) => Number(x[1])))) {
  const r = await aksi(A, "cekHasil", id, true);
  if (r.nilai?.status === "selesai" && r.nilai.soal?.length) {
    setA = id;
    isiA = r.teks;
    break;
  }
}
if (!setA) throw new Error("Guru A belum punya set soal yang selesai. Buat satu dulu.");
const idMateriA = [...materiA.matchAll(/href="\/materi\/(\d+)"/g)].map((x) => Number(x[1]))[0];
if (!idMateriA) throw new Error("Guru A belum punya materi. Buat satu dulu.");
console.log(`Set A = ${setA}, materi A = ${idMateriA}\n`);

// Pembanding: A sendiri boleh (supaya tes tidak "lulus" hanya karena semuanya rusak).
cek((await halaman(A, `/api/word?id=${setA}&jenis=soal`)).status === 200, "A bisa mengunduh Word setnya sendiri");
cek((await halaman(A, `/materi/${idMateriA}`)).status === 200, "A bisa membuka materinya sendiri");

// Set milik A, dicoba oleh B.
const soal0 = (await aksi(A, "cekHasil", setA, true)).nilai.soal[0];
const ditolak = async (nama: string, ...args: unknown[]) => {
  const { nilai } = await aksi(B, nama, ...args);
  cek(nilai?.ok === false && /tidak ditemukan/i.test(nilai.pesan), `B ditolak: ${nama}`, JSON.stringify(nilai)?.slice(0, 200));
};
cek((await aksi(B, "cekHasil", setA, true)).nilai === null, "B ditolak: cekHasil (membuka set)");
await ditolak("simpanSoal", setA, 0, { ...soal0, pertanyaan: "DIRETAS" });
await ditolak("gantiSatuSoal", setA, 0);
await ditolak("gantiSatuSoal", setA, 0, "ubah jadi lebih mudah");
await ditolak("tambahSoalSerupa", setA, 0);
await ditolak("tambahSoalManual", setA, soal0);
await ditolak("pindahSoal", setA, 0, 1);
await ditolak("hapusSoal", setA, 0);
await ditolak("ubahIdentitas", setA, { waktu: 1 });
await ditolak("ubahNamaSet", setA, "DIRETAS");
await ditolak("hapusSet", setA);
for (const jenis of ["soal", "kunci", "kisi"])
  for (const paket of ["", "&paket=B"]) {
    const s = (await halaman(B, `/api/word?id=${setA}&jenis=${jenis}${paket}`)).status;
    cek(s === 404, `B ditolak: unduh Word ${jenis}${paket}`, `HTTP ${s}`);
  }
for (const jalur of ["/riwayat", "/", "/admin/set"]) {
  const html = await (await halaman(B, jalur)).text();
  cek(!html.includes(`/?id=${setA}"`), `set A tidak tampil di ${jalur} milik B`);
}

// Materi milik A, dicoba oleh B.
cek((await halaman(B, `/materi/${idMateriA}`)).status === 404, "B ditolak: membuka materi A");
const isianUji = { mapel: "Fikih", kelas: "XI", teksArab: "dalil", judul: "DIRETAS", tp: "Uji", isi: "Uji pemisahan data antar guru. ".repeat(5), dalil: [], diverifikasi: true };
const simpan = (await aksi(B, "simpanMateri", idMateriA, isianUji)).nilai;
cek(simpan?.ok === false && /tidak ditemukan/i.test(simpan.pesan), "B ditolak: simpanMateri (mengubah materi A)", JSON.stringify(simpan));
const hapus = (await aksi(B, "hapusMateri", idMateriA)).nilai;
cek(hapus?.ok === false && /tidak ditemukan/i.test(hapus.pesan), "B ditolak: hapusMateri", JSON.stringify(hapus));
const buat = (await aksi(B, "mulaiBuatSoal", {
  babIds: [`materi-${idMateriA}`], tujuan: "Latihan", kesulitan: "Mudah",
  jumlah: { PG: 1, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0 }, level: { LOTS: 100, MOTS: 0, HOTS: 0 },
})).nilai;
cek(buat?.ok === false && /tidak ditemukan/i.test(buat.pesan), "B ditolak: membuat soal dari materi A", JSON.stringify(buat));

// Isi A tidak berubah sedikit pun.
const isiAkhir = (await aksi(A, "cekHasil", setA, true)).teks;
const beda = [...isiA].findIndex((h, i) => h !== isiAkhir[i]);
cek(isiAkhir === isiA, "set A tetap utuh", `berbeda mulai: …${isiA.slice(Math.max(0, beda - 80), beda + 80)}… menjadi …${isiAkhir.slice(Math.max(0, beda - 80), beda + 80)}…`);
cek(!(await (await halaman(A, `/materi/${idMateriA}`)).text()).includes("DIRETAS"), "materi A tetap utuh");

console.log(gagal ? `\n${gagal} pemeriksaan GAGAL` : "\nSemua lulus: data guru A aman dari guru B.");
process.exit(gagal ? 1 : 0);
