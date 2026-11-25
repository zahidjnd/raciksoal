import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { siswa } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { FormSiswa } from "./form";

export const metadata = { title: "Daftar siswa · Koreksi LJK" };

/** Daftar siswa per kelas untuk Koreksi LJK (keputusan pemilik 26 Nov 2026: admin menempel sekali dari Excel TU). */
export default async function DaftarSiswa() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");
  const kelas = (await db.select({ kelas: siswa.kelas, n: count() }).from(siswa).where(eq(siswa.aktif, true)).groupBy(siswa.kelas)).sort((a, b) =>
    a.kelas.localeCompare(b.kelas, "id", { numeric: true }),
  );
  return (
    <Kerangka p={p} aplikasi="koreksi">
      <h1 className="text-2xl">Daftar siswa</h1>
      <p className="text-sm text-pudar">Dipakai Koreksi LJK: guru memilih kelas, nama siswa muncul urut absen.</p>
      <FormSiswa />
      <section className="rounded-xl border bg-kartu p-4 text-sm">
        <h2 className="mb-2 text-lg">Kelas tersimpan</h2>
        {kelas.length ? (
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {kelas.map((k) => (
              <li key={k.kelas}>
                <b>{k.kelas}</b> <span className="text-pudar">· {k.n} siswa</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-pudar">Belum ada.</p>
        )}
      </section>
    </Kerangka>
  );
}
