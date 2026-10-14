import type { Bab, Bentuk } from "./soal";

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
export const MAKS_SOAL = 25; // batas output model (±8.000 token)

export type Pengaturan = {
  babId: string;
  tujuan: string;
  jumlah: Record<Bentuk, number>;
  level: { LOTS: number; MOTS: number; HOTS: number };
  kesulitan: string;
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
  return { babId: String(p.babId), tujuan: p.tujuan, jumlah, level, kesulitan: p.kesulitan };
}

export function buatPrompt(bab: Bab, p: Pengaturan) {
  const dalil = bab.dalil
    .map((d) => {
      const mufradat = d.mufradat.map((m) => `${m.arab} = ${m.arti}`).join("; ");
      return `[dalil_id: ${d.id}] ${d.sumber}\nArab: ${d.arab}\nTerjemah: ${d.terjemah}${mufradat ? `\nMufradat: ${mufradat}` : ""}`;
    })
    .join("\n\n");

  const sistem = `Anda guru ahli penyusun soal Al-Qur'an Hadis untuk madrasah aliyah (kurikulum Kemenag).
Tugas: menyusun soal HANYA dari DATA BAB di bawah. Jangan menambah fakta, tafsir, atau dalil dari luar data.

ATURAN TEKS ARAB (WAJIB):
- Jangan pernah mengetik ulang ayat atau hadis utuh.
- Jika soal perlu menampilkan ayat/hadis, isi "dalil_id" dengan id dalil dari data. Aplikasi akan menampilkan teks Arab terverifikasi di atas pertanyaan; cukup tulis misalnya "Perhatikan firman Allah Swt. berikut!".
- Jika perlu mengutip lafaz pendek (misalnya mufradat), salin PERSIS huruf dan harakatnya dari data. Selain itu jangan menulis huruf Arab sama sekali; gunakan transliterasi Latin.

ATURAN KUALITAS SOAL:
- Pokok soal jelas dan tidak ambigu; tidak ada petunjuk jawaban tersembunyi.
- Pengecoh masuk akal, homogen, dan panjang pilihan relatif seimbang.
- Hindari pilihan "semua benar" / "semua salah".
- Soal tidak saling mirip; sebar ke seluruh dalil, materi, dan TP.
- Tulis pilihan TANPA huruf A–E di depannya. Pembahasan TIDAK menyebut huruf pilihan (urutan pilihan PG dan PGK akan diacak ulang oleh aplikasi).
- Level kognitif Bloom C1–C6: LOTS = C1–C2, MOTS = C3, HOTS = C4–C6. Soal HOTS memakai stimulus kasus/fenomena remaja yang relevan.

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

  const urutan = (Object.keys(NAMA_BENTUK) as Bentuk[]).filter((b) => p.jumlah[b] > 0);
  const tujuan = p.tujuan as (typeof TUJUAN)[number];
  const kesulitan = p.kesulitan as (typeof KESULITAN)[number];
  const pengguna = `Buat soal untuk ${tujuan}. Aturan ${tujuan}: ${ATURAN_TUJUAN[tujuan].aturan}
Tingkat kesulitan: ${kesulitan}. Artinya: ${ATURAN_KESULITAN[kesulitan]}
Jumlah: ${urutan.map((b) => `${b} ${p.jumlah[b]}`).join(", ")}. Urutkan per bentuk: ${urutan.join(", ")}.
Komposisi level: LOTS ${p.level.LOTS}%, MOTS ${p.level.MOTS}%, HOTS ${p.level.HOTS}%.
Balas hanya dengan JSON sesuai format.`;

  return { sistem, pengguna };
}
