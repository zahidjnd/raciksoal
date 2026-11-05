// Sumber data bab: materi milik guru (tabel `materi`, langkah 8). Bab bawaan (src/data) tidak lagi bisa dipilih
// (keputusan pemilik 2026-10-20: Bab III hanya uji coba), tapi datanya tetap dipakai untuk membuka set lama.
// Sengaja BUKAN file "use server": fungsi di sini menerima guruId, jadi tidak boleh bisa dipanggil dari browser.
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { DAFTAR_BAB } from "@/data";
import type { Bab } from "./soal";

const POLA_MATERI = /^materi-(\d+)$/;

/** Bab untuk membuat soal: hanya materi milik `guruId` itu sendiri (aturan 3). */
export async function babMilik(babId: string, guruId: string): Promise<Bab | undefined> {
  const m = POLA_MATERI.exec(babId);
  if (!m) return undefined;
  const [row] = await db.select({ bab: materi.bab }).from(materi).where(and(eq(materi.id, Number(m[1])), eq(materi.guruId, guruId)));
  return row && { ...(row.bab as Bab), id: babId };
}

/** Materi milik guru untuk pilihan "materi sebelumnya" di halaman utama, terbaru dulu. */
export async function daftarBabMilik(guruId: string) {
  const milik = await db
    .select({
      id: materi.id,
      judul: sql<string>`${materi.bab}->>'judul'`,
      mapel: sql<string | null>`${materi.bab}->>'mapel'`,
      kelas: sql<string | null>`${materi.bab}->>'kelas'`,
      // jumlah huruf isi materi (untuk peringatan "materi terlalu sedikit")
      huruf: sql<number>`coalesce((select sum(length(x)) from jsonb_array_elements_text(${materi.bab}->'materi') x), 0)::int`,
      diubah: materi.diubah,
    })
    .from(materi)
    .where(eq(materi.guruId, guruId))
    .orderBy(desc(materi.diubah));
  // Materi lama tanpa mapel = Al-Qur'an Hadis kelas XI (sama dengan identitasBab).
  return milik.map((m) => ({ id: `materi-${m.id}`, judul: m.judul, mapel: m.mapel || "Al-Qur'an Hadis", kelas: m.kelas || "XI", huruf: m.huruf, diubah: m.diubah }));
}

/** Bab sebuah set: salinan yang disimpan saat set dibuat; set lama (tanpa salinan) memakai bab bawaan. */
export const babDariSet = (h: { bab: unknown; babId: string }): Bab | undefined => (h.bab as Bab | null) ?? DAFTAR_BAB[h.babId];

/** Judul pendek untuk daftar ("Bab III"). */
export const judulPendek = (judul: string | null | undefined, babId: string) =>
  (judul ?? DAFTAR_BAB[babId]?.judul ?? babId).split(":")[0];
