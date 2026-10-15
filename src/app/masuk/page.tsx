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
    <main className="mx-auto max-w-sm space-y-6 p-4 pt-16">
      <h1 className="text-center text-2xl font-bold">Racik Soal</h1>
      {n === 0 ? <FormAdminPertama /> : <FormMasuk />}
    </main>
  );
}
