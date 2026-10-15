import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { keIsian, type IsianMateri } from "@/lib/materi";
import { wajibMasuk } from "@/lib/sesi";
import type { Bab } from "@/lib/soal";
import { Kepala } from "../../kepala";
import { FormMateri } from "../form";

const KOSONG: IsianMateri = { judul: "", tp: "", isi: "", dalil: [], diverifikasi: false };

/** /materi/baru atau /materi/12 (hanya materi milik sendiri, aturan 3). */
export default async function UbahMateri({ params }: { params: Promise<{ id: string }> }) {
  const p = await wajibMasuk();
  const { id } = await params;
  let awal = KOSONG;
  if (id !== "baru") {
    const [m] = /^\d+$/.test(id) ? await db.select().from(materi).where(and(eq(materi.id, Number(id)), eq(materi.guruId, p.id))) : [];
    if (!m) notFound();
    awal = keIsian(m.bab as Bab);
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <FormMateri id={id === "baru" ? null : Number(id)} awal={awal} />
    </main>
  );
}
