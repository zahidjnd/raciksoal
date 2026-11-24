import { wajibMasuk } from "@/lib/sesi";
import { APLIKASI } from "@/lib/aplikasi";
import { keluar } from "../masuk/actions";
import { JendelaTanya } from "../tanya";
import { KartuAplikasi } from "./kartu-menu";

/**
 * Halaman awal (1.0.0, pilihan pemilik): muncul setiap kali masuk. Sengaja POLOS, tanpa sidebar Racik Soal, supaya
 * terasa seperti memilih aplikasi. Isi: kartu dari APLIKASI (lib/aplikasi.ts) + tombol Keluar kecil di bawah.
 */
export default async function HalamanAwal() {
  await wajibMasuk();
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
    </main>
  );
}
