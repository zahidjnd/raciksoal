"use server";

import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { tanyaAI } from "@/lib/ai";
import { bagiTahap, bersihkanPengaturan, buatPengguna, buatSistem, type Pengaturan } from "@/lib/prompt";
import { periksaSoal, ratakanKunci, type Bab, type Soal } from "@/lib/soal";
import bab3 from "@/data/qurdis11-bab3.json";

const DAFTAR_BAB: Record<string, Bab> = { [bab3.id]: bab3 };
// ponytail: batas harian untuk seluruh web (belum ada login). Jadi per guru di langkah 5.
const BATAS_PER_HARI = 30;

const pesanError = (e: unknown) => {
  const err = e as Error;
  return (err.cause as Error)?.message ?? err.message;
};

/** Mulai membuat soal di belakang layar, langsung kembalikan id-nya. Hasil dicek lewat cekHasil(). */
export async function mulaiBuatSoal(input: Pengaturan) {
  try {
    const p = bersihkanPengaturan(input);
    if (typeof p === "string") return { ok: false as const, pesan: p };
    const bab = DAFTAR_BAB[p.babId];
    if (!bab) return { ok: false as const, pesan: "Bab tidak dikenal." };

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(hasilSoal)
      .where(gte(hasilSoal.dibuat, sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`));
    if (n >= BATAS_PER_HARI) return { ok: false as const, pesan: `Batas ${BATAS_PER_HARI} kali pembuatan soal hari ini sudah habis.` };

    const [baris] = await db
      .insert(hasilSoal)
      .values({ status: "proses", babId: bab.id, pengaturan: p, model: process.env.AI_MODEL, pesan: "Menyiapkan..." })
      .returning({ id: hasilSoal.id });

    void kerjakan(baris.id, bab, p); // sengaja tidak ditunggu, supaya koneksi browser tidak putus
    return { ok: true as const, id: baris.id };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal memulai: ${pesanError(e)}` };
  }
}

/** Buat soal bertahap (maks 10 soal per panggilan AI) supaya jawaban AI tidak terpotong, lalu gabungkan. */
async function kerjakan(id: number, bab: Bab, p: Pengaturan) {
  const sistem = buatSistem(bab);
  const tahap = bagiTahap(p.jumlah);
  const permintaan: string[] = [];
  const mentah: string[] = [];
  const semua: Soal[] = [];
  // Prompt & jawaban mentah setiap tahap disimpan untuk perbandingan model (langkah 4).
  const simpan = (data: Partial<typeof hasilSoal.$inferInsert>) =>
    db
      .update(hasilSoal)
      .set({ prompt: [sistem, ...permintaan].join("\n\n---\n\n"), jawabanAi: JSON.stringify(mentah), ...data })
      .where(eq(hasilSoal.id, id));

  try {
    for (const [i, jumlah] of tahap.entries()) {
      await simpan({ pesan: `Tahap ${i + 1} dari ${tahap.length}` });
      const pengguna = buatPengguna(p, jumlah, semua.map((s) => s.pertanyaan));
      permintaan.push(pengguna);
      const { jawaban, terpotong } = await tanyaAI(sistem, pengguna);
      mentah.push(jawaban);
      if (terpotong) throw new Error(`Jawaban AI di tahap ${i + 1} terpotong karena terlalu panjang.`);
      const data = JSON.parse(jawaban);
      if (!Array.isArray(data?.soal)) throw new Error(`Format jawaban AI di tahap ${i + 1} tidak sesuai (daftar soal tidak ditemukan).`);
      semua.push(...(data.soal as Soal[]));
    }
    const soal = periksaSoal(semua, bab);
    ratakanKunci(soal);
    await simpan({ status: "selesai", soal, pesan: null });
  } catch (e) {
    const err = e as Error;
    const pesan = err.name === "TimeoutError" ? "AI terlalu lama menjawab (timeout)." : pesanError(e);
    await simpan({ status: "gagal", pesan }).catch(() => {});
  }
}

// ponytail: siapa pun yang tahu id bisa melihat hasil. Batasi per guru setelah ada login (langkah 5).
export async function cekHasil(id: number) {
  const [h] = await db
    .select({ status: hasilSoal.status, soal: hasilSoal.soal, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h) return null;
  return { ...h, soal: h.soal as Soal[] | null };
}
