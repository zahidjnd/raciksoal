import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pengguna } from "@/db/schema";
import { penggunaSaatIni } from "@/lib/sesi";
import { FormAdminPertama, FormMasuk } from "./form";

export default async function HalamanMasuk() {
  if (await penggunaSaatIni()) redirect("/");
  const [{ n }] = await db.select({ n: count() }).from(pengguna);

  return (
    <main id="halaman-masuk" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center space-y-6 p-4">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-hijau font-serif text-2xl font-semibold text-white" aria-hidden>
          R
        </span>
        <h1 className="text-2xl">Racik Soal</h1>
        <p className="text-sm text-pudar">Racik soal lebih cepat, hasilnya tetap cermat</p>      </div>
      {n === 0 ? <FormAdminPertama /> : <FormMasuk />}
    </main>
  );
}
