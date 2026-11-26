import { redirect } from "next/navigation";
import { wajibMasuk } from "@/lib/sesi";
import { APLIKASI } from "@/lib/aplikasi";
import { keluar } from "./masuk/actions";
import { JendelaTanya } from "./tanya";
import { KartuAplikasi } from "./kartu-aplikasi";
import { Pengumuman } from "./pengumuman";
import { PasangAplikasi } from "./pasang-aplikasi";
/**
 * Halaman awal (alamat utama "/", pilihan pemilik): selalu yang pertama tampil, juga saat login masih tersimpan
 * (tautan WA, browser baru, aplikasi HP). Sengaja POLOS, tanpa sidebar: kartu dari APLIKASI + tombol Keluar.
 * Tautan lama Racik Soal ("/?id=12", "/?materi=...", sebelum 1.0.1) diteruskan ke /racik.
 */
export default async function HalamanAwal({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await wajibMasuk();
  const q = await searchParams;
  if (q.id || q.materi) redirect(`/racik?${new URLSearchParams(q)}`);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 p-4">
      <h1 className="sr-only">Pilih aplikasi</h1>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {APLIKASI.map((a) => (
          <KartuAplikasi key={a.id} a={a} />
        ))}
      </div>
      <form action={keluar}>
        <button className="h-10 rounded-lg px-4 text-sm text-pudar hover:bg-krem-sorot hover:text-tinta max-md:min-h-11">Keluar</button>
      </form>
      <JendelaTanya />
      <Pengumuman />
      <PasangAplikasi />
    </main>
  );
}
