"use server";

import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { daftarModel, tanyaAI } from "@/lib/ai";
import { bagiTahap, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, buatPermintaanKisi, buatSistem, type Pengaturan } from "@/lib/prompt";
import { arabTakTerverifikasi, korpusArab, periksaKisi, periksaSoal, rapikanSoal, ratakanKunci, samakanDenganKisi, terapkanBobot, type Bab, type BarisKisi, type Soal } from "@/lib/soal";
import { DAFTAR_BAB } from "@/data";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";
// Aturan 4: batas pembuatan per guru per hari (admin tidak dibatasi per guru),
// plus batas total seluruh web sebagai pengaman saldo AI. Set yang GAGAL tidak dihitung.
const BATAS_PER_GURU = 10;
const BATAS_TOTAL = 100;
const BATAS_GANTI_PER_SET = 30;

/** Jumlah set hari ini (WIB, mulai 00.00) yang tidak gagal; untuk satu guru atau seluruh web. */
async function hitungHariIni(guruId?: string) {
  const awalHariIni = sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(gte(hasilSoal.dibuat, awalHariIni), ne(hasilSoal.status, "gagal"), guruId ? eq(hasilSoal.guruId, guruId) : undefined));
  return n;
}

/** Sisa jatah hari ini untuk ditampilkan di form. batas = null berarti admin (tanpa batas per guru). */
export async function ambilJatah() {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  if (saya.peran === "admin") return { batas: null, terpakai: await hitungHariIni(saya.id) };
  return { batas: BATAS_PER_GURU, terpakai: await hitungHariIni(saya.id) };
}

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
async function tanyaDenganCadangan<T>(sistem: string, pengguna: string, slotUtama: number, pakaiCadangan: boolean, ambil: (data: unknown) => T) {
  const semuaModel = daftarModel();
  const urutan = pakaiCadangan ? [slotUtama, ...semuaModel.map((m) => m.slot).filter((s) => s !== slotUtama)] : [slotUtama];
  const catatan: string[] = [];
  for (const slot of urutan) {
    const nama = semuaModel.find((m) => m.slot === slot)?.nama ?? `model ${slot}`;
    try {
      const r = await tanyaAI(sistem, pengguna, slot);
      if (r.terpotong) throw new Error(`AI (${nama}) gagal: jawaban terpotong karena terlalu panjang.`);
      let hasil: T;
      try {
        hasil = ambil(JSON.parse(r.jawaban));
      } catch (e) {
        throw new Error(`AI (${nama}) gagal: ${e instanceof SyntaxError ? "jawaban bukan JSON yang valid." : (e as Error).message}`);
      }
      return { ...r, hasil, catatan };
    } catch (e) {
      const err = e as Error;
      catatan.push(err.name === "TimeoutError" ? `AI (${nama}) gagal: terlalu lama menjawab (timeout).` : pesanError(e));
      console.error("[AI gagal]", catatan.at(-1)); // terlihat di app.log hosting
    }
  }
  throw new Error(catatan.join(" | "));
}

/** Ambil daftar soal dari JSON jawaban AI; `perlu` = jumlah minimal (kelebihan dibuang). */
function ambilSoal(data: unknown, perlu = 1): Soal[] {
  const soal = (data as { soal?: unknown })?.soal;
  if (!Array.isArray(soal) || !soal.length) throw new Error("daftar soal tidak ditemukan.");
  if (soal.length < perlu) throw new Error(`hanya ${soal.length} dari ${perlu} soal.`);
  return (soal as Soal[]).slice(0, Math.max(perlu, 1));
}

/** Model AI yang terpasang di .env (nomor + nama saja, tanpa kunci), untuk pilihan di form. */
export async function ambilDaftarModel() {
  // Pilihan model hanya untuk admin; guru selalu memakai model utama (+ cadangan otomatis).
  if ((await penggunaSaatIni())?.peran !== "admin") return [];
  return daftarModel();
}

const SARAN_GURU = "silakan coba lagi beberapa saat; jika berulang, hubungi admin.";
const PESAN_GAGAL_GURU = `Gagal membuat soal, ${SARAN_GURU}`;

/** Mulai membuat soal di belakang layar, langsung kembalikan id-nya. Hasil dicek lewat cekHasil(). */
export async function mulaiBuatSoal(input: Pengaturan) {
  try {
    const saya = await penggunaSaatIni();
    if (!saya) return { ok: false as const, pesan: SESI_HABIS };
    const isian = bersihkanPengaturan(input);
    if (typeof isian === "string") return { ok: false as const, pesan: isian };
    // Guru tidak boleh memilih model atau mode bandingkan, walau dikirim dari browser: paksa model utama.
    const p = saya.peran === "admin" ? isian : { ...isian, modelSlot: daftarModel()[0]?.slot ?? 1, bandingkan: false };
    const bab = DAFTAR_BAB[p.babId];
    if (!bab) return { ok: false as const, pesan: "Bab tidak dikenal." };
    const model = daftarModel().find((m) => m.slot === p.modelSlot);
    if (!model) return { ok: false as const, pesan: "Model AI tidak dikenal." };

    if (saya.peran !== "admin" && (await hitungHariIni(saya.id)) >= BATAS_PER_GURU) {
      return { ok: false as const, pesan: `Jatah ${BATAS_PER_GURU} set soal Anda hari ini sudah habis. Silakan lanjutkan besok.` };
    }
    if ((await hitungHariIni()) >= BATAS_TOTAL) {
      return { ok: false as const, pesan: "Batas pembuatan soal seluruh web hari ini sudah tercapai. Silakan coba lagi besok atau hubungi admin." };
    }

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

/**
 * Langkah 6: susun kisi-kisi dulu (satu panggilan, AI melihat rencana semua soal sehingga skenario tidak berulang),
 * lalu buat soal bertahap (maks 10 per panggilan supaya jawaban AI tidak terpotong) mengikuti potongan kisi-kisinya.
 */
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

  const tanya = async <T,>(label: string, pengguna: string, ambil: (data: unknown) => T) => {
    permintaan.push(pengguna);
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, ambil);
    mentah.push(r.jawaban);
    info.tokenMasuk += r.token.masuk;
    info.tokenKeluar += r.token.keluar;
    info.catatan.push(...r.catatan.map((c) => `${label}: ${c}`));
    dipakai.add(r.model);
    return r.hasil;
  };

  try {
    await simpan({ pesan: "Menyusun kisi-kisi" });
    const kisi = await tanya("Kisi-kisi", buatPermintaanKisi(p), (d) => periksaKisi((d as { kisi?: unknown })?.kisi, p.jumlah, bab));
    await simpan({ kisi });

    let awal = 0;
    for (const [i, jumlah] of tahap.entries()) {
      // Tahap diisi berurutan PG → PGK → BS → URAIAN, sama dengan urutan kisi-kisi.
      const n = jumlah.PG + jumlah.PGK + jumlah.BS + jumlah.URAIAN;
      const baris = kisi.slice(awal, awal + n);
      awal += n;
      await simpan({ pesan: `Tahap ${i + 1} dari ${tahap.length}` });
      const pengguna = buatPengguna(p, jumlah, semua.map((s) => s.pertanyaan), "", baris);
      const soal = await tanya(`Tahap ${i + 1}`, pengguna, (d) => ambilSoal(d, baris.length));
      semua.push(...soal.map((s, j) => samakanDenganKisi(s, baris[j])));
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
    // TP/level yang diubah guru ikut ke baris kisi-kisinya, supaya kisi-kisi tetap cocok dengan soal.
    const kisi = set.h.kisi as BarisKisi[] | null;
    if (kisi?.[no]) kisi[no] = { ...kisi[no], tp: soal.tp, level: soal.level };
    await db.update(hasilSoal).set({ soal: set.soal, kisi }).where(eq(hasilSoal.id, set.h.id));
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
    const kisi = h.kisi as BarisKisi[] | null; // set lama: tanpa kisi-kisi
    const baris = kisi?.[no];
    const sistem = buatSistem(bab);
    const pengguna = buatPenggantiPengguna(h.pengaturan as Pengaturan, lama, set.soal, baris);
    const p = h.pengaturan as Pengaturan;
    // Model utama sama dengan set; cadangan dipakai kalau gagal (kecuali set hasil "Bandingkan semua model").
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, (d) => ambilSoal(d));
    // Prompt & jawaban mentah penggantian ikut disimpan (untuk perbandingan model, langkah 4).
    const catat = {
      jumlahGanti: h.jumlahGanti + 1,
      prompt: `${h.prompt}\n\n---\n\n[GANTI SOAL NOMOR ${no + 1} dengan ${r.model}]\n${pengguna}`,
      // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
      jawabanAi: JSON.stringify([...(h.jawabanAi?.startsWith("[") ? JSON.parse(h.jawabanAi) : [h.jawabanAi].filter(Boolean)), r.jawaban]),
    };
    const { stimulus, ...baru } = r.hasil[0];
    const [soal] = periksaSoal([baris ? samakanDenganKisi(baru, baris) : { ...baru, bentuk: lama.bentuk }], bab);
    ratakanKunci([soal]); // posisi kunci PG/PGK diacak
    if (p.bobot) terapkanBobot([soal], p.bobot);
    set.soal[no] = soal;
    // Skenario baru dicatat di baris kisi-kisi (indikator tetap).
    // (aturan 5: skenario berisi teks Arab yang tidak terverifikasi tidak dipakai)
    const skenario = String(stimulus ?? "").trim();
    const skenarioAman = skenario && !arabTakTerverifikasi(skenario, korpusArab(bab)).length;
    if (kisi && baris) kisi[no] = { ...baris, stimulus: skenarioAman ? skenario : baris.stimulus };
    await db.update(hasilSoal).set({ ...catat, soal: set.soal, kisi }).where(eq(hasilSoal.id, h.id));
    return { ok: true as const, soal };
  } catch (e) {
    const admin = (await penggunaSaatIni().catch(() => null))?.peran === "admin";
    return { ok: false as const, pesan: admin ? `Gagal mengganti: ${pesanError(e)}` : PESAN_GAGAL_GURU };
  }
}

/** Status + isi satu set, hanya untuk pemiliknya atau admin (aturan 3). Set orang lain dijawab "tidak ada". */
export async function cekHasil(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  const [h] = await db
    .select({ guruId: hasilSoal.guruId, status: hasilSoal.status, soal: hasilSoal.soal, kisi: hasilSoal.kisi, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat, info: hasilSoal.info })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h || !bolehAkses(h.guruId, saya)) return null;
  const { guruId, ...isi } = h; // id pemilik tidak perlu dikirim ke browser
  void guruId;
  const soal = h.soal as Soal[] | null;
  const kisi = h.kisi as BarisKisi[] | null;
  if (saya.peran !== "admin") {
    // Guru tidak menerima info teknis (model, waktu, token, catatan cadangan) maupun rincian error penyedia AI.
    // (halaman sudah menambahkan awalan "Gagal membuat soal:")
    return { ...isi, soal, kisi, model: null, info: null, pesan: h.status === "gagal" ? SARAN_GURU : h.pesan };
  }
  return { ...isi, soal, kisi, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number; catatan?: string[] } | null };
}
