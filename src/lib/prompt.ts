import { identitasBab, MAKS_GABUNG, type Bab, type BarisKisi, type Bentuk, type Soal } from "./soal.ts";

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
  Mudah: "Pokok soal langsung dan pendek, cukup satu langkah berpikir, tanpa stimulus panjang. Pengecoh jelas berbeda dari jawaban benar.",
  Sedang: "Pokok soal menuntut pemahaman konsep, boleh memakai stimulus pendek. Pengecoh masuk akal dan mirip dengan jawaban benar.",
  Sulit: "Gunakan stimulus kasus, data, atau perbandingan dua konsep/kondisi yang menuntut beberapa langkah berpikir. Pengecoh sangat homogen dan hanya berbeda tipis, tetapi tetap jelas salah bagi siswa yang memahami materi.",
};
export const NAMA_BENTUK: Record<Bentuk, string> = {
  PG: "Pilihan Ganda",
  PGK: "Pilihan Ganda Kompleks",
  BS: "Kategori (Benar/Salah)", // kode "BS" dipertahankan agar set lama tetap terbaca
  URAIAN: "Uraian",
};
export const MAKS_SOAL = 40;
// Satu jawaban AI maks ±8.000 token. 10 soal Latihan+Sulit ≈ 14.000 huruf, aman di bawah batas.
export const MAKS_PER_TAHAP = 10;

// Skor per soal seperti format AFTS madrasah (10 PG + 5 PGK + 5 B/S + 5 uraian = 100).
export const BOBOT_BAWAAN: Record<Bentuk, number> = { PG: 2, PGK: 5, BS: 3, URAIAN: 8 };

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

/** Tulisan guru untuk AI: dirapikan, dipotong, dan tanda """ dibuang supaya tidak keluar dari kutipan. */
const bersihkanKutipan = (s: unknown, maks: number) => String(s ?? "").replace(/"{3,}/g, '"').trim().slice(0, maks);
/** Instruksi "Minta perubahan" dari browser. */
export const bersihkanInstruksi = (s: unknown) => bersihkanKutipan(s, MAKS_INSTRUKSI);

/** Rapikan isian form dari browser (tidak dipercaya begitu saja). Mengembalikan pesan kalau tidak valid. */
export function bersihkanPengaturan(p: Pengaturan): Pengaturan | string {
  const angka = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const jumlah = { PG: angka(p?.jumlah?.PG), PGK: angka(p?.jumlah?.PGK), BS: angka(p?.jumlah?.BS), URAIAN: angka(p?.jumlah?.URAIAN) };
  const level = { LOTS: angka(p?.level?.LOTS), MOTS: angka(p?.level?.MOTS), HOTS: angka(p?.level?.HOTS) };
  const total = jumlah.PG + jumlah.PGK + jumlah.BS + jumlah.URAIAN;
  if (total < 1 || total > MAKS_SOAL) return `Jumlah soal harus 1 sampai ${MAKS_SOAL}.`;
  if (level.LOTS + level.MOTS + level.HOTS !== 100) return "Komposisi LOTS + MOTS + HOTS harus 100%.";
  if (!(TUJUAN as readonly string[]).includes(p?.tujuan)) return "Tujuan soal tidak dikenal.";
  if (p.tujuan === TKA && jumlah.URAIAN) return "Latihan TKA tidak memakai soal uraian. Kosongkan jumlah uraian.";
  if (!(KESULITAN as readonly string[]).includes(p?.kesulitan)) return "Tingkat kesulitan tidak dikenal.";
  const bobotDari = (b: Bentuk) => angka(p?.bobot?.[b] ?? BOBOT_BAWAAN[b]);
  const bobot = { PG: bobotDari("PG"), PGK: bobotDari("PGK"), BS: bobotDari("BS"), URAIAN: bobotDari("URAIAN") };
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
 * urut PG → PGK → BS → URAIAN, supaya jawaban AI tidak terpotong.
 */
export function bagiTahap(jumlah: Record<Bentuk, number>, maks = MAKS_PER_TAHAP) {
  const tahap: Record<Bentuk, number>[] = [];
  let isi = 0;
  for (const b of Object.keys(NAMA_BENTUK) as Bentuk[]) {
    let sisa = jumlah[b];
    while (sisa > 0) {
      if (!tahap.length || isi === maks) {
        tahap.push({ PG: 0, PGK: 0, BS: 0, URAIAN: 0 });
        isi = 0;
      }
      const ambil = Math.min(sisa, maks - isi);
      tahap[tahap.length - 1][b] += ambil;
      isi += ambil;
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

KAIDAH KONSTRUKSI:
- Pokok soal jelas, tegas, tidak bermakna ganda, hanya memuat yang perlu, dan tidak memberi petunjuk ke jawaban benar.
- Tidak ada negatif ganda (misalnya "yang tidak benar, kecuali"). Kata negatif di pokok soal ditulis kapital: BUKAN, KECUALI, TIDAK.
- Pengecoh masuk akal, homogen, panjang pilihan relatif seimbang. Hindari pilihan "semua benar" / "semua salah".
- Pilihan berupa angka, tahun, atau urutan ditulis berurutan (kecil → besar, lama → baru).
- Setiap soal berdiri sendiri: tidak bergantung pada jawaban soal lain.
- Soal tidak saling mirip; sebar ke seluruh TP dan materi${adaDalil ? " (dan dalil)" : ""}.
- Tulis pilihan TANPA huruf A–E di depannya. Pembahasan TIDAK menyebut huruf pilihan (urutan pilihan PG dan PGK akan diacak ulang oleh aplikasi).
- JANGAN merujuk ke sumber data di soal, pilihan, maupun pembahasan: tanpa frasa "menurut materi", "berdasarkan materi", "dalam bab ini", "sesuai data", "teks di atas", "bacaan", dan sejenisnya (siswa sudah tahu soal berasal dari pelajaran). Jika perlu menyebut sumber, sebut sumber aslinya (nama tokoh, kitab, buku, undang-undang, atau ${adaDalil ? 'dalil, misalnya "Menurut QS. An-Nūr [24]: 2"' : "peristiwa"}).

KAIDAH BAHASA:
- Bahasa Indonesia baku, efektif, komunikatif, sesuai usia siswa MA. Tanpa bahasa daerah atau bahasa gaul (kecuali kutipan stimulus yang memang perlu).
- Mapel bahasa asing (Bahasa Arab, Bahasa Inggris, dll.): soal boleh ditulis dalam bahasa tersebut.

LEVEL KOGNITIF (taksonomi Bloom revisi):
- C1 mengingat, C2 memahami, C3 menerapkan, C4 menganalisis, C5 mengevaluasi, C6 mencipta. LOTS = C1–C2, MOTS = C3, HOTS = C4–C6.
- Level ditentukan oleh proses berpikir yang dibutuhkan siswa, BUKAN oleh kata kerja di soal. Soal "Analisislah ..." yang jawabannya bisa dihafal tetap C1.
- HOTS bukan berarti sulit: HOTS = menalar. Soal HOTS WAJIB memakai stimulus baru (kasus, data, teks, fenomena) dan jawabannya diperoleh dengan mengolah stimulus itu, bukan hafalan.
- Soal C1–C2 cukup pokok soal langsung, tanpa stimulus panjang.

STIMULUS (berlaku untuk seluruh set soal, lintas bentuk soal):
- Kontekstual dan dekat dengan kehidupan siswa MA (madrasah, pesantren, keluarga, masyarakat, media sosial).
- Ragamkan bentuknya: kasus/cerita pendek tentang satu orang, cuplikan berita, data/tabel (ditulis sebagai teks), grafik atau gambar yang dideskripsikan dengan kata, teks bacaan, potongan percakapan, kutipan tokoh, hasil percobaan (boleh dengan kelompok kontrol), perbandingan dua kondisi (misalnya wilayah X dan Y), potongan dokumen sejarah, atau tanpa stimulus.
- Aplikasi tidak bisa menampilkan gambar: jangan menulis "perhatikan gambar berikut" kecuali gambarnya dideskripsikan lengkap dengan kata.
- Susunan baris: percakapan/dialog/hiwar ditulis SATU PENUTUR PER BARIS dengan format "Nama: ucapan", baris dipisah baris baru (\\n di dalam teks JSON). Daftar bernomor, langkah prosedur, puisi/syair, dan surat/pesan singkat juga satu bagian per baris. Kalimat pengantar ("Perhatikan percakapan berikut!") dan perintah soal ditulis di baris sendiri. Teks cerita atau uraian biasa tetap satu paragraf. Berlaku untuk "pertanyaan", "wacana", "pilihan", dan "pernyataan".
- Pola "dua orang/kelompok berdebat atau berbeda pendapat" paling banyak 2 kali dalam satu set.
- Satu skenario atau kasus hanya boleh dipakai SEKALI dalam satu set.
- Boleh menyisipkan nilai Panca Cinta (Cinta Allah dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama, Cinta Tanah Air) secara wajar pada tokoh/cerita, tanpa menggurui dan tanpa mengubah kunci. Tidak wajib di setiap soal.

PENGECOH DAN PEMBAHASAN:
- Pernyataan/pilihan salah dibuat dengan mengubah SATU konsep kunci dari pernyataan benar (sebab-akibat dibalik, istilah tertukar, naik/turun, terbesar/terkecil). Jebakan harus pada konsep, bukan permainan kata yang menyesatkan.
- Pembahasan menjelaskan mengapa kunci benar DAN mengapa setiap pengecoh salah, dengan menyebut isinya (bukan hurufnya).
- Jika soal memuat perhitungan, pembahasan WAJIB memuat langkah hitung lengkap sampai hasil akhir.

${BENTUK_SOAL}

FORMAT JAWABAN (kecuali permintaan menyebut format lain): hanya JSON (tanpa teks lain), dengan bentuk:
{"soal":[{"bentuk":"PG","dalil_id":null,"pertanyaan":"...","pilihan":["...","...","...","...","..."],"kunci":"B","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}]}
Untuk BS: {"bentuk":"BS","dalil_id":null,"pertanyaan":"...","pernyataan":["...","...","...","..."],"label":["Fakta","Opini"],"kunci":["Fakta","Opini","Opini","Fakta"],"pembahasan":"...","level":"C4","tp":"TP 3.2","skor":1}
Untuk URAIAN tambahkan "rubrik":[{"kriteria":"...","skor":2}]. "tp" diisi kode TP yang paling sesuai.

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
 * Analisa materi baru dari halaman utama: judul, usulan TP, pokok materi, dan sumber/terjemah dalil yang tertulis
 * di teks. Hasil dicek lagi oleh terapkanAnalisa (src/lib/materi.ts): yang tidak tertulis di teks guru dibuang.
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
- "tp": 3–6 Tujuan Pembelajaran gaya Kemenag, diawali "Peserta didik mampu ...", kata kerja operasional, sesuai isi teks, urut dari mudah ke sulit. Bila teks memuat TP/ATP, salin TP itu.
- "pokok": 4–10 pokok materi yang bisa diuji (maks 15 kata per poin).
- "dalil": untuk setiap [DALIL n]: "sumber" (mis. "HR. Bukhari dan Muslim") dan "terjemah" HANYA bila tertulis di teks di dekat dalil itu, disalin PERSIS kata per kata; kalau tidak tertulis, isi "". Jangan menerjemahkan sendiri.
- "catatan": satu kalimat bila teks terlalu sedikit atau kurang jelas untuk dibuat soal; selain itu "".`;
  return { sistem, pengguna };
}

const BENTUK_SOAL = `BENTUK SOAL:
- PG: 5 pilihan, tepat 1 benar. "kunci": "A".."E".
- PGK (pilihan ganda kompleks, model jawaban ganda/MCMA): 5 pilihan, 2 ATAU 3 benar (tidak semua), sesuai isi soal; ragamkan jumlahnya dalam satu set. "kunci": array berisi 2 atau 3 huruf jawaban benar. Akhiri pertanyaan dengan "(Pilih semua jawaban yang tepat)" tanpa menyebut jumlah jawaban benar.
- BS (pilihan ganda kompleks model Kategori): "pertanyaan" berisi stimulus/pokok soal + perintah, misalnya "Tentukan apakah setiap pernyataan berikut Benar atau Salah!". Lalu tepat 4 "pernyataan" yang masing-masing dinilai dengan sepasang "label", salah satu dari: ["Benar","Salah"], ["Fakta","Opini"], ["Sesuai","Tidak Sesuai"], ["Tepat","Tidak Tepat"], ["Didukung","Tidak Didukung"] (didukung/tidak oleh stimulus). Pilih pasangan label yang paling cocok dengan isi soal dan ragamkan dalam satu set. "kunci": array 4 label sesuai urutan pernyataan; jangan semua sama. Jangan menulis ulang keempat pernyataan di dalam "pertanyaan" (aplikasi menampilkannya sebagai tabel). Tanpa "pilihan".
- URAIAN: "kunci" berisi jawaban ideal; "rubrik" berisi kriteria penilaian dan skornya; "skor" = jumlah skor rubrik.`;

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
  return `Tujuan: ${nama}. Aturan ${namaTujuan(tujuan)}: ${ATURAN_TUJUAN[tujuan].aturan}
Tingkat kesulitan: ${kesulitan}. Artinya: ${ATURAN_KESULITAN[kesulitan]}
${catatanGuru}`;
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
${tanpaArab ? 'Di kisi-kisi JANGAN menulis huruf Arab sama sekali; sebut lafaz dengan transliterasi Latin (misalnya "lā taqrabū az-zinā").' : "Di kisi-kisi boleh menulis kosakata/kalimat Arab buatan sendiri, tetapi JANGAN menulis ayat atau hadis."}
${p.tujuan === TKA ? `${SOAL_GRUP}${tanpaArab ? " Wacana tanpa huruf Arab." : " Wacana boleh berbahasa Arab, tetapi bukan ayat atau hadis."}\n` : ""}${p.catatan ? `${TANGGAPAN}\n` : ""}FORMAT JAWABAN untuk permintaan ini: hanya JSON {${p.catatan ? '"tanggapan":"...",' : ""}"kisi":[{"bentuk":"PG","tp":"TP 3.1","materi":"...","indikator":"...","level":"C2","dalil_id":null,"stimulus":"tanpa stimulus"${p.tujuan === TKA ? ',"grup":null' : ""}}]${p.tujuan === TKA ? ',"wacana":[{"grup":1,"teks":"..."}]' : ""}}`;
}

// ATURAN-SOAL.md bagian 9 no. 4: soal grup TKA. Dibatasi bentuk sama supaya lembar soal tetap per bagian bentuk.
const SOAL_GRUP = `SOAL GRUP (gaya TKA): nomor yang ditandai GRUP N di atas SUDAH DITENTUKAN sebagai soal grup: semua nomor dengan GRUP yang sama memakai SATU wacana bersama.
- Isi "grup" setiap baris dengan nomor grupnya, atau null untuk soal tunggal. Soal dalam satu grup mengukur indikator yang berbeda.
- WAJIB tulis wacana setiap grup di "wacana": teks lengkap 80–200 kata yang belum pernah dibaca siswa (bacaan, data/tabel ditulis sebagai teks, kasus, atau hasil percobaan).
- "stimulus" baris grup diisi "wacana grup N".`;

// ATURAN-SOAL.md bagian 6 no. 2: AI menjawab catatan guru; tampil di paling atas hasil soal.
const TANGGAPAN = `Isi juga "tanggapan": balasan singkat untuk guru (maks 3 kalimat, sapa dengan "Anda") tentang catatannya: apa yang Anda ikuti dan bagaimana, serta bagian yang TIDAK bisa diikuti beserta alasannya. Bila meminta jumlah/bentuk soal lain, arahkan ke tombol jumlah soal di form; bila meminta komposisi level lain, arahkan ke menu Lanjutan.`;

/** Baris kisi-kisi dalam bentuk ringkas untuk permintaan soal. */
const tulisKisi = (k: BarisKisi) =>
  `- Nomor ${k.no} | ${k.bentuk} | ${k.tp} | ${k.level} | dalil_id: ${k.dalil_id ?? "null"} | Indikator: ${k.indikator} | Stimulus: ${k.grup && k.wacana ? `WACANA GRUP ${k.grup}` : k.stimulus}`;

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

/**
 * Permintaan untuk satu tahap. `sudah` = pertanyaan dari tahap sebelumnya, supaya AI tidak membuat soal yang mirip.
 * `kisi` = baris kisi-kisi untuk tahap ini (set lama tanpa kisi-kisi: kosong, pakai komposisi level).
 */
export function buatPengguna(p: Pengaturan, jumlah: Record<Bentuk, number>, sudah: string[], tambahan = "", kisi: BarisKisi[] = []) {
  const urutan = urutanBentuk(jumlah);
  const daftarSudah = sudah.length
    ? `\nSoal berikut SUDAH dibuat dalam set ini. Jangan membuat soal yang sama atau mirip (pokok bahasan maupun redaksinya), jangan memakai lagi skenario/kasus yang sama, dan hitung pola "berdebat/berbeda pendapat" yang sudah ada di daftar ini terhadap batas 2 kali. Ambil sisi materi, dalil, atau TP yang lain:\n${sudah.map((s) => `- ${s.slice(0, 160)}`).join("\n")}\n`
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
export function buatPenggantiPengguna(p: Pengaturan, lama: Soal, semua: Soal[], kisi?: BarisKisi, instruksi = "") {
  const jumlah = { PG: 0, PGK: 0, BS: 0, URAIAN: 0, [lama.bentuk]: 1 };
  if (instruksi) {
    // "Minta perubahan": soal yang sama ditulis ulang sesuai instruksi guru. Instruksi tidak boleh mengalahkan aturan sistem.
    const { peringatan, stimulus, grup, wacana, ...isiLama } = lama;
    void peringatan;
    void stimulus;
    const tambahan = `\nIni permintaan MENGUBAH satu soal sesuai instruksi guru. Soal saat ini (JSON):
${JSON.stringify(isiLama)}
${kisi ? `Kisi-kisinya: indikator "${kisi.indikator}", stimulus "${kisi.stimulus}".\n` : ""}${tulisWacana([{ grup, wacana }])}Instruksi guru (ikuti selama tidak bertentangan dengan aturan di instruksi sistem: jangan mengetik ayat/hadis, jangan memakai dalil atau fakta di luar data bab, tetap bentuk ${lama.bentuk}):
"""${bersihkanInstruksi(instruksi)}"""
Kembalikan tepat 1 soal hasil perubahan. Bagian yang tidak diminta untuk diubah biarkan sama. "level" dan "tp" boleh berubah bila instruksi menuntutnya.
Tambahkan field "indikator" (indikator soal gaya Kemenag yang sesuai dengan soal hasil perubahan) dan "stimulus" (jenis + skenario, maks 15 kata, atau "tanpa stimulus").\n`;
    return buatPengguna(p, jumlah, semua.filter((s) => s !== lama).map((s) => s.pertanyaan), tambahan);
  }
  const sasaran = kisi?.grup && lama.wacana
    ? `dengan bentuk ${kisi.bentuk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}", dan tetap memakai WACANA GRUP ${lama.grup} di bawah (soal grup), dengan pokok soal yang berbeda dari soal yang diganti`
    : kisi
    ? `dengan bentuk ${kisi.bentuk}, ${kisi.tp}, level ${kisi.level}, tetap mengukur indikator: "${kisi.indikator}". Skenario lama ("${kisi.stimulus}") JANGAN dipakai lagi; pilih skenario baru yang belum ada di set ini. Tambahkan field "stimulus" pada soal berisi jenis + skenario baru (maks 15 kata) atau "tanpa stimulus"`
    : `${lama.bentuk} pengganti dengan level ${lama.level} dan ${lama.tp} (abaikan komposisi level di atas)`;
  const tambahan = `\nIni permintaan MENGGANTI soal berikut (guru tidak memakainya): "${lama.pertanyaan.slice(0, 300)}"
Buat tepat 1 soal ${sasaran}. Gunakan ${kisi?.grup && lama.wacana ? "" : "skenario, "}sudut pandang dan redaksi yang berbeda dari soal yang diganti maupun soal lain di daftar.\n${kisi?.grup ? tulisWacana([lama]) : ""}`;
  return buatPengguna(p, jumlah, semua.map((s) => s.pertanyaan), tambahan);
}
