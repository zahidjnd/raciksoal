// Hitungan pemakaian & preferensi guru dari database. SENGAJA bukan file "use server": fungsi yang diekspor dari file
// server action bisa dipanggil browser dengan guruId siapa pun (aturan 3). Dipakai actions.ts dan halaman Akun/Set baru.
import { and, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { awalBulanIni, awalHariIni, db } from "@/db";
import { hasilSoal, pemakaianAi, preferensiGuru } from "@/db/schema";
import { PREFERENSI_AWAL, rapikanPreferensi, type Preferensi } from "./preferensi";

/** Jumlah set hari ini (WIB, mulai 00.00) yang tidak gagal; untuk satu guru atau seluruh web. */
export async function hitungHariIni(guruId?: string, q: Pick<typeof db, "select"> = db) {
  const [{ n }] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(gte(hasilSoal.dibuat, awalHariIni), ne(hasilSoal.status, "gagal"), guruId ? eq(hasilSoal.guruId, guruId) : undefined));
  return n;
}

/**
 * Pemakaian AI di luar pembuatan set hari ini (WIB) oleh satu guru: Ganti/Ubah/Tambah soal, analisa materi, atau
 * halaman PDF yang dibaca AI (0.31.0; dulu "ubah" = semua selain analisa, jadi halaman PDF ikut memakan jatah Ganti).
 */
export async function hitungPemakaian(guruId: string, jenis: "ubah" | "analisa" | "halaman", q: Pick<typeof db, "select"> = db) {
  const [{ n }] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(pemakaianAi)
    .where(and(eq(pemakaianAi.guruId, guruId), gte(pemakaianAi.waktu, awalHariIni), jenis === "ubah" ? inArray(pemakaianAi.jenis, ["ganti", "ubah", "tambah"]) : eq(pemakaianAi.jenis, jenis)));
  return n;
}

/** Set bulan ini (sejak tanggal 1, WIB) yang tidak gagal; dasar batas set per bulan. */
export async function hitungBulanIni(guruId?: string, q: Pick<typeof db, "select"> = db) {
  const [{ n }] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(gte(hasilSoal.dibuat, awalBulanIni), ne(hasilSoal.status, "gagal"), guruId ? eq(hasilSoal.guruId, guruId) : undefined));
  return n;
}

/** Set 30 hari terakhir (tidak gagal) satu guru, untuk halaman Akun. */
export async function hitungSebulan(guruId: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(eq(hasilSoal.guruId, guruId), gte(hasilSoal.dibuat, sql`now() - interval '30 days'`), ne(hasilSoal.status, "gagal")));
  return n;
}

/** Preferensi milik guru ini saja (aturan 3). Belum pernah disimpan → nilai bawaan. */
export async function ambilPreferensi(guruId: string): Promise<Preferensi> {
  const [r] = await db.select({ nilai: preferensiGuru.nilai }).from(preferensiGuru).where(eq(preferensiGuru.guruId, guruId));
  return r ? rapikanPreferensi(r.nilai) : PREFERENSI_AWAL;
}
