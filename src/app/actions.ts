"use server";

import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { daftarModel, tanyaAI } from "@/lib/ai";
import { bagiTahap, bersihkanInstruksi, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, buatPermintaanKisi, buatSistem, buatAnalisaMateri, bersihkanIdentitas, rencanaGrup, TKA, type Identitas, type Pengaturan } from "@/lib/prompt";
import { BATAS_MATERI, susunDraf, terapkanAnalisa } from "@/lib/materi";
import { bersihkanTanggapan, gabungBab, identitasBab, KELAS, LEVEL, pemeriksaArab, pasangWacana, periksaKisi, periksaSoal, rapikanSoal, ratakanKunci, samakanDenganKisi, terapkanBobot, type Bab, type BarisKisi, type Soal } from "@/lib/soal";
import { babDariSet, babMilik, daftarBabMilik } from "@/lib/bab";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";
import { mushaf } from "@/lib/mushaf";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";
// Materi mode "bahasa" (Bahasa Arab): teks Arab yang dikenali sebagai ayat tetap ditandai (aturan 5). Mushaf dimuat
// hanya saat dipakai, yaitu untuk materi mode "bahasa".
const cekAyat = (arab: string) => !!mushaf().cari(arab);
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

/** Pilihan bab di form: bab bawaan + materi milik guru yang sedang masuk. */
export async function ambilDaftarBab() {
  const saya = await penggunaSaatIni();
  return saya ? daftarBabMilik(saya.id) : [];
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
    // Materi hanya milik guru yang sedang masuk (aturan 3). Beberapa materi (PTS/PAS) digabung jadi satu bab.
    const babs = await Promise.all(p.babIds!.map((b) => babMilik(b, saya.id)));
    if (babs.some((b) => !b)) return { ok: false as const, pesan: "Materi tidak ditemukan." };
    const id0 = identitasBab(babs[0]!);
    if (babs.some((b) => identitasBab(b!).mapel.toLowerCase() !== id0.mapel.toLowerCase() || identitasBab(b!).kelas !== id0.kelas))
      return { ok: false as const, pesan: "Materi yang digabung harus satu mapel dan satu kelas." };
    const bab = gabungBab(babs as Bab[]);
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
      .values({ status: "proses", guruId: saya.id, babId: p.babIds!.join(","), bab, pengaturan: p, model: model.nama, pesan: "Menyiapkan..." })
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
  // tanggapan: balasan AI atas catatan guru (dikirim juga ke guru, lihat cekHasil)
  const info: { detik: number; tokenMasuk: number; tokenKeluar: number; catatan: string[]; tanggapan?: string } = { detik: 0, tokenMasuk: 0, tokenKeluar: 0, catatan: [] };
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
    const { kisi, tanggapan } = await tanya("Kisi-kisi", buatPermintaanKisi(p, bab),(d) => {
      const isi = d as { kisi?: unknown; tanggapan?: unknown; wacana?: unknown };
      // Wacana soal grup hanya untuk Latihan TKA; jenis lain: semua soal tunggal.
      // Nomor grup dari rencana aplikasi (rencanaGrup), bukan dari AI; AI hanya menulis wacananya.
      const grup = p.tujuan === TKA ? rencanaGrup(p.jumlah) : [];
      const kisi = pasangWacana(periksaKisi(isi?.kisi, p.jumlah, bab, cekAyat).map((k, i) => ({ ...k, grup: grup[i] ?? null })), p.tujuan === TKA ? isi?.wacana : null, bab, cekAyat);
      return { kisi, tanggapan: p.catatan ? bersihkanTanggapan(isi?.tanggapan, bab, cekAyat) : "" };
    });
    if (tanggapan) info.tanggapan = tanggapan;
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
    const soal = periksaSoal(semua, bab, cekAyat);
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
  const bab = babDariSet(h);
  if (!Number.isInteger(no) || no < 0 || no >= soal.length || !bab) return "Nomor soal tidak valid.";
  return { h, soal, bab };
}

/** Simpan hasil edit guru untuk satu soal (hanya pemilik/admin, lewat ambilSet). Penjaga teks Arab tetap berlaku. */
export async function simpanSoal(id: number, no: number, isian: Soal) {
  try {
    const set = await ambilSet(id, no);
    if (typeof set === "string") return { ok: false as const, pesan: set };
    const lama = set.soal[no];
    // Nomor grup tetap dari server (bukan dari browser); hanya teks wacananya yang boleh diedit guru.
    const [soal] = periksaSoal([rapikanSoal({ ...isian, grup: lama.grup }, lama.bentuk)], set.bab, cekAyat);
    set.soal[no] = soal;
    // TP/level yang diubah guru ikut ke baris kisi-kisinya, supaya kisi-kisi tetap cocok dengan soal.
    const kisi = set.h.kisi as BarisKisi[] | null;
    if (kisi?.[no]) kisi[no] = { ...kisi[no], tp: soal.tp, level: soal.level };
    // Wacana soal grup dipakai bersama: editan guru ikut ke semua soal & baris kisi-kisi grup itu.
    if (soal.grup && soal.wacana) {
      set.soal.forEach((s, i) => {
        if (s.grup !== soal.grup) return;
        set.soal[i] = { ...s, wacana: soal.wacana };
        if (kisi?.[i]) kisi[i] = { ...kisi[i], wacana: soal.wacana };
      });
    }
    await db.update(hasilSoal).set({ soal: set.soal, kisi }).where(eq(hasilSoal.id, set.h.id));
    return { ok: true as const, soal };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal menyimpan: ${pesanError(e)}` };
  }
}

/**
 * Minta AI membuat 1 soal pengganti (bentuk, level, TP sama; skenario berbeda dari semua soal di set).
 * Dengan `instruksi` ("Minta perubahan"): soal yang sama ditulis ulang sesuai instruksi guru; bentuk tetap,
 * level/TP/indikator boleh berubah dan ikut ke kisi-kisi. Batas 30x per set dipakai bersama.
 */
export async function gantiSatuSoal(id: number, no: number, instruksiMentah?: string) {
  const ubah = instruksiMentah !== undefined;
  const instruksi = bersihkanInstruksi(instruksiMentah);
  try {
    if (ubah && !instruksi) return { ok: false as const, pesan: "Tulis dulu perubahan yang diminta." };
    const set = await ambilSet(id, no);
    if (typeof set === "string") return { ok: false as const, pesan: set };
    const { h, bab } = set;
    if (h.jumlahGanti >= BATAS_GANTI_PER_SET) return { ok: false as const, pesan: `Batas ${BATAS_GANTI_PER_SET} kali ganti/ubah soal untuk set ini sudah habis.` };

    const lama = set.soal[no];
    const kisi = h.kisi as BarisKisi[] | null; // set lama: tanpa kisi-kisi
    const baris = kisi?.[no];
    const sistem = buatSistem(bab);
    const pengguna = buatPenggantiPengguna(h.pengaturan as Pengaturan, lama, set.soal, baris, instruksi);
    const p = h.pengaturan as Pengaturan;
    // Model utama sama dengan set; cadangan dipakai kalau gagal (kecuali set hasil "Bandingkan semua model").
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, (d) => ambilSoal(d));
    // Prompt & jawaban mentah penggantian ikut disimpan (untuk perbandingan model, langkah 4).
    const catat = {
      jumlahGanti: h.jumlahGanti + 1,
      prompt: `${h.prompt}\n\n---\n\n[${ubah ? "UBAH" : "GANTI"} SOAL NOMOR ${no + 1} dengan ${r.model}]\n${pengguna}`,
      // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
      jawabanAi: JSON.stringify([...(h.jawabanAi?.startsWith("[") ? JSON.parse(h.jawabanAi) : [h.jawabanAi].filter(Boolean)), r.jawaban]),
    };
    const { stimulus, indikator, ...baru } = r.hasil[0];
    // Ubah: level/TP dari AI dipakai hanya kalau valid. Ganti: disamakan dengan kisi-kisi.
    // Grup & wacana tidak diambil dari jawaban AI: tetap milik soal lama (soal grup tetap di grupnya).
    const grupLama = lama.grup && lama.wacana ? { grup: lama.grup, wacana: lama.wacana } : {};
    const { grup: _g, wacana: _w, ...isiBaru } = baru;
    void _g;
    void _w;
    const hasilUbah = { ...isiBaru, ...grupLama, bentuk: lama.bentuk, level: LEVEL.includes(baru.level) ? baru.level : lama.level, tp: bab.tp.some((t) => t.kode === baru.tp) ? baru.tp : lama.tp };
    const [soal] = periksaSoal([ubah ? hasilUbah : baris ? samakanDenganKisi(baru, baris) : { ...isiBaru, ...grupLama, bentuk: lama.bentuk }], bab, cekAyat);
    if (!ubah) ratakanKunci([soal]); // posisi kunci PG/PGK diacak (tidak saat "ubah", supaya guru tidak bingung)
    if (p.bobot) terapkanBobot([soal], p.bobot);
    set.soal[no] = soal;
    // Skenario (dan pada "ubah": indikator, TP, level) baru dicatat di baris kisi-kisi.
    // (aturan 5: teks berisi Arab yang tidak terverifikasi tidak dipakai)
    const aman = (x: unknown) => {
      const t = String(x ?? "").trim();
      return t && !pemeriksaArab(bab, cekAyat)(t).length ? t : null;
    };
    if (kisi && baris) {
      kisi[no] = { ...baris, stimulus: aman(stimulus) ?? baris.stimulus };
      if (ubah) kisi[no] = { ...kisi[no], indikator: aman(indikator) ?? baris.indikator, tp: soal.tp, level: soal.level };
    }
    await db.update(hasilSoal).set({ ...catat, soal: set.soal, kisi }).where(eq(hasilSoal.id, h.id));
    return { ok: true as const, soal };
  } catch (e) {
    const admin = (await penggunaSaatIni().catch(() => null))?.peran === "admin";
    return { ok: false as const, pesan: admin ? `Gagal ${ubah ? "mengubah" : "mengganti"}: ${pesanError(e)}` : ubah ? `Gagal mengubah soal, ${SARAN_GURU}` : PESAN_GAGAL_GURU };
  }
}

// Batas analisa materi per guru per hari (biaya AI), di memori: hilang saat server dinyalakan ulang.
// ponytail: penghitung di memori, pindah ke tabel bila perlu tepat atau server lebih dari satu.
const BATAS_ANALISA = 30;
const analisaHariIni = new Map<string, { hari: string; n: number }>();
const hariWib = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

/**
 * Materi baru dari halaman utama (tempel teks / file Word-PowerPoint, paragraf urut): ayat dicocokkan ke mushaf,
 * lalu AI mengusulkan judul, TP, pokok materi, serta sumber/terjemah dalil yang tertulis di teks. Belum disimpan:
 * guru memeriksa kartu materinya dulu; materi tersimpan otomatis saat "Buat soal".
 */
export async function analisaMateri(input: { mapel: string; kelas: string; paragraf: string[] }) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const mapel = String(input?.mapel ?? "").trim().slice(0, 60);
  const kelas = String(input?.kelas ?? "").trim();
  if (!mapel || !KELAS.includes(kelas)) return { ok: false as const, pesan: "Pilih mata pelajaran dan kelas dulu." };
  const paragraf = (Array.isArray(input?.paragraf) ? input.paragraf : []).map((p) => String(p ?? "").slice(0, 5000)).slice(0, 3000);
  if (paragraf.join("\n").length > 40_000) return { ok: false as const, pesan: "Materi terlalu panjang (maks ±30.000 huruf). Pecah menjadi beberapa materi." };

  const m = mushaf();
  const { isian, untukAi, dibuangPdf } = susunDraf({ mapel, kelas, paragraf }, m.cari, m.basmalah);
  const pesanPdf = dibuangPdf
    ? `${dibuangPdf} baris teks Arab dari PDF tidak dikenali sebagai ayat dan dibuang (teks Arab PDF sering rusak). Ayat: pakai "Ambil ayat"; hadis: tempel sendiri dari sumber terpercaya.`
    : "";
  if (isian.isi.length < BATAS_MATERI.isiMin) return { ok: false as const, pesan: `Materi terlalu pendek (minimal ${BATAS_MATERI.isiMin} huruf teks).` };

  if (saya.peran !== "admin") {
    const hari = hariWib();
    const c = analisaHariIni.get(saya.id);
    const n = c?.hari === hari ? c.n : 0;
    if (n >= BATAS_ANALISA) return { ok: false as const, pesan: `Batas ${BATAS_ANALISA} analisa materi hari ini sudah habis. Pakai materi yang sudah ada, atau lanjutkan besok.` };
    analisaHariIni.set(saya.id, { hari, n: n + 1 });
  }

  const { sistem, pengguna } = buatAnalisaMateri(mapel, kelas, untukAi, isian.teksArab === "bahasa");
  try {
    const r = await tanyaDenganCadangan(sistem, pengguna, daftarModel()[0]?.slot ?? 1, true, (d) => d);
    const a = terapkanAnalisa(r.hasil, isian, untukAi);
    return { ok: true as const, isian: a.isian, catatan: [pesanPdf, a.catatan].filter(Boolean).join(" ") };
  } catch (e) {
    console.error("[analisa materi gagal]", pesanError(e));
    // AI gagal: materi tetap bisa dipakai, guru mengisi judul & TP sendiri di kartu materi.
    return { ok: true as const, isian, catatan: `${pesanPdf} AI gagal menganalisa materi. Isi judul dan TP sendiri, atau coba analisa lagi.`.trim() };
  }
}

/** Ubah identitas ujian (kop Word) setelah set jadi: tanpa AI, hanya pemilik/admin (aturan 3). */
export async function ubahIdentitas(id: number, identitas: Identitas) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const [h] = await db.select({ guruId: hasilSoal.guruId, pengaturan: hasilSoal.pengaturan }).from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  if (!h || !bolehAkses(h.guruId, saya)) return { ok: false as const, pesan: "Set soal tidak ditemukan." };
  const baru = bersihkanIdentitas(identitas);
  await db.update(hasilSoal).set({ pengaturan: { ...(h.pengaturan as Pengaturan), identitas: baru } }).where(eq(hasilSoal.id, Number(id)));
  return { ok: true as const, identitas: baru };
}

/** Status + isi satu set, hanya untuk pemiliknya atau admin (aturan 3). Set orang lain dijawab "tidak ada". */
export async function cekHasil(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  const [h] = await db
    .select({ guruId: hasilSoal.guruId, status: hasilSoal.status, soal: hasilSoal.soal, kisi: hasilSoal.kisi, bab: hasilSoal.bab, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat, info: hasilSoal.info, pengaturan: hasilSoal.pengaturan })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h || !bolehAkses(h.guruId, saya)) return null;
  const { guruId, pengaturan, ...isi } = h; // id pemilik tidak perlu dikirim ke browser
  void guruId;
  const soal = h.soal as Soal[] | null;
  const kisi = h.kisi as BarisKisi[] | null;
  // Catatan guru + tanggapan AI atasnya (ATURAN-SOAL.md bagian 6), untuk guru maupun admin.
  const catatan = (pengaturan as Pengaturan).catatan || null;
  const tanggapan = (h.info as { tanggapan?: string } | null)?.tanggapan || null;
  const identitas = (pengaturan as Pengaturan).identitas ?? {}; // kop Word, bisa diubah di halaman hasil
  // Data bab (untuk menampilkan ayat & form edit) cukup dikirim saat selesai, tidak di setiap pengecekan.
  const bab = h.status === "selesai" ? (babDariSet(h) ?? null) : null;
  if (saya.peran !== "admin") {
    // Guru tidak menerima info teknis (model, waktu, token, catatan cadangan) maupun rincian error penyedia AI.
    // (halaman sudah menambahkan awalan "Gagal membuat soal:")
    return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, model: null, info: null, pesan: h.status === "gagal" ? SARAN_GURU : h.pesan };
  }
  return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number; catatan?: string[] } | null };
}
