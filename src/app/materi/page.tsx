import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import type { Bab } from "@/lib/soal";
import { Kerangka } from "../kepala";
import { TombolHapusMateri } from "./form";

export default async function MateriSaya() {
  const p = await wajibMasuk();
  // Aturan 3: hanya materi milik pengguna yang sedang masuk.
  const daftar = await db.select().from(materi).where(eq(materi.guruId, p.id)).orderBy(desc(materi.diubah));

  return (
    <Kerangka p={p}>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Materi saya ({daftar.length})</h2>
          <Link href="/materi/baru" className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">+ Tambah materi</Link>
        </div>
        <p className="text-sm text-gray-600">
          Materi di sini hanya bisa dilihat dan dipakai oleh Anda. Setelah disimpan, materi muncul di pilihan Bab pada form Buat Soal.
        </p>
        {daftar.map((m) => {
          const bab = m.bab as Bab;
          return (
            <article key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="font-semibold">{bab.judul}</p>
                <p className="text-xs text-gray-500">
                  {bab.tp.length} TP · {bab.dalil.length} ayat/hadis · {bab.materi.join("").length.toLocaleString("id-ID")} huruf · diubah{" "}
                  {m.diubah.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/materi/${m.id}`} className="rounded border px-3 py-1 text-sm">Ubah</Link>
                <TombolHapusMateri id={m.id} judul={bab.judul} />
              </div>
            </article>
          );
        })}
      </section>
    </Kerangka>
  );
}
