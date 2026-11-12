"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { BATAS_MATERI, keIsian, rapikanMateri, type IsianMateri } from "@/lib/materi";
import { gambarMilik } from "@/lib/bab";
import { mushaf } from "@/lib/mushaf";
import { cariDalil } from "@/lib/hadis";
import { penggunaSaatIni } from "@/lib/sesi";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";

/** Langkah 9: "QS An-Nur: 2" → teks Arab dari data mushaf. */
export async function ambilAyat(rujukan: string) {
  if (!(await penggunaSaatIni())) return { ok: false as const, pesan: SESI_HABIS };
  const r = mushaf().ambil(String(rujukan ?? "").slice(0, 100));
  return typeof r === "string" ? { ok: false as const, pesan: r } : { ok: true as const, ...r };
}

/**
 * Langkah 9: cocokkan teks Arab dari file Word/PowerPoint ke mushaf. Per teks: ayat resmi + sumbernya,
 * "basmalah" (diabaikan), atau null (tidak ditemukan: hadis/doa, tetap usulan yang wajib diperiksa guru).
 */
export async function cocokkanAyat(daftar: string[]) {
  if (!(await penggunaSaatIni())) return null;
  const m = mushaf();
  return (Array.isArray(daftar) ? daftar : []).slice(0, 200).map((a) => {
    const arab = String(a ?? "").slice(0, 5000);
    return m.basmalah(arab) ? ("basmalah" as const) : m.cari(arab);
  });
}

/**
 * Simpan materi baru (id = null) atau ubah materi milik sendiri. Aturan 3: hanya materi milik guru yang masuk.
 * Mengembalikan isian yang sudah dirapikan (teks Arab tak terverifikasi dibuang) supaya form menampilkan isi sebenarnya.
 */
export async function simpanMateri(id: number | null, isian: IsianMateri) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  // Mode "bahasa": hanya ayat yang dicocokkan (hadis di teks Bahasa Arab tetap isi pelajaran).
  const r = rapikanMateri(isian, "", isian?.teksArab === "bahasa" ? mushaf().cari : cariDalil);
  if (typeof r === "string") return { ok: false as const, pesan: r };
  // Aturan 3: hanya gambar milik guru sendiri yang boleh masuk materinya (id gambar guru lain dibuang diam-diam).
  if (r.bab.gambar) {
    const milik = await gambarMilik(r.bab.gambar.map((g) => g.id), saya.id);
    r.bab.gambar = r.bab.gambar.filter((g) => milik.has(g.id));
    if (!r.bab.gambar.length) delete r.bab.gambar;
  }

  let idBaru = id;
  if (id) {
    const [ubah] = await db
      .update(materi)
      .set({ bab: r.bab, diubah: sql`now()` })
      .where(and(eq(materi.id, Number(id)), eq(materi.guruId, saya.id)))
      .returning({ id: materi.id });
    if (!ubah) return { ok: false as const, pesan: "Materi tidak ditemukan." };
  } else {
    const [{ n }] = await db.select({ n: count() }).from(materi).where(eq(materi.guruId, saya.id));
    if (n >= BATAS_MATERI.perGuru) return { ok: false as const, pesan: `Maksimal ${BATAS_MATERI.perGuru} materi per guru. Hapus materi yang tidak dipakai.` };
    [{ id: idBaru }] = await db.insert(materi).values({ guruId: saya.id, bab: r.bab }).returning({ id: materi.id });
  }
  revalidatePath("/materi");
  return { ok: true as const, id: idBaru!, isian: keIsian(r.bab), dihapus: r.dihapus };
}

/** Hapus materi milik sendiri. Set soal yang sudah dibuat tetap utuh (menyimpan salinan materinya). */
export async function hapusMateri(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const [hapus] = await db
    .delete(materi)
    .where(and(eq(materi.id, Number(id)), eq(materi.guruId, saya.id)))
    .returning({ id: materi.id });
  if (!hapus) return { ok: false as const, pesan: "Materi tidak ditemukan." };
  revalidatePath("/materi");
  return { ok: true as const };
}
