// Nama madrasah di kop lembar soal Word, diatur admin sekali (/admin/pengaturan). Hanya untuk server.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pengaturanWeb } from "@/db/schema";

/** Nama di kop asli format AFTS; dipakai selama admin belum mengubahnya. */
export const NAMA_MADRASAH_BAWAAN = "MADRASAH ALIYAH AL-FATAH";

export async function ambilNamaMadrasah() {
  const [r] = await db.select({ nilai: pengaturanWeb.nilai }).from(pengaturanWeb).where(eq(pengaturanWeb.kunci, "madrasah"));
  return String((r?.nilai as { nama?: string } | undefined)?.nama ?? "").trim() || NAMA_MADRASAH_BAWAAN;
}
