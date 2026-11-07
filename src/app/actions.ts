"use server";

import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal, pemakaianAi } from "@/db/schema";
import { daftarModel, tanyaAI } from "@/lib/ai";
import { bagiTahap, jumlahSoal, bersihkanInstruksi, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, laranganIsian, ringkasSudah, buatPermintaanKisi, buatSistem, buatAnalisaMateri, bersihkanIdentitas, rencanaGrup, MAKS_NAMA_SET, MAKS_SOAL, NAMA_BENTUK, TKA, type Identitas, type Pengaturan } from "@/lib/prompt";
import { BATAS_MATERI, susunDraf, terapkanAnalisa } from "@/lib/materi";
import { bersihkanTanggapan, gabungBab, identitasBab, kataTerpakai, KELAS, LEVEL, pemeriksaArab, pasangWacana, periksaKisi, periksaSoal, rapikanSoal, ratakanKunci, samakanDenganKisi, susunMenjodohkan, terapkanBobot, type Bab, type BarisKisi, type Bentuk, type Soal } from "@/lib/soal";
import { babDariSet, babMilik, daftarBabMilik } from "@/lib/bab";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";
import { mushaf } from "@/lib/mushaf";
import { BATAS_ANALISA, BATAS_PER_GURU, BATAS_TOTAL, BATAS_UBAH_PER_GURU } from "@/lib/pembatas";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";
// Materi mode "bahasa" (Bahasa Arab): teks Arab yang dikenali sebagai ayat tetap ditandai (aturan 5). Mushaf dimuat
// hanya saat dipakai, yaitu untuk materi mode "bahasa".
const cekAyat = (arab: string) => !!mushaf().cari(arab);
// Aturan 4: batas pembuatan per guru per hari (admin tidak dibatasi per guru),
// plus batas total seluruh web sebagai pengaman saldo AI. Set yang GAGAL tidak dihitung.
const BATAS_GANTI_PER_SET = 30;
// Set yang sedang dibuat bersamaan: per guru (admin bebas, untuk "Bandingkan") dan seluruh web (RAM hosting 1 GB).
const BATAS_PROSES_GURU = 2;
const BATAS_PROSES_WEB = 10;
// Batas waktu TOTAL (audit C3): tanpa ini, timeout per panggilan × coba ulang × model cadangan × tahap bisa
// membuat guru menunggu puluhan menit. Lewat batas → set gagal (jatah kembali). Normal: 40 soal ±80 detik.
const TENGGAT_SET = 10 * 60_000;
const TENGGAT_SATU_SOAL = 4 * 60_000;

const awalHariIni = sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`; // 00.00 WIB

/** Jumlah set hari ini (WIB, mulai 00.00) yang tidak gagal; untuk satu guru atau seluruh web. */
async function hitungHariIni(guruId?: string, q: Pick<typeof db, "select"> = db) {
  const [{ n }] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(gte(hasilSoal.dibuat, awalHariIni), ne(hasilSoal.status, "gagal"), guruId ? eq(hasilSoal.guruId, guruId) : undefined));
  return n;
}

/** Pemakaian AI di luar pembuatan set hari ini (WIB) oleh satu guru: Ganti/Ubah/Tambah soal, atau analisa materi. */
async function hitungPemakaian(guruId: string, jenis: "ubah" | "analisa", q: Pick<typeof db, "select"> = db) {
  const [{ n }] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(pemakaianAi)
    .where(and(eq(pemakaianAi.guruId, guruId), gte(pemakaianAi.waktu, awalHariIni), jenis === "analisa" ? eq(pemakaianAi.jenis, "analisa") : ne(pemakaianAi.jenis, "analisa")));
  return n;
}
const PESAN_BATAS_SET = `Jatah ${BATAS_GANTI_PER_SET} kali ganti/ubah/tambah soal untuk set ini sudah habis dan tidak kembali. Perbaiki soal lewat Edit atau Tulis soal sendiri, atau buat set baru dengan "Pakai materi ini lagi".`;
const PESAN_BATAS_UBAH = `Batas ${BATAS_UBAH_PER_GURU} kali ganti/ubah/tambah soal hari ini sudah habis. Edit manual dan tulis soal sendiri tetap bisa; coba lagi besok.`;

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
async function tanyaDenganCadangan<T>(sistem: string, pengguna: string, slotUtama: number, pakaiCadangan: boolean, ambil: (data: unknown) => T, sampai: number) {
  const semuaModel = daftarModel();
  const urutan = pakaiCadangan ? [slotUtama, ...semuaModel.map((m) => m.slot).filter((s) => s !== slotUtama)] : [slotUtama];
  const catatan: string[] = [];
  for (const slot of urutan) {
    const nama = semuaModel.find((m) => m.slot === slot)?.nama ?? `model ${slot}`;
    // `sampai` = batas waktu total (jam). Habis → jangan coba model berikutnya.
    if (Date.now() > sampai - 15_000) {
      catatan.push("Batas waktu total habis, model lain tidak dicoba.");
      break;
    }
    try {
      const r = await tanyaAI(sistem, pengguna, slot, sampai);
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
  // Sebagian jawaban satu soal datang tanpa dibungkus daftar ("soal": {...} atau soalnya langsung) → dibungkus di sini.
  const mentah = (data as { soal?: unknown })?.soal ?? ((data as { pertanyaan?: unknown })?.pertanyaan ? data : undefined);
  const soal = mentah && !Array.isArray(mentah) && typeof mentah === "object" ? [mentah] : mentah;
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

    // Hitung jatah lalu simpan set dalam SATU transaksi yang memegang kunci bersama (audit C2): klik ganda atau dua
    // tab menunggu giliran, jadi jatah tidak bisa terlewati. ponytail: satu kunci untuk seluruh web (pembuatan set
    // jarang & cepat dicatat); pakai kunci per guru bila guru sangat banyak.
    const mulai = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(4210)`);
      const proses = (guruId?: string) =>
        tx
          .select({ n: sql<number>`count(*)::int` })
          .from(hasilSoal)
          .where(and(eq(hasilSoal.status, "proses"), guruId ? eq(hasilSoal.guruId, guruId) : undefined))
          .then(([r]) => r.n);
      if (saya.peran !== "admin" && (await hitungHariIni(saya.id, tx)) >= BATAS_PER_GURU)
        return `Jatah ${BATAS_PER_GURU} set soal Anda hari ini sudah habis. Silakan lanjutkan besok.`;
      if ((await hitungHariIni(undefined, tx)) >= BATAS_TOTAL)
        return "Batas pembuatan soal seluruh web hari ini sudah tercapai. Silakan coba lagi besok atau hubungi admin.";
      if (saya.peran !== "admin" && (await proses(saya.id)) >= BATAS_PROSES_GURU)
        return `Masih ada ${BATAS_PROSES_GURU} set Anda yang sedang dibuat. Tunggu salah satunya selesai dulu.`;
      if ((await proses()) >= BATAS_PROSES_WEB) return "Sedang banyak guru membuat soal. Coba lagi 1–2 menit lagi.";
      const [baris] = await tx
        .insert(hasilSoal)
        .values({ status: "proses", guruId: saya.id, babId: p.babIds!.join(","), bab, pengaturan: p, model: model.nama, pesan: "Menyiapkan..." })
        .returning({ id: hasilSoal.id });
      return baris.id;
    });
    if (typeof mulai === "string") return { ok: false as const, pesan: mulai };

    void kerjakan(mulai, bab, p); // sengaja tidak ditunggu, supaya koneksi browser tidak putus
    return { ok: true as const, id: mulai };
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
  // perbaikan: hasil perbaikan otomatis soal bertanda merah (terpisah dari catatan cadangan, supaya tidak memicu pita merah admin)
  const info: { detik: number; tokenMasuk: number; tokenKeluar: number; catatan: string[]; tanggapan?: string; perbaikan?: string[] } = { detik: 0, tokenMasuk: 0, tokenKeluar: 0, catatan: [] };
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

  const sampai = mulai + TENGGAT_SET; // berlaku untuk seluruh tahap set ini
  const tanya = async <T,>(label: string, pengguna: string, ambil: (data: unknown) => T) => {
    permintaan.push(pengguna);
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, ambil, sampai);
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
      const n = jumlahSoal(jumlah);
      const baris = kisi.slice(awal, awal + n);
      awal += n;
      await simpan({ pesan: `Tahap ${i + 1} dari ${tahap.length}` });
      const pengguna = buatPengguna(p, jumlah, semua.map(ringkasSudah), laranganIsian(kisi), baris);
      const soal = await tanya(`Tahap ${i + 1}`, pengguna, (d) => ambilSoal(d, baris.length));
      semua.push(...soal.map((s, j) => susunMenjodohkan(samakanDenganKisi(s, baris[j])))); // Menjodohkan: lajur kanan diacak aplikasi
      // Draf untuk tampilan bertahap (status tetap "proses"): sudah lewat penjaga ayat, tetapi kunci belum
      // diratakan dan skor belum diisi; keduanya baru di akhir untuk seluruh set.
      await simpan({ soal: periksaSoal(semua, bab, cekAyat) });
    }
    const soal = periksaSoal(semua, bab, cekAyat);
    // Perbaikan otomatis 1x: soal bertanda merah dikirim balik ke AI beserta daftar masalahnya, lalu hasilnya DIPERIKSA
    // ULANG oleh aplikasi (aturan 5: AI menulis, aplikasi yang memeriksa). Dipakai hanya kalau bersih; kalau tidak,
    // soal lama (tetap merah) dibiarkan untuk guru. Tidak memakai jatah Ganti/Ubah.
    for (const [i, s] of soal.entries()) {
      if (!s.peringatan?.length) continue;
      const masalah = s.peringatan.join("; ");
      info.perbaikan ??= [];
      await simpan({ pesan: `Memperbaiki soal ${i + 1}` });
      try {
        // Kebocoran jawaban sering berasal dari kisi-kisi (konsep yang sama diuji dua kali), jadi AI boleh menanyakan konsep
        // lain; petunjuk ini ditulis di depan karena instruksi dipotong 300 huruf.
        const bocor = s.peringatan.some((w) => w.startsWith("Jawaban isian sudah tertulis"));
        // 0.19.1: menjodohkan "pengelompokan" (jawaban berulang) tidak bisa diperbaiki dengan indikator yang sama → boleh ganti sisi materi.
        const kelompok = s.bentuk === "MJ" && s.peringatan.some((w) => w.startsWith("Dua premis memakai jawaban yang sama") || w.startsWith("Ada premis atau jawaban yang sama"));
        const awal = bocor
          ? "Jawaban bocor: tanyakan konsep LAIN dari materi yang jawabannya belum tertulis di soal mana pun, dan tulis indikator barunya. "
          : kelompok
          ? "Menjodohkan ini berupa pengelompokan (jawaban berulang): pakai sisi materi LAIN yang punya 5 pasangan satu-satu dengan jawaban berbeda semua, dan tulis indikator barunya. "
          : "";
        // Isian bocor: daftar kata yang sudah tertulis di soal lain (termasuk pengecoh), ditaruh di AKHIR supaya pemotongan hanya memendekkan daftar.
        const terpakai = bocor ? ` Kata/frasa yang SUDAH tertulis di soal lain, jadi TIDAK boleh menjadi jawaban baru: ${kataTerpakai(soal, i).map((k) => `"${k}"`).join(", ")}` : "";
        const instruksi = `${awal}Perbaiki soal ini (bentuk, TP, level tetap). Masalah: ${masalah}${terpakai}`;
        // Instruksi buatan aplikasi boleh lebih panjang dari batas guru (300), supaya potongan teks bocor dan daftar kata tidak terpotong.
        const [baru] = await tanya(`Perbaikan soal ${i + 1}`, buatPenggantiPengguna(p, s, soal, kisi[i], instruksi, 2000), (d) => ambilSoal(d));
        const { stimulus: _s, indikator, ...isi } = susunMenjodohkan(samakanDenganKisi(baru, kisi[i]));
        void _s;
        // Diperiksa bersama seluruh set (bukan sendirian), supaya kunci isian yang masih bocor ke soal lain tetap ketahuan.
        const cek = periksaSoal(soal.map((x, j) => (j === i ? isi : x)), bab, cekAyat)[i];
        if (cek.peringatan?.length) info.perbaikan.push(`Soal ${i + 1}: perbaikan otomatis masih melanggar aturan (${cek.peringatan.join("; ")}), soal awal dipakai.`);
        else {
          soal[i] = cek;
          // Indikator baru (konsep lain) ikut ke kisi-kisi; teks berisi Arab tak terverifikasi tidak dipakai (aturan 5).
          const ind = String(indikator ?? "").trim();
          if ((bocor || kelompok) && ind && !pemeriksaArab(bab, cekAyat)(ind).length) kisi[i] = { ...kisi[i], indikator: ind };
          info.perbaikan.push(`Soal ${i + 1} diperbaiki otomatis: ${masalah}`);
        }
      } catch (e) {
        info.perbaikan.push(`Soal ${i + 1}: perbaikan otomatis gagal (${pesanError(e)}), soal awal dipakai.`);
      }
    }
    ratakanKunci(soal);
    if (p.bobot) terapkanBobot(soal, p.bobot);
    await simpan({ status: "selesai", soal, kisi, pesan: null, model: [...dipakai].join(" + ") });
  } catch (e) {
    await simpan({ status: "gagal", pesan: pesanError(e) }).catch(() => {});
  }
}

/**
 * Ambil set soal yang sudah selesai + soal nomor `no` (mulai 0), HANYA kalau pengguna yang masuk boleh mengaksesnya
 * (aturan 3: pemilik atau admin). Mengembalikan pesan kalau tidak valid.
 */
async function ambilSet(id: number, no: number, tx?: Tx) {
  const saya = await penggunaSaatIni();
  if (!saya) return SESI_HABIS;
  // Di dalam transaksi (denganSetTerkunci): baris dikunci sampai transaksi selesai.
  const [h] = tx
    ? await tx.select().from(hasilSoal).where(eq(hasilSoal.id, Number(id))).for("update")
    : await db.select().from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  // Set milik guru lain dijawab "tidak ditemukan", supaya keberadaannya pun tidak bocor.
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya) || h.status !== "selesai") return "Set soal tidak ditemukan atau belum selesai.";
  const soal = h.soal as Soal[];
  const bab = babDariSet(h);
  if (!Number.isInteger(no) || no < 0 || no >= soal.length || !bab) return "Nomor soal tidak valid.";
  return { h, soal, bab, saya };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type IsiSet = Exclude<Awaited<ReturnType<typeof ambilSet>>, string>;

/**
 * Baca lalu ubah satu set di dalam transaksi dengan barisnya dikunci (SELECT ... FOR UPDATE). Aksi lain pada set
 * yang sama (edit, ganti, tambah, hapus soal) menunggu giliran dan membaca isi TERBARU, jadi tidak saling menimpa
 * (audit 2026-11-04 C1: dulu edit guru hilang bila tertimpa "Ganti soal" yang sedang menunggu AI).
 * Jangan memanggil AI di dalam `kerja`: kunci akan tertahan selama AI berpikir.
 */
async function denganSetTerkunci<T>(id: number, no: number, kerja: (set: IsiSet, tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    const set = await ambilSet(id, no, tx);
    return typeof set === "string" ? set : kerja(set, tx);
  });
}

/** Kisi-kisi mengikuti nomor soal setelah soal ditambah/dihapus: kolom `no` dinomori ulang 1, 2, 3, ... */
const nomoriUlang = (kisi: BarisKisi[]) => kisi.map((k, i) => ({ ...k, no: i + 1 }));

/** Simpan hasil edit guru untuk satu soal (hanya pemilik/admin, lewat ambilSet). Penjaga teks Arab tetap berlaku. */
export async function simpanSoal(id: number, no: number, isian: Soal) {
  try {
    const r = await denganSetTerkunci(id, no, (set, tx) => simpanSoalDi(set, no, isian, tx));
    return typeof r === "string" ? { ok: false as const, pesan: r } : { ok: true as const, soal: r };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal menyimpan: ${pesanError(e)}` };
  }
}

async function simpanSoalDi(set: IsiSet, no: number, isian: Soal, tx: Tx) {
  {
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
    await tx.update(hasilSoal).set({ soal: set.soal, kisi }).where(eq(hasilSoal.id, set.h.id));
    return soal;
  }
}

/** Isian soal manual yang belum lengkap → pesan untuk guru (soal AI tidak lewat sini). */
function kurangLengkap(s: Soal): string {
  const kosong = (x?: string[]) => !x?.length || x.some((t) => !t);
  if (!s.pertanyaan) return "Tulis pertanyaannya dulu.";
  if ((s.bentuk === "PG" || s.bentuk === "PGK") && kosong(s.pilihan)) return "Isi kelima pilihan jawaban.";
  if (s.bentuk === "PG" && !"ABCDE".includes(String(s.kunci) || "?")) return "Pilih kunci jawabannya.";
  if (s.bentuk === "BS" && kosong(s.pernyataan)) return "Isi keempat pernyataan.";
  if (s.bentuk === "MJ" && (kosong(s.premis) || (s.jawaban ?? []).filter(Boolean).length < (s.premis?.length ?? 0) + 1))
    return "Isi kelima premis dan keenam jawaban (satu jawaban sebagai pengecoh).";
  if ((s.bentuk === "ISIAN" || s.bentuk === "URAIAN") && !String(s.kunci)) return "Isi kunci jawabannya.";
  return "";
}

/**
 * Soal tulisan guru sendiri (tanpa AI, tidak memakai jatah). Disisipkan di akhir bagian bentuknya (urutan bagian
 * di Word baku); kisi-kisi mendapat baris baru dan dinomori ulang. Lewat `rapikanSoal` + `periksaSoal` yang sama
 * dengan Edit, jadi penjaga ayat tetap berlaku (aturan 5). Pemilik/admin saja (ambilSet di denganSetTerkunci).
 */
export async function tambahSoalManual(id: number, isian: Soal) {
  try {
    const bentuk = (Object.keys(NAMA_BENTUK) as Bentuk[]).find((b) => b === isian?.bentuk);
    if (!bentuk) return { ok: false as const, pesan: "Bentuk soal tidak dikenal." };
    const r = await denganSetTerkunci(id, 0, async (set, tx) => {
      const p = set.h.pengaturan as Pengaturan;
      if (p.tujuan === TKA && ["MJ", "ISIAN", "URAIAN"].includes(bentuk)) return "Latihan TKA hanya memakai PG, PG kompleks, dan Kategori.";
      if (set.soal.length >= MAKS_SOAL) return `Satu set maksimal ${MAKS_SOAL} soal.`;
      const rapi = rapikanSoal({ ...isian, grup: undefined, wacana: undefined }, bentuk);
      const kurang = kurangLengkap(rapi);
      if (kurang) return kurang;
      if (!set.bab.tp.some((t) => t.kode === rapi.tp)) rapi.tp = set.bab.tp[0]?.kode ?? rapi.tp;
      if (!LEVEL.includes(rapi.level)) rapi.level = "C2";
      const [soal] = periksaSoal([rapi], set.bab, cekAyat);
      // Akhir bagian bentuknya: setelah soal terakhir yang urutan bentuknya <= bentuk ini.
      const urut = Object.keys(NAMA_BENTUK) as Bentuk[];
      const posisi = set.soal.reduce((akhir, s, i) => (urut.indexOf(s.bentuk) <= urut.indexOf(bentuk) ? i + 1 : akhir), 0);
      set.soal.splice(posisi, 0, soal);
      const kisi = set.h.kisi as BarisKisi[] | null;
      kisi?.splice(posisi, 0, { no: 0, bentuk, tp: soal.tp, materi: "(soal tulisan guru)", indikator: "(soal tulisan guru)", level: soal.level, dalil_id: soal.dalil_id, stimulus: "" });
      await tx.update(hasilSoal).set({ soal: set.soal, kisi: kisi && nomoriUlang(kisi) }).where(eq(hasilSoal.id, set.h.id));
      return posisi;
    });
    return typeof r === "string" ? { ok: false as const, pesan: r } : { ok: true as const, no: r + 1 };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal menyimpan soal: ${pesanError(e)}` };
  }
}

/** Soal `no` boleh ditukar dengan tetangganya (`no + arah`): bentuk sama (urutan bagian di Word baku) dan bukan soal grup. */
export async function pindahSoal(id: number, no: number, arah: -1 | 1) {
  try {
    const r = await denganSetTerkunci(id, no, async (set, tx) => {
      const ke = no + (arah === -1 ? -1 : 1);
      const [a, b] = [set.soal[no], set.soal[ke]];
      if (!b || a.bentuk !== b.bentuk) return "Soal sudah di ujung bagiannya.";
      if (a.grup || b.grup) return "Soal grup (wacana bersama) tidak bisa dipindah.";
      [set.soal[no], set.soal[ke]] = [b, a];
      const kisi = set.h.kisi as BarisKisi[] | null;
      if (kisi?.[no] && kisi[ke]) [kisi[no], kisi[ke]] = [kisi[ke], kisi[no]];
      await tx.update(hasilSoal).set({ soal: set.soal, kisi: kisi && nomoriUlang(kisi) }).where(eq(hasilSoal.id, set.h.id));
      return true;
    });
    return typeof r === "string" ? { ok: false as const, pesan: r } : { ok: true as const };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal memindah soal: ${pesanError(e)}` };
  }
}

/** Hapus satu soal dari set (pemilik/admin). Kisi-kisi ikut dibuang barisnya dan dinomori ulang. Minimal 1 soal tersisa. */
export async function hapusSoal(id: number, no: number) {
  try {
    const r = await denganSetTerkunci(id, no, async (set, tx) => {
      if (set.soal.length <= 1) return "Set harus berisi minimal 1 soal. Hapus set-nya saja bila tidak dipakai.";
      const soal = set.soal.filter((_, i) => i !== no);
      const kisi = set.h.kisi as BarisKisi[] | null;
      await tx.update(hasilSoal).set({ soal, kisi: kisi ? nomoriUlang(kisi.filter((_, i) => i !== no)) : null }).where(eq(hasilSoal.id, set.h.id));
      return true;
    });
    return typeof r === "string" ? { ok: false as const, pesan: r } : { ok: true as const };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal menghapus soal: ${pesanError(e)}` };
  }
}

/**
 * Minta AI membuat 1 soal pengganti (bentuk, level, TP sama; skenario berbeda dari semua soal di set).
 * Dengan `instruksi` ("Minta perubahan"): soal yang sama ditulis ulang sesuai instruksi guru; bentuk tetap,
 * level/TP/indikator boleh berubah dan ikut ke kisi-kisi. Batas 30x per set dipakai bersama.
 */
export async function gantiSatuSoal(id: number, no: number, instruksiMentah?: string) {
  return soalBaruDariAI(id, no, instruksiMentah === undefined ? "ganti" : "ubah", instruksiMentah);
}

/** Tambah 1 soal serupa tepat di bawah soal `no` (bentuk, level, TP sama; skenario baru). Ikut batas 30x per set. */
export async function tambahSoalSerupa(id: number, no: number) {
  return soalBaruDariAI(id, no, "tambah");
}

async function soalBaruDariAI(id: number, no: number, mode: "ganti" | "ubah" | "tambah", instruksiMentah?: string) {
  const ubah = mode === "ubah";
  const instruksi = bersihkanInstruksi(instruksiMentah);
  const gagal = (pesan: string) => ({ ok: false as const, pesan });
  try {
    if (ubah && !instruksi) return gagal("Tulis dulu perubahan yang diminta.");
    // Baca dulu TANPA kunci (AI bisa 20–60 detik); hasilnya ditulis nanti di dalam transaksi terkunci.
    const set = await ambilSet(id, no);
    if (typeof set === "string") return gagal(set);
    const { h, bab, saya } = set;
    const dibatasi = saya.peran !== "admin"; // aturan 4: batas harian per guru, admin bebas
    if (dibatasi && (await hitungPemakaian(saya.id, "ubah")) >= BATAS_UBAH_PER_GURU) return gagal(PESAN_BATAS_UBAH);
    if (h.jumlahGanti >= BATAS_GANTI_PER_SET) return gagal(PESAN_BATAS_SET);
    if (mode === "tambah" && set.soal.length >= MAKS_SOAL) return gagal(`Satu set maksimal ${MAKS_SOAL} soal.`);

    const lama = set.soal[no];
    const kisi = h.kisi as BarisKisi[] | null; // set lama: tanpa kisi-kisi
    const baris = kisi?.[no];
    const sistem = buatSistem(bab);
    const pengguna = buatPenggantiPengguna(h.pengaturan as Pengaturan, lama, set.soal, baris, instruksi);
    const p = h.pengaturan as Pengaturan;
    // Model utama sama dengan set; cadangan dipakai kalau gagal (kecuali set hasil "Bandingkan semua model").
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, (d) => ambilSoal(d), Date.now() + TENGGAT_SATU_SOAL);
    const { stimulus, indikator, ...baru } = susunMenjodohkan({ ...r.hasil[0], bentuk: lama.bentuk }); // Menjodohkan: pasangan AI → premis, jawaban acak, kunci
    // Ubah: level/TP dari AI dipakai hanya kalau valid. Ganti/tambah: disamakan dengan kisi-kisi.
    // Grup & wacana tidak diambil dari jawaban AI: tetap milik soal lama (soal grup tetap di grupnya).
    const grupLama = lama.grup && lama.wacana ? { grup: lama.grup, wacana: lama.wacana } : {};
    const { grup: _g, wacana: _w, ...isiBaru } = baru;
    void _g;
    void _w;
    const hasilUbah = { ...isiBaru, ...grupLama, bentuk: lama.bentuk, level: LEVEL.includes(baru.level) ? baru.level : lama.level, tp: bab.tp.some((t) => t.kode === baru.tp) ? baru.tp : lama.tp };
    const [soal] = periksaSoal([ubah ? hasilUbah : baris ? samakanDenganKisi(baru, baris) : { ...isiBaru, ...grupLama, bentuk: lama.bentuk }], bab, cekAyat);
    if (!ubah) ratakanKunci([soal]); // posisi kunci PG/PGK diacak (tidak saat "ubah", supaya guru tidak bingung)
    if (p.bobot) terapkanBobot([soal], p.bobot);
    // Skenario (dan pada "ubah": indikator, TP, level) baru dicatat di baris kisi-kisi.
    // (aturan 5: teks berisi Arab yang tidak terverifikasi tidak dipakai)
    const aman = (x: unknown) => {
      const t = String(x ?? "").trim();
      return t && !pemeriksaArab(bab, cekAyat)(t).length ? t : null;
    };
    const barisBaru = baris && { ...baris, stimulus: aman(stimulus) ?? baris.stimulus, ...(ubah && { indikator: aman(indikator) ?? baris.indikator, tp: soal.tp, level: soal.level }) };

    // Tulis ke isi TERBARU set (bisa sudah diedit guru selama AI bekerja), dengan baris dikunci.
    const tulis = await denganSetTerkunci(id, no, async (kini, tx) => {
      if (JSON.stringify(kini.soal[no]) !== JSON.stringify(lama)) return "Soal ini berubah saat AI bekerja (diedit atau dihapus). Muat ulang halaman lalu coba lagi.";
      if (kini.h.jumlahGanti >= BATAS_GANTI_PER_SET) return PESAN_BATAS_SET;
      // ponytail: dicek ulang di sini, tapi dua permintaan serentak pada set BERBEDA bisa lewat 1–2 di atas batas
      // (kunci di sini per set). Cukup untuk pengaman biaya; kunci per guru bila perlu tepat.
      if (dibatasi && (await hitungPemakaian(saya.id, "ubah", tx)) >= BATAS_UBAH_PER_GURU) return PESAN_BATAS_UBAH;
      await tx.insert(pemakaianAi).values({ guruId: saya.id, jenis: mode });
      const kisiKini = kini.h.kisi as BarisKisi[] | null;
      if (mode === "tambah") {
        if (kini.soal.length >= MAKS_SOAL) return `Satu set maksimal ${MAKS_SOAL} soal.`;
        kini.soal.splice(no + 1, 0, soal);
        if (kisiKini && barisBaru) kisiKini.splice(no + 1, 0, barisBaru);
      } else {
        kini.soal[no] = soal;
        if (kisiKini && barisBaru) kisiKini[no] = barisBaru;
      }
      const { h: hk } = kini;
      await tx
        .update(hasilSoal)
        .set({
          soal: kini.soal,
          kisi: kisiKini && (mode === "tambah" ? nomoriUlang(kisiKini) : kisiKini),
          jumlahGanti: hk.jumlahGanti + 1,
          // Prompt & jawaban mentah ikut disimpan (untuk perbandingan model, langkah 4).
          prompt: `${hk.prompt}\n\n---\n\n[${mode.toUpperCase()} SOAL NOMOR ${no + 1} dengan ${r.model}]\n${pengguna}`,
          // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
          jawabanAi: JSON.stringify([...(hk.jawabanAi?.startsWith("[") ? JSON.parse(hk.jawabanAi) : [hk.jawabanAi].filter(Boolean)), r.jawaban]),
        })
        .where(eq(hasilSoal.id, hk.id));
      return soal;
    });
    return typeof tulis === "string" ? gagal(tulis) : { ok: true as const, soal: tulis };
  } catch (e) {
    const admin = (await penggunaSaatIni().catch(() => null))?.peran === "admin";
    const kata = { ganti: "mengganti", ubah: "mengubah", tambah: "menambah" }[mode];
    return gagal(admin ? `Gagal ${kata}: ${pesanError(e)}` : mode === "ganti" ? PESAN_GAGAL_GURU : `Gagal ${kata} soal, ${SARAN_GURU}`);
  }
}


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

  // Batas analisa per guru per hari (biaya AI); dihitung saat mencoba, walau AI-nya gagal. Admin bebas.
  if (saya.peran !== "admin") {
    if ((await hitungPemakaian(saya.id, "analisa")) >= BATAS_ANALISA) return { ok: false as const, pesan: `Batas ${BATAS_ANALISA} analisa materi hari ini sudah habis. Pakai materi yang sudah ada, atau lanjutkan besok.` };
    await db.insert(pemakaianAi).values({ guruId: saya.id, jenis: "analisa" });
  }

  const { sistem, pengguna } = buatAnalisaMateri(mapel, kelas, untukAi, isian.teksArab === "bahasa");
  try {
    const r = await tanyaDenganCadangan(sistem, pengguna, daftarModel()[0]?.slot ?? 1, true, (d) => d, Date.now() + TENGGAT_SATU_SOAL);
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
  const [h] = await db.select({ guruId: hasilSoal.guruId, pengaturan: hasilSoal.pengaturan, dihapus: hasilSoal.dihapus }).from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya)) return { ok: false as const, pesan: "Set soal tidak ditemukan." };
  const baru = bersihkanIdentitas(identitas);
  await db.update(hasilSoal).set({ pengaturan: { ...(h.pengaturan as Pengaturan), identitas: baru } }).where(eq(hasilSoal.id, Number(id)));
  return { ok: true as const, identitas: baru };
}

/** Ganti nama set (tampil di riwayat, judul hasil, nama file Word). Kosong = kembali ke judul bab. Pemilik/admin saja. */
export async function ubahNamaSet(id: number, namaMentah: string) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const [h] = await db.select({ guruId: hasilSoal.guruId, dihapus: hasilSoal.dihapus }).from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya)) return { ok: false as const, pesan: "Set soal tidak ditemukan." };
  const nama = String(namaMentah ?? "").replace(/\s+/g, " ").trim().slice(0, MAKS_NAMA_SET) || null;
  await db.update(hasilSoal).set({ nama }).where(eq(hasilSoal.id, Number(id)));
  return { ok: true as const, nama };
}

/**
 * Hapus set (hapus lunak, kolom `dihapus`): hilang dari riwayat dan tidak bisa dibuka lagi, tetapi tetap dihitung di
 * jatah harian. Set yang masih diproses tidak boleh dihapus (pembuatannya masih menulis ke baris itu). Pemilik/admin saja.
 */
export async function hapusSet(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const [h] = await db.select({ guruId: hasilSoal.guruId, dihapus: hasilSoal.dihapus, status: hasilSoal.status }).from(hasilSoal).where(eq(hasilSoal.id, Number(id)));
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya)) return { ok: false as const, pesan: "Set soal tidak ditemukan." };
  if (h.status === "proses") return { ok: false as const, pesan: "Set masih dibuat. Tunggu sampai selesai, lalu hapus." };
  await db.update(hasilSoal).set({ dihapus: sql`now()` }).where(eq(hasilSoal.id, Number(id)));
  return { ok: true as const };
}

/**
 * Status + isi satu set, hanya untuk pemiliknya atau admin (aturan 3). Set orang lain dijawab "tidak ada".
 * denganBab=false: selama proses, data bab (bisa ratusan ribu huruf) tidak dikirim ulang di setiap pengecekan.
 */
export async function cekHasil(id: number, denganBab = true) {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  const [h] = await db
    .select({ guruId: hasilSoal.guruId, dihapus: hasilSoal.dihapus, nama: hasilSoal.nama, status: hasilSoal.status, soal: hasilSoal.soal, kisi: hasilSoal.kisi, bab: hasilSoal.bab, pesan: hasilSoal.pesan, model: hasilSoal.model, babId: hasilSoal.babId, dibuat: hasilSoal.dibuat, info: hasilSoal.info, pengaturan: hasilSoal.pengaturan, jumlahGanti: hasilSoal.jumlahGanti })
    .from(hasilSoal)
    .where(eq(hasilSoal.id, Number(id)));
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya)) return null;
  const { guruId, dihapus, pengaturan, jumlahGanti, ...isi } = h; // id pemilik tidak perlu dikirim ke browser
  void guruId;
  void dihapus;
  // Sisa jatah Ganti/Ubah/Tambah (ditampilkan di menu Lainnya): per set (permanen) dan per hari (guru saja).
  const guru = saya.peran !== "admin";
  const jatahUbah = h.status === "selesai"
    ? { set: jumlahGanti, batasSet: BATAS_GANTI_PER_SET, hari: guru ? await hitungPemakaian(saya.id, "ubah") : null, batasHari: guru ? BATAS_UBAH_PER_GURU : null }
    : null;
  const soal = h.soal as Soal[] | null;
  const kisi = h.kisi as BarisKisi[] | null;
  // Catatan guru + tanggapan AI atasnya (ATURAN-SOAL.md bagian 6), untuk guru maupun admin.
  const catatan = (pengaturan as Pengaturan).catatan || null;
  const tanggapan = (h.info as { tanggapan?: string } | null)?.tanggapan || null;
  const identitas = (pengaturan as Pengaturan).identitas ?? {}; // kop Word, bisa diubah di halaman hasil
  // Data bab (untuk menampilkan ayat & form edit): saat selesai, dan sekali saja selama proses (untuk draf soal).
  const bab = h.status === "selesai" || (h.status === "proses" && denganBab) ? (babDariSet(h) ?? null) : null;
  if (saya.peran !== "admin") {
    // Guru tidak menerima info teknis (model, waktu, token, catatan cadangan) maupun rincian error penyedia AI.
    // (halaman sudah menambahkan awalan "Gagal membuat soal:")
    return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, jatahUbah, model: null, info: null, pesan: h.status === "gagal" ? SARAN_GURU : h.pesan };
  }
  return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, jatahUbah, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number; catatan?: string[]; perbaikan?: string[] } | null };
}
