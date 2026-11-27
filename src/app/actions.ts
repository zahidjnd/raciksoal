"use server";

import { and, eq, sql } from "drizzle-orm";
import { awalHariIni, db } from "@/db";
import { gambar, hasilSoal, masukan, pemakaianAi } from "@/db/schema";
import paket from "../../package.json";
import { BATAS_GAMBAR, rapikanNilaiGambar, ukuranJpeg } from "@/lib/gambar";
import { daftarModel, tanyaAI, type GambarAI } from "@/lib/ai";
import { bagiTahap, jumlahSoal, miripIndikator, bersihkanInstruksi, bersihkanPengaturan, buatPengguna, buatPenggantiPengguna, buatPermintaanUbah, caraDiminta, bentukUbahan, MINTA_BENTUK, namaBentuk, laranganIsian, ringkasSudah, buatPermintaanKisi, buatPeriksaKembar, terapkanKembar, buatSistem, buatAnalisaMateri, buatBacaHalaman, bersihkanIdentitas, pasangKunciPgk, grupSet, rencanaDalil, rencanaLevelSet, sesuaikanLevel, MAKS_NAMA_SET, MAKS_SOAL, NAMA_BENTUK, TKA, type Identitas, type Pengaturan } from "@/lib/prompt";
import { BATAS_MATERI, modeArab, rapikanBacaanHalaman, susunDraf, terapkanAnalisa } from "@/lib/materi";
import { bersihkanTanggapan, MAKS_WACANA, gabungBab, identitasBab, isiSama, jawabanAman, kategoriBaru, posisiBentuk, sesuaikanBentuk, kataTerpakai, KELAS, LEVEL, mjLama, pasangDalil, pemeriksaArab, POLA_ARAB, pasangWacana, periksaKisi, periksaSoal, rapikanSoal, ratakanKunci, isiSisipan, cekKunciPgk, samakanDenganKisi, susunMenjodohkan, susunMjLama, susunPilihanDalil, terapkanBobot, type Bab, type BarisKisi, type Bentuk, type Soal } from "@/lib/soal";
import { babDariSet, babMilik, daftarBabMilik, dataGambar, gambarMilik } from "@/lib/bab";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";
import { hitungBulanIni, hitungHariIni, hitungPemakaian } from "@/lib/pemakaian";
import { lengkapiTerjemah, mushaf, potongAyat } from "@/lib/mushaf";
import { cariDalil } from "@/lib/hadis";
import { ambilBatas, ambilBawaan, tolakBila } from "@/lib/batas";
import { dihentikan, pesanRem, rapikanCatatan } from "@/lib/batas-nilai";

const SESI_HABIS = "Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.";
// Materi mode "bahasa" (Bahasa Arab): teks Arab yang dikenali sebagai ayat tetap ditandai (aturan 5). Mushaf dimuat
// hanya saat dipakai, yaitu untuk materi mode "bahasa".
const cekAyat = (arab: string) => !!mushaf().cari(arab);
// Aturan 4: batas pembuatan per guru per hari (admin tidak dibatasi per guru),
// plus batas total seluruh web sebagai pengaman saldo AI. Set yang GAGAL tidak dihitung.
const BATAS_GANTI_PER_SET = 100;
// Set yang sedang dibuat bersamaan: per guru (admin bebas, untuk "Bandingkan") dan seluruh web (RAM hosting 1 GB).
const BATAS_PROSES_GURU = 2;
const BATAS_PROSES_WEB = 10;
// Batas waktu TOTAL (audit C3): tanpa ini, timeout per panggilan × coba ulang × model cadangan × tahap bisa
// membuat guru menunggu puluhan menit. Lewat batas → set gagal (jatah kembali). Normal: 40 soal ±80 detik.
const TENGGAT_SET = 10 * 60_000;
const TENGGAT_SATU_SOAL = 4 * 60_000;

const PESAN_BATAS_SET = `Jatah ${BATAS_GANTI_PER_SET} kali ganti/ubah/tambah soal untuk set ini sudah habis dan tidak kembali. Perbaiki soal lewat Edit atau Tulis soal sendiri, atau buat set baru dengan "Pakai materi ini lagi".`;

/**
 * Sisa jatah set untuk ditampilkan di form. batas/batasBulan = null berarti tanpa batas (admin, atau guru yang diberi
 * "tanpa batas"); `pesan` terisi bila guru sedang tidak boleh membuat set (habis, dihentikan, atau rem darurat).
 */
export async function ambilJatah() {
  const saya = await penggunaSaatIni();
  if (!saya) return null;
  const terpakai = await hitungHariIni(saya.id);
  if (saya.peran === "admin") return { admin: true, batas: null, terpakai, bulan: null, batasBulan: null, pesan: null, peringatan: null, peringatanMateri: null };
  const [b, bulan, pesan, pesanAnalisa] = await Promise.all([ambilBatas(saya.id), hitungBulanIni(saya.id), tolakBila(saya, "set"), tolakBila(saya, "analisa")]);
  const nol = (n: number) => (Number.isFinite(n) ? n : null);
  // Kotak peringatan di halaman guru: judul singkat (diakhiri "!") + isi. Rem darurat → isinya catatan admin + penghibur.
  const stop = b.khusus && dihentikan(b.angka);
  const alasan = (p: string | null, habis: string) =>
    !p
      ? null
      : b.rem
        ? { judul: "Pembuatan soal sedang dihentikan sementara!", isi: `${b.remPesan ? `${rapikanCatatan(b.remPesan)}. ` : ""}Edit manual, tulis soal sendiri, dan riwayat set tetap bisa dipakai.` }
        : { judul: stop ? "Pemakaian AI akun Anda dihentikan admin!" : habis, isi: p };
  return {
    admin: false,
    batas: nol(b.angka.set),
    terpakai,
    bulan,
    batasBulan: nol(b.angka.bulan),
    pesan,
    // peringatan: set tidak bisa dibuat → seluruh form Set baru dikunci. peringatanMateri: hanya analisa materi yang tertutup.
    peringatan: alasan(pesan, "Jatah pembuatan soal habis!"),
    peringatanMateri: alasan(pesanAnalisa, "Analisa materi tidak tersedia sekarang!"),
  };
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
async function tanyaDenganCadangan<T>(sistem: string, pengguna: string, slotUtama: number, pakaiCadangan: boolean, ambil: (data: unknown) => T, sampai: number, gambar: GambarAI[] = []) {
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
      const r = await tanyaAI(sistem, pengguna, slot, sampai, gambar);
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

/**
 * Gambar bab untuk dikirim ke AI (0.30.0). Isinya diambil sekali; yang bukan milik pemilik set tidak ikut (aturan 3).
 * Kembalian: fungsi pemilih, `pilih()` = semua gambar, `pilih([12])` = gambar tertentu saja (hemat token).
 */
async function gambarUntukAI(bab: Bab, guruId: string | null) {
  const daftar = bab.gambar ?? [];
  const data = daftar.length && guruId ? await dataGambar(daftar.map((g) => g.id), guruId) : new Map<number, { data: Buffer }>();
  const siap = daftar
    .filter((g) => data.has(g.id))
    .map((g) => ({ id: g.id, label: `[gambar_id: ${g.id}]${g.keterangan ? ` ${g.keterangan}` : ""}`, url: `data:image/jpeg;base64,${data.get(g.id)!.data.toString("base64")}` }));
  return (ids?: (number | null | undefined)[]): GambarAI[] => siap.filter((g) => !ids || ids.includes(g.id)).map(({ label, url }) => ({ label, url }));
}

/** Ambil daftar soal dari JSON jawaban AI; `perlu` = jumlah minimal (kelebihan dibuang). */
function ambilSoal(data: unknown, perlu = 1, maks = perlu): Soal[] {
  // Sebagian jawaban satu soal datang tanpa dibungkus daftar ("soal": {...} atau soalnya langsung) → dibungkus di sini.
  const mentah = (data as { soal?: unknown })?.soal ?? ((data as { pertanyaan?: unknown })?.pertanyaan ? data : undefined);
  const soal = mentah && !Array.isArray(mentah) && typeof mentah === "object" ? [mentah] : mentah;
  if (!Array.isArray(soal) || !soal.length) throw new Error("daftar soal tidak ditemukan.");
  if (soal.length < perlu) throw new Error(`hanya ${soal.length} dari ${perlu} soal.`);
  return (soal as Soal[]).slice(0, Math.max(maks, 1));
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
    // 0.42.0: ayat dari mushaf tanpa terjemah guru diberi terjemah Kemenag (disimpan di salinan bab set).
    const bab = lengkapiTerjemah(gabungBab(babs as Bab[]));
    // 0.33.0: batas total sama dengan batas satu materi (biaya token & panjang pesan yang diterima AI).
    const totalHuruf = bab.materi.join("\n").length;
    if (totalHuruf > BATAS_MATERI.isi)
      return { ok: false as const, pesan: `Materi yang digabung terlalu panjang: ±${totalHuruf.toLocaleString("id-ID")} huruf, maksimal ${BATAS_MATERI.isi.toLocaleString("id-ID")}. Kurangi materi yang dipakai di set ini.` };
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
      const tolak = await tolakBila(saya, "set", tx);
      if (tolak) return tolak;
      if ((await hitungHariIni(undefined, tx)) >= (await ambilBawaan()).web)
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

    void kerjakan(mulai, bab, p, saya.id); // sengaja tidak ditunggu, supaya koneksi browser tidak putus
    return { ok: true as const, id: mulai };
  } catch (e) {
    return { ok: false as const, pesan: `Gagal memulai: ${pesanError(e)}` };
  }
}

/**
 * Langkah 6: susun kisi-kisi dulu (satu panggilan, AI melihat rencana semua soal sehingga skenario tidak berulang),
 * lalu buat soal bertahap (maks 10 per panggilan supaya jawaban AI tidak terpotong) mengikuti potongan kisi-kisinya.
 */
async function kerjakan(id: number, bab: Bab, p: Pengaturan, guruId: string) {
  const sistem = buatSistem(bab, p.tujuan === TKA);
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
  const tanya = async <T,>(label: string, pengguna: string, ambil: (data: unknown) => T, gambar: GambarAI[] = []) => {
    permintaan.push(gambar.length ? `[${gambar.map((g) => g.label).join("; ")}]\n${pengguna}` : pengguna);
    const r = await tanyaDenganCadangan(sistem, pengguna, p.modelSlot ?? 1, !p.bandingkan, ambil, sampai, gambar);
    mentah.push(r.jawaban);
    info.tokenMasuk += r.token.masuk;
    info.tokenKeluar += r.token.keluar;
    info.catatan.push(...r.catatan.map((c) => `${label}: ${c}`));
    dipakai.add(r.model);
    return r.hasil;
  };

  try {
    const pilihGambar = await gambarUntukAI(bab, guruId);
    await simpan({ pesan: "Menyusun kisi-kisi" });
    const { kisi: kisiAwal, tanggapan } = await tanya("Kisi-kisi", buatPermintaanKisi(p, bab),(d) => {
      const isi = d as { kisi?: unknown; tanggapan?: unknown; wacana?: unknown };
      // Wacana soal grup: Latihan TKA, dan PG Bahasa Indonesia (0.39.0); selain itu semua soal tunggal.
      // Nomor grup dari rencana aplikasi (grupSet), bukan dari AI; AI hanya menulis wacananya.
      const grup = grupSet(p, bab.mapel ?? "");
      // Level tiap baris dikunci ke kategori rencana aplikasi (komposisi LOTS/MOTS/HOTS harus persis, mis. surat ASAS).
      const rencana = rencanaLevelSet(p);
      const kisi = pasangKunciPgk(
        pasangWacana(periksaKisi(isi?.kisi, p.jumlah, bab, cekAyat).map((k, i) => ({ ...k, grup: grup[i] ?? null, level: sesuaikanLevel(k.level, rencana[i]) })), grup.some(Boolean) ? isi?.wacana : null, bab, cekAyat),
        p.tujuan === TKA,
      );
      // 0.42.0: nomor berdalil & cara tampil dari rencana aplikasi (set tanpa porsi dalil = set lama: kisi apa adanya).
      return { kisi: p.porsiDalil ? pasangDalil(kisi, rencanaDalil(p, bab), bab, !!p.catatan) : kisi, tanggapan: p.catatan ? bersihkanTanggapan(isi?.tanggapan, bab, cekAyat) : "" };
    }, pilihGambar());
    if (tanggapan) info.tanggapan = tanggapan;
    // Pemeriksaan kisi-kisi (0.25.0): AI mencari baris kembar lintas bentuk dan menulis ulang yang belakangan. Gagal → kisi
    // awal tetap dipakai; catatan di info.perbaikan (bukan info.catatan, yang memicu pita merah admin).
    let kisi = kisiAwal;
    await simpan({ kisi, pesan: "Memeriksa kisi-kisi" });
    try {
      const aman = (t: string) => !pemeriksaArab(bab, cekAyat)(t).length;
      const r = await tanya("Periksa kisi-kisi", buatPeriksaKembar(kisi), (d) => terapkanKembar(kisi, d, aman));
      kisi = r.kisi;
      if (r.diganti.length) (info.perbaikan ??= []).push(`Kisi-kisi: baris kembar ditulis ulang: ${r.diganti.join(", ")}.`);
    } catch (e) {
      (info.perbaikan ??= []).push(`Kisi-kisi: pemeriksaan baris kembar gagal (${pesanError(e)}), kisi-kisi awal dipakai.`);
    }
    await simpan({ kisi });

    let awal = 0;
    for (const [i, jumlah] of tahap.entries()) {
      // Tahap diisi berurutan PG → PGK → BS → URAIAN, sama dengan urutan kisi-kisi.
      const n = jumlahSoal(jumlah);
      const baris = kisi.slice(awal, awal + n);
      awal += n;
      await simpan({ pesan: `Tahap ${i + 1} dari ${tahap.length}` });
      const pengguna = buatPengguna(p, jumlah, semua.map(ringkasSudah), laranganIsian(kisi), baris);
      // Hanya gambar yang direncanakan kisi-kisi untuk nomor-nomor tahap ini.
      const gambarTahap = baris.map((k) => k.gambar_id).filter(Boolean);
      const soal = await tanya(`Tahap ${i + 1}`, pengguna, (d) => ambilSoal(d, baris.length), gambarTahap.length ? pilihGambar(gambarTahap) : []);
      // Menjodohkan gaya lama: daftar jawaban bersama per blok disusun & diacak aplikasi (susunMjLama).
      // 0.43.0: pilihan A–E soal PG berdalil (rumpang/pilihan/urutan) disusun aplikasi dari teks terverifikasi.
      // 0.44.0: kode sisipan dalil ([[A 3-4]]) diganti teks asli SEBELUM daftar jawaban menjodohkan disusun.
      semua.push(...susunMjLama(soal.map((s, j) => isiSisipan(samakanDenganKisi(s, baris[j]), bab))).map((s) => susunPilihanDalil(susunMenjodohkan(s), bab)));
      // Draf untuk tampilan bertahap (status tetap "proses"): sudah lewat penjaga ayat, tetapi kunci belum
      // diratakan dan skor belum diisi; keduanya baru di akhir untuk seluruh set.
      await simpan({ soal: periksaSoal(semua, bab, cekAyat) });
    }
    const soal = periksaSoal(semua, bab, cekAyat).map((s, i) => cekKunciPgk(s, kisi[i]));
    // Perbaikan otomatis 1x: soal bertanda merah dikirim balik ke AI beserta daftar masalahnya, lalu hasilnya DIPERIKSA
    // ULANG oleh aplikasi (aturan 5: AI menulis, aplikasi yang memeriksa). Dipakai hanya kalau bersih; kalau tidak,
    // soal lama (tetap merah) dibiarkan untuk guru. Tidak memakai jatah Ganti/Ubah.
    for (const [i, s] of soal.entries()) {
      // Menjodohkan gaya lama memakai daftar jawaban bersama: tidak bisa diperbaiki AI satu nomor saja (guru: Edit).
      if (!s.peringatan?.length || mjLama(s)) continue;
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
        // 0.31.2: nama/istilah/tahun materi yang dipastikan aplikasi belum tertulis di soal mana pun, ditaruh SEBELUM daftar
        // terlarang (yang boleh terpotong). Dulu AI menebak dan tebakannya juga sudah tertulis (set 104: 3 calon gagal).
        const aman = bocor ? jawabanAman(bab, soal, i) : [];
        const pilihan = aman.length ? ` Pilih jawaban baru dari daftar ini (dipastikan aplikasi belum tertulis di soal mana pun): ${aman.map((k) => `"${k}"`).join(", ")}.` : "";
        const instruksi = `${awal}Perbaiki soal ini (bentuk, TP, level tetap). Masalah: ${masalah}${pilihan}${terpakai}`;
        // Instruksi buatan aplikasi boleh lebih panjang dari batas guru (300), supaya potongan teks bocor dan daftar kata tidak terpotong.
        // Isian bocor: 3 calon sekaligus, aplikasi memakai yang pertama bersih. Satu calon saja sering gagal karena konsep
        // penggantinya juga sudah tertulis di soal lain (set 93: "fungsi anggaran", "fungsi mengatur"); 14 dari 17 isian bocor
        // di data laptop memang konsep yang ditanyakan dua kali, jadi isiannya harus pindah konsep.
        const calon = bocor ? 3 : 1;
        const daftar = await tanya(`Perbaikan soal ${i + 1}`, buatPenggantiPengguna(p, s, soal, kisi[i], instruksi, 2000, calon), (d) => ambilSoal(d, 1, calon), s.gambar_id ? pilihGambar([s.gambar_id]) : []);
        // Diperiksa bersama seluruh set (bukan sendirian), supaya kunci isian yang masih bocor ke soal lain tetap ketahuan.
        const hasil = daftar.map((baru) => {
          // 0.43.0: dalil tetap (kisi); potongan & pengecoh lama dipakai bila AI tidak menuliskannya lagi (set 150 no. 9).
          const potongLama = baru.dalil_potong ? {} : { dalil_potong: s.dalil_potong };
          const { stimulus: _s, indikator, ...isi } = susunPilihanDalil(susunMenjodohkan(isiSisipan(samakanDenganKisi({ ...baru, ...potongLama }, kisi[i]), bab)), bab);
          void _s;
          // Konsep pengganti tidak boleh mengulang baris kisi lain (0.31.2, set 117: isian 21 "PPnBM" dan 23 "Pajak Penjualan
          // atas Barang Mewah" diperbaiki ke konsep yang sama; indikatornya kembar, kuncinya beda tulisan).
          const ulang = (bocor || kelompok) && indikator ? kisi.findIndex((k, j) => j !== i && k.bentuk !== "MJ" && k.bentuk !== "URAIAN" && miripIndikator(k.indikator, String(indikator))) + 1 : 0;
          const cek = cekKunciPgk(periksaSoal(soal.map((x, j) => (j === i ? isi : x)), bab, cekAyat)[i], kisi[i]);
          return { indikator, cek: ulang ? { ...cek, peringatan: [...(cek.peringatan ?? []), `Konsep penggantinya sama dengan soal nomor ${ulang}.`] } : cek };
        });
        const bersih = hasil.findIndex((h) => !h.cek.peringatan?.length);
        const { indikator, cek } = hasil[Math.max(bersih, 0)];
        if (cek.peringatan?.length) info.perbaikan.push(`Soal ${i + 1}: perbaikan otomatis masih melanggar aturan (${cek.peringatan.join("; ")})${hasil.length > 1 ? `, ${hasil.length} calon semuanya gagal` : ""}, soal awal dipakai.`);
        else {
          soal[i] = cek;
          // Indikator baru (konsep lain) ikut ke kisi-kisi; teks berisi Arab tak terverifikasi tidak dipakai (aturan 5).
          const ind = String(indikator ?? "").trim();
          if ((bocor || kelompok) && ind && !pemeriksaArab(bab, cekAyat)(ind).length) kisi[i] = { ...kisi[i], indikator: ind };
          // Rencana jawaban isian ikut kunci baru; tanpa ini Ganti/Ubah nanti diberi tahu kunci lama (set 115: "Damaskus").
          if (bocor) kisi[i] = { ...kisi[i], jawaban: String([cek.kunci].flat()[0] ?? "").trim() || kisi[i].jawaban };
          info.perbaikan.push(`Soal ${i + 1} diperbaiki otomatis${hasil.length > 1 ? ` (calon ${bersih + 1} dari ${hasil.length})` : ""}: ${masalah}`);
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

/**
 * Gambar yang diunggah guru langsung di Edit / Tulis soal sendiri (belum ada di materi set): kalau milik pemilik set
 * (aturan 3), dicatat di salinan bab set itu supaya lolos periksaSoal. Mengembalikan true kalau bab berubah.
 */
async function sahkanGambarBaru(set: IsiSet, id: unknown) {
  const g = Number(id);
  if (!Number.isInteger(g) || g <= 0 || !set.h.guruId || set.bab.gambar?.some((x) => x.id === g) || (set.bab.gambar?.length ?? 0) >= 2 * BATAS_GAMBAR.perSet) return false;
  if (!(await gambarMilik([g], set.h.guruId)).has(g)) return false;
  set.bab = { ...set.bab, gambar: [...(set.bab.gambar ?? []), { id: g, keterangan: "" }] };
  return true;
}

async function simpanSoalDi(set: IsiSet, no: number, isian: Soal, tx: Tx) {
  {
    const lama = set.soal[no];
    const babBaru = await sahkanGambarBaru(set, isian?.gambar_id);
    // Nomor grup tetap dari server (bukan dari browser); hanya teks wacananya yang boleh diedit guru.
    const [soal] = periksaSoal([rapikanSoal({ ...isian, grup: lama.grup }, lama.bentuk)], set.bab, cekAyat, set.soal.filter((_, j) => j !== no));
    set.soal[no] = soal;
    // TP/level yang diubah guru ikut ke baris kisi-kisinya, supaya kisi-kisi tetap cocok dengan soal.
    const kisi = set.h.kisi as BarisKisi[] | null;
    if (kisi?.[no]) kisi[no] = { ...kisi[no], tp: soal.tp, level: soal.level, gambar_id: soal.gambar_id ?? null };
    // Wacana soal grup dipakai bersama: editan guru ikut ke semua soal & baris kisi-kisi grup itu.
    if (soal.grup && soal.wacana) {
      set.soal.forEach((s, i) => {
        if (s.grup !== soal.grup) return;
        set.soal[i] = { ...s, wacana: soal.wacana };
        if (kisi?.[i]) kisi[i] = { ...kisi[i], wacana: soal.wacana };
      });
    }
    // Menjodohkan gaya lama: daftar jawaban dipakai bersama satu blok, editannya ikut ke nomor lain di blok itu.
    if (mjLama(soal) && soal.grup) set.soal.forEach((s, i) => mjLama(s) && s.grup === soal.grup && (set.soal[i] = { ...s, jawaban: soal.jawaban }));
    await tx.update(hasilSoal).set({ soal: set.soal, kisi, ...(babBaru && { bab: set.bab }) }).where(eq(hasilSoal.id, set.h.id));
    return soal;
  }
}

/** Isian soal manual yang belum lengkap → pesan untuk guru (soal AI tidak lewat sini). */
function kurangLengkap(s: Soal): string {
  const kosong = (x?: string[]) => !x?.length || x.some((t) => !t);
  if (!s.pertanyaan) return "Tulis pertanyaannya dulu.";
  if ((s.bentuk === "PG" || s.bentuk === "PGK") && kosong(s.pilihan)) return "Isi kelima pilihan jawaban.";
  if (s.bentuk === "PG" && !"ABCDE".includes(String(s.kunci) || "?")) return "Pilih kunci jawabannya.";
  if (s.bentuk === "BS" && Array.isArray(s.pernyataan) && kosong(s.pernyataan)) return "Isi semua pernyataan.";
  if (s.bentuk === "BS" && !Array.isArray(s.pernyataan) && !["Benar", "Salah"].includes(String(s.kunci))) return "Pilih kuncinya: Benar atau Salah.";
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
      // Menjodohkan gaya lama memakai daftar jawaban bersama satu blok: dibuat lewat "Buat soal", diperbaiki lewat Edit.
      if (bentuk === "MJ") return "Soal menjodohkan tidak bisa ditulis satu per satu. Buat lewat Buat soal, atau perbaiki nomor menjodohkan yang ada lewat Edit.";
      if (set.soal.length >= MAKS_SOAL) return `Satu set maksimal ${MAKS_SOAL} soal.`;
      const babBaru = await sahkanGambarBaru(set, isian?.gambar_id);
      const rapi = rapikanSoal({ ...isian, grup: undefined, wacana: undefined }, bentuk);
      const kurang = kurangLengkap(rapi);
      if (kurang) return kurang;
      if (!set.bab.tp.some((t) => t.kode === rapi.tp)) rapi.tp = set.bab.tp[0]?.kode ?? rapi.tp;
      if (!LEVEL.includes(rapi.level)) rapi.level = "C2";
      const [soal] = periksaSoal([rapi], set.bab, cekAyat);
      // Akhir bagian bentuknya: setelah soal terakhir yang urutan bentuknya <= bentuk ini.
      const posisi = posisiBentuk(set.soal, bentuk);
      set.soal.splice(posisi, 0, soal);
      const kisi = set.h.kisi as BarisKisi[] | null;
      kisi?.splice(posisi, 0, { no: 0, bentuk, tp: soal.tp, materi: "(soal tulisan guru)", indikator: "(soal tulisan guru)", level: soal.level, dalil_id: soal.dalil_id, gambar_id: soal.gambar_id ?? null, stimulus: "" });
      await tx.update(hasilSoal).set({ soal: set.soal, kisi: kisi && nomoriUlang(kisi), ...(babBaru && { bab: set.bab }) }).where(eq(hasilSoal.id, set.h.id));
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

/** Penolakan yang pesannya untuk guru apa adanya (bukan galat teknis). */
class PesanGuru extends Error {}

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
    const tolakUbah = await tolakBila(saya, "ubah"); // aturan 4: batas harian per guru + rem darurat, admin bebas
    if (tolakUbah) return gagal(tolakUbah);
    if (h.jumlahGanti >= BATAS_GANTI_PER_SET) return gagal(PESAN_BATAS_SET);
    if (mode === "tambah" && set.soal.length >= MAKS_SOAL) return gagal(`Satu set maksimal ${MAKS_SOAL} soal.`);

    const lama = set.soal[no];
    // Menjodohkan (gaya lama: daftar jawaban dipakai bersama satu blok) tidak diganti/diubah/ditambah AI per nomor.
    if (lama.bentuk === "MJ") return gagal("Soal menjodohkan tidak bisa diganti, diubah, atau ditambah AI per nomor karena daftar jawabannya dipakai bersama. Perbaiki lewat Edit.");
    const kisi = h.kisi as BarisKisi[] | null; // set lama: tanpa kisi-kisi
    const baris = kisi?.[no];
    const p = h.pengaturan as Pengaturan;
    const sistem = buatSistem(bab, p.tujuan === TKA);
    // 0.45.0: "ubah" memakai permintaan editor sendiri (buatPermintaanUbah), bukan "buat soal" + instruksi di ujung.
    // 0.50.0: cara tampil dalil yang diminta guru ("hadisnya jadi jawaban" = pilihan) dibaca aplikasi, bukan ditebak AI.
    const cara = ubah ? caraDiminta(instruksi, lama.bentuk, bab, lama.dalil_id) : null;
    const opsiUbah = { cara, adaGambar: !!bab.gambar?.length };
    let pengguna = ubah ? buatPermintaanUbah(p, lama, set.soal, baris, instruksi, opsiUbah) : buatPenggantiPengguna(p, lama, set.soal, baris);
    // Model utama sama dengan set; cadangan dipakai kalau gagal (kecuali set hasil "Bandingkan semua model").
    // Gambar soal lama / rencana kisi-kisi ikut dikirim supaya AI bisa menulis soal bergambar yang benar.
    const idGambar = [lama.gambar_id, baris?.gambar_id].filter(Boolean);
    const gambarAI = idGambar.length ? (await gambarUntukAI(bab, h.guruId))(idGambar) : [];
    const sampai = Date.now() + TENGGAT_SATU_SOAL;
    const tanya = (isi: string) => tanyaDenganCadangan(sistem, isi, p.modelSlot ?? 1, !p.bandingkan, (d) => ambilSoal(d), sampai, gambarAI);
    // (aturan 5: teks berisi Arab yang tidak terverifikasi tidak dipakai)
    const aman = (x: unknown) => {
      const t = String(x ?? "").trim();
      return t && !pemeriksaArab(bab, cekAyat)(t).length ? t : null;
    };

    const alasanBentuk = (b: Bentuk) => {
      const nama = NAMA_BENTUK[b]?.toLowerCase() ?? "bentuk lain";
      return `Soal tidak diubah: ${
        lama.grup ? "soal grup (wacana bersama) tidak bisa diganti bentuknya."
        : p.tujuan === TKA && !["PG", "PGK", "BS"].includes(b) ? `Latihan TKA hanya memakai PG, PG kompleks, dan Kategori, jadi tidak bisa dijadikan ${nama}.`
        : b === "MJ" ? "soal menjodohkan tidak bisa dibuat lewat Ubah soal (daftar jawabannya dipakai bersama)."
        : !MINTA_BENTUK.test(instruksi) ? "AI mencoba mengganti bentuk soal padahal tidak diminta. Coba lagi, atau sebut bentuknya bila memang ingin diganti."
        : `bentuk ${nama} tidak bisa dipakai untuk soal ini.`
      } Jatah tidak terpakai.`;
    };

    /** Jawaban AI → soal jadi + baris kisi-kisi baru (+ pada "ubah": wacana baru & catatan AI untuk guru). */
    const olah = (hasilAi: Soal[]) => {
      // 0.46.0: "ubah" boleh mengganti bentuk bila diizinkan (bentukUbahan) DAN guru menyebut bentuk di permintaannya.
      const bentukAi = String(hasilAi[0]?.bentuk ?? "").trim().toUpperCase() as Bentuk;
      const bentuk = ubah && bentukUbahan(p, lama).includes(bentukAi) && MINTA_BENTUK.test(instruksi) ? bentukAi : lama.bentuk;
      // AI menulis bentuk lain yang tidak boleh (mis. uraian di Latihan TKA): isinya tidak cocok dengan bentuk lama
      // (PG tanpa pilihan, set 129), jadi ditolak utuh, tidak disimpan & tidak memakai jatah.
      if (ubah && bentukAi && bentukAi !== lama.bentuk && bentuk === lama.bentuk) throw new PesanGuru(alasanBentuk(bentukAi));
      const { stimulus, indikator, catatan, ...baru } = susunMenjodohkan(isiSisipan({ ...hasilAi[0], bentuk }, bab)) as Soal & { indikator?: unknown; catatan?: unknown }; // Menjodohkan: pasangan AI → premis, jawaban acak, kunci
      // Ubah: level/TP dari AI dipakai hanya kalau valid. Ganti/tambah: disamakan dengan kisi-kisi.
      // Nomor grup tidak diambil dari jawaban AI (soal grup tetap di grupnya). Wacana baru hanya pada "ubah" soal grup.
      const { grup: _g, wacana: wacanaAi, ...isiBaru } = baru;
      void _g;
      const wacana = ubah && lama.grup && lama.wacana ? aman(wacanaAi) : null;
      const wacanaBaru = wacana && wacana !== lama.wacana?.trim() ? wacana.slice(0, MAKS_WACANA) : null;
      const grupLama = lama.grup && lama.wacana ? { grup: lama.grup, wacana: wacanaBaru ?? lama.wacana } : {};
      const hasilUbah = { ...sesuaikanBentuk(isiBaru as Soal, bentuk), ...grupLama, gambar_id: baru.gambar_id === undefined ? lama.gambar_id : baru.gambar_id, level: LEVEL.includes(baru.level) ? baru.level : lama.level, tp: bab.tp.some((t) => t.kode === baru.tp) ? baru.tp : lama.tp,
        // 0.43.0: dalil sama tanpa potongan baru → potongan & urutan lama tetap (guru hanya meminta mengubah kalimat, misalnya).
        ...(baru.dalil_id === lama.dalil_id && !baru.dalil_potong && { dalil_potong: lama.dalil_potong ?? null }) };
      const [diperiksa] = periksaSoal([susunPilihanDalil(ubah ? hasilUbah : baris ? samakanDenganKisi(baru, baris) : { ...isiBaru, ...grupLama, bentuk: lama.bentuk }, bab)], bab, cekAyat, set.soal.filter((_, j) => mode === "tambah" || j !== no));
      const soal = ubah ? diperiksa : cekKunciPgk(diperiksa, baris ?? undefined); // Ganti/Tambah: jumlah kunci PGK ikut kisi
      const gantiBentuk = bentuk !== lama.bentuk;
      // Posisi kunci PG/PGK diacak (tidak saat "ubah" bentuk sama, supaya guru tidak bingung).
      if (!ubah || gantiBentuk) ratakanKunci([soal]);
      if (p.bobot) terapkanBobot([soal], p.bobot);
      // Skenario (dan pada "ubah": indikator, TP, level) baru dicatat di baris kisi-kisi.
      // Ganti bentuk: rencana khusus bentuk lama dibuang, diganti isi soal barunya (dipakai "Ganti soal ini" berikutnya).
      const rencanaBentuk = gantiBentuk && {
        bentuk,
        kunciPgk: bentuk === "PGK" ? [soal.kunci].flat().length : undefined,
        jumlahPernyataan: kategoriBaru(soal) ? soal.pernyataan!.length : undefined,
        kunciBs: bentuk === "BS" && !kategoriBaru(soal) ? String(soal.kunci) : undefined,
        jawaban: bentuk === "ISIAN" ? String(soal.kunci) : undefined,
      };
      const barisBaru = baris && { ...baris, stimulus: aman(stimulus) ?? baris.stimulus, ...(ubah && { indikator: aman(indikator) ?? baris.indikator, tp: soal.tp, level: soal.level, ...rencanaBentuk, ...(wacanaBaru && { wacana: wacanaBaru }), ...(baris.dalil_tampil !== undefined && { dalil_id: soal.dalil_id, dalil_tampil: soal.dalil_tampil ?? null }) }) };
      return { soal, barisBaru, wacanaBaru, gantiBentuk, catatan: ubah ? (aman(catatan)?.slice(0, 400) ?? "") : "" };
    };

    let r = await tanya(pengguna);
    let hasil = olah(r.hasil);
    const masihSempat = () => Date.now() < sampai - 60_000;
    // 0.45.0: AI mengembalikan soal yang sama persis (0.50.0: atau tidak memakai cara tampil dalil yang diminta) → coba
    // sekali lagi dengan teguran (jatah tetap dihitung sekali).
    const meleset = (s: Soal) => isiSama(s, lama) || (!!cara && s.dalil_tampil !== cara);
    if (ubah && meleset(hasil.soal) && masihSempat()) {
      const ulang = buatPermintaanUbah(p, lama, set.soal, baris, instruksi, { ...opsiUbah, ulang: true });
      const kedua = await tanya(ulang).then((r2) => ({ r2, h2: olah(r2.hasil) })).catch(() => null);
      if (kedua && (!meleset(kedua.h2.soal) || isiSama(hasil.soal, lama))) [r, hasil, pengguna] = [kedua.r2, kedua.h2, ulang];
    }
    // 0.50.0: hasil Ubah yang masih bertanda merah diperbaiki AI sekali sebelum disimpan (seperti pembuatan set). Hasil
    // perbaikan dipakai hanya bila peringatannya berkurang dan tetap menjalankan permintaan guru.
    const masalah = hasil.soal.peringatan ?? [];
    if (ubah && masalah.length && !isiSama(hasil.soal, lama) && masihSempat()) {
      const minta = buatPermintaanUbah(p, hasil.soal, set.soal.filter((_, j) => j !== no), baris, instruksi, { ...opsiUbah, masalah });
      const baik = await tanya(minta).then((r3) => ({ r3, h3: olah(r3.hasil) })).catch(() => null);
      if (baik && (baik.h3.soal.peringatan ?? []).length < masalah.length && !meleset(baik.h3.soal)) {
        [r, hasil, pengguna] = [baik.r3, baik.h3, minta];
        hasil.catatan = `Hasil pertama bertanda peringatan (${masalah[0].split(/\.\s/)[0].replace(/\.$/, "")}), jadi sudah diperbaiki otomatis. ${hasil.catatan}`;
      }
    }
    const { soal, barisBaru, wacanaBaru } = hasil;
    // Wacana dipakai bersama: soal lain di grupnya ikut berubah, guru diminta memeriksanya.
    const nomorGrupLain = wacanaBaru ? set.soal.flatMap((s, j) => (j !== no && s.grup === lama.grup && s.wacana ? [j + 1] : [])) : [];
    const catatan = [hasil.catatan, nomorGrupLain.length ? `Wacana baru juga dipakai soal nomor ${nomorGrupLain.join(", ")}; periksa soal-soal itu.` : ""].filter(Boolean).join(" ");

    // Tulis ke isi TERBARU set (bisa sudah diedit guru selama AI bekerja), dengan baris dikunci.
    let letak = no; // nomor baru soal (berubah bila bentuknya diganti)
    const tulis = await denganSetTerkunci(id, no, async (kini, tx) => {
      if (JSON.stringify(kini.soal[no]) !== JSON.stringify(lama)) return "Soal ini berubah saat AI bekerja (diedit atau dihapus). Muat ulang halaman lalu coba lagi.";
      if (kini.h.jumlahGanti >= BATAS_GANTI_PER_SET) return PESAN_BATAS_SET;
      // ponytail: dicek ulang di sini, tapi dua permintaan serentak pada set BERBEDA bisa lewat 1–2 di atas batas
      // (kunci di sini per set). Cukup untuk pengaman biaya; kunci per guru bila perlu tepat.
      const tolakLagi = await tolakBila(saya, "ubah", tx);
      if (tolakLagi) return tolakLagi;
      await tx.insert(pemakaianAi).values({ guruId: saya.id, jenis: mode });
      const kisiKini = kini.h.kisi as BarisKisi[] | null;
      if (mode === "tambah") {
        if (kini.soal.length >= MAKS_SOAL) return `Satu set maksimal ${MAKS_SOAL} soal.`;
        kini.soal.splice(no + 1, 0, soal);
        if (kisiKini && barisBaru) kisiKini.splice(no + 1, 0, barisBaru);
      } else if (hasil.gantiBentuk) {
        // Bentuk baru: soal (dan baris kisinya) pindah ke akhir bagian bentuk itu, nomor sesudahnya bergeser.
        kini.soal.splice(no, 1);
        letak = posisiBentuk(kini.soal, soal.bentuk);
        kini.soal.splice(letak, 0, soal);
        if (kisiKini && barisBaru) {
          kisiKini.splice(no, 1);
          kisiKini.splice(letak, 0, barisBaru);
        }
      } else {
        kini.soal[no] = soal;
        if (kisiKini && barisBaru) kisiKini[no] = barisBaru;
        // Wacana baru (ubah soal grup) ikut ke semua soal & baris kisi-kisi grup itu, sama dengan Edit (simpanSoalDi).
        if (wacanaBaru)
          kini.soal.forEach((s, i) => {
            if (s.grup !== lama.grup || !s.wacana) return;
            kini.soal[i] = { ...s, wacana: wacanaBaru };
            if (kisiKini?.[i]) kisiKini[i] = { ...kisiKini[i], wacana: wacanaBaru };
          });
      }
      const { h: hk } = kini;
      await tx
        .update(hasilSoal)
        .set({
          soal: kini.soal,
          kisi: kisiKini && (mode === "tambah" || hasil.gantiBentuk ? nomoriUlang(kisiKini) : kisiKini),
          jumlahGanti: hk.jumlahGanti + 1,
          // Prompt & jawaban mentah ikut disimpan (untuk perbandingan model, langkah 4).
          prompt: `${hk.prompt}\n\n---\n\n[${mode.toUpperCase()} SOAL NOMOR ${no + 1} dengan ${r.model}]\n${pengguna}`,
          // set lama (sebelum pembuatan bertahap) menyimpan satu jawaban mentah, bukan array
          jawabanAi: JSON.stringify([...(hk.jawabanAi?.startsWith("[") ? JSON.parse(hk.jawabanAi) : [hk.jawabanAi].filter(Boolean)), r.jawaban]),
        })
        .where(eq(hasilSoal.id, hk.id));
      return soal;
    });
    const pindah = hasil.gantiBentuk ? `Bentuk soal diganti menjadi ${namaBentuk(soal.bentuk, p.tujuan === TKA)}; soal ini sekarang nomor ${letak + 1}.` : "";
    return typeof tulis === "string" ? gagal(tulis) : { ok: true as const, soal: tulis, catatan: [pindah, catatan].filter(Boolean).join(" "), no: letak + 1, pindah: hasil.gantiBentuk };
  } catch (e) {
    if (e instanceof PesanGuru) return gagal(e.message);
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
export async function analisaMateri(input: { mapel: string; kelas: string; paragraf: string[]; gambar?: string[]; tempel?: number }) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const mapel = String(input?.mapel ?? "").trim().slice(0, 60);
  const kelas = String(input?.kelas ?? "").trim();
  if (!mapel || !KELAS.includes(kelas)) return { ok: false as const, pesan: "Pilih mata pelajaran dan kelas dulu." };
  const paragraf = (Array.isArray(input?.paragraf) ? input.paragraf : []).map((p) => String(p ?? "").slice(0, 5000)).slice(0, 3000);
  // Batas sama dengan pemeriksaan di browser (kotak-materi.tsx) dan batas isi materi tersimpan.
  const panjang = paragraf.join("\n").length;
  if (panjang > BATAS_MATERI.isi)
    return { ok: false as const, pesan: `Materi terlalu panjang: ±${panjang.toLocaleString("id-ID")} huruf, maksimal ${BATAS_MATERI.isi.toLocaleString("id-ID")}. Pecah menjadi beberapa materi (per bab).` };

  const m = mushaf();
  // Mode "bahasa" (Bahasa Arab, Nahwu): teks Arab isi pelajaran, hanya ayat yang dijadikan kotak dalil.
  const cari = modeArab(mapel) === "bahasa" ? m.cari : cariDalil;
  const { isian, untukAi, dibuangPdf } = susunDraf({ mapel, kelas, paragraf }, cari, m.basmalah);
  const pesanPdf = dibuangPdf
    ? `${dibuangPdf} baris teks Arab dari PDF tidak dikenali sebagai ayat atau hadis 9 kitab dan dibuang (teks Arab PDF sering rusak). Ayat: pakai "Ambil ayat"; hadis lain: tempel sendiri dari sumber terpercaya.`
    : "";
  if (isian.isi.length < BATAS_MATERI.isiMin) return { ok: false as const, pesan: `Materi terlalu pendek (minimal ${BATAS_MATERI.isiMin} huruf teks).` };

  // Batas analisa per guru per hari (biaya AI); dihitung saat mencoba, walau AI-nya gagal. Admin bebas.
  if (saya.peran !== "admin") {
    const tolak = await tolakBila(saya, "analisa");
    if (tolak) return { ok: false as const, pesan: tolak };
    await db.insert(pemakaianAi).values({ guruId: saya.id, jenis: "analisa" });
  }

  // 0.30.0: pratinjau kecil gambar (JPEG, dari browser) dinilai AI: isi pelajaran atau logo/hiasan, plus keterangannya.
  // Nomor = urutan daftar (gambar tempelan guru dulu, `tempel` buah, lalu gambar file sesuai tanda [[GAMBAR n]]).
  // Pratinjau yang rusak/kebesaran dilewati tanpa menggeser nomor yang lain.
  const pratinjau = (Array.isArray(input?.gambar) ? input.gambar : []).slice(0, BATAS_GAMBAR.dinilai).map((g) => {
    const b = Buffer.from(String(g ?? "").replace(/^data:image\/jpeg;base64,/, ""), "base64");
    return b.length <= BATAS_GAMBAR.bitaPratinjau && ukuranJpeg(b) ? b : null;
  });
  const tempel = Array.from({ length: Math.max(0, Math.min(Number(input?.tempel) || 0, pratinjau.length)) }, (_, i) => i + 1);
  const gambarAI = pratinjau.flatMap((b, i) => (b ? [{ label: `[GAMBAR ${i + 1}]${tempel.includes(i + 1) ? " (ditempel guru)" : ""}`, url: `data:image/jpeg;base64,${b.toString("base64")}` }] : []));

  const { sistem, pengguna } = buatAnalisaMateri(mapel, kelas, untukAi, isian.teksArab === "bahasa", gambarAI.length);
  try {
    const r = await tanyaDenganCadangan(sistem, pengguna, daftarModel()[0]?.slot ?? 1, true, (d) => d, Date.now() + TENGGAT_SATU_SOAL, gambarAI);
    const a = terapkanAnalisa(r.hasil, isian, untukAi, cari);
    // null = gambar tidak dinilai (tidak ada gambar, atau model yang menjawab tidak bisa melihat gambar): browser memakai semua.
    const gambar = r.lihatGambar ? rapikanNilaiGambar((r.hasil as { gambar?: unknown })?.gambar, pratinjau.length, tempel) : null;
    return { ok: true as const, isian: a.isian, gambar, catatan: [pesanPdf, a.catatan].filter(Boolean).join(" ") };
  } catch (e) {
    console.error("[analisa materi gagal]", pesanError(e));
    // AI gagal: materi tetap bisa dipakai, guru mengisi judul & TP sendiri di kartu materi.
    return { ok: true as const, isian, gambar: null, catatan: `${pesanPdf} AI gagal menganalisa materi. Isi judul dan TP sendiri, atau coba analisa lagi.`.trim() };
  }
}

/**
 * Simpan satu gambar (0.30.0): JPEG yang sudah dikecilkan di browser (src/app/gambar.tsx), dikirim sebagai base64.
 * Server memastikan isinya JPEG sungguhan (ukuranJpeg) dan tidak melewati batas ukuran & jumlah per guru.
 */
export async function unggahGambar(base64: string) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const data = Buffer.from(String(base64 ?? "").replace(/^data:image\/jpeg;base64,/, ""), "base64");
  if (data.length > BATAS_GAMBAR.bita) return { ok: false as const, pesan: "Gambar terlalu besar. Pakai gambar yang lebih kecil." };
  const ukuran = ukuranJpeg(data);
  if (!ukuran || ukuran.lebar > BATAS_GAMBAR.sisi || ukuran.tinggi > BATAS_GAMBAR.sisi) return { ok: false as const, pesan: "File bukan gambar yang bisa dipakai." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(gambar).where(eq(gambar.guruId, saya.id));
  if (n >= BATAS_GAMBAR.perGuru) return { ok: false as const, pesan: `Batas ${BATAS_GAMBAR.perGuru} gambar per guru sudah tercapai. Hubungi admin.` };
  const [baris] = await db.insert(gambar).values({ guruId: saya.id, data, ...ukuran }).returning({ id: gambar.id });
  return { ok: true as const, id: baris.id };
}

/**
 * 0.31.0: AI membaca SATU halaman PDF dari fotonya (JPEG dari browser, satu halaman per panggilan supaya kiriman tetap
 * di bawah 1 MB). Hasil: paragraf materi (tabel, rumus, penanda gambar) + kotak gambar yang dipotong browser.
 * Aturan 4: dibatasi per guru per hari lewat tolakBila (lib/batas.ts; admin bebas), dihitung saat mencoba.
 * Gagal (jatah habis, AI gagal, model tanpa penglihatan) → browser memakai teks PDF biasa untuk halaman itu.
 */
const BATAS_CONTEKAN = 8000; // huruf teks lapisan PDF per halaman (halaman buku padat ±5 ribu)
export async function bacaHalamanPdf(gambarHalaman: string, mapel: string, contekan?: string) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const data = Buffer.from(String(gambarHalaman ?? "").replace(/^data:image\/jpeg;base64,/, ""), "base64");
  const ukuran = data.length <= BATAS_GAMBAR.bita ? ukuranJpeg(data) : null;
  if (!ukuran || Math.max(ukuran.lebar, ukuran.tinggi) > 2000) return { ok: false as const, pesan: "Gambar halaman tidak sah." };
  if (saya.peran !== "admin") {
    const tolak = await tolakBila(saya, "halaman");
    if (tolak) return { ok: false as const, pesan: tolak };
    await db.insert(pemakaianAi).values({ guruId: saya.id, jenis: "halaman" });
  }
  // Contekan dari browser: dibatasi panjangnya dan huruf Arabnya dibuang lagi di sini (aturan 5; kiriman bisa diubah).
  const { sistem, pengguna } = buatBacaHalaman(String(contekan ?? "").slice(0, BATAS_CONTEKAN).replace(new RegExp(POLA_ARAB, "g"), " "));
  try {
    const r = await tanyaDenganCadangan(sistem, pengguna, daftarModel()[0]?.slot ?? 1, true, (d) => d, Date.now() + 2 * 60_000, [{ label: "[HALAMAN]", url: `data:image/jpeg;base64,${data.toString("base64")}` }]);
    if (!r.lihatGambar) return { ok: false as const, pesan: "Model AI yang aktif tidak bisa membaca gambar halaman." };
    const bahasa = modeArab(String(mapel ?? "")) === "bahasa";
    return { ok: true as const, ...rapikanBacaanHalaman(r.hasil, bahasa ? mushaf().cari : cariDalil, potongAyat, bahasa) };
  } catch (e) {
    console.error("[baca halaman PDF gagal]", pesanError(e));
    return { ok: false as const, pesan: "AI gagal membaca halaman ini." };
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

const MAKS_MASUKAN = 1000; // huruf
const BATAS_MASUKAN = 10; // per guru per hari

/**
 * Masukan & saran (0.48.0). Guru hanya mengirim (dibaca admin di /admin/masukan). setId opsional = set yang dikeluhkan,
 * wajib milik pengirim (aturan 3). Tanpa AI. Wajib ada nilai (1–5) atau tulisan.
 */
export async function kirimMasukan(input: { nilai?: number | null; isi?: string; setId?: number | null; otomatis?: boolean }) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const nilai = Number.isInteger(input?.nilai) && input.nilai! >= 1 && input.nilai! <= 5 ? input.nilai! : null;
  const isi = String(input?.isi ?? "").trim().slice(0, MAKS_MASUKAN) || null;
  if (!nilai && !isi) return { ok: false as const, pesan: "Pilih wajah atau tulis masukan dulu." };
  let setId: number | null = null;
  if (input?.setId) {
    const [h] = await db.select({ guruId: hasilSoal.guruId, dihapus: hasilSoal.dihapus }).from(hasilSoal).where(eq(hasilSoal.id, Number(input.setId)));
    if (!h || h.dihapus || !bolehAkses(h.guruId, saya)) return { ok: false as const, pesan: "Set soal tidak ditemukan." };
    setId = Number(input.setId);
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(masukan)
    .where(and(eq(masukan.guruId, saya.id), sql`${masukan.dibuat} >= ${awalHariIni}`));
  if (n >= BATAS_MASUKAN) return { ok: false as const, pesan: `Batas ${BATAS_MASUKAN} masukan hari ini sudah tercapai. Terima kasih, coba lagi besok.` };
  await db.insert(masukan).values({ guruId: saya.id, nilai, isi, setId, otomatis: !!input?.otomatis, versi: paket.version });
  return { ok: true as const };
}

/** Jumlah set selesai milik guru ini (untuk menentukan kapan jendela masukan muncul sendiri). */
export async function jumlahSetSelesai() {
  const saya = await penggunaSaatIni();
  if (!saya) return 0;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilSoal)
    .where(and(eq(hasilSoal.guruId, saya.id), eq(hasilSoal.status, "selesai")));
  return n;
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
  const batasGuru = guru && h.status === "selesai" ? await ambilBatas(saya.id) : null;
  const batasUbah = batasGuru?.angka.ubah ?? Infinity;
  // `tutup`: AI dihentikan admin (rem darurat / akun di-Stop) → tombol Ganti/Tambah/Ubah dimatikan dengan alasan.
  const tutup = batasGuru?.rem ? pesanRem(batasGuru.remPesan) : batasGuru?.khusus && batasUbah === 0 ? "Pemakaian AI akun Anda dihentikan admin. Edit manual dan tulis soal sendiri tetap bisa." : null;
  const jatahUbah = h.status === "selesai"
    ? { set: jumlahGanti, batasSet: BATAS_GANTI_PER_SET, hari: guru ? await hitungPemakaian(saya.id, "ubah") : null, batasHari: guru && Number.isFinite(batasUbah) ? batasUbah : null, tutup }
    : null;
  const soal = h.soal as Soal[] | null;
  const kisi = h.kisi as BarisKisi[] | null;
  // Catatan guru + tanggapan AI atasnya (ATURAN-SOAL.md bagian 6), untuk guru maupun admin.
  const catatan = (pengaturan as Pengaturan).catatan || null;
  const tanggapan = (h.info as { tanggapan?: string } | null)?.tanggapan || null;
  const identitas = (pengaturan as Pengaturan).identitas ?? {}; // kop Word, bisa diubah di halaman hasil
  const tka = (pengaturan as Pengaturan).tujuan === TKA; // gaya bentuk BS (Kategori vs Benar/Salah gaya lama)
  // Data bab (untuk menampilkan ayat & form edit): saat selesai, dan sekali saja selama proses (untuk draf soal).
  const bab = h.status === "selesai" || (h.status === "proses" && denganBab) ? (babDariSet(h) ?? null) : null;
  if (saya.peran !== "admin") {
    // Guru tidak menerima info teknis (model, waktu, token, catatan cadangan) maupun rincian error penyedia AI.
    // (halaman sudah menambahkan awalan "Gagal membuat soal:")
    return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, tka, jatahUbah, model: null, info: null, pesan: h.status === "gagal" ? SARAN_GURU : h.pesan };
  }
  return { ...isi, soal, kisi, bab, catatan, tanggapan, identitas, tka, jatahUbah, info: h.info as { detik: number; tokenMasuk: number; tokenKeluar: number; catatan?: string[]; perbaikan?: string[] } | null };
}
