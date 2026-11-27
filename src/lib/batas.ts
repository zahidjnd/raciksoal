// Batas pemakaian AI dari database (aturan 4). SENGAJA bukan file "use server": fungsi di sini menerima id guru, jadi
// tidak boleh bisa dipanggil dari browser (aturan 3). Angka & aturan murni ada di batas-nilai.ts.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { batasGuru, pengaturanWeb } from "@/db/schema";
import { gabungBatas, pesanBatas, pesanRem, rapikanBawaan, rapikanKhusus, type JenisBatas } from "./batas-nilai";
import { hitungBulanIni, hitungHariIni, hitungPemakaian } from "./pemakaian";

/** Batas bawaan semua guru + rem darurat (admin yang mengatur; belum diatur → NORMAL). */
export async function ambilBawaan() {
  const [r] = await db.select({ nilai: pengaturanWeb.nilai }).from(pengaturanWeb).where(eq(pengaturanWeb.kunci, "batas"));
  return rapikanBawaan(r?.nilai);
}

/** Batas yang berlaku untuk satu guru (khusus guru → bawaan → NORMAL) + status rem darurat. */
export async function ambilBatas(guruId: string) {
  const [bawaan, [k]] = await Promise.all([ambilBawaan(), db.select().from(batasGuru).where(eq(batasGuru.guruId, guruId))]);
  const { angka, khusus } = gabungBatas(bawaan, k ? rapikanKhusus(k.nilai) : null, k?.sampai ?? null);
  return { angka, khusus, web: bawaan.web, rem: bawaan.rem, remPesan: bawaan.remPesan };
}

type Q = Parameters<typeof hitungHariIni>[1];

/**
 * Satu pintu semua pemeriksaan jatah. Kembalian: pesan penolakan untuk guru, atau null = boleh.
 * Admin tidak dibatasi (dan tidak kena rem darurat, supaya tetap bisa menguji). `q` = transaksi bila dipanggil di dalamnya.
 * "set" memeriksa batas harian lalu bulanan; selain itu harian.
 */
export async function tolakBila(saya: { id: string; peran: string | null }, jenis: "set" | "ubah" | "analisa" | "halaman", q?: Q) {
  if (saya.peran === "admin") return null;
  const b = await ambilBatas(saya.id);
  if (b.rem) return pesanRem(b.remPesan);
  const harian = jenis === "set" ? await hitungHariIni(saya.id, q) : await hitungPemakaian(saya.id, jenis, q);
  const tolak = pesanBatas(jenis as JenisBatas, b.angka[jenis], harian, b.khusus);
  if (tolak || jenis !== "set") return tolak;
  return pesanBatas("bulan", b.angka.bulan, await hitungBulanIni(saya.id, q), b.khusus);
}
