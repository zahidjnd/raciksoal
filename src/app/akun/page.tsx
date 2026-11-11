import { wajibMasuk } from "@/lib/sesi";
import { ambilPreferensi, hitungHariIni, hitungPemakaian, hitungSebulan } from "@/lib/pemakaian";
import { BATAS_HALAMAN_PDF, BATAS_PER_GURU, BATAS_UBAH_PER_GURU } from "@/lib/pembatas";
import { Kerangka } from "../kepala";
import { FormKataSandi, FormNama, FormPreferensi, TombolKeluarkanPerangkat } from "./form";

/** Halaman Akun (0.32.0): profil, bawaan Set baru, pemakaian hari ini, keamanan. Semua untuk akun yang sedang masuk saja. */
export default async function HalamanAkun() {
  const p = await wajibMasuk();
  const admin = p.peran === "admin";
  const [pref, set, ubah, halaman, sebulan] = await Promise.all([
    ambilPreferensi(p.id),
    hitungHariIni(p.id),
    hitungPemakaian(p.id, "ubah"),
    hitungPemakaian(p.id, "halaman"),
    hitungSebulan(p.id),
  ]);
  const jatah = [
    { nama: "Set soal dibuat", n: set, batas: BATAS_PER_GURU },
    { nama: "Ganti / Ubah / Tambah soal", n: ubah, batas: BATAS_UBAH_PER_GURU },
    { nama: "Halaman PDF dibaca AI", n: halaman, batas: BATAS_HALAMAN_PDF },
  ];
  const kartu = "space-y-3 rounded-xl border bg-kartu p-4";
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Akun</h1>

      <section className={kartu} aria-labelledby="profil">
        <h2 id="profil">Profil</h2>
        <p className="text-sm">
          <span className="text-pudar">Nama pengguna untuk masuk:</span> {p.username} <span className="text-pudar">(diatur admin)</span>
          <br />
          <span className="text-pudar">Peran:</span> {admin ? "Admin" : "Guru"}
        </p>
        <div className="max-w-sm">
          <FormNama nama={p.nama} />
        </div>
      </section>

      <section className={kartu} aria-labelledby="bawaan">
        <h2 id="bawaan">Bawaan membuat soal</h2>
        <p className="text-sm text-pudar">Terisi otomatis setiap membuka Set baru, di HP maupun laptop. Tetap bisa diubah per set.</p>
        <FormPreferensi awal={pref} />
      </section>

      <section className={kartu} aria-labelledby="pemakaian">
        <h2 id="pemakaian">Pemakaian hari ini</h2>
        <ul className="space-y-2 text-sm">
          {jatah.map((j) => (
            <li key={j.nama}>
              <div className="flex justify-between gap-2">
                <span>{j.nama}</span>
                <span className="tabular-nums">{admin ? `${j.n} (admin, tanpa batas)` : `${j.n} dari ${j.batas}`}</span>
              </div>
              {!admin && (
                <div className="mt-1 h-2 rounded-full bg-krem-sorot" aria-hidden>
                  <div className={`h-2 rounded-full ${j.n >= j.batas ? "bg-bahaya" : "bg-hijau"}`} style={{ width: `${Math.min(100, (j.n / j.batas) * 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-pudar">Jatah kembali penuh setiap pukul 00.00 WIB. Set yang gagal tidak dihitung. 30 hari terakhir: {sebulan} set.</p>
      </section>

      <section className={`${kartu} max-w-xl`} aria-labelledby="keamanan">
        <h2 id="keamanan">Keamanan</h2>
        <FormKataSandi />
        <hr className="border-garis" />
        <TombolKeluarkanPerangkat />
      </section>
    </Kerangka>
  );
}
