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
    <main id="halaman-masuk" className="flex min-h-dvh items-center justify-center p-4">
      {/* Satu kartu di tengah (lebar tetap), supaya tidak banyak ruang kosong di layar lebar. */}
      <div className="grid w-full max-w-[820px] overflow-hidden rounded-2xl border bg-kartu shadow-lg md:min-h-[480px] md:grid-cols-[5fr_6fr]">
        {/* Kiri (HP: atas): tanda bintang delapan + teks yang "diketik" seperti AI sedang meracik soal. */}
        <section className="flex flex-col gap-5 border-b bg-krem-tua p-5 md:border-r md:border-b-0 md:p-8">
          <Panggung />
          <p className="hidden text-xs text-pudar md:block">MA Al-Fatah · v{paket.version}</p>
        </section>

        <section className="flex flex-col justify-center gap-6 p-5 md:p-8">
          <div>
            <h1 className="text-3xl">Assalamu&apos;alaikum.</h1>
            <p className="mt-1 text-sm text-pudar">Masuk untuk mulai meracik soal.</p>
          </div>
          {n === 0 ? <FormAdminPertama /> : <FormMasuk />}
        </section>
      </div>
    </main>
  );
}
