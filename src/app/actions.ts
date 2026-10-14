"use server";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { tesData } from "@/db/schema";
import { tanyaAI } from "@/lib/ai";

export async function simpanDanBaca(isi: string) {
  try {
    await db.insert(tesData).values({ isi: isi.slice(0, 200) || "(kosong)" });
    const baris = await db.select().from(tesData).orderBy(desc(tesData.id)).limit(5);
    return { ok: true as const, baris };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal ke database: ${(e as Error).message}` };
  }
}

// ponytail: batas harian disimpan di memori (hilang saat server restart).
// Diganti batas per guru di database setelah ada login (langkah 5).
const BATAS_AI_PER_HARI = 20;
let hitung = { tanggal: "", jumlah: 0 };

export async function tesAI() {
  const hariIni = new Date().toISOString().slice(0, 10);
  if (hitung.tanggal !== hariIni) hitung = { tanggal: hariIni, jumlah: 0 };
  if (hitung.jumlah >= BATAS_AI_PER_HARI) {
    return { ok: false as const, pesan: "Batas tes AI hari ini sudah habis." };
  }
  hitung.jumlah++;
  try {
    const hasil = await tanyaAI("Sebutkan nama surah ke-1 dalam Al-Qur'an dan artinya, dalam satu kalimat.");
    return { ok: true as const, ...hasil };
  } catch (e) {
    const err = e as Error;
    const pesan = err.name === "TimeoutError" ? "AI terlalu lama menjawab (timeout)." : err.message;
    return { ok: false as const, pesan };
  }
}
