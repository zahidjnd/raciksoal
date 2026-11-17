import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { keIsian, type IsianMateri } from "@/lib/materi";
import { wajibMasuk } from "@/lib/sesi";
import { ambilPreferensi } from "@/lib/pemakaian";
import type { Bab } from "@/lib/soal";
import { Kerangka } from "../../kepala";
import { FormMateri } from "../form";

/** /materi/baru atau /materi/12 (hanya materi milik sendiri, aturan 3). */
export default async function UbahMateri({ params }: { params: Promise<{ id: string }> }) {
  const p = await wajibMasuk();
  const { id } = await params;
  let awal: IsianMateri | null = null;
  if (id !== "baru") {
    const [m] = /^\d+$/.test(id) ? await db.select().from(materi).where(and(eq(materi.id, Number(id)), eq(materi.guruId, p.id))) : [];
    if (!m) notFound();
    awal = keIsian(m.bab as Bab);
  }
  return (
    <Kerangka p={p}>
      <FormMateri id={id === "baru" ? null : Number(id)} awal={awal} bawaan={await ambilPreferensi(p.id)} />
    </Kerangka>
  );
}
