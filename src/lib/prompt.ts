import { identitasBab, keFormatAI, MAKS_GABUNG, type Bab, type BarisKisi, type Bentuk, type Soal } from "./soal.ts";

export const TUJUAN = ["Ulangan Harian", "PTS", "PAS", "Latihan", "Latihan TKA"] as const;
/** Nama yang tampil (pilihan pemilik 2026-10-20: AFTS & ASAS sesuai istilah madrasah). Kode "PTS"/"PAS" tetap disimpan agar set lama terbaca. */
const NAMA_TUJUAN: Record<string, string> = { PTS: "AFTS", PAS: "ASAS" };
const KEPANJANGAN: Record<string, string> = { PTS: "Asesmen Formatif Tengah Semester", PAS: "Asesmen Sumatif Akhir Semester" };
export const namaTujuan = (t: string) => NAMA_TUJUAN[t] ?? t;
/** ATURAN-SOAL.md bagian 9: TKA hanya PG, PG kompleks, Kategori (tanpa uraian), memakai soal grup. */
export const TKA = "Latihan TKA";
export const NAMA_LEVEL_TKA = { LOTS: "Pemahaman", MOTS: "Penerapan", HOTS: "Penalaran" } as const;
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
      "Gaya Tes Kemampuan Akademik (TKA) SMA/MA dari pusat: level kognitif disebut Pemahaman (= LOTS), Penerapan (= MOTS), dan Penalaran (= HOTS); hampir semua soal berbasis stimulus (bacaan, data/tabel, kasus, hasil percobaan) yang harus diolah, bukan hafalan. Sebagian soal berupa SOAL GRUP (beberapa soal memakai satu wacana bersama). Pembahasan mendidik: alasan kunci benar + alasan tiap pengecoh salah.",
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
  BS: "Kategori (Benar/Salah)", // kode "BS" dipertahankan agar set lama tetap terbaca
  MJ: "Menjodohkan",
  ISIAN: "Isian Singkat",
  URAIAN: "Uraian",
};
export const MAKS_SOAL = 40;
// Satu jawaban AI maks ±8.000 token. 10 soal Latihan+Sulit ≈ 14.000 huruf, aman di bawah batas.
export const MAKS_PER_TAHAP = 10;
/** Jumlah semua soal dari rincian per bentuk. SATU-SATUNYA penjumlah: jangan menyebut bentuk satu per satu (bentuk baru terlewat). */
export const jumlahSoal = (j: Record<Bentuk, number>) => (Object.keys(NAMA_BENTUK) as Bentuk[]).reduce((n, b) => n + (j[b] ?? 0), 0);

// Satu soal Menjodohkan memuat 12 potong teks (5 pasangan + pengecoh), jadi dihitung seberat 2 soal biasa per tahap.
const BERAT_TAHAP: Partial<Record<Bentuk, number>> = { MJ: 2 };

// Skor per soal seperti format AFTS madrasah (10 PG + 5 PGK + 5 B/S + 5 uraian = 100).
// Menjodohkan: bobot = skor SATU soal (5 pasangan); tiap pasangan benar mendapat 1/5-nya (penskoran per pasangan).
export const BOBOT_BAWAAN: Record<Bentuk, number> = { PG: 2, PGK: 5, BS: 3, MJ: 5, ISIAN: 3, URAIAN: 8 };

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
  for (const b of Object.keys(NAMA_BENTUK) as Bentuk[]) {
    const berat = BERAT_TAHAP[b] ?? 1;
    let sisa = jumlah[b] ?? 0; // set lama tidak punya kunci bentuk baru
    while (sisa > 0) {
      if (!tahap.length || maks - isi < berat) {
        tahap.push({ PG: 0, PGK: 0, BS: 0, MJ: 0, ISIAN: 0, URAIAN: 0 });
        isi = 0;
      }
      const ambil = Math.min(sisa, Math.floor((maks - isi) / berat));
      tahap[tahap.length - 1][b] += ambil;
      isi += ambil * berat;
      sisa -= ambil;
    }
  }
  return tahap;
}

/** Instruksi utama: aturan + data bab. Sama untuk semua tahap (DeepSeek memberi harga murah untuk bagian yang berulang). */
export function buatSistem(bab: Bab) {
  const dalil = bab.dalil
    .map((d) => {
      const mufradat = d.mufradat.map((m) => `${m.arab} = ${m.arti}`).join("; ");
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
- Ragamkan bentuknya: kasus/cerita pendek tentang satu orang, cuplikan berita, data/tabel (ditulis sebagai teks), grafik atau gambar yang dideskripsikan dengan kata, teks bacaan, potongan percakapan, kutipan tokoh, hasil percobaan (boleh dengan kelompok kontrol), perbandingan dua kondisi (misalnya wilayah X dan Y), potongan dokumen sejarah, atau tanpa stimulus.
- Aplikasi tidak bisa menampilkan gambar: jangan menulis "perhatikan gambar berikut" kecuali gambarnya dideskripsikan lengkap dengan kata.
- Susunan baris: percakapan/dialog/hiwar ditulis SATU PENUTUR PER BARIS dengan format "Nama: ucapan", baris dipisah baris baru (\\n di dalam teks JSON). Daftar bernomor, langkah prosedur, puisi/syair, dan surat/pesan singkat juga satu bagian per baris. Kalimat pengantar ("Perhatikan percakapan berikut!") dan perintah soal ditulis di baris sendiri. TANPA baris kosong di antara baris-baris (satu \\n saja). Bagian rumpang ditulis "..." atau "(1) ..." di dalam baris ucapan. Teks cerita atau uraian biasa tetap satu paragraf. Berlaku untuk "pertanyaan", "wacana", "pilihan", dan "pernyataan".
- Pola "dua orang/kelompok berdebat atau berbeda pendapat" paling banyak 2 kali dalam satu set.
- Satu skenario atau kasus hanya boleh dipakai SEKALI dalam satu set.
- Nama tokoh beragam (jangan selalu Ahmad atau Fatimah), seimbang putra dan putri. Tokoh yang berbuat salah atau keliru TIDAK memakai nama nabi, sahabat, atau tokoh mulia dalam Islam.
- Boleh menyisipkan nilai Panca Cinta (Cinta Allah dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama, Cinta Tanah Air) secara wajar pada tokoh/cerita, tanpa menggurui dan tanpa mengubah kunci. Tidak wajib di setiap soal.

PENGECOH DAN PEMBAHASAN:
- Pernyataan/pilihan salah dibuat dengan mengubah SATU konsep kunci dari pernyataan benar (sebab-akibat dibalik, istilah tertukar, naik/turun, terbesar/terkecil). Jebakan harus pada konsep, bukan permainan kata yang menyesatkan.
- Pembahasan menjelaskan mengapa kunci benar DAN mengapa setiap pengecoh salah, dengan menyebut isinya (bukan hurufnya).
- Jika soal memuat perhitungan, pembahasan WAJIB memuat langkah hitung lengkap sampai hasil akhir.

${BENTUK_SOAL}

FORMAT JAWABAN (kecuali permintaan menyebut format lain): hanya JSON (tanpa teks lain), dengan bentuk:
{"soal":[{"bentuk":"PG","dalil_id":null,"pertanyaan":"...","langkah":"...","jawaban_benar":"...","pilihan":["...","...","...","...","..."],"kunci":"B","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}]}
Untuk BS: {"bentuk":"BS","dalil_id":null,"pertanyaan":"...","pernyataan":["...","...","...","..."],"label":["Fakta","Opini"],"kunci":["Fakta","Opini","Opini","Fakta"],"pembahasan":"...","level":"C4","tp":"TP 3.2","skor":1}
Untuk MJ: {"bentuk":"MJ","dalil_id":null,"pertanyaan":"Jodohkan setiap kata di lajur kiri dengan artinya di lajur kanan!","pasangan":[{"premis":"...","jawaban":"..."}],"pengecoh":["..."],"pembahasan":"...","level":"C1","tp":"TP 3.2","skor":1} ("pasangan" berisi TEPAT 5 objek)
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
- "pokok": 4–10 pokok materi yang bisa diuji (maks 15 kata per poin).
- "dalil": untuk setiap [DALIL n]: "sumber" (mis. "HR. Bukhari dan Muslim") dan "terjemah" HANYA bila tertulis di teks di dekat dalil itu, disalin PERSIS kata per kata; kalau tidak tertulis, isi "". Jangan menerjemahkan sendiri.
- "catatan": satu kalimat bila teks terlalu sedikit atau kurang jelas untuk dibuat soal; selain itu "".`;
  return { sistem, pengguna };
}

const BENTUK_SOAL = `BENTUK SOAL:
- PG: 5 pilihan, tepat 1 benar. Tulis berurutan: "pertanyaan", lalu "langkah" (langkah hitung atau alasan singkat untuk menemukan jawaban benar; wajib lengkap untuk soal hitungan), lalu "jawaban_benar" (isi jawaban benar hasil langkah itu), BARU "pilihan" (salah satunya salinan PERSIS "jawaban_benar") dan "kunci" ("A".."E", huruf pilihan yang sama dengan "jawaban_benar"). Periksa ulang hitungan sebelum menulis pilihan.
- PGK (pilihan ganda kompleks, model jawaban ganda/MCMA): 5 pilihan, 2 ATAU 3 benar (tidak semua), sesuai isi soal; ragamkan jumlahnya dalam satu set. Setiap pilihan satu pernyataan utuh; JANGAN pilihan gabungan seperti "(2) dan (3)" atau "1, 2, dan 4". "kunci": array berisi 2 atau 3 huruf jawaban benar. Akhiri pertanyaan dengan "(Pilih semua jawaban yang tepat)" tanpa menyebut jumlah jawaban benar.
- BS (pilihan ganda kompleks model Kategori): "pertanyaan" berisi stimulus/pokok soal + perintah, misalnya "Tentukan apakah setiap pernyataan berikut Benar atau Salah!". Lalu tepat 4 "pernyataan" yang masing-masing dinilai dengan sepasang "label", salah satu dari: ["Benar","Salah"], ["Fakta","Opini"], ["Sesuai","Tidak Sesuai"], ["Tepat","Tidak Tepat"], ["Didukung","Tidak Didukung"] (didukung/tidak oleh stimulus). Pilih pasangan label yang paling cocok dengan isi soal dan ragamkan dalam satu set (jangan semua Benar/Salah bila ada lebih dari satu soal BS). Pembahasan menyebut ISI pernyataan, bukan urutannya ("pernyataan pertama", "pernyataan 2"), karena urutan pernyataan diacak aplikasi. "kunci": array 4 label sesuai urutan pernyataan; jangan semua sama. Jangan menulis ulang keempat pernyataan di dalam "pertanyaan" (aplikasi menampilkannya sebagai tabel). Tanpa "pilihan".
- MJ (menjodohkan): "pertanyaan" berisi perintah singkat saja, misalnya "Jodohkan setiap kata di lajur kiri dengan artinya di lajur kanan!"; JANGAN menulis pasangannya di dalam "pertanyaan". "pasangan": TEPAT 5 objek {"premis":"...","jawaban":"..."}; setiap premis punya TEPAT SATU jawaban yang benar, semua premis berbeda, semua jawaban berbeda, dan seluruh pasangan memiliki hubungan sejenis (kata–arti, tokoh–peristiwa, istilah–pengertian, rumus–nama, dan sebagainya). Hubungannya SATU-SATU: kelima jawaban berbeda isi. JANGAN menjodohkan untuk pengelompokan, yaitu beberapa hal masuk ke kelompok yang sama (pajak pusat/daerah, kebijakan moneter/fiskal, benda hidup/mati), karena jawabannya pasti berulang. Premis dan jawaban singkat (maks 12 kata). "pengecoh": array berisi TEPAT 1 jawaban tambahan yang sejenis tetapi TIDAK cocok dengan premis mana pun. Aplikasi yang mengacak lajur kanan dan menyusun kunci hurufnya: JANGAN menulis huruf kunci, "pilihan", ataupun "kunci". "pembahasan": satu kalimat singkat per pasangan yang menjelaskan hubungannya (sebut isinya, bukan nomor atau hurufnya). Berlaku juga untuk bahasa asing (kosakata–arti, kata–lawan kata).
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
export function rencanaLevel(jumlah: Record<Bentuk, number>, level: Pengaturan["level"]): Kategori[] {
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
  let awal = 0;
  return urutan.flatMap((b) => {
    const bagian = semua.slice(awal, awal + jumlah[b]);
    awal += jumlah[b];
    return bagian.sort((x, y) => kategori.indexOf(x) - kategori.indexOf(y));
  });
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
Tingkat kesulitan: ${kesulitan}. Artinya: ${ATURAN_KESULITAN[kesulitan]}
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
  const kategori = rencanaLevel(p.jumlah, p.level);
  const grup = p.tujuan === TKA ? rencanaGrup(p.jumlah) : [];
  const rentang: string[] = [];
  for (let i = 0; i < total; ) {
    let j = i;
    while (j + 1 < total && bentukNo[j + 1] === bentukNo[i] && kategori[j + 1] === kategori[i] && (grup[j + 1] ?? null) === (grup[i] ?? null)) j++;
    rentang.push(`- Nomor ${i === j ? i + 1 : `${i + 1}–${j + 1}`}: ${bentukNo[i]}, ${kategori[i]} (${RENTANG[kategori[i]]})${grup[i] ? `, GRUP ${grup[i]}` : ""}`);
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
Indikator antarbaris juga tidak boleh sama persis; ambil sisi materi yang berbeda.
${p.jumlah.ISIAN ? `${RENCANA_ISIAN}\n` : ""}${p.jumlah.MJ ? `${RENCANA_MJ}\n` : ""}${tanpaArab ? 'Di kisi-kisi JANGAN menulis huruf Arab sama sekali; sebut lafaz dengan transliterasi Latin (misalnya "lā taqrabū az-zinā").' : "Di kisi-kisi boleh menulis kosakata/kalimat Arab buatan sendiri, tetapi JANGAN menulis ayat atau hadis."}
${p.tujuan === TKA ? `${SOAL_GRUP}${tanpaArab ? " Wacana tanpa huruf Arab." : " Wacana boleh berbahasa Arab, tetapi bukan ayat atau hadis."}\n` : ""}${p.catatan ? `${TANGGAPAN}\n` : ""}FORMAT JAWABAN untuk permintaan ini: hanya JSON {${p.catatan ? '"tanggapan":"...",' : ""}"kisi":[{"bentuk":"PG","tp":"TP 3.1","materi":"...","indikator":"...","level":"C2","dalil_id":null,"stimulus":"tanpa stimulus"${p.tujuan === TKA ? ',"grup":null' : ""}}${p.jumlah.ISIAN ? ',{"bentuk":"ISIAN",...,"jawaban":"..."}' : ""}]${p.tujuan === TKA ? ',"wacana":[{"grup":1,"teks":"..."}]' : ""}}`;
}

// ATURAN-SOAL.md bagian 9 no. 4: soal grup TKA. Dibatasi bentuk sama supaya lembar soal tetap per bagian bentuk.
const SOAL_GRUP = `SOAL GRUP (gaya TKA): nomor yang ditandai GRUP N di atas SUDAH DITENTUKAN sebagai soal grup: semua nomor dengan GRUP yang sama memakai SATU wacana bersama.
- Isi "grup" setiap baris dengan nomor grupnya, atau null untuk soal tunggal. Soal dalam satu grup mengukur indikator yang berbeda.
- WAJIB tulis wacana setiap grup di "wacana": teks lengkap 80–200 kata yang belum pernah dibaca siswa (bacaan, data/tabel ditulis sebagai teks, kasus, atau hasil percobaan).
- "stimulus" baris grup diisi "wacana grup N".`;

// ATURAN-SOAL.md bagian 6 no. 2: AI menjawab catatan guru; tampil di paling atas hasil soal.
const TANGGAPAN = `Isi juga "tanggapan": balasan singkat untuk guru (maks 3 kalimat, sapa dengan "Anda") tentang catatannya: apa yang Anda ikuti dan bagaimana, serta bagian yang TIDAK bisa diikuti beserta alasannya. Bila meminta jumlah/bentuk soal lain, arahkan ke tombol jumlah soal di form; bila meminta komposisi level lain, arahkan ke menu Lanjutan.`;

// 0.18.3: jawaban isian direncanakan di kisi-kisi, supaya tahap soal lain (yang ditulis LEBIH DULU) bisa menghindarinya.
const RENCANA_ISIAN = `- "jawaban" (HANYA baris ISIAN): rencana jawaban soal isian itu (1–5 kata). Pilih istilah/konsep yang TIDAK akan menjadi kunci, pengecoh, atau data di soal lain dalam kisi-kisi ini, dan berbeda antarbaris isian. Jangan berupa angka yang juga dipakai sebagai data soal lain (misalnya tarif yang diberikan di soal hitungan).`;

// 0.19.1: menjodohkan "pengelompokan" (5 pajak → pusat/daerah) membuat jawaban berulang dan gagal diperbaiki (audit set 76).
const RENCANA_MJ = `- Baris MJ (menjodohkan): pilih materi yang punya 5 pasangan SATU-SATU yang jawabannya semua berbeda (istilah–pengertian, tokoh–karya, kata–arti). Materi pengelompokan (beberapa hal masuk ke kelompok yang sama) jangan dijadikan MJ.`;

/** Baris kisi-kisi dalam bentuk ringkas untuk permintaan soal. */
const tulisKisi = (k: BarisKisi) =>
  `- Nomor ${k.no} | ${k.bentuk} | ${k.tp} | ${k.level} | dalil_id: ${k.dalil_id ?? "null"} | Indikator: ${k.indikator} | Stimulus: ${k.grup && k.wacana ? `WACANA GRUP ${k.grup}` : k.stimulus}${k.jawaban ? ` | Jawaban (kunci): ${k.jawaban}` : ""}`;

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
      : s.bentuk === "ISIAN" ? kunci[0] : "";
  // 0.19.0: isi Menjodohkan & Kategori ikut dikirim; dulu hanya perintahnya ("Jodohkan ...!") sehingga AI membuat
  // pasangan yang sama lagi (audit 2026-11-07, set 70 no. 19 & 20).
  const isi = s.bentuk === "MJ" ? [...(s.premis ?? s.pasangan?.map((p) => p.premis) ?? []), ...(s.jawaban ?? s.pasangan?.map((p) => p.jawaban) ?? [])] : s.pernyataan ?? [];
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
export function buatPenggantiPengguna(p: Pengaturan, lama: Soal, semua: Soal[], kisi?: BarisKisi, instruksi = "", maksInstruksi = MAKS_INSTRUKSI) {
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
Kembalikan tepat 1 soal hasil perubahan. Bagian yang tidak diminta untuk diubah biarkan sama. "level" dan "tp" boleh berubah bila instruksi menuntutnya.
Tambahkan field "indikator" (indikator soal gaya Kemenag yang sesuai dengan soal hasil perubahan) dan "stimulus" (jenis + skenario, maks 15 kata, atau "tanpa stimulus").\n`;
    return buatPengguna(p, jumlah, semua.filter((s) => s !== lama).map(ringkasSudah), tambahan);
  }
  const sasaran = kisi?.grup && lama.wacana
    ? `dengan bentuk ${kisi.bentuk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}", dan tetap memakai WACANA GRUP ${lama.grup} di bawah (soal grup), dengan pokok soal yang berbeda dari soal yang diganti`
    : kisi
    ? `dengan bentuk ${kisi.bentuk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}". Skenario lama ("${kisi.stimulus}") JANGAN dipakai lagi; pilih skenario baru yang belum ada di set ini. Tambahkan field "stimulus" pada soal berisi jenis + skenario baru (maks 15 kata) atau "tanpa stimulus"`
    : `${lama.bentuk} pengganti dengan level ${lama.level} dan ${lama.tp} (abaikan komposisi level di atas)`;
  const tambahan = `\nIni permintaan MENGGANTI soal berikut (guru tidak memakainya): "${lama.pertanyaan.slice(0, 300)}"
Buat tepat 1 soal ${sasaran}. Gunakan ${kisi?.grup && lama.wacana ? "" : "skenario, "}sudut pandang dan redaksi yang berbeda dari soal yang diganti maupun soal lain di daftar.\n${kisi?.grup ? tulisWacana([lama]) : ""}`;
  return buatPengguna(p, jumlah, semua.map(ringkasSudah), tambahan);
}
