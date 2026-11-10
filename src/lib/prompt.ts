import { MAPEL_INGGRIS, MAPEL_SEJARAH } from "./mapel.ts";
import { blokMj, bukanDalil, identitasBab, keFormatAI, kocok, MAKS_GABUNG, mjLama, type Bab, type BarisKisi, type Bentuk, type Soal } from "./soal.ts";

export const PESAN_MJ_MIN = "Menjodohkan minimal 3 nomor (atau 0), supaya daftar jawabannya masuk akal.";

export const TUJUAN = ["Ulangan Harian", "PTS", "PAS", "Latihan", "Latihan TKA"] as const;
/** Nama yang tampil (pilihan pemilik 2026-10-20: AFTS & ASAS sesuai istilah madrasah). Kode "PTS"/"PAS" tetap disimpan agar set lama terbaca. */
const NAMA_TUJUAN: Record<string, string> = { PTS: "AFTS", PAS: "ASAS" };
const KEPANJANGAN: Record<string, string> = { PTS: "Asesmen Formatif Tengah Semester", PAS: "Asesmen Sumatif Akhir Semester" };
/**
 * Mapel yang diujikan TKA SMA/MA (Kepmendikdasmen 56/2026: wajib B. Indonesia, Matematika, B. Inggris + 19 pilihan).
 * Mapel agama, Informatika, dll. tidak ada di TKA: jenisnya tampil sebagai "Latihan Gaya TKA" (soal tetap bergaya TKA),
 * supaya aplikasi tidak menyebut "TKA" untuk mapel yang tidak diujikan (RUJUKAN.md I2).
 */
const MAPEL_TKA = /bahasa\s+(indonesia|inggris|arab|jerman|prancis|perancis|jepang|korea|mandarin)|matematika|fisika|kimia|biologi|ekonomi|sosiologi|geografi|antropologi|ppkn|pancasila|kewirausahaan|^sejarah(\s+indonesia)?$/i;
export const mapelTka = (mapel: string) => MAPEL_TKA.test(mapel.trim());
/** `mapel` diisi bila diketahui: Latihan TKA untuk mapel di luar TKA → "Latihan Gaya TKA". */
export const namaTujuan = (t: string, mapel?: string) => (t === TKA && mapel && !mapelTka(mapel) ? "Latihan Gaya TKA" : (NAMA_TUJUAN[t] ?? t));
/** ATURAN-SOAL.md bagian 9: TKA hanya PG, PG kompleks, Kategori (tanpa uraian), memakai soal grup. */
export const TKA = "Latihan TKA";
export const NAMA_LEVEL_TKA = { LOTS: "Pemahaman", MOTS: "Penerapan", HOTS: "Penalaran" } as const;
type NamaLevel = { LOTS: string; MOTS: string; HOTS: string };
/** Mapel bahasa di TKA memakai kompetensi membaca, bukan Pemahaman/Penerapan/Penalaran (Perka BSKAP 045/2025, RUJUKAN.md I2). */
const LEVEL_TKA_BAHASA: [string, RegExp, NamaLevel][] = [
  ["Bahasa Arab", /bahasa\s+arab/i, { LOTS: "Pemahaman Literal", MOTS: "Reorganisasi", HOTS: "Pemahaman Inferensial" }],
  ["Bahasa Indonesia dan Bahasa Inggris", /bahasa\s+(indonesia|inggris)|english/i, { LOTS: "Pemahaman Tekstual", MOTS: "Pemahaman Inferensial", HOTS: "Evaluasi dan Apresiasi" }],
];
export const namaLevelTka = (mapel = ""): NamaLevel => LEVEL_TKA_BAHASA.find(([, pola]) => pola.test(mapel))?.[2] ?? NAMA_LEVEL_TKA;
const sebutLevel = (n: NamaLevel) => `${n.LOTS} (= LOTS), ${n.MOTS} (= MOTS), dan ${n.HOTS} (= HOTS)`;

/**
 * Latihan TKA mengikuti contoh soal resmi Pusmendik (Perka BSKAP 045/2025, RUJUKAN.md I2). Dikirim di setiap
 * permintaan TKA (kisi-kisi, soal, ganti/ubah, perbaikan otomatis) dan mengalahkan BENTUK SOAL di instruksi sistem.
 */
const ATURAN_TKA = `KHUSUS LATIHAN TKA (mengikuti contoh soal resmi Pusmendik; bila berbeda dengan BENTUK SOAL di instruksi sistem, ikuti ini):
- PGK (MCMA): 5 pilihan, jawaban benar 2, 3, ATAU 4 (tidak semua): ikuti "Jumlah jawaban benar" di kisi-kisi bila tertulis. "kunci": array 2–4 huruf. Akhiri pertanyaan dengan kalimat persis "Pilihlah jawaban yang benar! Jawaban benar lebih dari satu." (BUKAN "(Pilih semua jawaban yang tepat)").
- BS (Kategori): TEPAT 3 pernyataan (lihat "Jumlah pernyataan" di kisi-kisi), "kunci" array 3 label. Pasangan label HANYA salah satu dari: ["Benar","Salah"], ["Tepat","Tidak Tepat"], ["Sesuai","Tidak Sesuai"], ["Setuju","Tidak Setuju"], ["Logis","Tidak Logis"].`;
// Mapel Bahasa Inggris (mapel.ts MAPEL_INGGRIS): dulu guru harus menulis catatan "seluruh soal berbahasa Inggris" setiap set.
const ATURAN_INGGRIS = `BAHASA SOAL (mapel Bahasa Inggris, WAJIB): SEMUA yang dibaca siswa ditulis dalam bahasa Inggris: pertanyaan/perintah soal, wacana, pilihan, pernyataan, premis dan jawaban menjodohkan, serta kalimat petunjuk di dalam soal. Ini mengalahkan aturan lain yang meminta kalimat petunjuk persis berbahasa Indonesia (termasuk aturan Latihan TKA): PG kompleks diakhiri "(Choose all the correct answers.)" atau, untuk Latihan TKA, "Choose the correct answers! More than one answer is correct."; label Kategori "True"/"False"; kata negatif di pokok soal ditulis kapital (NOT, EXCEPT). Kunci isian dalam bahasa Inggris. Pembahasan, rubrik, indikator, dan kisi-kisi TETAP dalam Bahasa Indonesia (dibaca guru).`;
// Mapel sejarah (mapel.ts MAPEL_SEJARAH): tahun di bagian soal yang benar juga diperiksa aplikasi (tahunAsing, soal.ts).
const ATURAN_SEJARAH = `FAKTA SEJARAH (mapel sejarah, WAJIB): tahun, tanggal, nama tokoh, tempat, dan peristiwa yang menjadi isi pokok soal, wacana, atau kunci HARUS tertulis di DATA BAB; jangan menambah dari pengetahuan sendiri walaupun Anda yakin benar. Tulis tahun persis seperti di DATA BAB (misalnya "2 H", "622 M"). Pengecoh boleh memakai tahun/tokoh lain. Stimulus kekinian boleh memakai tahun sekarang.`;
export const KESULITAN = ["Mudah", "Sedang", "Sulit"] as const;

const ATURAN_UJIAN = "Gaya soal ujian resmi madrasah (seperti asesmen tengah/akhir semester). Sebar soal merata ke semua TP dan materi (dan semua dalil bila ada). Bahasa baku. Pembahasan ringkas: alasan kunci benar + alasan singkat tiap pengecoh salah.";

/** Aturan tiap tujuan soal + komposisi level bawaan (terisi otomatis di form, tetap bisa diubah). */
export const ATURAN_TUJUAN: Record<(typeof TUJUAN)[number], { aturan: string; level: { LOTS: number; MOTS: number; HOTS: number } }> = {
  Latihan: {
    aturan: "Pembahasan mendidik (3–4 kalimat): jelaskan mengapa jawaban benar tepat DAN mengapa pengecoh salah dengan menyebut isinya (bukan hurufnya), agar siswa bisa belajar mandiri.",
    level: { LOTS: 40, MOTS: 40, HOTS: 20 },
  },
  "Ulangan Harian": {
    aturan: "Pastikan setiap TP bab mendapat soal untuk mengecek ketercapaiannya. Bahasa baku. Pembahasan ringkas: alasan kunci benar + alasan singkat tiap pengecoh salah.",
    level: { LOTS: 40, MOTS: 40, HOTS: 20 },
  },
  PTS: { aturan: ATURAN_UJIAN, level: { LOTS: 30, MOTS: 40, HOTS: 30 } },
  PAS: { aturan: ATURAN_UJIAN, level: { LOTS: 30, MOTS: 40, HOTS: 30 } },
  "Latihan TKA": {
    aturan:
      `Gaya Tes Kemampuan Akademik (TKA) SMA/MA dari pusat: level kognitif disebut ${sebutLevel(NAMA_LEVEL_TKA)}; ${LEVEL_TKA_BAHASA.map(([nama, , n]) => `untuk ${nama}: ${sebutLevel(n)}`).join("; ")}. Hampir semua soal berbasis stimulus (bacaan, data/tabel, kasus, hasil percobaan) yang harus diolah, bukan hafalan. Sebagian soal berupa SOAL GRUP (beberapa soal memakai satu wacana bersama). Pembahasan mendidik: alasan kunci benar + alasan tiap pengecoh salah.`,
    level: { LOTS: 20, MOTS: 40, HOTS: 40 },
  },
};

export const ATURAN_KESULITAN: Record<(typeof KESULITAN)[number], string> = {
  // ATURAN-SOAL 1c: kesulitan mengatur berat soal DI DALAM levelnya; soal HOTS tetap wajib stimulus (dulu "tanpa stimulus panjang" bertabrakan).
  Mudah: "Pokok soal pendek dan lugas. Soal LOTS tanpa stimulus panjang; soal yang wajib memakai stimulus (HOTS) cukup diberi stimulus pendek dan sederhana dengan sedikit langkah berpikir. Pengecoh jelas berbeda dari jawaban benar.",
  Sedang: "Pokok soal menuntut pemahaman konsep, boleh memakai stimulus pendek. Pengecoh masuk akal dan mirip dengan jawaban benar.",
  Sulit: "Gunakan stimulus kasus, data, atau perbandingan dua konsep/kondisi yang menuntut beberapa langkah berpikir. Pengecoh sangat homogen dan hanya berbeda tipis, tetapi tetap jelas salah bagi siswa yang memahami materi.",
};
export const NAMA_BENTUK: Record<Bentuk, string> = {
  PG: "Pilihan Ganda",
  PGK: "Pilihan Ganda Kompleks",
  // Kode "BS" dipertahankan agar set lama terbaca. Jenis madrasah: Benar/Salah gaya lama (0.22.0); Latihan TKA: Kategori.
  BS: "Benar/Salah",
  MJ: "Menjodohkan",
  ISIAN: "Isian Singkat",
  URAIAN: "Uraian",
};
/** Nama bentuk untuk tampilan: di Latihan TKA "BS" adalah PG kompleks Kategori. */
export const namaBentuk = (b: Bentuk, tka: boolean) => (b === "BS" && tka ? "Kategori (PG Kompleks)" : NAMA_BENTUK[b]);
// 0.22.0: 50 (dulu 40) supaya ASAS non-eksak Al-Fatah (45 soal) bisa dibuat.
export const MAKS_SOAL = 50;
// Satu jawaban AI maks ±8.000 token. 10 soal Latihan+Sulit ≈ 14.000 huruf, aman di bawah batas.
export const MAKS_PER_TAHAP = 10;
/** Jumlah semua soal dari rincian per bentuk. SATU-SATUNYA penjumlah: jangan menyebut bentuk satu per satu (bentuk baru terlewat). */
export const jumlahSoal = (j: Record<Bentuk, number>) => (Object.keys(NAMA_BENTUK) as Bentuk[]).reduce((n, b) => n + (j[b] ?? 0), 0);

// Skor per soal seperti format AFTS madrasah (10 PG + 5 PGK + 5 B/S + 5 uraian = 100).
// Menjodohkan gaya lama (0.22.0): satu nomor = satu pasangan, jadi bobotnya setara satu nomor Benar/Salah.
export const BOBOT_BAWAAN: Record<Bentuk, number> = { PG: 2, PGK: 5, BS: 3, MJ: 3, ISIAN: 3, URAIAN: 8 };

/**
 * ASAS MA Al-Fatah (surat Kepala MA 433/P/MA/PP.006/SPb/11/2026, 7 Nov 2026): eksak = Matematika, Fisika, Kimia,
 * Biologi (pilihan pemilik). "Menjodohkan/BS" 5 nomor, boleh campur (bawaan: Benar/Salah 5). Persen level dipilih
 * supaya hitungLevel menghasilkan PERSIS jumlah di surat (dites): eksak 8/15/12 HOTS/MOTS/LOTS, non-eksak 10/20/15.
 * Skor total 100 diisi skorOtomatis (src/lib/skor.ts).
 */
export { MAPEL_EKSAK } from "./mapel.ts";
export const ASAS_ALFATAH = {
  eksak: { nama: "Eksak", jumlah: { PG: 20, PGK: 5, BS: 5, MJ: 0, ISIAN: 0, URAIAN: 5 }, level: { LOTS: 34, MOTS: 43, HOTS: 23 } },
  nonEksak: { nama: "Non-Eksak", jumlah: { PG: 30, PGK: 5, BS: 5, MJ: 0, ISIAN: 0, URAIAN: 5 }, level: { LOTS: 33, MOTS: 45, HOTS: 22 } },
} as const;

export type Pengaturan = {
  babId: string;
  tujuan: string;
  jumlah: Record<Bentuk, number>;
  level: { LOTS: number; MOTS: number; HOTS: number };
  kesulitan: string;
  bobot?: Record<Bentuk, number>; // tidak ada di set lama (sebelum fitur bobot)
  modelSlot?: number; // nomor model AI di .env (1 = AI_, 2 = AI2_, ...); set lama = 1
  bandingkan?: boolean; // mode "Bandingkan semua model": jangan pakai model cadangan
  catatan?: string; // catatan tambahan guru untuk AI (opsional)
  babIds?: string[]; // beberapa materi dalam satu set (PTS/PAS); kosong pada set lama → [babId]
  identitas?: Identitas; // identitas ujian untuk kop Word; boleh diubah setelah soal jadi
};

/** Identitas ujian di kop Word. Kosong → dihitung dari tanggal pembuatan (semester, tahun pelajaran) / bawaan. */
export type Identitas = { semester?: string; tahun?: string; tanggal?: string; waktu?: number };
export const WAKTU_BAWAAN = 90; // menit (pilihan pemilik, sama untuk semua jenis ujian)

/** Semester & tahun pelajaran dari sebuah tanggal: Juli–Desember = Ganjil. */
export function semesterDari(tanggal: Date) {
  const bulan = tanggal.getMonth() + 1;
  const tahun = tanggal.getFullYear();
  return bulan >= 7 ? { semester: "Ganjil", tahun: `${tahun}/${tahun + 1}` } : { semester: "Genap", tahun: `${tahun - 1}/${tahun}` };
}

/** "2026-11-04" → "Rabu, 4 November 2026" (kop Word dan form identitas). Kosong → "". */
export const hariTanggal = (t?: string) =>
  t ? new Date(`${t}T00:00:00Z`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

/** Rapikan identitas dari browser; isian tidak sah dibuang (kembali ke bawaan). */
export function bersihkanIdentitas(x: unknown): Identitas {
  const i = (x ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => String(v ?? "").trim();
  const waktu = Math.round(Number(i.waktu));
  return {
    ...(["Ganjil", "Genap"].includes(s(i.semester)) && { semester: s(i.semester) }),
    ...(/^\d{4}\/\d{4}$/.test(s(i.tahun)) && { tahun: s(i.tahun) }),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(s(i.tanggal)) && { tanggal: s(i.tanggal) }),
    ...(waktu >= 1 && waktu <= 600 && { waktu }),
  };
}

export const MAKS_CATATAN = 500;
export const MAKS_INSTRUKSI = 300;
export const MAKS_NAMA_SET = 80;

/** Tulisan guru untuk AI: dirapikan, dipotong, dan tanda """ dibuang supaya tidak keluar dari kutipan. */
const bersihkanKutipan = (s: unknown, maks: number) => String(s ?? "").replace(/"{3,}/g, '"').trim().slice(0, maks);
/** Instruksi "Minta perubahan" dari browser. */
export const bersihkanInstruksi = (s: unknown) => bersihkanKutipan(s, MAKS_INSTRUKSI);

/** Rapikan isian form dari browser (tidak dipercaya begitu saja). Mengembalikan pesan kalau tidak valid. */
export function bersihkanPengaturan(p: Pengaturan): Pengaturan | string {
  const angka = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const jumlah = { PG: angka(p?.jumlah?.PG), PGK: angka(p?.jumlah?.PGK), BS: angka(p?.jumlah?.BS), MJ: angka(p?.jumlah?.MJ), ISIAN: angka(p?.jumlah?.ISIAN), URAIAN: angka(p?.jumlah?.URAIAN) };
  const level = { LOTS: angka(p?.level?.LOTS), MOTS: angka(p?.level?.MOTS), HOTS: angka(p?.level?.HOTS) };
  const total = jumlahSoal(jumlah);
  if (total < 1 || total > MAKS_SOAL) return `Jumlah soal harus 1 sampai ${MAKS_SOAL}.`;
  if (level.LOTS + level.MOTS + level.HOTS !== 100) return "Komposisi LOTS + MOTS + HOTS harus 100%.";
  if (!(TUJUAN as readonly string[]).includes(p?.tujuan)) return "Tujuan soal tidak dikenal.";
  if (p.tujuan === TKA && (jumlah.URAIAN || jumlah.ISIAN || jumlah.MJ)) return "Latihan TKA hanya memakai pilihan ganda, pilihan ganda kompleks, dan kategori. Kosongkan jumlah menjodohkan, isian, dan uraian.";
  if (jumlah.MJ > 0 && jumlah.MJ < 3) return PESAN_MJ_MIN;
  if (!(KESULITAN as readonly string[]).includes(p?.kesulitan)) return "Tingkat kesulitan tidak dikenal.";
  const bobotDari = (b: Bentuk) => angka(p?.bobot?.[b] ?? BOBOT_BAWAAN[b]);
  const bobot = { PG: bobotDari("PG"), PGK: bobotDari("PGK"), BS: bobotDari("BS"), MJ: bobotDari("MJ"), ISIAN: bobotDari("ISIAN"), URAIAN: bobotDari("URAIAN") };
  const modelSlot = Math.max(1, Math.min(9, Math.round(Number(p?.modelSlot) || 1)));
  const catatan = bersihkanKutipan(p?.catatan, MAKS_CATATAN);
  // Materi: hanya id materi milik guru ("materi-12"), maks 5, tanpa dobel. Kepemilikan dicek di mulaiBuatSoal.
  const babIds = [...new Set((Array.isArray(p?.babIds) ? p.babIds : [p?.babId]).map((x) => String(x ?? "")))].filter((x) => /^materi-\d+$/.test(x));
  if (!babIds.length) return "Masukkan materi dulu.";
  if (babIds.length > MAKS_GABUNG) return `Maksimal ${MAKS_GABUNG} materi dalam satu set.`;
  return { babId: babIds[0], babIds, tujuan: p.tujuan, jumlah, level, kesulitan: p.kesulitan, bobot, modelSlot, bandingkan: p?.bandingkan === true, catatan, identitas: bersihkanIdentitas(p?.identitas) };
}

/**
 * Bagi jumlah soal menjadi beberapa tahap (maks MAKS_PER_TAHAP soal per panggilan AI),
 * urut PG → PGK → BS → ISIAN → URAIAN, supaya jawaban AI tidak terpotong.
 */
export function bagiTahap(jumlah: Record<Bentuk, number>, maks = MAKS_PER_TAHAP) {
  const tahap: Record<Bentuk, number>[] = [];
  let isi = 0;
  const baru = () => {
    tahap.push({ PG: 0, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0 });
    isi = 0;
  };
  for (const b of Object.keys(NAMA_BENTUK) as Bentuk[]) {
    if (b === "MJ") {
      // Menjodohkan gaya lama: satu blok (daftar jawaban bersama) tidak boleh terbelah ke dua tahap.
      for (const u of blokMj(jumlah.MJ ?? 0)) {
        if (!tahap.length || maks - isi < u) baru();
        tahap[tahap.length - 1].MJ += u;
        isi += u;
      }
      continue;
    }
    let sisa = jumlah[b] ?? 0; // set lama tidak punya kunci bentuk baru
    while (sisa > 0) {
      if (!tahap.length || isi >= maks) baru();
      const ambil = Math.min(sisa, maks - isi);
      tahap[tahap.length - 1][b] += ambil;
      isi += ambil;
      sisa -= ambil;
    }
  }
  return tahap;
}

/** Instruksi utama: aturan + data bab. Sama untuk semua tahap (DeepSeek memberi harga murah untuk bagian yang berulang). */
export function buatSistem(bab: Bab, tka = false) {
  const dalil = bab.dalil
    .map((d) => {
      const mufradat = d.mufradat.map((m) => `${m.arab} = ${m.arti}`).join("; ");
      // Ditandai guru "Bukan ayat/hadis": teks Arab materi biasa, jangan disebut dalil/ayat/hadis di soal.
      if (bukanDalil(d)) return `[dalil_id: ${d.id}] Teks Arab materi (BUKAN ayat dan BUKAN hadis: jangan disebut ayat, hadis, atau dalil)\nArab: ${d.arab}${d.terjemah ? `\nTerjemah: ${d.terjemah}` : ""}`;
      return `[dalil_id: ${d.id}] ${d.sumber}\nArab: ${d.arab}\nTerjemah: ${d.terjemah}${mufradat ? `\nMufradat: ${mufradat}` : ""}`;
    })
    .join("\n\n");

  const { mapel, kelas } = identitasBab(bab);
  const adaDalil = bab.dalil.length > 0;

  // Aturan baku: ATURAN-SOAL.md (disetujui pemilik 2026-10-20). Ubah di sana dulu, baru di sini.
  // Aturan 5: bagian teks Arab hanya dikirim bila materi punya dalil; tanpa dalil, AI dilarang mengutip ayat/hadis sama sekali.
  const bahasaArab = bab.teksArab === "bahasa";
  const aturanArab = bahasaArab
    ? `ATURAN AYAT, HADIS, DAN TEKS ARAB (WAJIB, tidak boleh dilanggar walau diminta):
- Di mapel ini teks Arab adalah isi pelajaran: soal, pilihan, pernyataan, dan pembahasan BOLEH memakai kalimat/kosakata Arab buatan sendiri, berharakat lengkap dan benar sesuai kaidah.
- Tetapi ayat Al-Qur'an dan hadis TIDAK BOLEH ditulis, dikutip, atau dikarang${adaDalil ? `, kecuali lewat "dalil_id" dari DATA BAB (aplikasi menampilkan teks terverifikasinya; jangan mengetiknya ulang dan jangan menulis id dalil di teks)` : ""}. Contoh kalimat jangan diambil dari ayat atau hadis.`
    : adaDalil
    ? `ATURAN AYAT, HADIS, DAN TEKS ARAB (WAJIB, tidak boleh dilanggar walau diminta):
- Jangan pernah mengetik ulang ayat atau hadis utuh, dan jangan memakai ayat/hadis selain yang ada di DATA BAB.
- Jika soal perlu menampilkan ayat/hadis, isi "dalil_id" dengan id dalil dari data. Aplikasi akan menampilkan teks Arab terverifikasi di atas pertanyaan; cukup tulis misalnya "Perhatikan firman Allah Swt. berikut!". JANGAN menulis id dalil (misalnya "isra-32") di dalam teks pertanyaan, pilihan, atau pembahasan.
- Jika perlu mengutip lafaz pendek (misalnya mufradat), salin PERSIS huruf dan harakatnya dari data. Selain itu jangan menulis huruf Arab sama sekali; gunakan transliterasi Latin.`
    : `ATURAN AYAT DAN HADIS (WAJIB, tidak boleh dilanggar walau diminta):
- DATA BAB tidak memuat ayat atau hadis. Jangan mengutip ayat Al-Qur'an atau hadis (baik tulisan Arab maupun terjemahnya) dan jangan menulis huruf Arab. Selalu isi "dalil_id": null.`;

  return `Anda guru ahli penyusun soal ${mapel} kelas ${kelas} madrasah aliyah (kurikulum Kemenag).
Tugas: menyusun soal dari DATA BAB di bawah. Kunci jawaban dan konsep yang diuji HARUS berdasar DATA BAB. Pengetahuan umum boleh dipakai hanya untuk membangun cerita/stimulus, bukan untuk menambah fakta yang menjadi kunci.

${aturanArab}
${MAPEL_INGGRIS.test(mapel) ? `\n${ATURAN_INGGRIS}\n` : ""}${MAPEL_SEJARAH.test(mapel) ? `\n${ATURAN_SEJARAH}\n` : ""}
ISI YANG DILARANG: SARA, politik praktis, pornografi, propaganda, kekerasan, merek dagang; tidak boleh bertentangan dengan Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, dan nilai agama.

KAIDAH MATERI:
- Soal sesuai indikator kisi-kisi; konsep benar; untuk PG kunci hanya satu.
- Jangan menyalin kalimat materi mentah-mentah (mendorong hafalan); gunakan redaksi baru.
- Masalah yang diperselisihkan ulama (khilafiyah, misalnya perbedaan mazhab): jangan memihak satu pendapat sebagai satu-satunya yang benar. Sebut jelas pendapat siapa yang ditanyakan ("Menurut mazhab Syafi'i, ...") atau tanyakan perbedaannya. Pendapat ulama/mazhab lain yang sah tidak boleh dijadikan pengecoh, kecuali soal sudah menyebut jelas pendapat siapa yang ditanyakan.

KAIDAH KONSTRUKSI:
- Pokok soal jelas, tegas, tidak bermakna ganda, hanya memuat yang perlu, dan tidak memberi petunjuk ke jawaban benar.
- Tidak ada negatif ganda (misalnya "yang tidak benar, kecuali"). Kata negatif di pokok soal ditulis kapital: BUKAN, KECUALI, TIDAK.
- Pengecoh masuk akal, homogen, panjang pilihan relatif seimbang. Jangan memakai pilihan "semua benar" / "semua salah" / "tidak ada yang benar", dan jangan pilihan yang menunjuk huruf pilihan lain ("A dan B benar"), karena urutan pilihan diacak aplikasi.
- Jawaban benar TIDAK BOLEH menjadi pilihan yang paling panjang atau paling lengkap/rinci. Buat pengecoh sama panjang dan sama rincinya.
- Pilihan berupa angka, tahun, atau urutan ditulis berurutan (kecil → besar, lama → baru).
- Setiap soal berdiri sendiri: tidak bergantung pada jawaban soal lain.
- Jawaban satu soal TIDAK BOLEH tertulis di soal lain dalam set ini (di pokok soal maupun pilihan), terutama kunci isian singkat.
- Soal tidak saling mirip; sebar ke seluruh TP dan materi${adaDalil ? " (dan dalil)" : ""}.
- Tulis pilihan TANPA huruf A–E di depannya. Pembahasan TIDAK menyebut huruf pilihan maupun urutannya ("pilihan pertama", "pengecoh kedua", "opsi terakhir"), karena urutan pilihan PG dan PGK akan diacak ulang oleh aplikasi; sebut ISI pilihannya.
- JANGAN merujuk ke sumber data di soal, pilihan, maupun pembahasan: tanpa frasa "menurut materi", "berdasarkan materi", "dalam bab ini", "sesuai data", "teks di atas", "bacaan", dan sejenisnya (siswa sudah tahu soal berasal dari pelajaran). Jika perlu menyebut sumber, sebut sumber aslinya (nama tokoh, kitab, buku, undang-undang, atau ${adaDalil ? 'dalil, misalnya "Menurut QS. An-Nūr [24]: 2"' : "peristiwa"}).

KAIDAH BAHASA:
- Bahasa Indonesia baku, efektif, komunikatif, sesuai usia siswa MA. Tanpa bahasa daerah atau bahasa gaul (kecuali kutipan stimulus yang memang perlu).
- Mapel bahasa asing (Bahasa Arab, Bahasa Inggris, dll.): soal boleh ditulis dalam bahasa tersebut.
- Istilah keagamaan ditulis sesuai KBBI: salat, zakat, wudu, hadis, Al-Qur'an, Allah Swt., Nabi Muhammad saw., Rasulullah saw. Nama surah ditulis persis seperti sumber dalil di DATA BAB.
- ${bahasaArab ? "Transliterasi Latin boleh memakai tanda baca ilmiah (ā, ḥ, ṣ) bila memang bagian pelajaran." : 'Transliterasi Latin TANPA huruf bergaris/bertitik (tulis "hissi", "mahall", bukan "ḥissī", "maḥall").'}

LEVEL KOGNITIF (taksonomi Bloom revisi):
- C1 mengingat, C2 memahami, C3 menerapkan, C4 menganalisis, C5 mengevaluasi, C6 mencipta. LOTS = C1–C2, MOTS = C3, HOTS = C4–C6.
- Level ditentukan oleh proses berpikir yang dibutuhkan siswa, BUKAN oleh kata kerja di soal. Soal "Analisislah ..." yang jawabannya bisa dihafal tetap C1.
- HOTS bukan berarti sulit: HOTS = menalar. Soal HOTS WAJIB memakai stimulus baru (kasus, data, teks, fenomena) dan jawabannya diperoleh dengan mengolah stimulus itu, bukan hafalan.
- Soal C1–C2 cukup pokok soal langsung, tanpa stimulus panjang.
- Bila jawaban bisa langsung ditemukan tertulis di stimulus atau cukup diingat dari materi, soal itu LOTS, bukan HOTS. Soal C4–C6 menuntut siswa MENGOLAH stimulus (membandingkan, menghubungkan, menyimpulkan, menilai) untuk sampai ke jawaban; jangan menulis jawabannya di stimulus.
- Tingkat kesulitan mengatur berat soal DI DALAM levelnya: tidak mengubah level dan tidak menghapus stimulus soal HOTS.

STIMULUS (berlaku untuk seluruh set soal, lintas bentuk soal):
- Kontekstual dan dekat dengan kehidupan siswa MA (madrasah, pesantren, keluarga, masyarakat, media sosial).
- Ragamkan bentuknya: kasus/cerita pendek tentang satu orang, cuplikan berita, data dalam tabel, grafik atau gambar yang dideskripsikan dengan kata, teks bacaan, potongan percakapan, kutipan tokoh, hasil percobaan (boleh dengan kelompok kontrol), perbandingan dua kondisi (misalnya wilayah X dan Y), potongan dokumen sejarah, atau tanpa stimulus.
- Aplikasi tidak bisa menampilkan gambar: jangan menulis "perhatikan gambar berikut" kecuali gambarnya dideskripsikan lengkap dengan kata.
- Susunan baris: percakapan/dialog/hiwar ditulis SATU PENUTUR PER BARIS dengan format "Nama: ucapan", baris dipisah baris baru (\\n di dalam teks JSON). Daftar bernomor, langkah prosedur, puisi/syair, dan surat/pesan singkat juga satu bagian per baris. Kalimat pengantar ("Perhatikan percakapan berikut!") dan perintah soal ditulis di baris sendiri. TANPA baris kosong di antara baris-baris (satu \\n saja). Bagian rumpang ditulis "..." atau "(1) ..." di dalam baris ucapan. Teks cerita atau uraian biasa tetap satu paragraf. Berlaku untuk "pertanyaan", "wacana", "pilihan", dan "pernyataan".
- TABEL: data yang lebih jelas dibaca berbaris-berkolom (data percobaan, perbandingan, angka statistik, daftar ciri) ditulis sebagai tabel di "pertanyaan", "wacana", atau "pembahasan", aplikasi menampilkannya sebagai tabel sungguhan. Format: setiap baris tabel di baris sendiri diawali dan diakhiri "|", sel dipisah "|", baris pertama = judul kolom, lalu baris pemisah "|---|---|", contoh: "Perhatikan data berikut!\\n| Kelompok | Suhu (°C) | Waktu (menit) |\\n|---|---|---|\\n| A | 30 | 12 |\\n| B | 40 | 8 |\\nKesimpulan yang tepat adalah ....". Maksimal 6 kolom × 10 baris isi, sel singkat (angka, kata, atau frasa pendek), tanpa tanda "|" di dalam sel. Kalimat pengantar dan perintah soal di baris sendiri, di luar tabel. JANGAN memakai tabel di "pilihan", "pernyataan", atau soal MJ. Data tabel diambil dari materi atau dibuat konsisten dengan materi; untuk soal C3 ke atas, kunci TIDAK boleh terbaca langsung dari satu sel tanpa diolah. Tidak wajib: pakai tabel hanya bila memang membantu.
- RUMUS: rumus, persamaan, pecahan, akar, pangkat, indeks, dan simbol matematika/sains ditulis dalam LaTeX diapit SATU tanda "$" di kiri dan kanan, di baris yang sama, aplikasi menampilkannya sebagai rumus sungguhan. Di dalam JSON setiap garis miring terbalik WAJIB ditulis ganda, contoh: "Jika $v = \\\\frac{s}{t}$ dan $s = 1{,}2 \\\\times 10^{3}$ m, ...", "$\\\\sqrt{2}$", "$\\\\Delta T$", "$x^{2} - 4 \\\\geq 0$", "$\\\\text{CO}_{2}$". Desimal memakai koma dengan kurung kurawal: $2{,}5$. Satuan di luar "$" atau dengan \\\\text{}. Angka biasa dan satuan yang berdiri sendiri ("12 m/s", "2,5 kg", "Rp 15.000") TANPA "$". Jangan memakai "$$", "\\\\(", "\\\\[", atau lingkungan \\\\begin{...}; satu rumus = satu potongan "$...$". Boleh di "pertanyaan", "wacana", "pilihan", "kunci", dan "pembahasan" (juga di sel tabel).
- Pola "dua orang/kelompok berdebat atau berbeda pendapat" paling banyak 2 kali dalam satu set.
- Satu skenario atau kasus hanya boleh dipakai SEKALI dalam satu set.
- Nama tokoh beragam (jangan selalu Ahmad atau Fatimah), seimbang putra dan putri. Tokoh yang berbuat salah atau keliru TIDAK memakai nama nabi, sahabat, atau tokoh mulia dalam Islam.
- Boleh menyisipkan nilai Panca Cinta (Cinta Allah dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama, Cinta Tanah Air) secara wajar pada tokoh/cerita, tanpa menggurui dan tanpa mengubah kunci. Tidak wajib di setiap soal.

PENGECOH DAN PEMBAHASAN:
- Pernyataan/pilihan salah dibuat dengan mengubah SATU konsep kunci dari pernyataan benar (sebab-akibat dibalik, istilah tertukar, naik/turun, terbesar/terkecil). Jebakan harus pada konsep, bukan permainan kata yang menyesatkan.
- Pembahasan menjelaskan mengapa kunci benar DAN mengapa setiap pengecoh salah, dengan menyebut isinya (bukan hurufnya).
- Jika soal memuat perhitungan, pembahasan WAJIB memuat langkah hitung lengkap sampai hasil akhir.

${bentukSoal(tka)}

FORMAT JAWABAN (kecuali permintaan menyebut format lain): hanya JSON (tanpa teks lain), dengan bentuk:
{"soal":[{"bentuk":"PG","dalil_id":null,"pertanyaan":"...","langkah":"...","jawaban_benar":"...","pilihan":["...","...","...","...","..."],"kunci":"B","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}]}
${formatBsMj(tka)}
Untuk ISIAN: {"bentuk":"ISIAN","dalil_id":null,"pertanyaan":"Kata yang menunjukkan tempat adalah ....","kunci":"mahall","kunciAlt":[],"pembahasan":"...","level":"C1","tp":"TP 3.2","skor":1}
Untuk URAIAN tambahkan "rubrik", setiap kriteria menyebut skor penuh DAN skor sebagian dengan skala yang SAMA dengan "skor" kriteria itu; contoh bila jumlah skor rubrik 5: [{"kriteria":"Menyebut tiga syarat sah salat Jumat (3 = tiga benar; 2 = dua benar; 1 = satu benar; 0 = tidak ada yang benar)","skor":3},{"kriteria":"Menjelaskan alasan dengan tepat (2 = alasan tepat dan lengkap; 1 = alasan kurang lengkap; 0 = salah atau kosong)","skor":2}]. "tp" diisi kode TP yang paling sesuai.

DATA BAB
Mata pelajaran: ${mapel}, kelas ${kelas}
Judul: ${bab.judul}

Tujuan Pembelajaran:
${bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n")}
${adaDalil ? `\nDalil:\n${dalil}\n` : ""}${bab.pokok?.length ? `\nPokok materi (sebar soal ke semua pokok ini):\n${bab.pokok.map((p) => `- ${p}`).join("\n")}\n` : ""}
Materi:
${bab.materi.join("\n")}`;
}

/**
 * Analisa materi baru dari halaman utama: judul, TP (disalin dari teks; usulan AI hanya bila teks tanpa TP, dan
 * wajib dicentang guru: RUJUKAN.md D), pokok materi, dan sumber/terjemah dalil yang tertulis di teks. Hasil dicek lagi oleh terapkanAnalisa (src/lib/materi.ts): yang tidak tertulis di teks guru dibuang.
 */
export function buatAnalisaMateri(mapel: string, kelas: string, teks: string, bahasaArab: boolean) {
  const sistem = `Anda membantu guru ${mapel} kelas ${kelas} madrasah aliyah (kurikulum Kemenag) menyiapkan materi untuk menyusun soal.
Bekerja HANYA dari TEKS MATERI yang diberikan guru. Jangan menambah fakta dari luar teks.
${bahasaArab ? "Kosakata/kalimat Arab dari teks boleh disebut, tetapi jangan menulis ayat Al-Qur'an atau hadis." : "Jangan menulis huruf Arab, ayat, atau hadis sama sekali; sebut lafaz dengan transliterasi Latin bila perlu."}
Balas hanya JSON.`;
  const pengguna = `TEKS MATERI (paragraf bertanda [DALIL n] adalah ayat/hadis):
"""
${teks.replace(/"{3,}/g, '"')}
"""

Balas JSON {"judul":"...","tp":["..."],"pokok":["..."],"dalil":[{"no":1,"sumber":"...","terjemah":"..."}],"catatan":"..."}:
- "judul": judul bab/materi singkat (maks 10 kata); pakai judul yang tertulis di teks bila ada.
- "tp": bila teks memuat Tujuan Pembelajaran (TP) atau ATP, SALIN TP itu PERSIS kata per kata (jangan diperbaiki), satu TP per butir, beserta kodenya bila ada (mis. "TP 1.2: Peserta didik mampu ..."). Hanya bila teks TIDAK memuat TP: usulkan 3–6 TP gaya Kemenag, diawali "Peserta didik mampu ...", kata kerja operasional, sesuai isi teks, urut dari mudah ke sulit (guru akan membaca dan menyetujuinya).
- "pokok": 4–10 pokok materi yang bisa diuji (maks 15 kata per poin). Rumus ditulis seperti di teks, dalam LaTeX "$...$" (garis miring terbalik ditulis ganda di JSON), bukan dengan kata-kata.
- "dalil": untuk setiap [DALIL n]: "sumber" (mis. "HR. Bukhari dan Muslim") dan "terjemah" HANYA bila tertulis di teks di dekat dalil itu, disalin PERSIS kata per kata; kalau tidak tertulis, isi "". Jangan menerjemahkan sendiri.
- "catatan": satu kalimat bila teks terlalu sedikit atau kurang jelas untuk dibuat soal; selain itu "".`;
  return { sistem, pengguna };
}

/**
 * Bentuk soal di instruksi sistem. `tka`: BS = PG kompleks Kategori (contoh resmi TKA). Jenis madrasah (0.22.0, gaya
 * Al-Fatah): BS = Benar/Salah satu pernyataan per nomor, MJ = menjodohkan gaya lama (satu nomor = satu pasangan).
 */
const bentukSoal = (tka: boolean) =>
  BENTUK_SOAL.replace("{{BS}}", tka ? BS_KATEGORI : BS_LAMA).replace("{{MJ}}\n", tka ? "" : `${MJ_LAMA}\n`);
const formatBsMj = (tka: boolean) =>
  tka
    ? `Untuk BS: {"bentuk":"BS","dalil_id":null,"pertanyaan":"...","pernyataan":["...","...","..."],"label":["Benar","Salah"],"kunci":["Benar","Salah","Salah"],"pembahasan":"...","level":"C4","tp":"TP 3.2","skor":1}`
    : `Untuk BS: {"bentuk":"BS","dalil_id":null,"pertanyaan":"Salat Jumat wajib bagi laki-laki muslim yang mukim.","kunci":"Benar","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}
Untuk MJ (satu objek per nomor): {"bentuk":"MJ","dalil_id":null,"pertanyaan":"Ilmu tentang cara membaca Al-Qur'an dengan benar","jodoh":"Ilmu tajwid","pengecoh":["Ilmu falak"],"pembahasan":"...","level":"C1","tp":"TP 3.2","skor":1}`;

const BS_KATEGORI = `- BS (pilihan ganda kompleks model Kategori): "pertanyaan" berisi stimulus/pokok soal + perintah, misalnya "Tentukan apakah setiap pernyataan berikut Benar atau Salah!". Lalu "pernyataan" sebanyak "Jumlah pernyataan" di baris kisi-kisinya (bila tidak tertulis: 4) yang masing-masing dinilai dengan sepasang "label", salah satu dari: ["Benar","Salah"], ["Fakta","Opini"], ["Sesuai","Tidak Sesuai"], ["Tepat","Tidak Tepat"], ["Didukung","Tidak Didukung"] (didukung/tidak oleh stimulus). Pilih pasangan label yang paling cocok dengan isi soal dan ragamkan dalam satu set (jangan semua Benar/Salah bila ada lebih dari satu soal BS). Pembahasan menyebut ISI pernyataan, bukan urutannya ("pernyataan pertama", "pernyataan 2"), karena urutan pernyataan diacak aplikasi. "kunci": array label, satu untuk setiap pernyataan sesuai urutan; jangan semua sama. Jangan menulis ulang pernyataan di dalam "pertanyaan" (aplikasi menampilkannya sebagai tabel). Tanpa "pilihan".`;

const BS_LAMA = `- BS (benar/salah): SATU nomor = SATU pernyataan. "pertanyaan" berisi satu kalimat pernyataan utuh yang bisa dinilai benar atau salah (bukan kalimat tanya, tanpa "Benar atau salah?"). "kunci": "Benar" atau "Salah", WAJIB sama dengan "Kunci" di baris kisi-kisinya bila tertulis. Pernyataan salah dibuat dengan mengubah SATU konsep kunci dari pernyataan benar (bukan sekadar menambah kata "tidak"). Tanpa "pilihan" dan tanpa "pernyataan". "pembahasan": mengapa pernyataan itu benar atau salah.`;

const MJ_LAMA = `- MJ (menjodohkan): SATU nomor = SATU pasangan. Nomor-nomor MJ dengan "Blok MJ" yang sama di kisi-kisi dijodohkan dengan SATU daftar jawaban bersama yang disusun aplikasi. Untuk setiap nomor MJ: "pertanyaan" = pernyataan lajur kiri (maks 15 kata; istilah, tokoh, kosakata, atau deskripsi singkat, tanpa titik-titik), "jodoh" = pasangannya yang benar (maks 12 kata). Semua nomor dalam satu blok berhubungan sejenis (istilah–pengertian, tokoh–karya, kata–arti, dan sebagainya), hubungannya SATU-SATU, dan semua "jodoh" berbeda isi; JANGAN pengelompokan (beberapa nomor berjodoh sama). SETIAP nomor MJ WAJIB juga punya "pengecoh": array berisi TEPAT 1 jawaban sejenis yang TIDAK cocok dengan pernyataan mana pun di bloknya dan BUKAN "jodoh" nomor lain di blok itu (aplikasi memilih satu sebagai jawaban tambahan di daftar; pengecoh yang sama dengan jodoh nomor lain dibuang). Contoh: jodoh satu blok "145 kali", "115 kali", "88 kali", "32 kali" → pengecoh yang benar "60 kali", BUKAN "115 kali". JANGAN menulis huruf, "pilihan", "kunci", "pasangan", ataupun "premis". "pembahasan": satu kalimat tentang hubungan pasangan itu (sebut isinya).`;

const BENTUK_SOAL = `BENTUK SOAL:
- PG: 5 pilihan, tepat 1 benar. Tulis berurutan: "pertanyaan", lalu "langkah" (langkah hitung atau alasan singkat untuk menemukan jawaban benar; wajib lengkap untuk soal hitungan), lalu "jawaban_benar" (isi jawaban benar hasil langkah itu), BARU "pilihan" (salah satunya salinan PERSIS "jawaban_benar") dan "kunci" ("A".."E", huruf pilihan yang sama dengan "jawaban_benar"). Periksa ulang hitungan sebelum menulis pilihan.
- PGK (pilihan ganda kompleks, model jawaban ganda/MCMA): 5 pilihan, lebih dari satu benar tetapi tidak semua. Jumlah jawaban benar WAJIB sama dengan "Jumlah jawaban benar" di baris kisi-kisinya (bila tidak tertulis: 2 atau 3). Setiap pilihan satu pernyataan utuh; JANGAN pilihan gabungan seperti "(2) dan (3)" atau "1, 2, dan 4". "kunci": array huruf jawaban benar, sebanyak jumlah itu. Akhiri pertanyaan dengan "(Pilih semua jawaban yang tepat)" tanpa menyebut jumlah jawaban benar.
{{BS}}
{{MJ}}
- ISIAN (isian singkat): "pertanyaan" berisi kalimat atau pertanyaan dengan SATU bagian kosong yang ditulis "...." (empat titik). "kunci": jawaban singkat yang pas mengisi bagian kosong (satu kata, istilah, angka, atau frasa maksimal 5 kata). "kunciAlt": array 0–3 penulisan lain yang juga benar (sinonim atau ejaan lain), atau []. Hanya SATU jawaban yang mungkin benar, jadi kalimat harus cukup spesifik; jawaban TIDAK BOLEH muncul di kalimat soal. Tanpa "pilihan". Berlaku juga untuk bahasa asing (kosakata, dhamir, kata tanya, terjemah).
- URAIAN: "pertanyaan" WAJIB menyebut batasan jawaban yang jelas: jumlah hal yang diminta ("Sebutkan tiga ...", "Jelaskan dua alasan ...") atau ruang lingkupnya ("... dari segi waktu dan nisabnya"); jangan perintah luas seperti "Jelaskan tentang ...!". "kunci" berisi jawaban ideal yang lengkap untuk SEMUA bagian yang diminta. "rubrik" mengikuti batasan itu (misalnya diminta tiga hal → tiga kriteria), setiap kriteria menyebut kapan mendapat skor penuh dan kapan sebagian; "skor" = jumlah skor rubrik.`;

/** Jumlah soal LOTS/MOTS/HOTS dari persentase (sisa pembulatan ke yang pecahannya terbesar), totalnya tepat `total`. */
export function hitungLevel(total: number, level: Pengaturan["level"]) {
  const kunci = ["LOTS", "MOTS", "HOTS"] as const;
  const mentah = kunci.map((k) => (total * level[k]) / 100);
  const hasil = mentah.map(Math.floor);
  const urut = kunci.map((_, i) => i).sort((a, b) => mentah[b] - hasil[b] - (mentah[a] - hasil[a]));
  for (let i = 0; hasil.reduce((a, b) => a + b, 0) < total; i++) hasil[urut[i % 3]]++;
  return { LOTS: hasil[0], MOTS: hasil[1], HOTS: hasil[2] };
}

export type Kategori = "LOTS" | "MOTS" | "HOTS";
const RENTANG: Record<Kategori, string> = { LOTS: "C1–C2", MOTS: "C3", HOTS: "C4–C6" };

/**
 * Kategori level untuk setiap nomor, ditentukan APLIKASI (AI tidak pandai menghitung komposisi).
 * Dibagi merata ke semua bentuk (round-robin berbobot), lalu di dalam tiap bentuk diurutkan mudah → sulit.
 */
export function rencanaLevel(jumlah: Record<Bentuk, number>, level: Pengaturan["level"], tanpaHots: Bentuk[] = []): Kategori[] {
  const urutan = urutanBentuk(jumlah);
  const total = urutan.reduce((n, b) => n + jumlah[b], 0);
  const target = hitungLevel(total, level);
  const kategori = ["LOTS", "MOTS", "HOTS"] as const;
  const dipakai = { LOTS: 0, MOTS: 0, HOTS: 0 };
  const semua: Kategori[] = [];
  for (let i = 0; i < total; i++) {
    // pilih kategori yang paling "tertinggal" dari porsinya
    const k = kategori.filter((x) => dipakai[x] < target[x]).sort((a, b) => dipakai[a] / target[a] - dipakai[b] / target[b])[0];
    dipakai[k]++;
    semua.push(k);
  }
  // Bentuk `tanpaHots` (Benar/Salah & Menjodohkan gaya lama: satu kalimat pendek, tanpa stimulus) tidak diberi HOTS:
  // HOTS-nya ditukar dengan LOTS/MOTS bentuk lain, jadi komposisi total tetap persis.
  const bentukNo = urutan.flatMap((b) => Array<Bentuk>(jumlah[b]).fill(b));
  for (let i = 0; i < total; i++) {
    if (semua[i] !== "HOTS" || !tanpaHots.includes(bentukNo[i])) continue;
    const j = semua.findIndex((k, x) => k !== "HOTS" && !tanpaHots.includes(bentukNo[x]));
    if (j < 0) break;
    [semua[i], semua[j]] = [semua[j], semua[i]];
  }
  let awal = 0;
  return urutan.flatMap((b) => {
    const bagian = semua.slice(awal, awal + jumlah[b]);
    awal += jumlah[b];
    return bagian.sort((x, y) => kategori.indexOf(x) - kategori.indexOf(y));
  });
}

/**
 * Rencana kategori level per nomor satu set: dipakai permintaan kisi-kisi DAN koreksi level kisi (sesuaikanLevel).
 * Benar/Salah & Menjodohkan gaya lama = satu kalimat pendek: HOTS-nya dipindah ke bentuk lain (jumlah total tetap).
 */
export const rencanaLevelSet = (p: Pengaturan) => rencanaLevel(p.jumlah, p.level, p.tujuan === TKA ? [] : ["BS", "MJ"]);

/**
 * Level kisi dari AI disesuaikan dengan kategori rencananya. Uji 2026-11-08 (set 86, ASAS 45): AI menulis C2 untuk
 * baris MOTS/HOTS, komposisi jadi 17/19/9 padahal surat 15/20/10. Level di luar kategori → C2 / C3 / C4.
 */
export function sesuaikanLevel(level: string, k: Kategori): string {
  const boleh: Record<Kategori, string[]> = { LOTS: ["C1", "C2"], MOTS: ["C3"], HOTS: ["C4", "C5", "C6"] };
  return boleh[k].includes(level) ? level : { LOTS: "C2", MOTS: "C3", HOTS: "C4" }[k];
}

/**
 * Soal grup Latihan TKA, ditentukan APLIKASI (AI mengabaikan "kira-kira separuh"). Per bentuk (tanpa uraian),
 * separuh nomor (dibulatkan ke bawah) di AKHIR bagian bentuk itu (level lebih tinggi, cocok untuk wacana)
 * dijadikan grup berisi 3 atau 2 soal. Hasil: nomor grup per nomor soal (urut kisi-kisi), atau null.
 */
export function rencanaGrup(jumlah: Record<Bentuk, number>): (number | null)[] {
  const hasil: (number | null)[] = [];
  let nomor = 0;
  for (const b of urutanBentuk(jumlah)) {
    const n = jumlah[b];
    let sisa = b === "URAIAN" ? 0 : Math.floor(n / 2);
    if (sisa < 2) sisa = 0;
    const ukuran: number[] = [];
    while (sisa > 0) {
      const u = sisa === 4 || sisa === 2 ? 2 : 3;
      ukuran.push(u);
      sisa -= u;
    }
    const tunggal = n - ukuran.reduce((a, c) => a + c, 0);
    hasil.push(...Array<null>(tunggal).fill(null));
    for (const u of ukuran) hasil.push(...Array<number>(u).fill(++nomor));
  }
  return hasil;
}

/**
 * Jumlah jawaban benar tiap soal PGK, ditentukan APLIKASI dan dicatat di kisi-kisi (`kunciPgk`), karena AI tidak
 * meragamkannya sendiri (uji set 81: keempat PGK berkunci 2 walau diminta 2–4). TKA 2–4 (contoh resmi), jenis lain 2–3.
 */
export function pasangKunciPgk<T extends { bentuk: Bentuk; grup?: number | null; tp?: string; materi?: string; indikator?: string }>(kisi: T[], tka: boolean, acak: () => number = Math.random): (T & { kunciPgk?: number; jumlahPernyataan?: number; kunciBs?: string })[] {
  const pola = tka ? [2, 3, 4] : [2, 3];
  let n = 0;
  // Benar/Salah gaya lama (0.22.0): kunci tiap nomor ditentukan aplikasi, separuh Benar separuh Salah, urutan acak
  // (AI cenderung membuat semua "Benar").
  const nBs = kisi.filter((k) => k.bentuk === "BS").length;
  const kunciBs = tka ? [] : kocok(Array.from({ length: nBs }, (_, i) => (i % 2 ? "Salah" : "Benar")), acak);
  // Menjodohkan gaya lama: nomor MJ dibagi ke blok (blokMj); nomor grup dilanjutkan setelah grup wacana yang ada.
  const ukuran = blokMj(kisi.filter((k) => k.bentuk === "MJ").length);
  let grup = Math.max(0, ...kisi.map((k) => k.grup ?? 0));
  let sisaBlok = 0;
  let kepala: T | null = null;
  return kisi.map((k) => {
    if (k.bentuk === "PGK") return { ...k, kunciPgk: pola[n++ % pola.length] };
    if (k.bentuk === "BS") return tka ? { ...k, jumlahPernyataan: 3 } : { ...k, kunciBs: kunciBs.shift() };
    if (k.bentuk === "MJ" && !tka) {
      if (sisaBlok === 0) {
        grup++;
        sisaBlok = ukuran.shift() ?? 1;
        kepala = k;
      }
      sisaBlok--;
      // Satu blok = satu daftar jawaban, jadi satu jenis hubungan: indikator/materi/TP nomor pertama dipakai seluruh blok.
      // AI menyusun kisi sebelum blok dibentuk dan sengaja meragamkan tiap baris (set 86–88: istilah + nama nabi
      // dalam satu daftar); indikator per baris lalu mengalahkan aturan "sejenis" saat soal ditulis.
      const { tp, materi, indikator } = kepala!;
      return { ...k, grup, tp, materi, indikator };
    }
    return k;
  });
}

const urutanBentuk = (jumlah: Record<Bentuk, number>) => (Object.keys(NAMA_BENTUK) as Bentuk[]).filter((b) => jumlah[b] > 0);

/** Tujuan, kesulitan, dan catatan guru: sama untuk permintaan kisi-kisi dan soal. */
function kepalaPermintaan(p: Pengaturan) {
  const tujuan = p.tujuan as (typeof TUJUAN)[number];
  const kesulitan = p.kesulitan as (typeof KESULITAN)[number];
  // ATURAN-SOAL.md bagian 6: catatan guru mengalahkan semua aturan gaya, kecuali 4 hal yang dikunci.
  const catatanGuru = p.catatan
    ? `\nCatatan dari guru (PRIORITAS TERTINGGI):\n"""${p.catatan}"""\n${KUNCI_CATATAN}\n`
    : "";
  const nama = `${namaTujuan(tujuan)}${KEPANJANGAN[tujuan] ? ` (${KEPANJANGAN[tujuan]})` : ""}`;
  // 0.19.0: rubrik kini menulis skor sebagian di teks kriteria ("3 = tiga benar"); kalau jumlahnya tidak sama dengan bobot,
  // terapkanBobot menskalakan angka skor tetapi teksnya tidak ikut → tidak cocok. Jadi AI diberi tahu jumlah yang dituju.
  const bobotUraian = p.jumlah?.URAIAN && p.bobot?.URAIAN ? `Jumlah skor rubrik setiap soal URAIAN harus tepat ${p.bobot.URAIAN}.\n` : "";
  return `Tujuan: ${nama}. Aturan ${namaTujuan(tujuan)}: ${ATURAN_TUJUAN[tujuan].aturan}
${tujuan === TKA ? `${ATURAN_TKA}\n` : ""}Tingkat kesulitan: ${kesulitan}. Artinya: ${ATURAN_KESULITAN[kesulitan]}
${bobotUraian}${catatanGuru}`;
}

const KUNCI_CATATAN = `Ikuti catatan guru sepenuhnya, walau berbeda dengan aturan gaya di instruksi sistem (stimulus, variasi, sebaran TP/materi/dalil, panjang pembahasan, pilihan kata, dan sebagainya), KECUALI empat hal yang tidak boleh diubah:
1. Ayat dan hadis tidak boleh dikarang, diketik ulang, atau diambil dari luar DATA BAB. (Guru boleh meminta lebih sedikit atau tanpa teks Arab: isi "dalil_id": null.)
2. Jumlah, bentuk, dan kategori level tiap nomor sudah ditentukan aplikasi.
3. Format jawaban JSON.
4. Isi yang dilarang (SARA, politik praktis, pornografi, propaganda, kekerasan, merek dagang).`;

/** Langkah 6: minta KISI-KISI (rencana semua soal) dulu, dalam satu panggilan, supaya skenario tidak berulang. */
export function buatPermintaanKisi(p: Pengaturan, bab?: Pick<Bab, "teksArab">) {
  // Mode "bahasa" (Bahasa Arab): kosakata/kalimat Arab boleh ditulis; selain itu semua Arab ditulis dengan transliterasi.
  const tanpaArab = bab?.teksArab !== "bahasa";
  const urutan = urutanBentuk(p.jumlah);
  const total = urutan.reduce((n, b) => n + p.jumlah[b], 0);
  // Rencana per nomor, diringkas jadi rentang: "Nomor 1–6: PG, LOTS (C1–C2)".
  const bentukNo = urutan.flatMap((b) => Array<Bentuk>(p.jumlah[b]).fill(b));
  const kategori = rencanaLevelSet(p);
  const grup = p.tujuan === TKA ? rencanaGrup(p.jumlah) : [];
  // Menjodohkan gaya lama: batas blok (blokMj, sama dengan pasangKunciPgk) diberitahukan sejak kisi-kisi, supaya AI
  // merencanakan satu jenis hubungan per blok (set 89: tanpa ini indikator nomor pertama blok hanya cukup untuk 1 pasangan).
  const blok: number[] = [];
  if (p.tujuan !== TKA) {
    const awalMj = bentukNo.indexOf("MJ");
    blokMj(p.jumlah.MJ ?? 0).forEach((n, b) => blok.push(...Array<number>(n).fill(b + 1)));
    blok.unshift(...Array<number>(Math.max(awalMj, 0)).fill(0));
  }
  const rentang: string[] = [];
  for (let i = 0; i < total; ) {
    let j = i;
    while (j + 1 < total && bentukNo[j + 1] === bentukNo[i] && kategori[j + 1] === kategori[i] && (grup[j + 1] ?? null) === (grup[i] ?? null) && (blok[j + 1] ?? 0) === (blok[i] ?? 0)) j++;
    rentang.push(`- Nomor ${i === j ? i + 1 : `${i + 1}–${j + 1}`}: ${bentukNo[i]}, ${kategori[i]} (${RENTANG[kategori[i]]})${grup[i] ? `, GRUP ${grup[i]}` : ""}${blok[i] ? `, BLOK MJ ${blok[i]}` : ""}`);
    i = j + 1;
  }
  return `Susun KISI-KISI untuk satu set ${total} soal. Belum menulis soal; setiap baris kisi-kisi = rencana satu soal.
${kepalaPermintaan(p)}Bentuk dan kategori level setiap nomor SUDAH DITENTUKAN, wajib diikuti persis (${total} baris, urut nomor):
${rentang.join("\n")}
Isi setiap baris:
- "tp": kode TP. Sebar merata ke semua TP.
- "materi": pokok materi singkat (maks 8 kata).
- "indikator": indikator soal gaya Kemenag, diawali "Disajikan ..., peserta didik dapat ..." bila memakai stimulus, atau "Peserta didik dapat ..." bila tanpa stimulus; kata kerja operasional sesuai level.
- "level": satu level di dalam kategori nomor itu (LOTS = C1 atau C2, MOTS = C3, HOTS = C4, C5, atau C6).
- "dalil_id": id dalil yang dipakai, atau null. Bila DATA BAB memuat dalil, sebar ke semua dalil.
- "stimulus": jenis stimulus + skenario singkat (maks 15 kata), atau "tanpa stimulus". Ikuti aturan STIMULUS: setiap skenario BERBEDA satu sama lain dalam seluruh kisi-kisi.
Indikator antarbaris juga tidak boleh sama persis; ambil sisi materi yang berbeda${p.jumlah.MJ && p.tujuan !== TKA ? " (KECUALI baris MJ dalam BLOK MJ yang sama: lihat aturan MJ)" : ""}.
SATU KETERAMPILAN = SATU NOMOR: kata kerja + objek yang sama (misalnya "menghitung tingkat inflasi dari data IHK", "menyebutkan syarat mukjizat") hanya boleh dipakai SATU baris dalam seluruh kisi-kisi, lintas bentuk. Mengganti sinonim kata kerja ("menghitung" → "menyimpulkan ... dalam persen"), angka data, nama tokoh, atau kasusnya TIDAK membuatnya berbeda. Ambil keterampilan lain dari TP yang sama (misalnya menafsirkan hasil hitungan, menentukan penyebab, membandingkan, menggolongkan).${p.jumlah.URAIAN ? " Pengecualian: baris URAIAN boleh memperdalam keterampilan satu baris lain (langkah lengkap atau alasan), asalkan bukan pertanyaan yang sama." : ""}
${p.jumlah.ISIAN ? `${RENCANA_ISIAN}\n` : ""}${p.jumlah.MJ ? `${RENCANA_MJ}\n` : ""}${tanpaArab ? 'Di kisi-kisi JANGAN menulis huruf Arab sama sekali; sebut lafaz dengan transliterasi Latin (misalnya "lā taqrabū az-zinā").' : "Di kisi-kisi boleh menulis kosakata/kalimat Arab buatan sendiri, tetapi JANGAN menulis ayat atau hadis."}
${p.tujuan === TKA ? `${SOAL_GRUP}${tanpaArab ? " Wacana tanpa huruf Arab." : " Wacana boleh berbahasa Arab, tetapi bukan ayat atau hadis."}\n` : ""}${p.catatan ? `${TANGGAPAN}\n` : ""}FORMAT JAWABAN untuk permintaan ini: hanya JSON {${p.catatan ? '"tanggapan":"...",' : ""}"kisi":[{"bentuk":"PG","tp":"TP 3.1","materi":"...","indikator":"...","level":"C2","dalil_id":null,"stimulus":"tanpa stimulus"${p.tujuan === TKA ? ',"grup":null' : ""}}${p.jumlah.ISIAN ? ',{"bentuk":"ISIAN",...,"jawaban":"..."}' : ""}]${p.tujuan === TKA ? ',"wacana":[{"grup":1,"teks":"..."}]' : ""}}`;
}

// ATURAN-SOAL.md bagian 9 no. 4: soal grup TKA. Dibatasi bentuk sama supaya lembar soal tetap per bagian bentuk.
const SOAL_GRUP = `SOAL GRUP (gaya TKA): nomor yang ditandai GRUP N di atas SUDAH DITENTUKAN sebagai soal grup: semua nomor dengan GRUP yang sama memakai SATU wacana bersama.
- Isi "grup" setiap baris dengan nomor grupnya, atau null untuk soal tunggal. Soal dalam satu grup mengukur indikator yang berbeda.
- WAJIB tulis wacana setiap grup di "wacana": teks lengkap 80–200 kata yang belum pernah dibaca siswa (bacaan, data dalam tabel sesuai aturan TABEL, kasus, atau hasil percobaan).
- "stimulus" baris grup diisi "wacana grup N".`;

// ATURAN-SOAL.md bagian 6 no. 2: AI menjawab catatan guru; tampil di paling atas hasil soal.
const TANGGAPAN = `Isi juga "tanggapan": balasan singkat untuk guru (maks 3 kalimat, sapa dengan "Anda") tentang catatannya: apa yang Anda ikuti dan bagaimana, serta bagian yang TIDAK bisa diikuti beserta alasannya. Bila meminta jumlah/bentuk soal lain, arahkan ke tombol jumlah soal di form; bila meminta komposisi level lain, arahkan ke menu Lanjutan.`;

// 0.18.3: jawaban isian direncanakan di kisi-kisi, supaya tahap soal lain (yang ditulis LEBIH DULU) bisa menghindarinya.
const RENCANA_ISIAN = `- "jawaban" (HANYA baris ISIAN): rencana jawaban soal isian itu (1–5 kata). Pilih istilah/konsep yang TIDAK akan menjadi kunci, pengecoh, atau data di soal lain dalam kisi-kisi ini, dan berbeda antarbaris isian. Jangan berupa angka yang juga dipakai sebagai data soal lain (misalnya tarif yang diberikan di soal hitungan).`;

// 0.19.1: menjodohkan "pengelompokan" (5 pajak → pusat/daerah) membuat jawaban berulang dan gagal diperbaiki (audit set 76).
// 0.22.0: menjodohkan gaya lama (satu baris = satu pasangan); baris MJ berurutan dijodohkan dengan satu daftar jawaban.
const RENCANA_MJ = `- Baris MJ (menjodohkan): setiap baris = SATU pasangan (satu pernyataan lajur kiri dan jodohnya). Baris-baris MJ yang berurutan dijodohkan bersama dengan satu daftar jawaban, jadi pilih SATU jenis hubungan untuk semuanya (istilah–pengertian, tokoh–karya, kata–arti) dengan pasangan berbeda di setiap baris dan jodoh yang semuanya berbeda. Semua baris dalam BLOK MJ yang sama memakai "indikator" dan "materi" yang SAMA PERSIS, berupa jenis hubungan yang cukup luas untuk memuat semua pasangan blok itu (contoh: "Peserta didik dapat menjodohkan istilah-istilah kemukjizatan dengan pengertiannya"), BUKAN satu pasangan tertentu. Jodoh dalam satu blok harus sejenis (semuanya istilah, atau semuanya nama surah, atau semuanya nama tokoh), jangan dicampur. Materi pengelompokan (beberapa hal masuk ke kelompok yang sama) jangan dijadikan MJ. "stimulus" baris MJ: "tanpa stimulus".`;

/** Baris kisi-kisi dalam bentuk ringkas untuk permintaan soal. */
const tulisKisi = (k: BarisKisi) =>
  `- Nomor ${k.no} | ${k.bentuk} | ${k.tp} | ${k.level} | dalil_id: ${k.dalil_id ?? "null"} | Indikator: ${k.indikator} | Stimulus: ${k.grup && k.wacana ? `WACANA GRUP ${k.grup}` : k.stimulus}${k.jawaban ? ` | Jawaban (kunci): ${k.jawaban}` : ""}${k.kunciPgk ? ` | Jumlah jawaban benar: ${k.kunciPgk}` : ""}${k.jumlahPernyataan ? ` | Jumlah pernyataan: ${k.jumlahPernyataan}` : ""}${k.kunciBs ? ` | Kunci: ${k.kunciBs}` : ""}${k.bentuk === "MJ" && k.grup && !k.wacana ? ` | Blok MJ ${k.grup}` : ""}`;

/**
 * Daftar jawaban isian rencana kisi-kisi yang TIDAK boleh tertulis di soal lain (ATURAN-SOAL 2b no. 11), untuk setiap
 * tahap soal. Jawaban yang memuat angka dilewati: melarang angka (mis. tarif 11%) bisa membuat AI mengubah data yang benar.
 */
export function laranganIsian(kisi: BarisKisi[]) {
  const kata = [...new Set(kisi.filter((k) => k.bentuk === "ISIAN" && k.jawaban && !/\d/.test(k.jawaban)).map((k) => k.jawaban!.trim()))];
  return kata.length
    ? `Kata/istilah berikut adalah JAWABAN soal isian di set ini: ${kata.map((k) => `"${k}"`).join(", ")}. JANGAN tuliskan kata-kata itu di pokok soal, pilihan, pernyataan, premis, maupun wacana soal lain (hanya soal isian yang bersangkutan yang memakainya, sebagai kunci).\n`
    : "";
}

/**
 * Pemeriksaan kisi-kisi oleh AI (0.25.0): cari baris yang menguji keterampilan sama lintas bentuk, lalu tulis ulang baris
 * yang belakangan. Aturan "satu keterampilan = satu nomor" di permintaan kisi saja tidak cukup (set 94: PG "menghitung
 * tingkat inflasi dari IHK" + isian "menentukan tingkat inflasi dari IHK"; set 95: PG + B/S "membedakan pajak subjektif dan
 * objektif"). Pemeriksa kemiripan kata buatan aplikasi melewatkan sinonim kata kerja, jadi yang memeriksa AI; aplikasi
 * hanya menerima perubahan indikator/materi/stimulus/jawaban isian (terapkanKembar).
 */
export function buatPeriksaKembar(kisi: BarisKisi[]) {
  const baris = kisi.map((k, i) =>
    `${i + 1}. ${k.bentuk}${k.bentuk === "MJ" && k.grup ? ` (BLOK MJ ${k.grup})` : ""} | ${k.tp} | ${k.level} | ${k.indikator} | materi: ${k.materi}${k.bentuk === "ISIAN" && k.jawaban ? ` | jawaban: ${k.jawaban}` : ""}`,
  );
  // Pasangan yang kata intinya hampir sama sudah pasti kembar (aplikasi menemukannya; AI kadang melewatkannya, set 99: PG
  // dan isian sama-sama menghitung PPN). AI tetap mencari pasangan lain yang beda kata (sinonim).
  const pasti = kisi.flatMap((a, i) =>
    kisi.slice(i + 1).flatMap((b, d) =>
      [a.bentuk, b.bentuk].some((x) => x === "MJ" || x === "URAIAN") || !miripIndikator(a.indikator, b.indikator) ? [] : [`${i + 1} dan ${i + d + 2}`],
    ),
  );
  return `Ini permintaan MEMERIKSA kisi-kisi set ini (bukan membuat soal):
${baris.join("\n")}
${pasti.length ? `\nPasangan berikut SUDAH PASTI kembar dan wajib diperbaiki: ${pasti.join("; ")}.\n` : ""}
Cari pasangan baris yang MENGUJI KETERAMPILAN YANG SAMA: kata kerja + objek yang sama, walaupun kata kerjanya sinonim (menghitung/menentukan/menilai kebenaran hasil hitung), angka data, tokoh, kasus, atau bentuk soalnya berbeda. Contoh kembar: "menghitung tingkat inflasi dari data IHK" (PG) dengan "menentukan tingkat inflasi dalam persen dari data IHK" (ISIAN); "membedakan pajak subjektif dan objektif" (PG) dengan "membedakan ciri pajak subjektif dan objektif" (BS).
BUKAN kembar: baris URAIAN yang memperdalam baris lain; baris MJ dalam BLOK MJ yang sama; dua baris dengan konsep sama tetapi keterampilan berbeda (misalnya menyebutkan pengertian vs menganalisis dampak).
Untuk setiap pasangan kembar, tulis ulang baris yang NOMORNYA LEBIH BESAR: indikator baru gaya Kemenag dari TP yang sama, bentuk dan level tetap (kata kerja sesuai level), mengambil sisi materi yang BELUM diuji baris mana pun. Indikator baru WAJIB berbeda kata kerja DAN objeknya dari indikator lama dan dari semua baris lain (menyalin atau sekadar menambah kata pada indikator lama = gagal); boleh memakai sub-materi lain dari TP yang sama. "materi" dan "stimulus" (jenis + skenario, maks 15 kata, atau "tanpa stimulus") menyesuaikan. Baris ISIAN juga menulis "jawaban" baru (1–5 kata) yang tidak tertulis di baris lain. Jangan menulis ayat atau hadis.
FORMAT JAWABAN: hanya JSON {"kembar":[{"nomor":17,"sama_dengan":3,"indikator":"...","materi":"...","stimulus":"..."}]}. Kalau tidak ada yang kembar: {"kembar":[]}.`;
}

const BUKAN_INTI = new Set("peserta didik dapat disajikan yang dan dengan dari pada untuk dalam suatu sebuah tentang secara tepat benar beberapa dua tiga data kasus".split(" "));
const kataInti = (t: string) => new Set(String(t).toLowerCase().split(/,\s*peserta didik dapat/).pop()!.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter((w) => w.length > 2 && !BUKAN_INTI.has(w)));
/** Dua indikator hampir sama: >= 75% kata inti (setelah "peserta didik dapat") yang lebih pendek ada di yang lain. */
export function miripIndikator(a: string, b: string) {
  const [x, y] = [kataInti(a), kataInti(b)];
  return Math.min(x.size, y.size) > 0 && [...x].filter((w) => y.has(w)).length / Math.min(x.size, y.size) >= 0.75;
}

/**
 * Terapkan hasil buatPeriksaKembar: hanya baris yang nomornya lebih besar dari pasangannya, bukan MJ/URAIAN, dan hanya
 * indikator/materi/stimulus/jawaban isian yang berubah (bentuk, TP, level, dalil, grup tetap). `aman` menolak teks berisi
 * Arab tak terverifikasi (aturan 5). Jawaban AI yang rusak → kisi-kisi tetap.
 */
export function terapkanKembar<T extends BarisKisi>(kisi: T[], data: unknown, aman: (teks: string) => boolean) {
  const baru = [...kisi];
  const diganti: string[] = [];
  const daftar = (data as { kembar?: unknown })?.kembar;
  for (const k of (Array.isArray(daftar) ? daftar : []) as Record<string, unknown>[]) {
    const no = Number(k?.nomor);
    const sama = Number(k?.sama_dengan);
    const a = baru[sama - 1];
    const b = baru[no - 1];
    const teks = (x: unknown, lama?: string) => (typeof x === "string" && x.trim() ? x.trim() : lama);
    const indikator = teks(k?.indikator);
    if (!a || !b || !Number.isInteger(no) || sama >= no || !indikator || [a.bentuk, b.bentuk].some((x) => x === "MJ" || x === "URAIAN")) continue;
    if (diganti.some((d) => d.startsWith(`${no} `))) continue;
    // AI sering "menulis ulang" dengan indikator yang sama atau hampir sama (set 97): itu bukan perbaikan, dilewati.
    if (baru.some((x, j) => j !== no - 1 && miripIndikator(x.indikator, indikator)) || miripIndikator(b.indikator, indikator)) continue;
    const isi = { indikator, materi: teks(k.materi, b.materi)!, stimulus: teks(k.stimulus, b.stimulus)!, ...(b.bentuk === "ISIAN" ? { jawaban: teks(k.jawaban, b.jawaban) } : {}) };
    if (!Object.values(isi).every((x) => !x || aman(x))) continue;
    baru[no - 1] = { ...b, ...isi };
    diganti.push(`${no} (kembar dengan ${sama})`);
  }
  return { kisi: baru, diganti };
}

/** Wacana soal grup yang dipakai baris-baris ini (sekali per grup), untuk permintaan soal. */
function tulisWacana(kisi: { grup?: number | null; wacana?: string; no?: number }[]) {
  const grup = new Map<number, { teks: string; no: number[] }>();
  kisi.forEach((k, i) => {
    if (!k.grup || !k.wacana) return;
    const g = grup.get(k.grup) ?? { teks: k.wacana, no: [] };
    g.no.push(k.no ?? i + 1);
    grup.set(k.grup, g);
  });
  if (!grup.size) return "";
  return `\n${[...grup].map(([n, g]) => `WACANA GRUP ${n} (untuk nomor ${g.no.join(", ")}):\n${g.teks}`).join("\n\n")}
Soal grup memakai wacana grupnya sebagai stimulus. JANGAN menulis ulang wacana di "pertanyaan" (aplikasi menampilkannya sekali di atas soal pertama grup); langsung tulis pokok soal, misalnya "Berdasarkan teks tersebut, ...". Untuk soal grup, merujuk "teks tersebut" diperbolehkan.\n`;
}

/** Satu baris daftar "soal yang sudah dibuat": pertanyaan (dipotong) + jawabannya (PG/PGK/isian), supaya jawaban tidak bocor ke soal lain. */
export function ringkasSudah(s: Soal): string {
  const kunci = [s.kunci].flat().map((k) => String(k ?? "").trim());
  const jawaban =
    s.bentuk === "PG" || s.bentuk === "PGK"
      ? kunci.map((h) => s.pilihan?.["ABCDE".indexOf(h.toUpperCase())]).filter(Boolean).join("; ")
      : s.bentuk === "ISIAN" || (s.bentuk === "BS" && !Array.isArray(s.pernyataan)) ? kunci[0]
      : mjLama(s) ? (s.jawaban?.["ABCDEFG".indexOf(String(kunci[0] ?? "").toUpperCase())] ?? "") : "";
  // 0.19.0: isi Menjodohkan & Kategori ikut dikirim; dulu hanya perintahnya ("Jodohkan ...!") sehingga AI membuat
  // pasangan yang sama lagi (audit 2026-11-07, set 70 no. 19 & 20). Menjodohkan gaya lama: jodohnya sudah di "jawaban".
  const isi = mjLama(s) ? [] : s.bentuk === "MJ" ? [...(s.premis ?? s.pasangan?.map((p) => p.premis) ?? []), ...(s.jawaban ?? s.pasangan?.map((p) => p.jawaban) ?? [])] : s.pernyataan ?? [];
  const daftar = isi.length ? ` → ${s.bentuk === "MJ" ? "isi lajur" : "pernyataan"}: ${isi.map((t) => String(t).slice(0, 50)).join("; ").slice(0, 300)}` : "";
  return `${String(s.pertanyaan ?? "").slice(0, 160)}${jawaban ? ` → jawaban: ${jawaban.slice(0, 120)}` : ""}${daftar}`;
}

/**
 * Permintaan untuk satu tahap. `sudah` = soal tahap sebelumnya (lihat ringkasSudah), supaya AI tidak membuat soal yang mirip.
 * `kisi` = baris kisi-kisi untuk tahap ini (set lama tanpa kisi-kisi: kosong, pakai komposisi level).
 */
export function buatPengguna(p: Pengaturan, jumlah: Record<Bentuk, number>, sudah: string[], tambahan = "", kisi: BarisKisi[] = []) {
  const urutan = urutanBentuk(jumlah);
  const daftarSudah = sudah.length
    ? `\nSoal berikut SUDAH dibuat dalam set ini. Jangan membuat soal yang sama atau mirip (pokok bahasan maupun redaksinya), jangan memakai lagi skenario/kasus yang sama, dan hitung pola "berdebat/berbeda pendapat" yang sudah ada di daftar ini terhadap batas 2 kali. Ambil sisi materi, dalil, atau TP yang lain. Jawaban soal-soal itu (setelah "→ jawaban:") JANGAN tertulis di pokok soal atau pilihan soal baru, dan jawaban soal baru jangan sudah tertulis di soal-soal itu:\n${sudah.map((s) => `- ${s}`).join("\n")}\n`
    : "";
  const rencana = kisi.length
    ? `Tulis tepat ${kisi.length} soal sesuai KISI-KISI berikut, satu soal per baris, urut sesuai nomor. Setiap soal WAJIB memakai bentuk, tp, level, dan dalil_id barisnya, mengukur indikatornya, dan memakai stimulus/skenario yang tertulis (jangan diganti skenario lain):\n${kisi.map(tulisKisi).join("\n")}${tulisWacana(kisi)}`
    : `Jumlah: ${urutan.map((b) => `${b} ${jumlah[b]}`).join(", ")}. Urutkan per bentuk: ${urutan.join(", ")}.
Komposisi level: LOTS ${p.level.LOTS}%, MOTS ${p.level.MOTS}%, HOTS ${p.level.HOTS}%.`;
  return `Buat soal. ${kepalaPermintaan(p)}${rencana}
${daftarSudah}${tambahan}Balas hanya dengan JSON sesuai format.`;
}

/**
 * Permintaan "ganti satu soal": 1 soal baru dengan bentuk, level, dan TP yang sama (dan indikator kisi-kisi
 * yang sama bila ada), tapi skenario berbeda dari semua soal di set.
 */
export function buatPenggantiPengguna(p: Pengaturan, lama: Soal, semua: Soal[], kisi?: BarisKisi, instruksi = "", maksInstruksi = MAKS_INSTRUKSI, calon = 1) {
  const jumlah = { PG: 0, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0, [lama.bentuk]: 1 };
  if (instruksi) {
    // "Minta perubahan": soal yang sama ditulis ulang sesuai instruksi guru. Instruksi tidak boleh mengalahkan aturan sistem.
    const { peringatan, stimulus, grup, wacana, ...isiAsli } = lama;
    void peringatan;
    void stimulus;
    const isiLama = keFormatAI(isiAsli as Soal); // Menjodohkan: dikirim sebagai pasangan + pengecoh, sama dengan format jawaban
    const tambahan = `\nIni permintaan MENGUBAH satu soal sesuai instruksi guru. Soal saat ini (JSON):
${JSON.stringify(isiLama)}
${kisi ? `Kisi-kisinya: indikator "${kisi.indikator}", stimulus "${kisi.stimulus}".\n` : ""}${tulisWacana([{ grup, wacana }])}Instruksi guru (ikuti selama tidak bertentangan dengan aturan di instruksi sistem: jangan mengetik ayat/hadis, jangan memakai dalil atau fakta di luar data bab, tetap bentuk ${lama.bentuk}):
"""${bersihkanKutipan(instruksi, maksInstruksi)}"""
${calon > 1 ? `Kembalikan ${calon} CALON soal hasil perubahan dalam daftar "soal" (aplikasi memilih satu yang lolos pemeriksaan), masing-masing dengan konsep dan kunci jawaban BERBEDA satu sama lain.` : "Kembalikan tepat 1 soal hasil perubahan."} Bagian yang tidak diminta untuk diubah biarkan sama. "level" dan "tp" boleh berubah bila instruksi menuntutnya.
Tambahkan field "indikator" (indikator soal gaya Kemenag yang sesuai dengan soal hasil perubahan) dan "stimulus" (jenis + skenario, maks 15 kata, atau "tanpa stimulus").\n`;
    return buatPengguna(p, jumlah, semua.filter((s) => s !== lama).map(ringkasSudah), tambahan);
  }
  const kunciPgk = kisi?.kunciPgk ? `, dengan tepat ${kisi.kunciPgk} jawaban benar` : kisi?.jumlahPernyataan ? `, dengan tepat ${kisi.jumlahPernyataan} pernyataan` : "";
  const sasaran = kisi?.grup && lama.wacana
    ? `dengan bentuk ${kisi.bentuk}${kunciPgk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}", dan tetap memakai WACANA GRUP ${lama.grup} di bawah (soal grup), dengan pokok soal yang berbeda dari soal yang diganti`
    : kisi
    ? `dengan bentuk ${kisi.bentuk}${kunciPgk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}". Skenario lama ("${kisi.stimulus}") JANGAN dipakai lagi; pilih skenario baru yang belum ada di set ini. Tambahkan field "stimulus" pada soal berisi jenis + skenario baru (maks 15 kata) atau "tanpa stimulus"`
    : `${lama.bentuk} pengganti dengan level ${lama.level} dan ${lama.tp} (abaikan komposisi level di atas)`;
  const tambahan = `\nIni permintaan MENGGANTI soal berikut (guru tidak memakainya): "${lama.pertanyaan.slice(0, 300)}"
Buat tepat 1 soal ${sasaran}. Gunakan ${kisi?.grup && lama.wacana ? "" : "skenario, "}sudut pandang dan redaksi yang berbeda dari soal yang diganti maupun soal lain di daftar.\n${kisi?.grup ? tulisWacana([lama]) : ""}`;
  return buatPengguna(p, jumlah, semua.map(ringkasSudah), tambahan);
}
