"use server";

import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { daftarModel, tanyaAI } from "@/lib/ai";
import { bagiTahap, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, buatSistem, type Pengaturan } from "@/lib/prompt";
import { periksaSoal, rapikanSoal, ratakanKunci, terapkanBobot, type Bab, type Soal } from "@/lib/soal";
import { DAFTAR_BAB } from "@/data";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";
// ponytail: batas harian untuk seluruh web (belum ada login). Jadi per guru di langkah 5.
const BATAS_PER_HARI = 30;
const BATAS_GANTI_PER_SET = 30;

// Alasan error yang bisa dibaca. Beberapa error (mis. database mati) tidak punya teks pesan, jadi ambil kodenya.
const pesanError = (e: unknown) => {
  const err = e as Error & { code?: string; errors?: Error[] };
  const alasan = (err.cause as Error)?.message || err.message || err.errors?.[0]?.message || err.code || String(e);
  return /ECONNREFUSED/.test(alasan) ? `database tidak bisa dihubungi (${alasan})` : alasan;
};

/**
 * Cadangan otomatis (fallback): coba model utama dulu; kalau gagal (saldo habis, kunci ditolak, server sibuk,
 * timeout, jawaban rusak), pindah ke model berikutnya sesuai urutan nomor di .env.
 * Mode "Bandingkan semua model" tidak memakai cadangan.
 */
async function tanyaDenganCadangan(sistem: string, pengguna: string, slotUtama: number, pakaiCadangan: boolean) {
  const semuaModel = daftarModel();
  const urutan = pakaiCadangan ? [slotUtama, ...semuaModel.map((m) => m.slot).filter((s) => s !== slotUtama)] : [slotUtama];
  const catatan: string[] = [];
  for (const slot of urutan) {
    const nama = semuaModel.find((m) => m.slot === slot)?.nama ?? `model ${slot}`;
    try {
      const r = await tanyaAI(sistem, pengguna, slot);
      if (r.terpotong) throw new Error(`AI (${nama}) gagal: jawaban terpotong karena terlalu panjang.`);
      let data;
      try {
        data = JSON.parse(r.jawaban);
      } catch {
        throw new Error(`AI (${nama}) gagal: jawaban bukan JSON yang valid.`);
      }
      if (!Array.isArray(data?.soal) || !data.soal.length) throw new Error(`AI (${nama}) gagal: daftar soal tidak ditemukan.`);
      return { ...r, soal: data.soal as Soal[], catatan };
    } catch (e) {
      const err = e as Error;
      catatan.push(err.name === "TimeoutError" ? `AI (${nama}) gagal: terlalu lama menjawab (timeout).` : pesanError(e));
      console.error("[AI gagal]", catatan.at(-1)); // terlihat di app.log hosting
    }
  }
  throw new Error(catatan.join(" | "));
}

/** Model AI yang terpasang di .env (nomor + nama saja, tanpa kunci), untuk pilihan di form. */
export async function ambilDaftarModel() {
  if (!(await penggunaSaatIni())) return [];
  return daftarModel();
}

/** Mulai membuat soal di belakang layar, langsung kembalikan id-nya. Hasil dicek lewat cekHasil(). */
export async function mulaiBuatSoal(input: Pengaturan) {
  try {
    const saya = await penggunaSaatIni();
    if (!saya) return { ok: false as const, pesan: SESI_HABIS };
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
      .values({ status: "proses", guruId: saya.id, babId: bab.id, pengaturan: p, model: model.nama, pesan: "Menyiapkan..." })
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
  const dipakai = new Set<string>(); // model yang benar-benar menghasilkan soal (bisa lebih dari satu kalau cadangan dipakai)
  const info = { detik: 0, tokenMasuk: 0, tokenKeluar: 0, catatan: [] as string[] };
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
      const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan);
      mentah.push(r.jawaban);
      info.tokenMasuk += r.token.masuk;
      info.tokenKeluar += r.token.keluar;
      info.catatan.push(...r.catatan.map((c) => `Tahap ${i + 1}: ${c}`));
      dipakai.add(r.model);
      semua.push(...r.soal);
    }
    const soal = periksaSoal(semua, bab);
    ratakanKunci(soal);
    if (p.bobot) terapkanBobot(soal, p.bobot);
    await simpan({ status: "selesai", soal, pesan: null, model: [...dipakai].join(" + ") });
  } catch (e) {
    await simpan({ status: "gagal", pesan: pesanError(e) }).catch(() => {});
  }
}

/**
 * Ambil set soal yang sudah selesai + soal nomor `no` (mulai 0), HANYA kalau pengguna yang masuk boleh mengaksesnya
 * (aturan 3: pemilik atau admin). Mengembalikan pesan kalau tidak valid.
 */
async function ambilSet(id: number, no: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return SESI_HABIS;
  const [h] = await db.select().from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  // Set milik guru lain dijawab "tidak ditemukan", supaya keberadaannya pun tidak bocor.
  if (!h || !bolehAkses(h.guruId, saya) || h.status !== "selesai") return "Set soal tidak ditemukan atau belum selesai.";
  const soal = h.soal as Soal[];
  const bab = DAFTAR_BAB[h.babId];
  if (!Number.isInteger(no) || no < 0 || no >= soal.length || !bab) return "Nomor soal tidak valid.";
  return { h, soal, bab };
}

/** Simpan hasil edit guru untuk satu soal (hanya pemilik/admin, lewat ambilSet). Penjaga teks Arab tetap berlaku. */
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
    const p = h.pengaturan as Pengaturan;
    // Model utama sama dengan set; cadangan dipakai kalau gagal (kecuali set hasil "Bandingkan semua model").
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan);
    // Prompt & jawaban mentah penggantian ikut disimpan (untuk perbandingan model, langkah 4).
    const catat = {
      jumlahGanti: h.jumlahGanti + 1,
      prompt: `${h.prompt}\n\n---\n\n[GANTI SOAL NOMOR ${no + 1} dengan ${r.model}]\n${pengguna}`,
      // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
      jawabanAi: JSON.stringify([...(h.jawabanAi?.startsWith("[") ? JSON.parse(h.jawabanAi) : [h.jawabanAi].filter(Boolean)), r.jawaban]),
    };
    const [soal] = periksaSoal([{ ...r.soal[0], bentuk: lama.bentuk }], bab);
    ratakanKunci([soal]); // posisi kunci PG/PGK diacak
    if (p.bobot) terapkanBobot([soal], p.bobot);
    set.soal[no] = soal;
    await db.update(hasilSoal).set({ ...catat, soal: set.soal }).where(eq(hasilSoal.id, h.id));
    return { ok: true as const, soal };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal mengganti: ${pesanError(e)}` };
  }
}

/** Status + isi satu set, hanya untuk pemiliknya atau admin (aturan 3). Set orang lain dijawab "tidak ada". */
export async function cekHasil(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  const [h] = await db
    .select({ guruId: hasilSoal.guruId, status: hasilSoal.status, soal: hasilSoal.soal, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat, info: hasilSoal.info })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h || !bolehAkses(h.guruId, saya)) return null;
  const { guruId, ...isi } = h; // id pemilik tidak perlu dikirim ke browser
  void guruId;
  return { ...isi, soal: h.soal as Soal[] | null, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number; catatan?: string[] } | null };
}
