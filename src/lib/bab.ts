// Sumber data bab: bab bawaan (src/data) atau materi sendiri milik guru (tabel `materi`, langkah 8).
// Sengaja BUKAN file "use server": fungsi di sini menerima guruId, jadi tidak boleh bisa dipanggil dari browser.
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { DAFTAR_BAB } from "@/data";
import type { Bab } from "./soal";

const POLA_MATERI = /^materi-(\d+)$/;

/** Bab untuk membuat soal. Materi sendiri hanya boleh milik `guruId` itu sendiri (aturan 3). */
export async function babMilik(babId: string, guruId: string): Promise<Bab | undefined> {
  const m = POLA_MATERI.exec(babId);
  if (!m) return DAFTAR_BAB[babId];
  const [row] = await db.select({ bab: materi.bab }).from(materi).where(and(eq(materi.id, Number(m[1])), eq(materi.guruId, guruId)));
  return row && { ...(row.bab as Bab), id: babId };
}

/** Pilihan bab di form: bab bawaan + materi milik guru. */
export async function daftarBabMilik(guruId: string) {
  const milik = await db
    .select({ id: materi.id, judul: sql<string>`${materi.bab}->>'judul'` })
    .from(materi)
    .where(eq(materi.guruId, guruId))
    .orderBy(desc(materi.diubah));
  return [
    ...Object.values(DAFTAR_BAB).map((b) => ({ id: b.id, judul: b.judul, sendiri: false })),
    ...milik.map((m) => ({ id: `materi-${m.id}`, judul: m.judul, sendiri: true })),
  ];
}

/** Bab sebuah set: salinan yang disimpan saat set dibuat; set lama (tanpa salinan) memakai bab bawaan. */
export const babDariSet = (h: { bab: unknown; babId: string }): Bab | undefined => (h.bab as Bab | null) ?? DAFTAR_BAB[h.babId];

/** Judul pendek untuk daftar ("Bab III"). */
export const judulPendek = (judul: string | null | undefined, babId: string) =>
  (judul ?? DAFTAR_BAB[babId]?.judul ?? babId).split(":")[0];
