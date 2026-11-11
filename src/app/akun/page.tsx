import Link from "next/link";
import { wajibMasuk } from "@/lib/sesi";
import { ambilPreferensi, hitungHariIni, hitungPemakaian, hitungSebulan } from "@/lib/pemakaian";
import { BATAS_HALAMAN_PDF, BATAS_PER_GURU, BATAS_UBAH_PER_GURU } from "@/lib/pembatas";
import { Kerangka } from "../kepala";
import { FormKataSandi, FormNama, FormPreferensi, TombolKeluarkanPerangkat } from "./form";

/** Tab halaman Akun (gaya halaman pengaturan claude.ai): `?tab=` supaya bisa ditautkan (mis. dari Panduan) & tetap saat dimuat ulang. */
const TAB = [
  { id: "profil", nama: "Profil" },
  { id: "bawaan", nama: "Bawaan soal" },
  { id: "keamanan", nama: "Keamanan" },
] as const;

/** Halaman Akun (0.32.0): profil + pemakaian hari ini, bawaan Set baru, keamanan. Semua untuk akun yang sedang masuk saja. */
export default async function HalamanAkun({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const p = await wajibMasuk();
  const minta = (await searchParams).tab;
  const tab = TAB.find((t) => t.id === minta)?.id ?? "profil";
  const admin = p.peran === "admin";
  const kartu = "space-y-3 rounded-xl border bg-kartu p-4";
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Akun</h1>
      <div className="md:flex md:items-start md:gap-6">
        {/* HP: deret tombol di atas; laptop: daftar di kiri. */}
        <nav aria-label="Bagian akun" className="mb-4 flex gap-1 overflow-x-auto md:mb-0 md:w-44 md:shrink-0 md:flex-col">
          {TAB.map((t) => (
            <Link
              key={t.id}
              href={t.id === "profil" ? "/akun" : `/akun?tab=${t.id}`}
              aria-current={tab === t.id ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm max-md:min-h-11 max-md:flex max-md:items-center ${tab === t.id ? "bg-krem-sorot font-semibold" : "text-pudar hover:bg-krem-sorot hover:text-tinta"}`}
            >
              {t.nama}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {tab === "profil" && <Profil p={p} admin={admin} kartu={kartu} />}

          {tab === "bawaan" && (
            <section className={kartu} aria-labelledby="bawaan">
              <h2 id="bawaan">Bawaan membuat soal</h2>
              <p className="text-sm text-pudar">Terisi otomatis setiap membuka Set baru, di HP maupun laptop. Tetap bisa diubah per set.</p>
              <FormPreferensi awal={await ambilPreferensi(p.id)} />
            </section>
          )}

          {tab === "keamanan" && (
            <section className={kartu} aria-labelledby="keamanan">
              <h2 id="keamanan">Keamanan</h2>
              <div className="max-w-md space-y-4">
                <FormKataSandi />
                <hr className="border-garis" />
                <TombolKeluarkanPerangkat />
              </div>
            </section>
          )}
        </div>
      </div>
    </Kerangka>
  );
}

async function Profil({ p, admin, kartu }: { p: Awaited<ReturnType<typeof wajibMasuk>>; admin: boolean; kartu: string }) {
  const [set, ubah, halaman, sebulan] = await Promise.all([
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
  return (
    <>
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
    </>
  );
}
