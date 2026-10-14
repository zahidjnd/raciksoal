"use server";

import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { daftarModel, tanyaAI } from "@/lib/ai";
import { bagiTahap, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, buatSistem, type Pengaturan } from "@/lib/prompt";
import { periksaSoal, rapikanSoal, ratakanKunci, terapkanBobot, type Bab, type Soal } from "@/lib/soal";
import { DAFTAR_BAB } from "@/data";
// ponytail: batas harian untuk seluruh web (belum ada login). Jadi per guru di langkah 5.
const BATAS_PER_HARI = 30;
const BATAS_GANTI_PER_SET = 30;

const pesanError = (e: unknown) => {
  const err = e as Error;
  return (err.cause as Error)?.message ?? err.message;
};

/** Model AI yang terpasang di .env (nomor + nama saja, tanpa kunci), untuk pilihan di form. */
export async function ambilDaftarModel() {
  return daftarModel();
}

/** Mulai membuat soal di belakang layar, langsung kembalikan id-nya. Hasil dicek lewat cekHasil(). */
export async function mulaiBuatSoal(input: Pengaturan) {
  try {
    const p = bersihkanPengaturan(input);
    if (typeof p === "string") return { ok: false as const, pesan: p };
    const bab = DAFTAR_BAB[p.babId];
    if (!bab) return { ok: false as const, pesan: "Bab tidak dikenal." };
    const model = daftarModel().find((m) => m.slot === p.modelSlot);
    if (!model) return { ok: false as const, pesan: "Model AI tidak dikenal." };

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(hasilSoal)
      .where(gte(hasilSoal.dibuat, sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`));
    if (n >= BATAS_PER_HARI) return { ok: false as const, pesan: `Batas ${BATAS_PER_HARI} kali pembuatan soal hari ini sudah habis.` };

    const [baris] = await db
      .insert(hasilSoal)
      .values({ status: "proses", babId: bab.id, pengaturan: p, model: model.nama, pesan: "Menyiapkan..." })
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
  const mulai = Date.now();
  const info = { detik: 0, tokenMasuk: 0, tokenKeluar: 0 };
  // Prompt, jawaban mentah, waktu, dan token setiap tahap disimpan untuk perbandingan model (langkah 4).
  const simpan = (data: Partial<typeof hasilSoal.$inferInsert>) =>
    db
      .update(hasilSoal)
      .set({
        prompt: [sistem, ...permintaan].join("\n\n---\n\n"),
        jawabanAi: JSON.stringify(mentah),
        info: { ...info, detik: Math.round((Date.now() - mulai) / 1000) },
        ...data,
      })
      .where(eq(hasilSoal.id, id));

  try {
    for (const [i, jumlah] of tahap.entries()) {
      await simpan({ pesan: `Tahap ${i + 1} dari ${tahap.length}` });
      const pengguna = buatPengguna(p, jumlah, semua.map((s) => s.pertanyaan));
      permintaan.push(pengguna);
      const { jawaban, terpotong, token } = await tanyaAI(sistem, pengguna, p.modelSlot);
      mentah.push(jawaban);
      info.tokenMasuk += token.masuk;
      info.tokenKeluar += token.keluar;
      if (terpotong) throw new Error(`Jawaban AI di tahap ${i + 1} terpotong karena terlalu panjang.`);
      const data = JSON.parse(jawaban);
      if (!Array.isArray(data?.soal)) throw new Error(`Format jawaban AI di tahap ${i + 1} tidak sesuai (daftar soal tidak ditemukan).`);
      semua.push(...(data.soal as Soal[]));
    }
    const soal = periksaSoal(semua, bab);
    ratakanKunci(soal);
    if (p.bobot) terapkanBobot(soal, p.bobot);
    await simpan({ status: "selesai", soal, pesan: null });
  } catch (e) {
    const err = e as Error;
    const pesan = err.name === "TimeoutError" ? "AI terlalu lama menjawab (timeout)." : pesanError(e);
    await simpan({ status: "gagal", pesan }).catch(() => {});
  }
}

/** Ambil set soal yang sudah selesai + soal nomor `no` (mulai 0). Mengembalikan pesan kalau tidak valid. */
async function ambilSet(id: number, no: number) {
  const [h] = await db.select().from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  if (!h || h.status !== "selesai") return "Set soal tidak ditemukan atau belum selesai.";
  const soal = h.soal as Soal[];
  const bab = DAFTAR_BAB[h.babId];
  if (!Number.isInteger(no) || no < 0 || no >= soal.length || !bab) return "Nomor soal tidak valid.";
  return { h, soal, bab };
}

// ponytail: siapa pun yang tahu id bisa mengedit. Batasi per guru setelah ada login (langkah 5).
/** Simpan hasil edit guru untuk satu soal. Penjaga teks Arab tetap berlaku untuk editan. */
export async function simpanSoal(id: number, no: number, isian: Soal) {
  try {
    const set = await ambilSet(id, no);
    if (typeof set === "string") return { ok: false as const, pesan: set };
    const [soal] = periksaSoal([rapikanSoal(isian, set.soal[no].bentuk)], set.bab);
    set.soal[no] = soal;
    await db.update(hasilSoal).set({ soal: set.soal }).where(eq(hasilSoal.id, set.h.id));
    return { ok: true as const, soal };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal menyimpan: ${pesanError(e)}` };
  }
}

/** Minta AI membuat 1 soal pengganti (bentuk, level, TP sama; skenario berbeda dari semua soal di set). */
export async function gantiSatuSoal(id: number, no: number) {
  try {
    const set = await ambilSet(id, no);
    if (typeof set === "string") return { ok: false as const, pesan: set };
    const { h, bab } = set;
    if (h.jumlahGanti >= BATAS_GANTI_PER_SET) return { ok: false as const, pesan: `Batas ${BATAS_GANTI_PER_SET} kali ganti soal untuk set ini sudah habis.` };

    const lama = set.soal[no];
    const sistem = buatSistem(bab);
    const pengguna = buatPenggantiPengguna(h.pengaturan as Pengaturan, lama, set.soal);
    const { jawaban, terpotong } = await tanyaAI(sistem, pengguna, (h.pengaturan as Pengaturan).modelSlot ?? 1); // model sama dengan set
    // Prompt & jawaban mentah penggantian ikut disimpan (untuk perbandingan model, langkah 4).
    const catat = {
      jumlahGanti: h.jumlahGanti + 1,
      prompt: `${h.prompt}\n\n---\n\n[GANTI SOAL NOMOR ${no + 1}]\n${pengguna}`,
      // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
      jawabanAi: JSON.stringify([...(h.jawabanAi?.startsWith("[") ? JSON.parse(h.jawabanAi) : [h.jawabanAi].filter(Boolean)), jawaban]),
    };
    const baru = !terpotong && (JSON.parse(jawaban)?.soal?.[0] as Soal | undefined);
    if (!baru) {
      await db.update(hasilSoal).set(catat).where(eq(hasilSoal.id, h.id));
      return { ok: false as const, pesan: "Jawaban AI tidak sesuai format. Coba lagi." };
    }
    const [soal] = periksaSoal([{ ...baru, bentuk: lama.bentuk }], bab);
    ratakanKunci([soal]); // posisi kunci PG/PGK diacak
    const bobot = (h.pengaturan as Pengaturan).bobot;
    if (bobot) terapkanBobot([soal], bobot);
    set.soal[no] = soal;
    await db.update(hasilSoal).set({ ...catat, soal: set.soal }).where(eq(hasilSoal.id, h.id));
    return { ok: true as const, soal };
  } catch (e) {
    const err = e as Error;
    return { ok: false as const, pesan: err.name === "TimeoutError" ? "AI terlalu lama menjawab (timeout)." : `Gagal mengganti: ${pesanError(e)}` };
  }
}

// ponytail: siapa pun yang tahu id bisa melihat hasil. Batasi per guru setelah ada login (langkah 5).
export async function cekHasil(id: number) {
  const [h] = await db
    .select({ status: hasilSoal.status, soal: hasilSoal.soal, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat, info: hasilSoal.info })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h) return null;
  return { ...h, soal: h.soal as Soal[] | null, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number } | null };
}
