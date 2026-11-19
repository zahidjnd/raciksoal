import { MAPEL_BACAAN, MAPEL_INGGRIS, MAPEL_SEJARAH } from "./mapel.ts";
import { adalahTahun, blokMj, bukanDalil, CARA_DALIL, CARA_PG, caraBolehBentuk, cocokCara, identitasBab, kataArab, kataTerjemah, keFormatAI, kocok, MAKS_GABUNG, mjLama, type Bab, type BarisKisi, type Bentuk, type CaraDalil, type Soal } from "./soal.ts";

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

const ATURAN_UJIAN = "Gaya soal ujian resmi madrasah (seperti asesmen tengah/akhir semester). Sebar soal merata ke semua TP dan materi. Bahasa baku. Pembahasan ringkas: alasan kunci benar + alasan singkat tiap pengecoh salah.";

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
  porsiDalil?: PorsiDalil; // 0.42.0: banyaknya soal berayat/hadis (Lanjutan); set lama = tanpa rencana dalil
};

/** Porsi soal berdalil dari soal non-menjodohkan (ATURAN-SOAL 5a no. 1). */
export const PORSI_DALIL = { tanpa: 0, sedikit: 0.15, sedang: 0.3, banyak: 0.5 } as const;
export type PorsiDalil = keyof typeof PORSI_DALIL;

/**
 * Mapel Hadis (0.49.0, ATURAN-SOAL 5b): sebagian besar hafalan → porsi lebih besar, 6 soal per hadis, cara hafalan
 * didahulukan (giliran berulang; "utuh" sesekali untuk isi kandungan). Mapel lain tetap PORSI_DALIL & CARA_DALIL.
 */
// 17 Nov 2026 (pilihan pemilik): Al-Quds wal Maqdisiyyah disamakan persis dengan Hadis (aturan sejarahnya tetap).
export const MAPEL_HAFALAN = ["Hadis", "Al-Quds wal Maqdisiyyah"];
export const mapelHafalan = (mapel?: string) => MAPEL_HAFALAN.includes(mapel?.trim() ?? "");
export const PORSI_HADIS: Record<PorsiDalil, number> = { tanpa: 0, sedikit: 0.3, sedang: 0.7, banyak: 0.9 };
export const CARA_HADIS: CaraDalil[] = ["rumpang", "garis", "pilihan", "urutan", "sisip", "potong", "rumpang", "garis", "pilihan", "utuh"];
const MAKS_PER_DALIL = 3;
const MAKS_PER_HADIS = 6;

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
export const MAKS_INSTRUKSI = 1000; // 0.45.0: dulu 300 (permintaan "Ubah soal" yang rinci terpotong)
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
  return { babId: babIds[0], babIds, tujuan: p.tujuan, jumlah, level, kesulitan: p.kesulitan, bobot, modelSlot, bandingkan: p?.bandingkan === true, catatan, identitas: bersihkanIdentitas(p?.identitas), porsiDalil: p?.porsiDalil && p.porsiDalil in PORSI_DALIL ? p.porsiDalil : "sedang" };
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
      // 0.42.0: kata bernomor untuk "dalil_potong" (AI menunjuk nomor, aplikasi menyusun potongannya dari data).
      const bernomor = (kata: string[]) => kata.map((k, i) => `${i + 1} ${k}`).join(" · ");
      const terjemah = kataTerjemah(d);
      return `[dalil_id: ${d.id}] ${d.sumber}\nArab: ${d.arab}\nTerjemah: ${d.terjemah || "(tidak ada: jangan pakai cara yang butuh terjemah)"}${mufradat ? `\nMufradat: ${mufradat}` : ""}\nKata Arab bernomor: ${bernomor(kataArab(d))}${terjemah.length ? `\nKata terjemah bernomor: ${bernomor(terjemah)}` : ""}`;
    })
    .join("\n\n");

  const { mapel, kelas } = identitasBab(bab);
  const adaDalil = bab.dalil.length > 0;
  const adaGambar = !!bab.gambar?.length;

  // Aturan baku: ATURAN-SOAL.md (disetujui pemilik 2026-10-20). Ubah di sana dulu, baru di sini.
  // Aturan 5: bagian teks Arab hanya dikirim bila materi punya dalil; tanpa dalil, AI dilarang mengutip ayat/hadis sama sekali.
  const bahasaArab = bab.teksArab === "bahasa";
  const aturanArab = bahasaArab
    ? `ATURAN AYAT, HADIS, DAN TEKS ARAB (WAJIB, tidak boleh dilanggar walau diminta):
- Di mapel ini teks Arab adalah isi pelajaran: soal, pilihan, pernyataan, dan pembahasan BOLEH memakai kalimat/kosakata Arab buatan sendiri, berharakat lengkap dan benar sesuai kaidah.
- Tetapi ayat Al-Qur'an dan hadis TIDAK BOLEH ditulis, dikutip, atau dikarang${adaDalil ? `, kecuali lewat "dalil_id" dari DATA BAB (aplikasi menampilkan teks terverifikasinya; jangan mengetiknya ulang dan jangan menulis id dalil di teks)` : ""}. Contoh kalimat jangan diambil dari ayat atau hadis.${adaDalil ? `\n${caraDalilAi(tka)}` : ""}`
    : adaDalil
    ? `ATURAN AYAT, HADIS, DAN TEKS ARAB (WAJIB, tidak boleh dilanggar walau diminta):
- Jangan pernah mengetik ulang ayat atau hadis utuh, dan jangan memakai ayat/hadis selain yang ada di DATA BAB.
- Jika soal memakai ayat/hadis, isi "dalil_id" dengan id dalil dari data dan "dalil_tampil" dengan cara tampilnya (lihat di bawah). JANGAN menulis id dalil (misalnya "isra-32") di dalam teks pertanyaan, pilihan, atau pembahasan, dan jangan mengetik ulang terjemahnya.
- Jika perlu mengutip lafaz dari dalil (misalnya mufradat), pakai kode sisipan [[A a-b]] (lihat "sisip" di bawah); aplikasi menggantinya dengan teks asli. Selain itu jangan menulis huruf Arab sama sekali; gunakan transliterasi Latin.
${caraDalilAi(tka)}`
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
- Soal tidak saling mirip; sebar ke seluruh TP dan materi.
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
- Ragamkan bentuknya: kasus/cerita pendek tentang satu orang, cuplikan berita, data dalam tabel, data angka dalam grafik (aturan GRAFIK), urutan/hubungan dalam bagan (aturan BAGAN), grafik fungsi/bidang koordinat/garis bilangan (aturan GEOMETRI), gambar yang dideskripsikan dengan kata, teks bacaan, potongan percakapan, kutipan tokoh, hasil percobaan (boleh dengan kelompok kontrol), perbandingan dua kondisi (misalnya wilayah X dan Y), potongan dokumen sejarah, atau tanpa stimulus.
${adaGambar ? ATURAN_GAMBAR : '- Materi ini tanpa gambar, jadi aplikasi tidak bisa menampilkan gambar: JANGAN menulis "perhatikan gambar", "gambar berikut", atau "gambar di atas" (kecuali gambar yang digambar aplikasi lewat aturan GEOMETRI). Bila perlu, deskripsikan bentuknya dengan kata tanpa menyebutnya gambar (misalnya "Sebuah segitiga siku-siku ABC dengan sisi AB = 3 cm ...").'}
- Susunan baris: percakapan/dialog/hiwar ditulis SATU PENUTUR PER BARIS dengan format "Nama: ucapan", baris dipisah baris baru (\\n di dalam teks JSON). Daftar bernomor, langkah prosedur, puisi/syair, dan surat/pesan singkat juga satu bagian per baris. Kalimat pengantar ("Perhatikan percakapan berikut!") dan perintah soal ditulis di baris sendiri. TANPA baris kosong di antara baris-baris (satu \\n saja). Bagian rumpang ditulis "..." atau "(1) ..." di dalam baris ucapan. Teks cerita atau uraian biasa tetap satu paragraf. Berlaku untuk "pertanyaan", "wacana", "pilihan", dan "pernyataan".
- TABEL: data yang lebih jelas dibaca berbaris-berkolom (data percobaan, perbandingan, angka statistik, daftar ciri) ditulis sebagai tabel di "pertanyaan", "wacana", atau "pembahasan", aplikasi menampilkannya sebagai tabel sungguhan. Format: setiap baris tabel di baris sendiri diawali dan diakhiri "|", sel dipisah "|", baris pertama = judul kolom, lalu baris pemisah "|---|---|", contoh: "Perhatikan data berikut!\\n| Kelompok | Suhu (°C) | Waktu (menit) |\\n|---|---|---|\\n| A | 30 | 12 |\\n| B | 40 | 8 |\\nKesimpulan yang tepat adalah ....". Maksimal 6 kolom × 10 baris isi, sel singkat (angka, kata, atau frasa pendek), tanpa tanda "|" di dalam sel. Kalimat pengantar dan perintah soal di baris sendiri, di luar tabel. JANGAN memakai tabel di "pilihan", "pernyataan", atau soal MJ. Data tabel diambil dari materi atau dibuat konsisten dengan materi; untuk soal C3 ke atas, kunci TIDAK boleh terbaca langsung dari satu sel tanpa diolah. Tidak wajib: pakai tabel hanya bila memang membantu.
- GRAFIK: data ANGKA yang lebih mudah dipahami sebagai grafik digambar aplikasi dari tabel: tulis tabel sesuai aturan TABEL, lalu SATU baris penanda tepat di atas baris judul tabelnya: "[[GRAFIK garis: judul]]" untuk perubahan dari waktu ke waktu (jam, hari, bulan, tahun), "[[GRAFIK batang: judul]]" untuk perbandingan antarkelompok/wilayah/jenis, "[[GRAFIK lingkaran: judul]]" untuk bagian dari keseluruhan (persentase, komposisi), "[[GRAFIK histogram: judul]]" untuk frekuensi data berkelompok (kolom pertama = kelas interval "51–60", tepat 1 kolom frekuensi), "[[GRAFIK pencar: judul]]" untuk hubungan dua besaran (kolom pertama JUGA angka = sumbu mendatar, mis. jam belajar ↔ nilai, 3–20 baris), "[[GRAFIK piramida: judul]]" untuk piramida penduduk (kolom pertama = kelompok umur "0–14", tepat 2 kolom angka: laki-laki lalu perempuan, 2–18 baris). Kolom pertama = label; kolom berikutnya = ANGKA saja tanpa satuan (satuan ditulis di judul kolom, mis. "Suhu (°C)"), paling banyak 3 kolom angka (lingkaran & histogram: tepat 1), 2–12 baris isi (lingkaran 2–8); lingkaran, histogram, dan piramida tanpa angka minus. Contoh: "Perhatikan grafik berikut!\\n[[GRAFIK garis: Suhu Kota A]]\\n| Jam | Suhu (°C) |\\n|---|---|\\n| 06.00 | 24 |\\n| 09.00 | 28 |\\n| 12.00 | 32 |\\nPernyataan yang sesuai dengan grafik adalah ....". Siswa hanya melihat grafiknya (tabelnya tidak tampil), jadi kalimat soal menyebut "grafik", bukan "tabel". Jangan menggambar grafik dengan huruf/simbol, dan jangan mendeskripsikan grafik dengan kata bila datanya bisa ditulis begini. Boleh di "pertanyaan", "wacana", dan "pembahasan"; JANGAN di "pilihan", "pernyataan", atau soal MJ. Untuk soal C3 ke atas, kunci TIDAK boleh terbaca langsung dari satu titik/batang tanpa diolah (membandingkan, menghitung selisih/kenaikan, menyimpulkan kecenderungan). Tidak wajib: pakai bila data angka memang lebih jelas sebagai grafik. TETAPI bila materi membahas cara membaca suatu grafik (histogram, piramida penduduk, diagram pencar/korelasi, grafik garis/batang/lingkaran), soal tentang materi itu WAJIB menampilkan grafiknya dengan penanda ini (data dibuat konsisten dengan materi), bukan mendeskripsikan bentuknya dengan kata ("alas lebar, puncak runcing").
- BAGAN: urutan atau hubungan yang lebih jelas dilihat sebagai bagan digambar aplikasi dari tabel, sama dengan GRAFIK (tabel sesuai aturan TABEL + SATU baris penanda tepat di atas baris judul tabel; baris judul kolom tidak digambar): "[[BAGAN waktu: judul]]" = garis waktu, tepat 2 kolom (waktu | peristiwa), 2–10 baris, urut dari yang paling awal; "[[BAGAN alur: judul]]" = diagram alir/tahapan berpanah dari atas ke bawah, 1 kolom langkah, 2–8 baris (juga rantai sanad: nama perawi saja, tanpa matan); "[[BAGAN siklus: judul]]" = tahapan melingkar (daur), 1 kolom, 3–8 baris, tahap terakhir kembali ke tahap pertama; "[[BAGAN pohon: judul]]" = klasifikasi, struktur organisasi, peta konsep, pembagian, tepat 2 kolom (nama | induk; induk = nama kotak lain yang SAMA PERSIS, induk kotak puncak dikosongkan "|  |", tepat satu puncak), 2–15 kotak, maks 4 tingkat. Contoh: "Perhatikan bagan berikut!\\n[[BAGAN pohon: Pembagian Kalimat]]\\n| Bagian | Induk |\\n|---|---|\\n| Kalimat |  |\\n| Isim | Kalimat |\\n| Fi'il | Kalimat |\\n| Huruf | Kalimat |\\nCiri bagian yang ditandai ....". Isi kotak singkat (peristiwa maks 120 huruf, langkah 80, tahap siklus 50, nama 40). Bagan TANPA huruf Arab (tulis Latin, mis. "Isim"). Kalimat soal menyebut "bagan", bukan "tabel". Untuk soal urutan (C2 ke atas), boleh mengosongkan satu kotak dengan "...." lalu menanyakan isinya, atau menanyakan langkah/peristiwa sebelum/sesudah; kunci TIDAK boleh terbaca langsung dari bagan tanpa diolah untuk C3 ke atas. Boleh di "pertanyaan", "wacana", dan "pembahasan"; JANGAN di "pilihan", "pernyataan", atau soal MJ. Bila materi membahas urutan peristiwa, tahapan/tata cara, daur, atau klasifikasi/pembagian, soal tentang itu memakai bagan ini, bukan daftar kalimat.
- GEOMETRI: bidang koordinat dan garis bilangan digambar aplikasi dari tabel TEPAT 3 kolom "| Jenis | Isi | Label |" (aturan TABEL) + SATU baris penanda tepat di atas baris judul tabel; baris judul kolom tidak digambar; satu baris = satu benda. "[[GEOMETRI koordinat: judul]]" untuk grafik fungsi (linear, kuadrat), persamaan garis & gradien, titik koordinat, vektor, program linear (daerah penyelesaian), kurva permintaan–penawaran, grafik gerak v–t/s–t. Jenis benda: "titik" isi "(4, 6)"; "titik bantu" = titik + garis putus-putus ke kedua sumbu (mis. titik keseimbangan); "garis" = garis lurus melalui TEPAT DUA titik "(0, 10) (10, 0)", digambar sampai tepi; "ruas" = garis patah melalui 2–12 titik berurutan "(0, 0) (2, 10) (6, 10) (8, 0)" (grafik v–t, s–t); "kurva" isi rumus "y = x^2 - 2x - 3" (pangkat ^, kali boleh tanpa tanda, tanpa "$"; peubah x atau huruf nama sumbu mendatar, mis. "v = 2t"); "panah" = vektor dari titik pertama ke titik kedua; "daerah" = segi banyak berarsir, titik pojok berurutan "(0, 0) (6, 0) (4, 2) (0, 4)"; "sumbu x" / "sumbu y" isi nama sumbu (mis. "Q", "P", "t (s)", "v (m/s)") dengan kolom Label = rentang "0..10" (boleh kosong: rentang otomatis memuat semua titik & titik asal). Desimal di dalam kurung pakai titik koma: "(2,5; 3)". Label = nama singkat (A, P, D, S, E, a, b, HP; maks 20 huruf) atau kosong. "[[GEOMETRI bilangan: judul]]" = garis bilangan (pertidaksamaan, himpunan penyelesaian): "titik" isi "3" = bulat penuh (termasuk), "titik kosong" isi "-1" = bulat kosong (tidak termasuk), "daerah" isi "-1..3", "2.." (ke kanan tak hingga), atau "..0" (ke kiri tak hingga), "rentang" isi "-3..5" = angka yang tampil (boleh tidak ditulis). Contoh: "Perhatikan grafik fungsi kuadrat berikut!\\n[[GEOMETRI koordinat: Grafik fungsi f]]\\n| Jenis | Isi | Label |\\n|---|---|---|\\n| kurva | y = x^2 - 2x - 3 | f |\\n| sumbu x | x | -3..5 |\\n| titik | (1, -4) | P |\\nKoordinat titik balik P adalah ....". Semua angka WAJIB dihitung dan konsisten dengan soal, kunci, dan pembahasan: titik potong, titik puncak, titik keseimbangan, dan titik pojok daerah benar-benar terletak pada garis/kurvanya. Gambar TIDAK boleh menuliskan jawaban yang ditanyakan (bila yang ditanya koordinat P, label cukup "P"; bila yang ditanya persamaan garis, jangan tulis persamaannya). Tanpa huruf Arab. Kalimat soal menyebut "grafik", "gambar", atau "garis bilangan", bukan "tabel". Boleh di "pertanyaan", "wacana", dan "pembahasan"; JANGAN di "pilihan", "pernyataan", atau soal MJ. Bila materi membahas grafik fungsi, persamaan garis, vektor, program linear, permintaan–penawaran, grafik gerak, atau pertidaksamaan, soal yang meminta siswa membaca/menafsirkan grafiknya memakai gambar ini, bukan deskripsi kata. BANGUN DATAR & SUDUT (aturan GEOMETRI juga, tetapi tabel TEPAT 2 kolom "| Bagian | Isi |", satu tabel = satu bangun): "[[GEOMETRI datar: judul]]" dengan baris "bangun" = segitiga, segitiga siku-siku, segitiga sama kaki, segitiga sama sisi, persegi, persegi panjang, jajargenjang, trapesium, trapesium siku-siku, trapesium sama kaki, belah ketupat, layang-layang, atau lingkaran; lalu ukuran: sisi/diagonal dengan nama dua titik "| AB | 8 cm |", "| AC | ? |", sudut "| sudut B | 90° |" (atau "siku-siku"), "| tinggi | 4 cm |" (segitiga, jajargenjang, trapesium), lingkaran "| jari-jari | 7 cm |", "| diameter | 14 cm |", "| juring | 60° |" (pilih juring ATAU diameter; sudut keliling, tali busur, dan garis singgung BELUM bisa digambar, jadi soal seperti itu dijelaskan dengan kata tanpa penanda). Titik A, B, C, D urut berlawanan arah jarum jam mulai kiri bawah (segitiga: AB alas, C puncak; trapesium: AB alas bawah, CD alas atas; belah ketupat & layang-layang: A kiri, B bawah, C kanan, D atas, AC diagonal mendatar); nama lain lewat "| titik | P, Q, R |" (huruf kelima = titik potong diagonal). "[[GEOMETRI sudut: judul]]" dengan baris "bentuk" = sudut (titik A, B, C; "| sudut B | 50° |"), berpelurus ("sudut 1", "sudut 2"), berpenyiku, bertolak belakang ("sudut 1"–"sudut 4": 1 kanan atas, 2 kiri atas, 3 kiri bawah, 4 kanan bawah), atau sejajar (dua garis sejajar dipotong garis lain: "sudut A1"–"sudut A4" di perpotongan atas, "sudut B1"–"sudut B4" di bawah, nomor seperti bertolak belakang; maka SAMA BESAR: A1 = A3 = B1 = B3 dan A2 = A4 = B2 = B4, sedangkan A1 + A2 = 180°. Pasangan: sehadap A1–B1, A2–B2, A3–B3, A4–B4; dalam berseberangan A3–B1, A4–B2; luar berseberangan A1–B3, A2–B4; dalam sepihak A3–B2, A4–B1 (jumlah 180°); luar sepihak A1–B4, A2–B3 (jumlah 180°)). Ukuran boleh bentuk aljabar ("2x + 10°"). Contoh: "Perhatikan gambar segitiga berikut!\\n[[GEOMETRI datar: Segitiga ABC]]\\n| Bagian | Isi |\\n|---|---|\\n| bangun | segitiga siku-siku |\\n| sudut B | siku-siku |\\n| AB | 8 cm |\\n| BC | 6 cm |\\n| AC | ? |\\nPanjang AC adalah ....". Aplikasi menggambar sesuai ukuran dan MENOLAK ukuran yang tidak cocok (Pythagoras, jumlah sudut 180°, aturan sinus/cosinus, sudut pada garis sejajar), jadi hitung semua ukuran dengan benar; ukuran yang ditanyakan ditulis "?" atau "x", bukan jawabannya. Bila materi membahas bangun datar (keliling, luas, Pythagoras), trigonometri segitiga, lingkaran (jari-jari, busur, juring), atau hubungan antarsudut, soal yang menanyakan ukuran suatu bangun/sudut menampilkan bangunnya dengan penanda ini, bukan hanya kalimat "Sebuah segitiga ABC ...". BANGUN RUANG: "[[GEOMETRI ruang: judul]]", tabel 2 kolom yang sama, baris "bangun" = kubus, balok, prisma segitiga, limas segiempat, limas segitiga, tabung, kerucut, atau bola. Nama titik baku: kubus/balok ABCD.EFGH (ABCD alas: A kiri depan, B kanan depan, C kanan belakang, D kiri belakang; E di atas A, F di atas B, dst.), prisma ABC.DEF (D di atas A), limas T.ABCD / T.ABC (T puncak); nama lain lewat "| titik | PQRS.TUVW |". Ukuran: rusuk/garis dengan nama dua titik "| AB | 8 cm |", diagonal "| AG | ? |" (garis yang bukan rusuk ikut digambar), kubus "| rusuk | 6 cm |", "| tinggi | 9 cm |" (limas: tinggi dari puncak ke alas), tabung/kerucut/bola: "| jari-jari | 7 cm |", "| diameter | 14 cm |", "| tinggi | 10 cm |", kerucut "| garis pelukis | 10 cm |". Titik tengah rusuk untuk soal jarak dimensi tiga: "| titik P | tengah EH |" lalu "| AP | ? |". Contoh: "Perhatikan kubus berikut!\\n[[GEOMETRI ruang: Kubus ABCD.EFGH]]\\n| Bagian | Isi |\\n|---|---|\\n| bangun | kubus |\\n| rusuk | 6 cm |\\n| titik P | tengah EH |\\n| AP | ? |\\nJarak titik A ke titik P adalah ....". Aplikasi menghitung jarak 3D dan MENOLAK ukuran yang tidak cocok (diagonal ruang, rusuk tegak limas, garis pelukis = Pythagoras), jadi angka yang tidak bulat (6√2) tulis sebagai label saja atau "?". Bila materi membahas bangun ruang (luas permukaan, volume) atau jarak/diagonal pada dimensi tiga, soal tentang ukuran bangun memakai penanda ini. Baris kisi-kisi yang stimulusnya ditulis "geometri ..." WAJIB ditulis dengan penanda GEOMETRI jenis itu (cerita boleh tetap ada, mis. "Sebuah topi berbentuk kerucut ... Perhatikan gambar berikut!").
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
{"soal":[{"bentuk":"PG","dalil_id":null,${adaDalil ? '"dalil_tampil":null,"dalil_potong":null,"dalil_pengecoh":null,' : ""}${adaGambar ? '"gambar_id":null,' : ""}"pertanyaan":"...","langkah":"...","jawaban_benar":"...","pilihan":["...","...","...","...","..."],"kunci":"B","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}]}
${formatBsMj(tka)}
Untuk ISIAN: {"bentuk":"ISIAN","dalil_id":null,"pertanyaan":"Kata yang menunjukkan tempat adalah ....","kunci":"mahall","kunciAlt":[],"pembahasan":"...","level":"C1","tp":"TP 3.2","skor":1}
Untuk URAIAN tambahkan "rubrik", setiap kriteria menyebut skor penuh DAN skor sebagian dengan skala yang SAMA dengan "skor" kriteria itu; contoh bila jumlah skor rubrik 5: [{"kriteria":"Menyebut tiga syarat sah salat Jumat (3 = tiga benar; 2 = dua benar; 1 = satu benar; 0 = tidak ada yang benar)","skor":3},{"kriteria":"Menjelaskan alasan dengan tepat (2 = alasan tepat dan lengkap; 1 = alasan kurang lengkap; 0 = salah atau kosong)","skor":2}]. "tp" diisi kode TP yang paling sesuai.

DATA BAB
Mata pelajaran: ${mapel}, kelas ${kelas}
Judul: ${bab.judul}

Tujuan Pembelajaran:
${bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n")}
${adaDalil ? `\nDalil:\n${dalil}\n` : ""}${adaGambar ? `\nGambar materi (gambarnya dikirim bersama permintaan bila diperlukan; keterangan dari guru):\n${bab.gambar!.map((g) => `[gambar_id: ${g.id}] ${g.keterangan || "(tanpa keterangan: lihat gambarnya)"}`).join("\n")}\n` : ""}${bab.pokok?.length ? `\nPokok materi (sebar soal ke semua pokok ini):\n${bab.pokok.map((p) => `- ${p}`).join("\n")}\n` : ""}
Materi:
${bab.materi.join("\n")}`;
}

/**
 * Analisa materi baru dari halaman utama: judul, TP (disalin dari teks; usulan AI hanya bila teks tanpa TP, dan
 * wajib dicentang guru: RUJUKAN.md D), pokok materi, dan sumber/terjemah dalil yang tertulis di teks. Hasil dicek lagi oleh terapkanAnalisa (src/lib/materi.ts): yang tidak tertulis di teks guru dibuang.
 */
export function buatAnalisaMateri(mapel: string, kelas: string, teks: string, bahasaArab: boolean, jumlahGambar = 0) {
  const sistem = `Anda membantu guru ${mapel} kelas ${kelas} madrasah aliyah (kurikulum Kemenag) menyiapkan materi untuk menyusun soal.
Bekerja HANYA dari TEKS MATERI yang diberikan guru. Jangan menambah fakta dari luar teks.
${bahasaArab ? "Kosakata/kalimat Arab dari teks boleh disebut, tetapi jangan menulis ayat Al-Qur'an atau hadis." : "Jangan menulis huruf Arab, ayat, atau hadis sama sekali; sebut lafaz dengan transliterasi Latin bila perlu."}
Balas hanya JSON.`;
  const pengguna = `TEKS MATERI (paragraf bertanda [DALIL n] adalah ayat/hadis):
"""
${teks.replace(/"{3,}/g, '"')}
"""

Balas JSON {"judul":"...","tp":["..."],"pokok":["..."],"dalil":[{"no":1,"sumber":"...","terjemah":"..."}],${jumlahGambar ? '"gambar":[{"no":1,"pakai":true,"keterangan":"..."}],' : ""}"catatan":"..."}:
- "judul": judul bab/materi singkat (maks 10 kata); pakai judul yang tertulis di teks bila ada.
- "tp": bila teks memuat Tujuan Pembelajaran (TP) atau ATP, SALIN TP itu PERSIS kata per kata (jangan diperbaiki), satu TP per butir, beserta kodenya bila ada (mis. "TP 1.2: Peserta didik mampu ..."). Hanya bila teks TIDAK memuat TP: usulkan 3–6 TP gaya Kemenag, diawali "Peserta didik mampu ...", kata kerja operasional, sesuai isi teks, urut dari mudah ke sulit (guru akan membaca dan menyetujuinya).
- "pokok": 4–10 pokok materi yang bisa diuji (maks 15 kata per poin). Rumus ditulis seperti di teks, dalam LaTeX "$...$" (garis miring terbalik ditulis ganda di JSON), bukan dengan kata-kata.
- "dalil": untuk setiap [DALIL n]: "sumber" (mis. "HR. Bukhari dan Muslim") dan "terjemah" HANYA bila tertulis di teks di dekat dalil itu, disalin PERSIS kata per kata; kalau tidak tertulis, isi "". Jangan menerjemahkan sendiri.
${jumlahGambar ? `${ANALISA_GAMBAR}\n` : ""}- "catatan": satu kalimat bila teks terlalu sedikit atau kurang jelas untuk dibuat soal; selain itu "".`;
  return { sistem, pengguna };
}

/**
 * 0.31.0: AI membaca SATU halaman PDF dari fotonya (gambar halaman dikirim bersama pesan). Diuji 2026-11-11 pada buku
 * Al-Qur'an Hadis XI Kemenag (hlm 16, 21) dan modul IPA: cakupan kata 99–100%, rumus/tabel rapi, kotak gambar tepat.
 * Jawaban dirapikan rapikanBacaanHalaman (materi.ts); teks Arab tidak dipakai apa adanya (aturan 5).
 * `contekan` (0.33.2): teks lapisan PDF halaman itu (pangkat ditandai ^{...}), tanpa huruf Arab: minus di pangkat
 * kecil sering terlewat dari foto (Fisika X: 10^{-30} terbaca 10^{30}). Kosong untuk PDF hasil scan.
 */
export function buatBacaHalaman(contekan = "") {
  const sistem = "Anda menyalin isi SATU halaman buku/modul pelajaran madrasah dari gambar halaman, untuk diolah aplikasi pembuat soal. Balas hanya JSON.";
  const pengguna = `Salin isi halaman ini PERSIS, urut seperti dibaca (atas ke bawah; halaman dua kolom: kolom kiri dulu). Jangan meringkas, jangan menambah, jangan memperbaiki isi.
Abaikan kepala dan kaki halaman yang berulang (judul buku, nomor halaman) dan hiasan.
Balas JSON {"blok":[...]} berisi blok berurutan:
- {"jenis":"teks","isi":"..."}: satu judul, paragraf, atau butir daftar per blok (paragraf yang terpotong baris digabung). Rumus, pecahan, akar, pangkat, indeks, dan simbol matematika ditulis LaTeX diapit $...$ (di JSON garis miring terbalik ditulis ganda), mis. "$v_{t} = v_{0} + at$", "$\\\\frac{1}{2}$", "$\\\\sqrt{s}$".
- {"jenis":"tabel","baris":[["judul kolom",...],["sel",...],...]}: tabel, sel per sel (rumus di sel juga $...$).
- {"jenis":"arab","isi":"..."}: kutipan Arab panjang di luar tabel (ayat, hadis, doa), satu blok per kutipan, huruf dan harakat seperti terlihat.
- {"jenis":"gambar","kotak":[x0,y0,x1,y1],"keterangan":"...","pakai":true}: setiap gambar, diagram, grafik, foto, atau logo. "kotak" = batas gambar dalam skala 0–1000 terhadap lebar dan tinggi halaman (x0,y0 = kiri atas, x1,y1 = kanan bawah), mencakup label di dalam gambar tetapi tidak termasuk teks keterangan di bawahnya. "pakai": true bila isi pelajaran (diagram, skema, grafik, peta, foto objek/percobaan), false bila logo, kop, ikon, hiasan, atau latar. "keterangan": isi gambar maks 15 kata, diakhiri label penunjuk bagian yang tertulis di gambar ("berlabel A–E", "bernomor 1–5") atau "tanpa label".`;
  if (!contekan.trim()) return { sistem, pengguna };
  return {
    sistem,
    pengguna: `${pengguna}

TEKS LAPISAN PDF halaman ini (diambil langsung dari file; urutan dan spasinya bisa kacau; ^{...} = pangkat/superskrip, _{...} = indeks/subskrip; huruf Arab sengaja dibuang):
<<<
${contekan}
>>>
Isi dan urutan tetap disalin dari GAMBAR halaman. Teks lapisan ini HANYA untuk memastikan angka, tanda minus, pangkat, indeks, dan ejaan yang kecil atau kabur di gambar (mis. pangkat negatif: "10^{-30}" ditulis "$10^{-30}$", bukan "$10^{30}$"). Jangan menyalin bagian teks lapisan yang tidak tampak di gambar.`,
  };
}

// 0.30.0: AI menilai gambar file materi (pratinjau kecil dikirim bersama pesan, berlabel [GAMBAR n]).
const ANALISA_GAMBAR = `- "gambar": untuk SETIAP gambar yang dikirim (label [GAMBAR n]; di TEKS MATERI, [GAMBAR n] menandai letak gambar itu di materi): {"no":n,"pakai":...,"keterangan":"..."}.
  "pakai": true bila gambar adalah ISI PELAJARAN yang bisa dipakai sebagai stimulus soal: diagram, skema, bagan, grafik, tabel, peta, denah, rangkaian, bangun/rumus, atau foto objek, percobaan, peristiwa, tokoh, atau tempat yang dibahas materi. false bila BUKAN isi pelajaran: logo, kop, lambang sekolah/instansi, ikon, bingkai, latar, garis hias, stiker/kartun/emoji yang tidak menjelaskan apa pun, foto sampul atau penulis, kode QR, tangkapan layar menu/tombol, atau gambar yang sama sekali tidak berhubungan dengan materi.
  "keterangan": isi gambar dalam maks 15 kata, menyebut warna penting yang tampak, dan DIAKHIRI label penunjuk bagian yang benar-benar tertulis di gambar ("berlabel A–E", "bernomor 1–5") atau "tanpa label" bila tidak ada nomor/huruf penunjuk (mis. "Struktur sel hewan, berlabel A–E"; "Grafik kecepatan terhadap waktu benda P dan Q, berlabel P dan Q"; "Model membran sel berwarna, tanpa label"). Jangan menebak label yang tidak terbaca. Gambar bertanda "(ditempel guru)" selalu "pakai": true. Jangan menulis huruf Arab, ayat, atau hadis di keterangan; teks Arab di gambar cukup disebut "tulisan Arab".`;

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
- PGK (pilihan ganda kompleks, model jawaban ganda/MCMA): 5 pilihan, lebih dari satu benar tetapi tidak semua. Jumlah jawaban benar WAJIB sama dengan "Jumlah jawaban benar" di baris kisi-kisinya (bila tidak tertulis: 2). Setiap pilihan satu pernyataan utuh; JANGAN pilihan gabungan seperti "(2) dan (3)" atau "1, 2, dan 4". "kunci": array huruf jawaban benar, sebanyak jumlah itu. Akhiri pertanyaan dengan "(Pilih semua jawaban yang tepat)" tanpa menyebut jumlah jawaban benar.
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
export function rencanaGrup(jumlah: Record<Bentuk, number>, boleh = (b: Bentuk) => b !== "URAIAN", [kecil, besar]: [number, number] = [2, 3], diminta = false): (number | null)[] {
  const hasil: (number | null)[] = [];
  let nomor = 0;
  for (const b of urutanBentuk(jumlah)) {
    const n = jumlah[b];
    // Separuh nomor; permintaan guru (0.47.0) menjamin minimal satu grup sebesar permintaannya bila soalnya cukup.
    let sisa = boleh(b) ? Math.max(Math.floor(n / 2), diminta ? Math.min(n, kecil) : 0) : 0;
    if (sisa < Math.min(kecil, diminta ? n : kecil) || sisa < 2) sisa = 0;
    // Dibagi rata ke sesedikit mungkin grup (tiap grup ≤ besar); grup yang lebih besar di depan.
    let k = Math.ceil(sisa / besar);
    if (k && Math.floor(sisa / k) < kecil) k = Math.max(1, Math.floor(sisa / kecil));
    const ukuran = Array.from({ length: k }, (_, i) => Math.min(besar, Math.floor(sisa / k) + (i < sisa % k ? 1 : 0)));
    const tunggal = n - ukuran.reduce((a, c) => a + c, 0);
    hasil.push(...Array<null>(tunggal).fill(null));
    for (const u of ukuran) hasil.push(...Array<number>(u).fill(++nomor));
  }
  return hasil;
}

/**
 * Rencana soal grup satu set: Latihan TKA (semua bentuk), atau Bahasa Indonesia jenis lain (0.39.0): PG saja, karena
 * B/S gaya lama & menjodohkan (blok MJ) memakai nomor grup untuk hal lain. Selain itu semua soal tunggal.
 */
/**
 * Nomor berdalil dan cara tampilnya, ditentukan APLIKASI (0.42.0, ATURAN-SOAL 5a): dulu AI menempelkan dalil ke soal
 * mana saja ("sebar ke semua dalil", set 141: 14 dari 45 soal, sebagian tidak membahasnya). Porsi dari Lanjutan, dihitung
 * dari nomor non-menjodohkan, maks 3 nomor per dalil, tersebar merata; cara tampil digilir (CARA_DALIL), cara yang tidak
 * bisa dipakai materi ini (tanpa terjemah sama sekali, tanpa ayat) dilewati. Set lama tanpa porsi: tanpa rencana (null semua).
 */
/** Nomor (indeks) BERGAMBAR rencana aplikasi (0.33.3): 1 per 5 soal yang bisa bergambar, maks jumlah gambar, tersebar. */
export function nomorBergambar(p: Pengaturan, bab?: Pick<Bab, "gambar">): Set<number> {
  const bentukNo = urutanBentuk(p.jumlah).flatMap((b) => Array<Bentuk>(p.jumlah[b]).fill(b));
  const bisaGambar = bentukNo.flatMap((b, i) => (b === "MJ" || (b === "BS" && p.tujuan !== TKA) ? [] : [i]));
  const jatahGambar = bab?.gambar?.length ? Math.min(bab.gambar.length, Math.ceil(bisaGambar.length / 5)) : 0;
  return new Set(Array.from({ length: jatahGambar }, (_, k) => bisaGambar[Math.floor(((k + 0.5) * bisaGambar.length) / jatahGambar)]));
}

export function rencanaDalil(p: Pengaturan, bab?: Pick<Bab, "dalil" | "gambar" | "mapel">): (CaraDalil | null)[] {
  const bentukNo = urutanBentuk(p.jumlah).flatMap((b) => Array<Bentuk>(p.jumlah[b]).fill(b));
  const hasil: (CaraDalil | null)[] = bentukNo.map(() => null);
  const dalil = (bab?.dalil ?? []).filter((d) => !bukanDalil(d));
  const hafalan = mapelHafalan(bab?.mapel);
  const porsi = p.porsiDalil ? (hafalan ? PORSI_HADIS : PORSI_DALIL)[p.porsiDalil] : 0;
  if (!dalil.length || !porsi) return hasil;
  // 0.43.0: nomor BERGAMBAR tidak dijatah dalil (set 149: "Perhatikan gambar berikut! Lengkapilah potongan ayat ...").
  const bergambar = nomorBergambar(p, bab);
  const bisa = bentukNo.flatMap((b, i) => (b === "MJ" || bergambar.has(i) ? [] : [i]));
  const n = Math.min(bisa.length, dalil.length * (hafalan ? MAKS_PER_HADIS : MAKS_PER_DALIL), Math.max(1, Math.round(bisa.length * porsi)));
  // Cara yang bisa dipakai paling tidak oleh satu dalil materi ini (terjemah ada, ayat ada, cukup panjang, ...).
  const cara = (hafalan ? CARA_HADIS : CARA_DALIL.filter((c) => c !== "garis")).filter((c) => dalil.some((d) => cocokCara(c, d)));
  if (!cara.length) return hasil;
  // 0.43.0: cara PG (rumpang, pilihan, urutan) hanya untuk nomor PG; nomor lain mengambil cara berikutnya di giliran.
  let giliran = 0;
  for (let k = 0; k < n; k++) {
    const i = bisa[Math.floor(((k + 0.5) * bisa.length) / n)];
    for (let t = 0; t < cara.length; t++) {
      const c = cara[(giliran + t) % cara.length];
      if (caraBolehBentuk(c, bentukNo[i])) {
        hasil[i] = c;
        giliran = (giliran + t + 1) % cara.length;
        break;
      }
    }
  }
  // 0.44.0 (tahap 3): porsi sedang/banyak + menjodohkan gaya lama → blok MJ pertama = "lafaz dalil ↔ artinya" (sisip),
  // asal ada dalil yang cukup panjang (min. 2 kata per nomor blok) dan berterjemah (lajur kanan = potongan terjemah).
  const blok = p.tujuan !== TKA ? blokMj(p.jumlah.MJ ?? 0)[0] ?? 0 : 0;
  const cukup = dalil.some((d) => d.terjemah?.trim() && kataArab(d).length >= blok * 2);
  if (porsi >= PORSI_DALIL.sedang && blok && cukup) bentukNo.forEach((b, i) => b === "MJ" && i < bentukNo.indexOf("MJ") + blok && (hasil[i] = "sisip"));
  return hasil;
}

/** Penjelasan cara tampil dalil untuk AI (instruksi sistem, bila materi punya dalil). */
const caraDalilAi = (tka: boolean) => `CARA MENAMPILKAN DALIL ("dalil_tampil"). Aplikasi yang menampilkan teks Arab/terjemahnya dari data terverifikasi, TEPAT DI BAWAH teks "pertanyaan" (sebelum pilihan); AI TIDAK mengetiknya. Jadi rujuk dalil dengan "berikut", bukan "tersebut" atau "di atas", misalnya "Perhatikan firman Allah Swt. berikut!" di baris pertama lalu perintah soalnya:
- "utuh": teks Arab + terjemah. Untuk soal isi kandungan, pesan, atau perilaku yang sesuai dalil. Pengantar misalnya "Perhatikan firman Allah Swt. berikut!".
- "arab": teks Arab saja (terjemah TIDAK tampil). Untuk soal menentukan surah/ayat atau perawi, lafaz, arti kata, hukum bacaan, atau isi yang sudah dipelajari. Jangan menulis "terjemah tersebut".
- "terjemah": terjemah saja (Arab tidak tampil). Untuk soal pemahaman makna. Pengantar misalnya "Perhatikan terjemah hadis berikut!".
- "potong": potongan teks Arab. Isi "dalil_potong": [nomor kata awal, nomor kata akhir] dari "Kata Arab bernomor" dalil itu (satu kata = soal arti kosakata/mufradat). Untuk arti kata/frasa, lafaz kunci, atau kelanjutan ayat. Pengantar misalnya "Perhatikan potongan ayat berikut!".
- "potong-terjemah": potongan terjemah. Isi "dalil_potong" dari "Kata terjemah bernomor". Untuk makna frasa tertentu.
- "rumpang" (PG saja): aplikasi menampilkan teks Arab dalil dengan kata ke-a sampai ke-b ("dalil_potong") DIKOSONGKAN, dan MENYUSUN SENDIRI pilihan A–E (kunci = bagian yang dikosongkan). Pilih bagian 1–4 kata yang bermakna. Isi "dalil_pengecoh": 4 potongan lain sepanjang kunci dari "Kata Arab bernomor" (dari dalil yang sama atau dalil lain, BUKAN bagian yang dikosongkan), bentuknya [{"dalil_id":"...","potong":[a,b]}]. Isi "pilihan": [] dan "kunci": "A" (aplikasi yang mengisi). Pengantar misalnya "Lengkapilah potongan ayat berikut!".
- "rumpang-terjemah" (PG saja): sama dengan "rumpang", tetapi yang dikosongkan dan pilihannya potongan TERJEMAH ("Kata terjemah bernomor"). Misalnya "Lengkapilah terjemah hadis berikut!".
- "pilihan" (PG saja): TIDAK ada kotak dalil, jadi JANGAN menulis "Perhatikan firman/ayat/hadis berikut"; pilihan A–E berupa potongan teks Arab yang disusun aplikasi: kunci = "dalil_potong", pengecoh = "dalil_pengecoh" (seperti "rumpang"). Soal misalnya "Lafaz yang berisi perintah menunaikan zakat adalah ....". "pilihan": [], "kunci": "A".
- "pilihan-terjemah" (PG saja): seperti "pilihan", tetapi pilihannya potongan terjemah. Misalnya "Terjemah lafaz ... yang tepat adalah ....".
- "urutan" (PG saja): aplikasi memotong kata ke-a sampai ke-b ("dalil_potong"; null = seluruh dalil, minimal 4 kata) menjadi 3–4 bagian bernomor yang diacak, lalu menyusun pilihan urutannya. Soal misalnya "Susunan potongan ayat berikut yang benar adalah ....". "pilihan": [], "kunci": "A".
- Pada rumpang/pilihan/urutan/garis "dalil_potong" WAJIB diisi (kecuali urutan seluruh dalil), juga pada permintaan memperbaiki atau mengubah soal. Pembahasan menyebut isi jawaban yang benar (lafaz dan artinya) tanpa menyebut huruf pilihan; jangan mengetik ulang teks Arab panjang.
- "sisip" (semua bentuk): TIDAK ada kotak dalil; potongan dalil DISISIPKAN di dalam teks soal dengan KODE yang diganti aplikasi dengan teks asli: [[A a-b]] = kata Arab ke-a sampai ke-b dalil soal itu, [[T a-b]] = kata terjemah ke-a sampai ke-b ("Kata Arab bernomor" / "Kata terjemah bernomor"); dalil lain: [[dalil_id A a-b]]. Kode boleh di "pertanyaan", "pernyataan", "pilihan"${tka ? "" : ', "jodoh", dan "kunci" isian'}. Contoh benar/salah: "Lafaz [[A 3-4]] berisi perintah menunaikan zakat."; PG kompleks: pilihan berupa kode lafaz yang berbeda-beda${tka ? "" : '; menjodohkan: "pertanyaan": "[[A 3-4]]", "jodoh": "[[T 4-5]]" (arti lafaz itu dari terjemahnya); isian: "Lanjutan lafaz [[A 1-2]] adalah ....", "kunci": "[[A 3-4]]"'}. Jangan mengetik huruf Arab ayat/hadis sendiri.
- "garis" (garis bawah; bukan PG kompleks): aplikasi menampilkan teks Arab dalil UTUH dengan kata ke-a sampai ke-b ("dalil_potong", dari "Kata Arab bernomor") BERGARIS BAWAH; terjemahnya TIDAK tampil. Untuk soal menerjemahkan/arti lafaz yang bergaris bawah. Pilih 1–6 kata yang bermakna, BUKAN seluruh dalil. Pertanyaan WAJIB menyebut "bergaris bawah", misalnya "Terjemah lafaz yang bergaris bawah pada hadis berikut adalah ....". Jawaban benar diambil dari terjemah dalil itu dengan kode [[T a-b]] ("Kata terjemah bernomor" yang berarti lafaz bergaris bawah): PG = pilihan A–E berupa kode [[T a-b]] (kunci = terjemah lafaz bergaris bawah; pengecoh = potongan terjemah lain sepanjang kunci dari dalil yang sama, atau [[dalil_id T a-b]] dari dalil lain); isian = "kunci": "[[T a-b]]"; uraian = jawaban ideal memuat [[T a-b]].
- "rujukan" (ayat saja): tidak ada teks yang tampil; soal MENYEBUT sumbernya di kalimat, persis seperti di DATA BAB, misalnya "Isi kandungan QS. Al-Baqarah [2]: 43 adalah ....". Jangan menulis "ayat berikut", dan jangan menuliskan isi atau terjemah ayatnya (isinya justru yang ditanyakan).
- "pembahasan": dalil TIDAK tampil di soal. Tulis soal biasa tanpa menyuruh memperhatikan ayat/hadis; pembahasan memakai dalil itu sebagai penguat kunci (aplikasi menampilkannya di kunci & pembahasan).
- Dalil hanya dipakai bila soal BENAR-BENAR membahasnya: pertanyaan menyebut firman/ayat/hadis/lafaz/terjemah/sumbernya. Soal tanpa dalil: "dalil_id": null, "dalil_tampil": null, dan jangan menulis "perhatikan firman/hadis berikut".
- Bila jawabannya nama surah/ayat atau perawi, aplikasi menyembunyikan sumber di bawah dalil; jangan menulis sumbernya di pertanyaan.
- Pada set dengan kisi-kisi, dalil dan cara tampil setiap nomor sudah ditentukan barisnya. Pada permintaan mengubah soal, guru boleh meminta dalil atau cara tampil lain (misalnya "tampilkan artinya saja" = "terjemah", "pakai potongan ayatnya" = "potong", "jadikan soal melengkapi ayat" = "rumpang", "ayatnya di pilihan jawaban" = "pilihan", "soal menyusun urutan ayat" = "urutan"; tiga yang terakhir hanya untuk PG).`;

export function grupSet(p: Pengaturan, mapel = ""): (number | null)[] {
  const minta = ukuranDiminta(p.catatan);
  if (p.tujuan === TKA) return rencanaGrup(p.jumlah, undefined, minta ?? undefined, !!minta);
  return MAPEL_BACAAN.test(mapel) ? rencanaGrup(p.jumlah, (b) => b === "PG", minta ?? [3, 5], !!minta) : [];
}

/** Batas soal per wacana: lebih dari ini teks terlalu panjang & tidak muat satu tahap (MAKS_PER_TAHAP). */
export const MAKS_GRUP = 10;
const KATA_TEKS = "cerita|teks|text|bacaan|wacana|passage|story|reading|nash|nas|qira'?ah|qiro'?ah";
const ANGKA_GRUP = String.raw`(\d{1,2})(?:\s*(?:-|–|—|sampai|s\.?\s?d\.?|hingga|to)\s*(\d{1,2}))?\s*(?:soal|pertanyaan|nomor|butir|questions?)`;
const POLA_GRUP = [
  // "1 cerita untuk 5-7 soal", "satu teks untuk 6 soal", "tiap bacaan 5 soal"
  // Diawali "satu/1/tiap": "buat teks narrative, 20 soal" = jumlah soal seluruhnya, bukan ukuran grup.
  new RegExp(String.raw`(?<![\p{L}\d])(?:satu|1|one|a|tiap|setiap|each|per)\s+(?:${KATA_TEKS})(?![\p{L}])[^\d\n]{0,20}?${ANGKA_GRUP}`, "iu"),
  // "5-7 soal per cerita", "5 soal dari satu teks" (kata sambung wajib: "5 soal cerita" = soal cerita biasa)
  new RegExp(String.raw`(?<![\d])${ANGKA_GRUP}\s+(?:per|untuk|tiap|setiap|dari|for|from|each)\s+(?:satu\s+|1\s+|one\s+|a\s+|each\s+)?(?:${KATA_TEKS})(?![\p{L}])`, "iu"),
];
/**
 * Ukuran soal grup yang diminta guru di catatan (0.47.0): "1 cerita untuk 5-7 soal" → [5, 7]. Dibaca APLIKASI, bukan
 * dititipkan ke AI (permintaan jumlah seperti "minimal N" tidak dituruti AI, lihat nomor BERGAMBAR 0.33.3).
 */
export function ukuranDiminta(catatan = ""): [number, number] | null {
  for (const pola of POLA_GRUP) {
    const m = catatan.match(pola);
    if (!m) continue;
    const [a, b] = [Number(m[1]), Number(m[2] ?? m[1])].sort((x, y) => x - y).map((x) => Math.min(MAKS_GRUP, x));
    if (a >= 2) return [a, b];
  }
  return null;
}

/**
 * Jumlah jawaban benar tiap soal PGK, ditentukan APLIKASI dan dicatat di kisi-kisi (`kunciPgk`), karena AI tidak
 * meragamkannya sendiri (uji set 81: keempat PGK berkunci 2 walau diminta 2–4). TKA 2–4 (contoh resmi), jenis lain
 * tepat 2 (17 Nov 2026, pilihan pemilik; dulu 2–3).
 */
export function pasangKunciPgk<T extends { bentuk: Bentuk; grup?: number | null; tp?: string; materi?: string; indikator?: string }>(kisi: T[], tka: boolean, acak: () => number = Math.random): (T & { kunciPgk?: number; jumlahPernyataan?: number; kunciBs?: string })[] {
  const pola = tka ? [2, 3, 4] : [2];
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
export function buatPermintaanKisi(p: Pengaturan, bab?: Pick<Bab, "teksArab" | "gambar" | "mapel" | "dalil">) {
  const adaGambar = !!bab?.gambar?.length;
  // Mode "bahasa" (Bahasa Arab): kosakata/kalimat Arab boleh ditulis; selain itu semua Arab ditulis dengan transliterasi.
  const tanpaArab = bab?.teksArab !== "bahasa";
  const urutan = urutanBentuk(p.jumlah);
  const total = urutan.reduce((n, b) => n + p.jumlah[b], 0);
  // Rencana per nomor, diringkas jadi rentang: "Nomor 1–6: PG, LOTS (C1–C2)".
  const bentukNo = urutan.flatMap((b) => Array<Bentuk>(p.jumlah[b]).fill(b));
  const kategori = rencanaLevelSet(p);
  const grup = grupSet(p, bab?.mapel);
  const adaGrup = p.tujuan === TKA || grup.some(Boolean);
  // Menjodohkan gaya lama: batas blok (blokMj, sama dengan pasangKunciPgk) diberitahukan sejak kisi-kisi, supaya AI
  // merencanakan satu jenis hubungan per blok (set 89: tanpa ini indikator nomor pertama blok hanya cukup untuk 1 pasangan).
  const blok: number[] = [];
  if (p.tujuan !== TKA) {
    const awalMj = bentukNo.indexOf("MJ");
    blokMj(p.jumlah.MJ ?? 0).forEach((n, b) => blok.push(...Array<number>(n).fill(b + 1)));
    blok.unshift(...Array<number>(Math.max(awalMj, 0)).fill(0));
  }
  // 0.33.3: nomor BERGAMBAR ditentukan aplikasi (1 per 5 soal yang bisa bergambar, maks jumlah gambar, tersebar merata). "Usahakan"
  // (set 127: 0 dari 10 gambar) dan "minimal N baris" (set 131–135: 2–6 dari jatah 5) tidak dituruti AI; nomor yang
  // ditandai dituruti seperti kategori level. Gambar mana & isi soalnya tetap dipilih AI.
  // MJ tidak bergambar; B/S gaya lama (satu pernyataan) jarang butuh gambar (set 138: gambar meridian, pernyataan soal kilogram).
  const bergambar = nomorBergambar(p, bab);
  const dalilNo = rencanaDalil(p, bab);
  const adaRencanaDalil = dalilNo.some(Boolean);
  const rentang: string[] = [];
  for (let i = 0; i < total; ) {
    let j = i;
    while (j + 1 < total && bentukNo[j + 1] === bentukNo[i] && kategori[j + 1] === kategori[i] && (grup[j + 1] ?? null) === (grup[i] ?? null) && (blok[j + 1] ?? 0) === (blok[i] ?? 0) && bergambar.has(j + 1) === bergambar.has(i) && dalilNo[j + 1] === dalilNo[i]) j++;
    rentang.push(`- Nomor ${i === j ? i + 1 : `${i + 1}–${j + 1}`}: ${bentukNo[i]}, ${kategori[i]} (${RENTANG[kategori[i]]})${grup[i] ? `, GRUP ${grup[i]}` : ""}${blok[i] ? `, BLOK MJ ${blok[i]}` : ""}${bergambar.has(i) ? ", BERGAMBAR" : ""}${dalilNo[i] ? `, DALIL (${dalilNo[i]})` : ""}`);
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
${adaRencanaDalil ? RENCANA_DALIL : '- "dalil_id": null (nomor yang dipakai dalil tidak direncanakan pada set ini; teks Arab materi yang bukan ayat/hadis boleh dipakai bila perlu).'}
${adaGambar ? `${RENCANA_GAMBAR}\n` : ""}- "stimulus": jenis stimulus + skenario singkat (maks 15 kata), atau "tanpa stimulus". Ikuti aturan STIMULUS: setiap skenario BERBEDA satu sama lain dalam seluruh kisi-kisi. Data angka yang akan digambar (aturan GRAFIK) ditulis dengan jenis grafiknya, mis. "grafik piramida: penduduk Desa Sukamaju 2025", "grafik histogram: nilai ulangan kelas X", "grafik pencar: jam belajar dan nilai"; bila materi membahas cara membaca grafik, nomor tentang itu (juga C1–C2, mis. menentukan tipe piramida) memakai stimulus grafik tersebut. Urutan/hubungan yang akan digambar (aturan BAGAN) ditulis dengan jenis bagannya, mis. "bagan waktu: perjalanan dakwah Rasulullah", "bagan alur: tata cara wudu", "bagan siklus: daur air", "bagan pohon: klasifikasi vertebrata"; jangan semua nomor berbagan, pilih yang memang tentang urutan, tahapan, daur, atau pembagian. Grafik fungsi, bidang koordinat, dan garis bilangan yang akan digambar (aturan GEOMETRI) ditulis "geometri koordinat: ..." atau "geometri bilangan: ...", mis. "geometri koordinat: kurva permintaan dan penawaran beras", "geometri koordinat: grafik v–t mobil", "geometri koordinat: daerah penyelesaian program linear", "geometri bilangan: penyelesaian pertidaksamaan"; nomor yang meminta siswa membaca/menafsirkan grafik fungsi, vektor, atau daerah penyelesaian memakai stimulus ini. Bangun dan sudut yang akan digambar ditulis "geometri datar: ..." atau "geometri sudut: ...", mis. "geometri datar: segitiga siku-siku ABC", "geometri datar: juring lingkaran", "geometri sudut: dua garis sejajar dipotong garis lain", "geometri ruang: kubus ABCD.EFGH, jarak A ke titik tengah EH", "geometri ruang: kerucut tumpeng".
Indikator antarbaris juga tidak boleh sama persis; ambil sisi materi yang berbeda${p.jumlah.MJ && p.tujuan !== TKA ? " (KECUALI baris MJ dalam BLOK MJ yang sama: lihat aturan MJ)" : ""}.
SATU KETERAMPILAN = SATU NOMOR: kata kerja + objek yang sama (misalnya "menghitung tingkat inflasi dari data IHK", "menyebutkan syarat mukjizat") hanya boleh dipakai SATU baris dalam seluruh kisi-kisi, lintas bentuk. Mengganti sinonim kata kerja ("menghitung" → "menyimpulkan ... dalam persen"), angka data, nama tokoh, atau kasusnya TIDAK membuatnya berbeda. Ambil keterampilan lain dari TP yang sama (misalnya menafsirkan hasil hitungan, menentukan penyebab, membandingkan, menggolongkan).${p.jumlah.URAIAN ? " Pengecualian: baris URAIAN boleh memperdalam keterampilan satu baris lain (langkah lengkap atau alasan), asalkan bukan pertanyaan yang sama." : ""}
${p.jumlah.ISIAN ? `${RENCANA_ISIAN}\n` : ""}${p.jumlah.MJ ? `${RENCANA_MJ}\n` : ""}${tanpaArab ? 'Di kisi-kisi JANGAN menulis huruf Arab sama sekali; sebut lafaz dengan transliterasi Latin (misalnya "lā taqrabū az-zinā").' : "Di kisi-kisi boleh menulis kosakata/kalimat Arab buatan sendiri, tetapi JANGAN menulis ayat atau hadis."}
${adaGrup ? `${soalGrup(grup)}${p.tujuan !== TKA ? ` ${wacanaMapel(bab?.mapel)}` : ""}${tanpaArab ? " Wacana tanpa huruf Arab." : " Wacana boleh berbahasa Arab, tetapi bukan ayat atau hadis."}\n` : ""}${p.catatan ? `${TANGGAPAN}\n` : ""}FORMAT JAWABAN untuk permintaan ini: hanya JSON {${p.catatan ? '"tanggapan":"...",' : ""}"kisi":[{"bentuk":"PG","tp":"TP 3.1","materi":"...","indikator":"...","level":"C2","dalil_id":null,${adaGambar ? '"gambar_id":null,' : ""}"stimulus":"tanpa stimulus"${adaGrup ? ',"grup":null' : ""}}${p.jumlah.ISIAN ? ',{"bentuk":"ISIAN",...,"jawaban":"..."}' : ""}]${adaGrup ? ',"wacana":[{"grup":1,"teks":"..."}]' : ""}}`;
}

// ATURAN-SOAL 5a (0.42.0): nomor berdalil & cara tampil ditentukan aplikasi (rencanaDalil); AI memilih dalilnya.
const RENCANA_DALIL = `- "dalil_id": nomor bertanda DALIL (cara tampil) WAJIB memakai satu dalil dari DATA BAB yang paling cocok dengan TP/materi baris itu. Sebar: setiap dalil dipakai dulu sebelum ada dalil yang dipakai lagi, dan dalil yang dipakai lagi memakai cara tampil berbeda. Nomor TANPA tanda DALIL: "dalil_id": null, dan indikator/stimulusnya tidak tentang ayat atau hadis. Nomor bertanda DALIL tidak memakai gambar ("gambar_id": null). BLOK MJ bertanda DALIL (sisip): semua barisnya "menjodohkan lafaz dalil dengan artinya" (indikator dan materi sama untuk satu blok); setiap baris memakai potongan lafaz yang berbeda (bukan kata yang sama dengan harakat lain), boleh dari dalil yang sama; "pertanyaan" baris itu cukup kode lafaznya, misalnya "[[A 3-4]]", dan "jodoh" potongan terjemah yang berarti lafaz itu. Indikator dan stimulus nomor berdalil sesuai cara tampilnya (lihat CARA MENAMPILKAN DALIL), misalnya "Disajikan potongan QS. ..., peserta didik dapat menentukan arti lafaz ...", "Disajikan terjemah hadis ..., peserta didik dapat ...", atau untuk "pembahasan": indikator biasa tanpa menyajikan dalil.`;

// ATURAN-SOAL.md bagian 4 no. 5 (0.30.0): gambar dari materi guru. Hanya dikirim bila bab punya gambar.
const ATURAN_GAMBAR = `- GAMBAR: DATA BAB memuat gambar materi (lihat "Gambar materi"; gambarnya dikirim bersama permintaan). Soal boleh memakai SATU gambar sebagai stimulus dengan mengisi "gambar_id"; aplikasi menampilkan gambar itu di bawah pokok soal, jadi tulis misalnya "Perhatikan gambar berikut!" lalu perintah/pertanyaannya. JANGAN menulis id gambar di teks. Soal bergambar harus benar-benar perlu melihat gambar untuk dijawab (menunjuk bagian berlabel, membaca grafik/diagram/peta, mengamati hasil percobaan), dan jawabannya sesuai yang TAMPAK di gambar: jangan mengarang bagian, label, angka, atau warna yang tidak ada di gambar. Gambar yang keterangannya "tanpa label" (atau tidak menyebut label): JANGAN menunjuk "nomor 1", "huruf D", "bagian berlabel X"; tanyakan keseluruhan gambar, atau tunjuk bagiannya lewat bentuk, warna, atau letak yang tampak (mis. "struktur berbentuk tabung biru yang menembus kedua lapisan"). Pokok soal tidak menjelaskan isi gambar sampai jawabannya terbaca tanpa melihat gambar. Teks Arab di dalam gambar jangan diketik ulang. Soal tanpa gambar: "gambar_id": null, dan jangan menulis "perhatikan gambar" (gambar lain tidak bisa ditampilkan).`;
const RENCANA_GAMBAR = `- "gambar_id": id gambar dari "Gambar materi" bila soal itu memakai gambar sebagai stimulus, atau null. Nomor bertanda BERGAMBAR WAJIB memakai gambar (gambar_id terisi): untuk setiap nomor itu pilih gambar yang paling cocok dengan TP-nya sebagai stimulus (diagram, skema, grafik, tabel, peta, foto objek atau percobaan), gambar berbeda-beda antarnomor; gambar yang hanya hiasan atau ilustrasi suasana dilewati (bila gambar yang cocok kurang, satu gambar boleh dipakai lagi untuk pertanyaan yang berbeda). Nomor lain boleh bergambar juga bila cocok. Indikator baris bergambar WAJIB tentang isi yang TAMPAK di gambar itu sendiri (bagian berlabel, data, arah, susunan, langkah yang digambar), bukan soal lain yang kebetulan setopik: soal bergambar tidak bisa dijawab tanpa melihat gambarnya, dan angka/label di soal sama dengan yang ada di gambar. Gambar paling cocok untuk soal yang menunjuk bagian, membaca data, atau mengamati; tidak untuk soal MJ. Menunjuk bagian lewat nomor/huruf HANYA untuk gambar yang keterangannya menyebut label itu; gambar "tanpa label" (atau tanpa keterangan label): indikator tentang keseluruhan gambar atau bagian yang dikenali dari bentuk/warna/letaknya. "stimulus" baris bergambar: "gambar: <apa yang diamati>".`;

// ATURAN-SOAL.md bagian 9 no. 4: soal grup TKA. Dibatasi bentuk sama supaya lembar soal tetap per bagian bentuk.
// 0.47.0: panjang wacana ikut ukuran grup terbesar (grup 5–10 soal butuh bahan lebih banyak dari grup 2–3).
const panjangWacana = (maks: number) => (maks <= 3 ? "80–200" : maks <= 5 ? "150–250" : maks <= 7 ? "200–300" : "250–350");
const soalGrup = (grup: (number | null)[]) => {
  const ukuran = new Map<number, number>();
  for (const g of grup) if (g) ukuran.set(g, (ukuran.get(g) ?? 0) + 1);
  return `SOAL GRUP: nomor yang ditandai GRUP N di atas SUDAH DITENTUKAN sebagai soal grup: semua nomor dengan GRUP yang sama memakai SATU wacana bersama.
- Isi "grup" setiap baris dengan nomor grupnya, atau null untuk soal tunggal. Soal dalam satu grup mengukur indikator yang berbeda, dan semuanya bisa dijawab dari wacananya.
- WAJIB tulis wacana setiap grup di "wacana": teks lengkap ${panjangWacana(Math.max(0, ...ukuran.values()))} kata yang belum pernah dibaca siswa (bacaan, data dalam tabel sesuai aturan TABEL, kasus, atau hasil percobaan).
- "stimulus" baris grup diisi "wacana grup N".`;
};
// 0.39.0 Bahasa Indonesia, 0.47.0 Bahasa Inggris & Bahasa Arab: soal grup di UH/AFTS/ASAS/Latihan (grupSet). Bacaan = jenis
// teks yang sedang dipelajari.
const WACANA_INDONESIA = `Wacana berupa teks utuh dari jenis teks yang dipelajari di DATA BAB (misalnya cerpen, teks eksposisi, berita, hikayat, teks negosiasi), ditulis baru sesuai ciri dan struktur jenis teks itu, supaya soal grupnya menguji isi, struktur, kebahasaan, atau amanat teks tersebut.`;
const WACANA_INGGRIS = `Wacana berupa reading text berbahasa Inggris yang utuh dari jenis teks yang dipelajari di DATA BAB (misalnya descriptive, recount, narrative, procedure, report, news item, analytical exposition, announcement, letter, dialogue), ditulis baru sesuai ciri dan struktur jenis teks itu dengan kosakata sesuai kelas, supaya soal grupnya menguji main idea, detail, reference, vocabulary in context, inference, struktur, atau kebahasaan teks tersebut.`;
const WACANA_ARAB = `Wacana berupa teks bacaan (qira'ah) atau hiwar berbahasa Arab fusha yang utuh, berharakat lengkap, ditulis baru sesuai tema dan kosakata DATA BAB serta tingkat kelasnya, supaya soal grupnya menguji isi (fahm al-maqru'), makna kosakata dalam konteks, dan kaidah yang dipelajari di teks tersebut. Wacana bukan ayat Al-Qur'an atau hadis.`;
const wacanaMapel = (mapel = "") => (MAPEL_INGGRIS.test(mapel) ? WACANA_INGGRIS : /bahasa\s+arab/i.test(mapel) ? WACANA_ARAB : WACANA_INDONESIA);

// ATURAN-SOAL.md bagian 6 no. 2: AI menjawab catatan guru; tampil di paling atas hasil soal.
const TANGGAPAN = `Isi juga "tanggapan": balasan singkat untuk guru (maks 3 kalimat, sapa dengan "Anda") tentang catatannya: apa yang Anda ikuti dan bagaimana, serta bagian yang TIDAK bisa diikuti beserta alasannya. Bila meminta jumlah/bentuk soal lain, arahkan ke tombol jumlah soal di form; bila meminta komposisi level lain, arahkan ke menu Lanjutan.`;

// 0.18.3: jawaban isian direncanakan di kisi-kisi, supaya tahap soal lain (yang ditulis LEBIH DULU) bisa menghindarinya.
const RENCANA_ISIAN = `- "jawaban" (HANYA baris ISIAN): rencana jawaban soal isian itu (1–5 kata). Pilih istilah/konsep yang TIDAK akan menjadi kunci, pengecoh, atau data di soal lain dalam kisi-kisi ini, dan berbeda antarbaris isian. Jangan berupa angka yang juga dipakai sebagai data soal lain (misalnya tarif yang diberikan di soal hitungan).`;

// 0.19.1: menjodohkan "pengelompokan" (5 pajak → pusat/daerah) membuat jawaban berulang dan gagal diperbaiki (audit set 76).
// 0.22.0: menjodohkan gaya lama (satu baris = satu pasangan); baris MJ berurutan dijodohkan dengan satu daftar jawaban.
const RENCANA_MJ = `- Baris MJ (menjodohkan): setiap baris = SATU pasangan (satu pernyataan lajur kiri dan jodohnya). Baris-baris MJ yang berurutan dijodohkan bersama dengan satu daftar jawaban, jadi pilih SATU jenis hubungan untuk semuanya (istilah–pengertian, tokoh–karya, kata–arti) dengan pasangan berbeda di setiap baris dan jodoh yang semuanya berbeda. Semua baris dalam BLOK MJ yang sama memakai "indikator" dan "materi" yang SAMA PERSIS, berupa jenis hubungan yang cukup luas untuk memuat semua pasangan blok itu (contoh: "Peserta didik dapat menjodohkan istilah-istilah kemukjizatan dengan pengertiannya"), BUKAN satu pasangan tertentu. Jodoh dalam satu blok harus sejenis (semuanya istilah, atau semuanya nama surah, atau semuanya nama tokoh), jangan dicampur. Materi pengelompokan (beberapa hal masuk ke kelompok yang sama) jangan dijadikan MJ. "stimulus" baris MJ: "tanpa stimulus".`;

/** Baris kisi-kisi dalam bentuk ringkas untuk permintaan soal. */
const tulisKisi = (k: BarisKisi) =>
  `- Nomor ${k.no} | ${k.bentuk} | ${k.tp} | ${k.level} | dalil_id: ${k.dalil_id ?? "null"}${k.dalil_id && k.dalil_tampil ? ` | dalil_tampil: ${k.dalil_tampil}` : ""}${k.gambar_id ? ` | gambar_id: ${k.gambar_id}` : ""} | Indikator: ${k.indikator} | Stimulus: ${k.grup && k.wacana ? `WACANA GRUP ${k.grup}` : k.stimulus}${k.jawaban ? ` | Jawaban (kunci): ${k.jawaban}` : ""}${k.kunciPgk ? ` | Jumlah jawaban benar: ${k.kunciPgk}` : ""}${k.jumlahPernyataan ? ` | Jumlah pernyataan: ${k.jumlahPernyataan}` : ""}${k.kunciBs ? ` | Kunci: ${k.kunciBs}` : ""}${k.bentuk === "MJ" && k.grup && !k.wacana ? ` | Blok MJ ${k.grup}` : ""}`;

/**
 * Daftar jawaban isian rencana kisi-kisi yang TIDAK boleh tertulis di soal lain (ATURAN-SOAL 2b no. 11), untuk setiap
 * tahap soal. Jawaban yang memuat angka dilewati: melarang angka (mis. tarif 11%) bisa membuat AI mengubah data yang benar.
 * Kecuali tahun ("92 H"): bukan data hitungan, dan tanpa larangan tahun bocor ke soal PG yang ditulis lebih dulu (0.31.2, set 104).
 */
export function laranganIsian(kisi: BarisKisi[]) {
  const kata = [...new Set(kisi.filter((k) => k.bentuk === "ISIAN" && k.jawaban && (!/\d/.test(k.jawaban) || adalahTahun(k.jawaban))).map((k) => k.jawaban!.trim()))];
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
  // Jawaban isian yang sudah tertulis di indikator/materi baris SEBELUMNYA pasti bocor (0.31.2, set 104: isian "Muawiyah bin
  // Abi Sufyan" sementara baris 3, 11, 12 menguji Muawiyah). Dicocokkan kata terpanjang jawaban; kata topik yang muncul di
  // >= 40% baris ("inflasi" di materi inflasi) dilewati. Diukur di 23 isian lama: 3 bocor sungguhan tertangkap, 1 salah tangkap.
  const polos = (t: string) => ` ${t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
  const teksBaris = kisi.map((k) => polos(`${k.indikator} ${k.materi}`));
  const tabrak = kisi.flatMap((k, i) => {
    if (k.bentuk !== "ISIAN" || !k.jawaban) return [];
    const kata = polos(k.jawaban).trim().split(" ").filter((w) => w.length >= 4 && !/^\d+$/.test(w)).sort((a, b) => b.length - a.length)[0];
    if (!kata || teksBaris.filter((t) => t.includes(` ${kata} `)).length >= 0.4 * kisi.length) return [];
    const j = teksBaris.findIndex((t, j) => j < i && kisi[j].bentuk !== "URAIAN" && t.includes(` ${kata} `));
    return j < 0 ? [] : [`${i + 1} dan ${j + 1} (jawaban isian "${k.jawaban}" sudah diuji di baris ${j + 1})`];
  });
  pasti.push(...tabrak);
  return `Ini permintaan MEMERIKSA kisi-kisi set ini (bukan membuat soal):
${baris.join("\n")}
${pasti.length ? `\nPasangan berikut SUDAH PASTI kembar dan wajib diperbaiki: ${pasti.join("; ")}.\n` : ""}
Cari pasangan baris yang MENGUJI KETERAMPILAN YANG SAMA: kata kerja + objek yang sama, walaupun kata kerjanya sinonim (menghitung/menentukan/menilai kebenaran hasil hitung), angka data, tokoh, kasus, atau bentuk soalnya berbeda. Contoh kembar: "menghitung tingkat inflasi dari data IHK" (PG) dengan "menentukan tingkat inflasi dalam persen dari data IHK" (ISIAN); "membedakan pajak subjektif dan objektif" (PG) dengan "membedakan ciri pajak subjektif dan objektif" (BS).
BUKAN kembar: baris URAIAN yang memperdalam baris lain; baris MJ dalam BLOK MJ yang sama; dua baris dengan konsep sama tetapi keterampilan berbeda (misalnya menyebutkan pengertian vs menganalisis dampak).
Untuk setiap pasangan kembar, tulis ulang baris yang NOMORNYA LEBIH BESAR: indikator baru gaya Kemenag dari TP yang sama, bentuk dan level tetap (kata kerja sesuai level), mengambil sisi materi yang BELUM diuji baris mana pun. Indikator baru WAJIB berbeda kata kerja DAN objeknya dari indikator lama dan dari semua baris lain (menyalin atau sekadar menambah kata pada indikator lama = gagal); boleh memakai sub-materi lain dari TP yang sama. "materi" dan "stimulus" (jenis + skenario, maks 15 kata, atau "tanpa stimulus") menyesuaikan. Baris ISIAN juga menulis "jawaban" baru (1–5 kata) yang tidak tertulis di baris lain. Jangan menulis ayat atau hadis.
FORMAT JAWABAN: hanya JSON {"kembar":[{"nomor":17,"sama_dengan":3,"indikator":"...","materi":"...","stimulus":"..."}]}. Kalau tidak ada yang kembar: {"kembar":[]}.`;
}

const BUKAN_INTI = new Set("peserta didik dapat disajikan yang dan dengan dari pada untuk dalam suatu sebuah tentang secara tepat benar beberapa dua tiga data kasus besar pernyataan pilih semua jawaban".split(" "));
/**
 * Kata kerja sinonim disamakan dulu (0.31.2): "menilai kebenaran hasil hitung inflasi" (BS) = "menentukan tingkat inflasi"
 * (ISIAN) = "menghitung tingkat inflasi" (PG). Tanpa ini kata kerjanya dihitung beda dan pasangan kembar lolos (set 110 no. 6
 * dan 19). Diukur di 66 kisi laptop: 29 → 47 pasangan, 0 pasangan lama hilang, ±4 salah tangkap (cukup ditulis ulang AI).
 */
const samakanKerja = (t: string) =>
  t
    .replace(/\bmenentukan\s+benar\s+atau\s+salah\b/g, "menilai")
    .replace(/\b(menilai|mengevaluasi|memeriksa|menentukan)\s+(kebenaran|ketepatan|kesesuaian)\s+(hasil\s+)?(per)?hitung(an)?\b/g, "menghitung")
    .replace(/\b(menentukan|mencari)\b/g, "menghitung");
const kataInti = (t: string) =>
  new Set(samakanKerja(String(t).toLowerCase().split(/,\s*peserta didik dapat/).pop()!).normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").map((w) => w.replace(/nya$/, "")).filter((w) => w.length > 2 && !BUKAN_INTI.has(w)));
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
    // Baris MJ boleh jadi pasangan bila yang ditulis ulang baris ISIAN (jawaban isian sudah dipakai di blok MJ).
    if (!a || !b || !Number.isInteger(no) || sama >= no || !indikator || b.bentuk === "MJ" || [a.bentuk, b.bentuk].includes("URAIAN") || (a.bentuk === "MJ" && b.bentuk !== "ISIAN")) continue;
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
    ? `Tulis tepat ${kisi.length} soal sesuai KISI-KISI berikut, satu soal per baris, urut sesuai nomor. Setiap soal WAJIB memakai bentuk, tp, level, dalil_id, dan dalil_tampil barisnya, mengukur indikatornya, dan memakai stimulus/skenario yang tertulis (jangan diganti skenario lain):\n${kisi.map(tulisKisi).join("\n")}${tulisWacana(kisi)}`
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

/**
 * Bentuk tujuan yang boleh dipilih "Ubah soal" (0.46.0). Tidak untuk soal grup (wacana bersama/blok MJ harus satu
 * bentuk) dan tidak ke/dari MJ (daftar jawaban bersama satu blok). Latihan TKA: hanya PG, PGK, Kategori.
 */
export function bentukUbahan(p: Pick<Pengaturan, "tujuan">, lama: Pick<Soal, "bentuk" | "grup">): Bentuk[] {
  if (lama.grup || lama.bentuk === "MJ") return [];
  const semua: Bentuk[] = p.tujuan === TKA ? ["PG", "PGK", "BS"] : ["PG", "PGK", "BS", "ISIAN", "URAIAN"];
  return semua.filter((b) => b !== lama.bentuk);
}

/**
 * Permintaan guru menyebut bentuk soal. Pengaman kedua (selain instruksi ke AI): bentuk hanya diganti bila guru
 * menyebutnya, supaya "jadikan lebih sulit" tidak diam-diam mengubah PG jadi PGK.
 * ponytail: daftar kata sederhana; tambah sinonim bila guru memakai istilah lain.
 */
export const MINTA_BENTUK = /\b(pg|pgk|pilihan ganda|ganda kompleks|benar[\s/-]*salah|b\/s|kategori|isian|uraian|esai|essay|bentuk)(nya)?\b/i;

// 0.50.0: kalimat guru Hadis di riwayat Ubah (16 Nov 2026), mis. "hadisnya jadi jawaban", "ubah jadi melengkapi potongan
// hadis", "mengartikan lafaz bergaris bawah". Urutan penting: yang pertama cocok dipakai.
// ponytail: daftar kata sederhana; tambah sinonim bila guru memakai istilah lain.
const DALIL_KATA = String.raw`(?:ayat|hadi[st]|lafa[zdḍ]h?|dalil)`;
const POLA_CARA: [RegExp, CaraDalil, CaraDalil?][] = [
  [/garis\s*bawah|bergaris/i, "garis"],
  [new RegExp(String.raw`\b(?:urut|susun|menyusun|mengurutkan)\w*\s+(?:\w+\s+)?${DALIL_KATA}`, "i"), "urutan"],
  [new RegExp(String.raw`\b(?:lengkapi|melengkapi|sambung|menyambung|lanjutan|melanjutkan|rumpang)\w*\s+(?:\w+\s+){0,2}${DALIL_KATA}|\brumpang\b`, "i"), "rumpang", "rumpang-terjemah"],
  [new RegExp(String.raw`${DALIL_KATA}\w*\s+(?:di)?jadi(?:kan)?\s+(?:di\s+)?(?:pilihan|jawaban|opsi)|${DALIL_KATA}\w*\s+(?:di|ke)\s+(?:pilihan|jawaban|opsi)|\b(?:pilihan|jawaban|opsi)\w*\s+(?:\w+\s+)?${DALIL_KATA}`, "i"), "pilihan", "pilihan-terjemah"],
  [/\b(?:full|hanya|cuma)\s+(?:bahasa\s+)?arab|\barab\w*\s+saja|tanpa\s+(?:terjemah|arti)/i, "arab"],
  [/\b(?:terjemah|arti)\w*\s+saja|tanpa\s+(?:teks\s+|tulisan\s+)?arab/i, "terjemah"],
  [new RegExp(String.raw`\bpotongan\s+(?:\w+\s+)?${DALIL_KATA}`, "i"), "potong", "potong-terjemah"],
];

/**
 * Cara tampil dalil yang diminta guru di "Ubah soal" (0.50.0), dibaca APLIKASI seperti MINTA_BENTUK, lalu ditegaskan ke
 * AI dan diperiksa hasilnya. Null bila tidak ada, tidak cocok bentuknya, atau tidak bisa dipakai dalil soal/materi ini.
 * Cara PG pada soal bukan PG: "melengkapi" → sisip (kode [[A a-b]], mis. kunci isian); lainnya tidak dipaksakan.
 */
export function caraDiminta(instruksi: string, bentuk: Bentuk, bab: Pick<Bab, "dalil">, dalilId?: string | null): CaraDalil | null {
  const kena = POLA_CARA.find(([pola]) => pola.test(instruksi));
  if (!kena) return null;
  let cara = kena[2] && /terjemah|\barti(?:nya)?\b/i.test(instruksi) ? kena[2] : kena[1];
  if (!caraBolehBentuk(cara, bentuk)) cara = cara.startsWith("rumpang") ? "sisip" : cara;
  if (!caraBolehBentuk(cara, bentuk)) return null;
  const dalil = bab.dalil.filter((d) => !bukanDalil(d) && (!dalilId || d.id === dalilId));
  return dalil.some((d) => cocokCara(cara, d)) ? cara : null;
}

/**
 * 0.45.0 "Ubah soal" dari guru: AI bekerja sebagai EDITOR satu soal, permintaan guru = tugas utama. Dulu permintaan
 * ditempel di akhir permintaan "Buat soal" yang penuh larangan, sehingga AI sering mengembalikan soal yang sama persis.
 * Bentuk tetap; selain itu semua bagian boleh diubah, termasuk wacana grup. Opsi: `ulang` = percobaan kedua setelah
 * jawaban pertama tidak mengubah apa pun / tidak memakai cara yang diminta; `masalah` (0.50.0) = peringatan pemeriksa atas
 * hasil ubahan sebelumnya (`lama` = hasil itu), diperbaiki 1x; `cara` = caraDiminta; `adaGambar` = materi bergambar.
 */
export function buatPermintaanUbah(p: Pengaturan, lama: Soal, semua: Soal[], kisi: BarisKisi | undefined, instruksi: string,
  { ulang = false, masalah = [], cara = null, adaGambar = false }: { ulang?: boolean; masalah?: string[]; cara?: CaraDalil | null; adaGambar?: boolean } = {}) {
  const { peringatan, stimulus, grup, wacana, ...isiAsli } = lama;
  void peringatan;
  void stimulus;
  const lain = semua.filter((s) => s !== lama).map(ringkasSudah);
  const bagianWacana = wacana
    ? `\nWACANA bersama soal ini (dipakai juga oleh soal lain di grupnya, ditampilkan aplikasi di atas soal; jangan ditulis ulang di "pertanyaan"):\n${wacana}\n`
    : "";
  const tka = p.tujuan === TKA;
  const boleh = bentukUbahan(p, lama);
  // 0.46.0 (tahap 2): bentuk boleh diganti bila guru memintanya; aplikasi memindah soal ke bagian bentuk barunya.
  const aturanBentuk = boleh.length
    ? `- Bentuk soal sekarang ${lama.bentuk} (${namaBentuk(lama.bentuk, tka)}). Ganti bentuk HANYA bila guru jelas memintanya, ke salah satu: ${boleh.map((b) => `${b} (${b === "BS" && !tka ? "Benar/Salah satu pernyataan" : namaBentuk(b, tka)})`).join(", ")}. Bila diganti: tulis kode bentuk baru di "bentuk", tulis soal LENGKAP sesuai format bentuk itu di instruksi sistem (field bentuk lama yang tidak dipakai dibuang), dan tetap menguji konsep yang sama kecuali guru meminta lain.${boleh.includes("URAIAN") && p.bobot?.URAIAN ? ` Untuk URAIAN, jumlah skor rubrik harus tepat ${p.bobot.URAIAN}.` : ""}${boleh.includes("PGK") ? ` Untuk PGK, jumlah jawaban benar ${tka ? "2, 3, atau 4" : "tepat 2"}.` : ""}`
    : `- Bentuk tetap ${lama.bentuk}${grup ? " (soal grup tidak bisa diganti bentuknya; bila diminta, jelaskan di \"catatan\" bahwa bentuk bisa diganti lewat Edit atau Tulis soal sendiri)" : ""}.`;
  return `TUGAS: Anda EDITOR satu soal ${namaBentuk(lama.bentuk, tka)}. Ubah soal di bawah sesuai PERMINTAAN GURU.

PERMINTAAN GURU (tugas utama, WAJIB dijalankan):
"""${bersihkanInstruksi(instruksi)}"""
${ulang ? `\nPERHATIAN: jawaban Anda sebelumnya ${cara ? `tidak memakai cara tampil dalil "${cara}" yang diminta, atau ` : ""}mengembalikan soal yang SAMA PERSIS, padahal guru meminta perubahan. Kali ini WAJIB ada perubahan nyata sesuai permintaan. Hanya bila permintaan benar-benar tidak bisa dijalankan, kembalikan soal apa adanya dan jelaskan alasannya di "catatan".\n` : ""}${masalah.length ? `\nPERHATIAN: SOAL SAAT INI di bawah adalah hasil ubahan Anda sebelumnya. Permintaan guru sudah dijalankan, tetapi pemeriksa aplikasi menemukan masalah:\n${masalah.map((m) => `- ${m}`).join("\n")}\nPerbaiki masalah itu TANPA membatalkan perubahan yang diminta guru. "catatan" tetap menjelaskan perubahan untuk guru.\n` : ""}
SOAL SAAT INI (JSON):
${JSON.stringify(keFormatAI(isiAsli as Soal))}
${kisi ? `Kisi-kisi soal ini: indikator "${kisi.indikator}", stimulus "${kisi.stimulus}".\n` : ""}${bagianWacana}
CARA MENGUBAH:
- Permintaan guru boleh menyentuh bagian mana pun: pokok soal, stimulus/kasus, tokoh, pilihan, pengecoh, kunci, pembahasan, rubrik, kesulitan, level kognitif, TP, panjang dan gaya kalimat, bahasa, tabel, rumus, gambar ("gambar_id" dari DATA BAB), dan dalil ("dalil_id" dari DATA BAB)${wacana ? `, juga wacana (tulis wacana baru UTUH di field "wacana"; bila wacana tidak diubah, jangan tulis field "wacana")` : ""}.
- Permintaan guru MENGALAHKAN aturan gaya di instruksi sistem dan catatan set di bawah (gaya dan panjang stimulus, variasi, sebaran, pilihan kata). Yang TIDAK boleh dilanggar walau diminta hanya: ayat/hadis tidak boleh diketik atau dikarang (pakai "dalil_id" dari DATA BAB), kunci harus benar, bentuk hanya yang diizinkan di bawah, format JSON, dan isi yang dilarang.
${aturanBentuk}
- Permintaan umum ("perbaiki", "buat lebih bagus", "lebih jelas") = perbaiki kelemahan yang Anda temukan; jangan kembalikan soal yang sama.
- Bagian yang tidak terkait permintaan boleh tetap, tetapi soal harus tetap utuh dan konsisten: bila pokok soal, pilihan, atau kunci berubah, sesuaikan kunci dan pembahasannya.
- Bila hanya sebagian permintaan bisa dijalankan, jalankan bagian yang bisa dan jelaskan sisanya di "catatan".
- Bila PERMINTAAN GURU berisi soal atau teks yang sudah ditulis lengkap oleh guru (pokok soal, pilihan A–E, kalimat utuh), PAKAI teks guru itu apa adanya sebagai isi soal: hanya betulkan salah ketik dan spasi (kata yang menempel dipisah), lengkapi bagian yang belum ada (kunci, pembahasan), dan jangan mengarang stimulus atau kasus baru. Teks dalil (ayat/hadis/terjemahnya) yang ditempel guru jangan disalin ke "pertanyaan" bila teks itu sudah ditampilkan aplikasi lewat "dalil_tampil"; tunjuk dalilnya dengan "dalil_id".
${lama.dalil_id ? `- Soal ini memakai dalil "${lama.dalil_id}". Tetap pakai dalil itu dan uji konsep/isi yang sama, kecuali guru meminta dalil atau konsep lain (mis. "ganti hadisnya").\n` : ""}${cara ? `- Aplikasi membaca permintaan ini sebagai cara tampil dalil "${cara}": WAJIB isi "dalil_tampil": "${cara}" dan ikuti penjelasan cara "${cara}" di instruksi sistem${cara === "sisip" ? "" : ' (termasuk "dalil_potong"' + (CARA_PG.has(cara) && cara !== "urutan" ? ' dan "dalil_pengecoh"' : "") + ")"}.${lama.dalil_id ? "" : " Pilih dalil dari DATA BAB yang sesuai isi soal."}\n` : ""}- AI tidak bisa mengubah gambar (menambah angka, huruf, label, atau panah). Soal hanya boleh menunjuk label yang tertulis di keterangan gambar ("berlabel ..."); gambar tanpa label: tanyakan keseluruhan gambar atau tunjuk bagian lewat bentuk, warna, atau letaknya. ${adaGambar ? 'Bila guru meminta label/angka pada gambar, jelaskan di "catatan": gambar tidak bisa diubah AI; unggah gambar yang sudah berlabel lewat Edit, lalu tulis labelnya di keterangan gambar materi.' : 'Materi ini tidak punya gambar: bila guru meminta gambar, jelaskan di "catatan" bahwa gambar bisa ditambahkan lewat Edit (Gambar soal) atau di materi.'}

KONTEKS SET:
${kepalaPermintaan(p)}${lain.length ? `Soal lain di set ini (soal hasil ubahan jangan dibuat mirip, dan jawabannya jangan tertulis di soal hasil ubahan):\n${lain.map((s) => `- ${s}`).join("\n")}\n` : ""}
Balas hanya JSON {"soal":[{...}]} berisi tepat 1 soal hasil ubahan dengan format soal di instruksi sistem, ditambah field "indikator" (indikator soal gaya Kemenag yang sesuai soal hasil ubahan), "stimulus" (jenis + skenario maks 15 kata, atau "tanpa stimulus"), dan "catatan" (1–2 kalimat untuk guru: apa saja yang diubah, atau alasan bagian permintaan yang tidak bisa dijalankan; bahasa guru biasa: sebut "materi", bukan "DATA BAB"; jangan membahas skor karena diatur aplikasi; tanpa huruf Arab).`;
}
