import type { Bab, Bentuk, Soal } from "./soal";

export const TUJUAN = ["Ulangan Harian", "PTS", "PAS", "Latihan"] as const;
export const KESULITAN = ["Mudah", "Sedang", "Sulit"] as const;

const ATURAN_UJIAN = "Gaya soal ujian resmi madrasah (seperti asesmen tengah/akhir semester). Sebar soal merata ke semua TP dan semua dalil. Bahasa baku. Pembahasan ringkas (1–2 kalimat).";

/** Aturan tiap tujuan soal + komposisi level bawaan (terisi otomatis di form, tetap bisa diubah). */
export const ATURAN_TUJUAN: Record<(typeof TUJUAN)[number], { aturan: string; level: { LOTS: number; MOTS: number; HOTS: number } }> = {
  Latihan: {
    aturan: "Pembahasan mendidik (3–4 kalimat): jelaskan mengapa jawaban benar tepat DAN mengapa pengecoh salah dengan menyebut isinya (bukan hurufnya), agar siswa bisa belajar mandiri.",
    level: { LOTS: 40, MOTS: 40, HOTS: 20 },
  },
  "Ulangan Harian": {
    aturan: "Pastikan setiap TP bab mendapat soal untuk mengecek ketercapaiannya. Bahasa baku. Pembahasan ringkas (1–2 kalimat).",
    level: { LOTS: 40, MOTS: 40, HOTS: 20 },
  },
  PTS: { aturan: ATURAN_UJIAN, level: { LOTS: 30, MOTS: 40, HOTS: 30 } },
  PAS: { aturan: ATURAN_UJIAN, level: { LOTS: 30, MOTS: 40, HOTS: 30 } },
};

export const ATURAN_KESULITAN: Record<(typeof KESULITAN)[number], string> = {
  Mudah: "Pokok soal langsung dan pendek, cukup satu langkah berpikir, tanpa stimulus panjang. Pengecoh jelas berbeda dari jawaban benar.",
  Sedang: "Pokok soal menuntut pemahaman konsep, boleh memakai stimulus pendek. Pengecoh masuk akal dan mirip dengan jawaban benar.",
  Sulit: "Gunakan stimulus kasus atau perbandingan dua dalil/konsep yang menuntut beberapa langkah berpikir. Pengecoh sangat homogen dan hanya berbeda tipis, tetapi tetap jelas salah bagi siswa yang memahami materi.",
};
export const NAMA_BENTUK: Record<Bentuk, string> = {
  PG: "Pilihan Ganda",
  PGK: "Pilihan Ganda Kompleks",
  BS: "Benar / Salah",
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
};

/** Rapikan isian form dari browser (tidak dipercaya begitu saja). Mengembalikan pesan kalau tidak valid. */
export function bersihkanPengaturan(p: Pengaturan): Pengaturan | string {
  const angka = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const jumlah = { PG: angka(p?.jumlah?.PG), PGK: angka(p?.jumlah?.PGK), BS: angka(p?.jumlah?.BS), URAIAN: angka(p?.jumlah?.URAIAN) };
  const level = { LOTS: angka(p?.level?.LOTS), MOTS: angka(p?.level?.MOTS), HOTS: angka(p?.level?.HOTS) };
  const total = jumlah.PG + jumlah.PGK + jumlah.BS + jumlah.URAIAN;
  if (total < 1 || total > MAKS_SOAL) return `Jumlah soal harus 1 sampai ${MAKS_SOAL}.`;
  if (level.LOTS + level.MOTS + level.HOTS !== 100) return "Komposisi LOTS + MOTS + HOTS harus 100%.";
  if (!(TUJUAN as readonly string[]).includes(p?.tujuan)) return "Tujuan soal tidak dikenal.";
  if (!(KESULITAN as readonly string[]).includes(p?.kesulitan)) return "Tingkat kesulitan tidak dikenal.";
  const bobotDari = (b: Bentuk) => angka(p?.bobot?.[b] ?? BOBOT_BAWAAN[b]);
  const bobot = { PG: bobotDari("PG"), PGK: bobotDari("PGK"), BS: bobotDari("BS"), URAIAN: bobotDari("URAIAN") };
  const modelSlot = Math.max(1, Math.min(9, Math.round(Number(p?.modelSlot) || 1)));
  return { babId: String(p.babId), tujuan: p.tujuan, jumlah, level, kesulitan: p.kesulitan, bobot, modelSlot };
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

  return `Anda guru ahli penyusun soal Al-Qur'an Hadis untuk madrasah aliyah (kurikulum Kemenag).
Tugas: menyusun soal HANYA dari DATA BAB di bawah. Jangan menambah fakta, tafsir, atau dalil dari luar data.

ATURAN TEKS ARAB (WAJIB):
- Jangan pernah mengetik ulang ayat atau hadis utuh.
- Jika soal perlu menampilkan ayat/hadis, isi "dalil_id" dengan id dalil dari data. Aplikasi akan menampilkan teks Arab terverifikasi di atas pertanyaan; cukup tulis misalnya "Perhatikan firman Allah Swt. berikut!". JANGAN menulis id dalil (misalnya "isra-32") di dalam teks pertanyaan, pilihan, atau pembahasan.
- Jika perlu mengutip lafaz pendek (misalnya mufradat), salin PERSIS huruf dan harakatnya dari data. Selain itu jangan menulis huruf Arab sama sekali; gunakan transliterasi Latin.

ATURAN KUALITAS SOAL:
- Pokok soal jelas dan tidak ambigu; tidak ada petunjuk jawaban tersembunyi.
- Pengecoh masuk akal, homogen, dan panjang pilihan relatif seimbang.
- Hindari pilihan "semua benar" / "semua salah".
- JANGAN merujuk ke sumber data di soal, pilihan, maupun pembahasan: tanpa frasa "menurut materi", "berdasarkan materi", "dalam bab ini", "sesuai data", "teks di atas", "bacaan", dan sejenisnya (siswa sudah tahu soal berasal dari pelajaran). Jika perlu menyebut sumber, sebut sumber aslinya, misalnya "Menurut QS. An-Nūr [24]: 2", "Imam al-Qurṭubī menjelaskan", atau "Berdasarkan hadis riwayat Bukhari dan Muslim".
- Soal tidak saling mirip; sebar ke seluruh dalil, materi, dan TP.
- Tulis pilihan TANPA huruf A–E di depannya. Pembahasan TIDAK menyebut huruf pilihan (urutan pilihan PG dan PGK akan diacak ulang oleh aplikasi).
- Level kognitif Bloom C1–C6: LOTS = C1–C2, MOTS = C3, HOTS = C4–C6. Soal HOTS memakai stimulus kasus/fenomena remaja yang relevan.

VARIASI STIMULUS (berlaku untuk seluruh set soal, lintas bentuk soal):
- Ragamkan bentuk stimulus: cuplikan berita atau data, unggahan media sosial, pernyataan seorang tokoh, cerita pendek tentang satu orang, potongan percakapan, situasi di madrasah/rumah/masyarakat, atau tanpa stimulus sama sekali.
- Pola "dua orang/kelompok berdebat atau berbeda pendapat" paling banyak 2 kali dalam satu set.
- Satu skenario atau kasus (misalnya: mendengar lirik lagu, berduaan di ruang kelas, perbedaan hukuman pezina) hanya boleh dipakai SEKALI dalam satu set.
- Tidak semua soal perlu stimulus: soal LOTS cukup berupa pokok soal langsung.

BENTUK SOAL:
- PG: 5 pilihan, tepat 1 benar. "kunci": "A".."E".
- PGK (pilihan ganda kompleks): 5 pilihan, tepat 2 benar. "kunci": array berisi 2 huruf jawaban benar. Akhiri pertanyaan dengan "(Pilih 2 jawaban)".
- BS: satu pernyataan. "kunci": "Benar" atau "Salah". Tanpa "pilihan".
- URAIAN: "kunci" berisi jawaban ideal; "rubrik" berisi kriteria penilaian dan skornya; "skor" = jumlah skor rubrik.

FORMAT JAWABAN: hanya JSON (tanpa teks lain), dengan bentuk:
{"soal":[{"bentuk":"PG","dalil_id":null,"pertanyaan":"...","pilihan":["...","...","...","...","..."],"kunci":"B","pembahasan":"...","level":"C2","tp":"TP 3.2","skor":1}]}
Untuk URAIAN tambahkan "rubrik":[{"kriteria":"...","skor":2}]. "tp" diisi kode TP yang paling sesuai.

DATA BAB
Judul: ${bab.judul}

Tujuan Pembelajaran:
${bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n")}

Dalil:
${dalil}

Materi:
${bab.materi.join("\n")}`;
}

/** Permintaan untuk satu tahap. `sudah` = pertanyaan dari tahap sebelumnya, supaya AI tidak membuat soal yang mirip. */
export function buatPengguna(p: Pengaturan, jumlah: Record<Bentuk, number>, sudah: string[], tambahan = "") {
  const urutan = (Object.keys(NAMA_BENTUK) as Bentuk[]).filter((b) => jumlah[b] > 0);
  const tujuan = p.tujuan as (typeof TUJUAN)[number];
  const kesulitan = p.kesulitan as (typeof KESULITAN)[number];
  const daftarSudah = sudah.length
    ? `\nSoal berikut SUDAH dibuat dalam set ini. Jangan membuat soal yang sama atau mirip (pokok bahasan maupun redaksinya), jangan memakai lagi skenario/kasus yang sama, dan hitung pola "berdebat/berbeda pendapat" yang sudah ada di daftar ini terhadap batas 2 kali. Ambil sisi materi, dalil, atau TP yang lain:\n${sudah.map((s) => `- ${s.slice(0, 160)}`).join("\n")}\n`
    : "";
  return `Buat soal untuk ${tujuan}. Aturan ${tujuan}: ${ATURAN_TUJUAN[tujuan].aturan}
Tingkat kesulitan: ${kesulitan}. Artinya: ${ATURAN_KESULITAN[kesulitan]}
Jumlah: ${urutan.map((b) => `${b} ${jumlah[b]}`).join(", ")}. Urutkan per bentuk: ${urutan.join(", ")}.
Komposisi level: LOTS ${p.level.LOTS}%, MOTS ${p.level.MOTS}%, HOTS ${p.level.HOTS}%.
${daftarSudah}${tambahan}Balas hanya dengan JSON sesuai format.`;
}

/** Permintaan "ganti satu soal": 1 soal baru dengan bentuk, level, dan TP yang sama, tapi berbeda dari semua soal di set. */
export function buatPenggantiPengguna(p: Pengaturan, lama: Soal, semua: Soal[]) {
  const jumlah = { PG: 0, PGK: 0, BS: 0, URAIAN: 0, [lama.bentuk]: 1 };
  const tambahan = `\nIni permintaan MENGGANTI soal berikut (guru tidak memakainya): "${lama.pertanyaan.slice(0, 300)}"
Buat tepat 1 soal ${lama.bentuk} pengganti dengan level ${lama.level} dan ${lama.tp} (abaikan komposisi level di atas). Gunakan skenario, sudut pandang, dan redaksi yang berbeda dari soal yang diganti maupun soal lain di daftar.\n`;
  return buatPengguna(p, jumlah, semua.map((s) => s.pertanyaan), tambahan);
}
