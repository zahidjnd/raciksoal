// Pemeriksaan hasil AI. Tanpa import "@/..." supaya bisa dites langsung: npm test

export type Bentuk = "PG" | "PGK" | "BS" | "URAIAN";

export type Soal = {
  bentuk: Bentuk;
  dalil_id: string | null;
  pertanyaan: string;
  pilihan?: string[];
  kunci: string | string[];
  rubrik?: { kriteria: string; skor: number }[];
  pembahasan: string;
  level: string;
  tp: string;
  skor: number;
  peringatan?: string[]; // diisi aplikasi, bukan AI
  stimulus?: string; // hanya pada jawaban "ganti satu soal": ringkasan skenario baru untuk kisi-kisi
  indikator?: string; // hanya pada jawaban "minta perubahan": indikator baru untuk kisi-kisi
};

export type Bab = {
  id: string;
  judul: string;
  tp: { kode: string; teks: string }[];
  // mushaf: teks Arab diambil/dicocokkan dari data mushaf (langkah 9), bukan ketikan guru
  dalil: { id: string; sumber: string; arab: string; terjemah: string; mufradat: { arab: string; arti: string }[]; mushaf?: boolean }[];
  materi: string[];
};

/** Satu baris kisi-kisi = rencana satu soal (langkah 6). Disusun AI dulu, lalu soal ditulis mengikuti barisnya. */
export type BarisKisi = {
  no: number;
  bentuk: Bentuk;
  tp: string;
  materi: string;
  indikator: string;
  level: string;
  dalil_id: string | null;
  stimulus: string; // jenis + skenario singkat, supaya skenario tidak berulang dalam satu set
  peringatan?: string[]; // diisi aplikasi (aturan 5: teks Arab tak terverifikasi)
};

const URUTAN_BENTUK: Bentuk[] = ["PG", "PGK", "BS", "URAIAN"];

/**
 * Rapikan kisi-kisi dari AI: jumlah baris per bentuk harus pas dengan permintaan (kelebihan dibuang),
 * diurutkan PG → PGK → BS → URAIAN dan diberi nomor. Dalil yang tidak ada di data bab dikosongkan.
 * Melempar error kalau ada bentuk yang kurang (supaya model cadangan dicoba).
 */
export function periksaKisi(data: unknown, jumlah: Record<Bentuk, number>, bab: Bab): BarisKisi[] {
  const teks = (x: unknown) => String(x ?? "").trim();
  const mentah = Array.isArray(data) ? (data as Partial<BarisKisi>[]) : [];
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  const korpus = korpusArab(bab);
  const hasil = URUTAN_BENTUK.flatMap((b) => {
    const baris = mentah.filter((k) => teks(k?.bentuk).toUpperCase() === b).slice(0, jumlah[b]);
    if (baris.length < jumlah[b]) throw new Error(`kisi-kisi ${b} hanya ${baris.length} dari ${jumlah[b]} baris.`);
    return baris.map((k) => {
      const isi = { materi: teks(k.materi), indikator: teks(k.indikator), stimulus: teks(k.stimulus) };
      const arabAsing = Object.values(isi).flatMap((t) => arabTakTerverifikasi(t, korpus));
      return {
        no: 0,
        bentuk: b,
        tp: teks(k.tp),
        ...isi,
        level: teks(k.level).toUpperCase(),
        dalil_id: k.dalil_id && dalilAda.has(teks(k.dalil_id)) ? teks(k.dalil_id) : null,
        peringatan: arabAsing.length ? [`Teks Arab tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`] : [],
      };
    });
  });
  return hasil.map((k, i) => ({ ...k, no: i + 1 }));
}

/** Samakan bentuk, TP, dan level soal dengan baris kisi-kisinya (kisi-kisi = rencana yang dipegang). */
export function samakanDenganKisi(soal: Soal, k: BarisKisi): Soal {
  return { ...soal, bentuk: k.bentuk, tp: k.tp || soal.tp, level: LEVEL.includes(k.level) ? k.level : soal.level };
}

const HURUF_ARAB ="؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
// Satu potongan teks Arab: huruf Arab, boleh berisi spasi di tengah.
export const POLA_ARAB = `[${HURUF_ARAB}]+(?:[\\s${HURUF_ARAB}]*[${HURUF_ARAB}])?`;
const rapikan = (s: string) => s.replace(/\s+/g, " ").normalize("NFC");

/** Semua teks Arab terverifikasi milik bab (ayat, hadis, mufradat, materi) dalam satu teks. */
export const korpusArab = (bab: Bab) => rapikan(JSON.stringify(bab));

/** Potongan teks Arab yang TIDAK ada persis (huruf + harakat) di data terverifikasi. Harus kosong. */
export function arabTakTerverifikasi(teks: string, korpus: string): string[] {
  return (teks.match(new RegExp(POLA_ARAB, "g")) ?? []).filter((p) => !korpus.includes(rapikan(p)));
}

export const LEVEL = ["C1", "C2", "C3", "C4", "C5", "C6"];

/** Rapikan soal hasil edit guru (data dari browser tidak dipercaya begitu saja). Bentuk soal tidak bisa diubah. */
export function rapikanSoal(s: Partial<Soal>, bentuk: Bentuk): Soal {
  const teks = (x: unknown) => String(x ?? "").trim();
  const kunci = [s.kunci].flat().map(teks).filter(Boolean);
  const rubrik = (s.rubrik ?? []).map((r) => ({ kriteria: teks(r?.kriteria), skor: Math.max(0, Number(r?.skor) || 0) })).filter((r) => r.kriteria);
  return {
    bentuk,
    dalil_id: s.dalil_id ? teks(s.dalil_id) : null,
    pertanyaan: teks(s.pertanyaan),
    ...(bentuk === "PG" || bentuk === "PGK" ? { pilihan: [0, 1, 2, 3, 4].map((i) => teks(s.pilihan?.[i])) } : {}),
    kunci: bentuk === "PGK" ? kunci : (kunci[0] ?? ""),
    ...(bentuk === "URAIAN" ? { rubrik } : {}),
    pembahasan: teks(s.pembahasan),
    level: teks(s.level),
    tp: teks(s.tp),
    skor: bentuk === "URAIAN" ? rubrik.reduce((n, r) => n + r.skor, 0) : Math.max(0, Number(s.skor) || 0),
  };
}

/**
 * Isi skor tiap soal sesuai bobot bentuknya (bukan dari AI). Rubrik uraian diskalakan
 * proporsional supaya jumlahnya tepat sama dengan bobot uraian.
 */
export function terapkanBobot(soal: Soal[], bobot: Record<Bentuk, number>): void {
  for (const s of soal) {
    const target = bobot[s.bentuk];
    if (!(target >= 0)) continue;
    s.skor = target;
    const rubrik = s.rubrik ?? [];
    const total = rubrik.reduce((n, r) => n + (Number(r.skor) || 0), 0);
    if (s.bentuk !== "URAIAN" || !rubrik.length || total <= 0) continue;
    s.rubrik = rubrik.map((r) => ({ ...r, skor: Math.round(((Number(r.skor) || 0) * target) / total) }));
    // sisa pembulatan diberikan ke kriteria berskor terbesar
    const selisih = target - s.rubrik.reduce((n, r) => n + r.skor, 0);
    const terbesar = s.rubrik.reduce((m, r, i, a) => (r.skor > a[m].skor ? i : m), 0);
    s.rubrik[terbesar].skor += selisih;
  }
}

/**
 * Buang kode dalil yang bocor ke teks, misalnya "(dalil: isra-32)" atau "[dalil_id: nur-2]".
 * Hanya kode yang memang ada di data bab yang dibuang. Mengembalikan teks bersih + kode yang ditemukan.
 */
export function bersihkanKodeDalil(teks: string, idDalil: Set<string>) {
  let ditemukan: string | null = null;
  const bersih = String(teks ?? "")
    .replace(/[([]?\s*dalil(?:_id)?\s*[:=]\s*([a-z0-9-]+)\s*[)\]]?/gi, (asli, id: string) => {
      if (!idDalil.has(id.toLowerCase())) return asli;
      ditemukan ??= id.toLowerCase();
      return "";
    });
  if (!ditemukan) return { bersih: String(teks ?? ""), ditemukan }; // tidak ada kode dalil: teks tidak disentuh
  return {
    bersih: bersih.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    ditemukan,
  };
}

/** Beri peringatan pada soal yang bermasalah. Aturan 5: teks Arab hanya boleh dari data terverifikasi. */
export function periksaSoal(soal: Soal[], bab: Bab): Soal[] {
  const korpus = korpusArab(bab);
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  return soal.map((asli) => {
    // Bersihkan kode dalil yang bocor; kalau AI lupa mengisi dalil_id, pakai kode yang ditemukan di teks.
    let ditemukan: string | null = null;
    const bersih = (t: string) => {
      const r = bersihkanKodeDalil(t, dalilAda);
      ditemukan ??= r.ditemukan;
      return r.bersih;
    };
    const s: Soal = {
      ...asli,
      pertanyaan: bersih(asli.pertanyaan),
      pembahasan: bersih(asli.pembahasan),
      ...(asli.pilihan ? { pilihan: asli.pilihan.map(bersih) } : {}),
    };
    if (!s.dalil_id && ditemukan) s.dalil_id = ditemukan;
    const peringatan: string[] = [];
    const semuaTeks = [s.pertanyaan, ...(s.pilihan ?? []), ...[s.kunci].flat(), s.pembahasan, ...(s.rubrik ?? []).map((r) => r.kriteria)];
    const arabAsing = semuaTeks.flatMap((t) => arabTakTerverifikasi(String(t ?? ""), korpus));
    if (arabAsing.length) peringatan.push(`Teks Arab tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`);
    if (s.dalil_id && !dalilAda.has(s.dalil_id)) peringatan.push(`Dalil "${s.dalil_id}" tidak ada di data bab.`);
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && s.pilihan?.length !== 5) peringatan.push("Jumlah pilihan bukan 5.");
    if (s.bentuk === "PGK" && (!Array.isArray(s.kunci) || s.kunci.length !== 2)) peringatan.push("Kunci PG kompleks bukan 2 jawaban.");
    return { ...s, peringatan };
  });
}

const HURUF = "ABCDE";
// 10 kemungkinan pasangan kunci PG kompleks: [0,1]=AB, [0,2]=AC, ... [3,4]=DE
const PASANGAN = [0, 1, 2, 3].flatMap((a) => [1, 2, 3, 4].filter((b) => b > a).map((b) => [a, b]));

function kocok<T>(arr: T[], acak: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** n target diambil bergiliran dari putaran-putaran acak, sehingga setiap target muncul merata. */
function targetMerata<T>(semua: T[], n: number, acak: () => number): T[] {
  const hasil: T[] = [];
  while (hasil.length < n) hasil.push(...kocok([...semua], acak));
  return hasil.slice(0, n);
}

/** Indeks kunci (0–4) kalau kunci soal valid untuk bentuknya, selain itu null (soal tidak diacak). */
function indeksKunci(s: Soal): number[] | null {
  if (s.pilihan?.length !== 5) return null;
  const kunci = [s.kunci].flat();
  const jumlahBenar = s.bentuk === "PG" ? 1 : s.bentuk === "PGK" ? 2 : 0;
  const idx = [...new Set(kunci.map((h) => HURUF.indexOf(String(h).trim().toUpperCase())))];
  return jumlahBenar && idx.length === jumlahBenar && kunci.length === jumlahBenar && !idx.includes(-1) ? idx : null;
}

/** Pindahkan jawaban benar ke posisi target, pengecoh mengisi sisanya secara acak. */
function susunUlang(s: Soal, benar: number[], posisi: number[], acak: () => number) {
  const p = s.pilihan!;
  const isiBenar = benar.map((i) => p[i]);
  const pengecoh = kocok(p.filter((_, i) => !benar.includes(i)), acak);
  s.pilihan = p.map((_, i) => (posisi.includes(i) ? isiBenar[posisi.indexOf(i)] : pengecoh.shift()!));
  const kunci = posisi.map((i) => HURUF[i]);
  s.kunci = s.bentuk === "PG" ? kunci[0] : kunci;
}

/**
 * Sebar kunci merata karena AI cenderung menaruh jawaban benar di A/B.
 * PG: setiap huruf A–E jadi kunci bergiliran. PGK: 10 pasangan (AB..DE) bergiliran, jadi tiap huruf seimbang.
 */
export function ratakanKunci(soal: Soal[], acak = Math.random): void {
  for (const bentuk of ["PG", "PGK"] as const) {
    const daftar = soal.filter((s) => s.bentuk === bentuk && indeksKunci(s));
    const semuaTarget = bentuk === "PG" ? [0, 1, 2, 3, 4].map((i) => [i]) : PASANGAN;
    const target = targetMerata(semuaTarget, daftar.length, acak);
    daftar.forEach((s, i) => susunUlang(s, indeksKunci(s)!, target[i], acak));
  }
}
