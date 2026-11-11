import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pengguna } from "@/db/schema";
import { penggunaSaatIni } from "@/lib/sesi";
import paket from "../../../package.json";
import { FormAdminPertama, FormMasuk, Panggung } from "./form";

export default async function HalamanMasuk() {
  if (await penggunaSaatIni()) redirect("/");
  const [{ n }] = await db.select({ n: count() }).from(pengguna);

  return (
    // HP (0.32.6, pilihan pemilik): tanpa kartu, logo di atas, form di sepertiga atas (tidak tertutup papan ketik),
    // MA Al-Fatah + versi di dasar layar. Laptop: satu kartu dua kolom di tengah seperti dulu.
    <main id="halaman-masuk" className="flex min-h-dvh flex-col px-5 pt-[10dvh] pb-6 md:items-center md:justify-center md:p-4">
      <div className="mx-auto w-full max-w-sm md:grid md:min-h-[480px] md:max-w-[820px] md:grid-cols-[5fr_6fr] md:overflow-hidden md:rounded-2xl md:border md:bg-kartu md:shadow-lg">
        {/* Kiri (HP: atas, rata tengah): tanda bintang delapan + teks yang "diketik" seperti AI sedang meracik soal. */}
        <section className="flex flex-col items-center gap-3 pb-8 text-center md:items-stretch md:gap-5 md:border-r md:bg-krem-tua md:p-8 md:text-left">
          <Panggung />
          <p className="hidden text-xs text-pudar md:block">MA Al-Fatah · v{paket.version}</p>
        </section>

        <section className="flex flex-col justify-center gap-6 md:p-8">
          <div>
            <h1 className="text-3xl">Assalamu&apos;alaikum.</h1>
            <p className="mt-1 text-sm text-pudar">Masuk untuk mulai meracik soal.</p>
          </div>
          {n === 0 ? <FormAdminPertama /> : <FormMasuk />}
        </section>
      </div>
      <p className="mt-auto pt-10 text-center text-xs text-pudar md:hidden">MA Al-Fatah · v{paket.version}</p>
    </main>
  );
}
