// Pemeriksaan hasil AI. Tanpa import "@/..." supaya bisa dites langsung: npm test

export type Bentuk = "PG" | "PGK" | "BS" | "MJ" | "ISIAN" | "URAIAN";

export type Soal = {
  bentuk: Bentuk;
  dalil_id: string | null;
  pertanyaan: string;
  pilihan?: string[];
  // Bentuk BS = PG kompleks Kategori (Tahap D): 4 pernyataan, masing-masing dinilai dengan sepasang label,
  // kunci = array label sesuai urutan pernyataan. Set lama: BS satu pernyataan, kunci "Benar"/"Salah", tanpa dua field ini.
  pernyataan?: string[];
  label?: string[];
  kunci: string | string[];
  // Bentuk ISIAN (0.10.0): pertanyaan memuat bagian kosong "....", kunci = jawaban singkat, kunciAlt = penulisan lain yang
  // juga benar (hanya pegangan guru di lembar kunci; koreksi tetap manual).
  kunciAlt?: string[];
  // Bentuk MJ = Menjodohkan (0.10.0): premis (lajur kiri, 5), jawaban (lajur kanan, 6 = 5 benar + 1 pengecoh, SUDAH
  // diacak aplikasi), kunci = array huruf jawaban untuk tiap premis. `pasangan` + `pengecoh` hanya format jawaban AI
  // (pasangan benar); diubah jadi premis/jawaban/kunci oleh susunMenjodohkan dan tidak pernah disimpan.
  premis?: string[];
  jawaban?: string[];
  pasangan?: { premis: string; jawaban: string }[];
  pengecoh?: string[];
  rubrik?: { kriteria: string; skor: number }[];
  pembahasan: string;
  level: string;
  tp: string;
  skor: number;
  peringatan?: string[]; // diisi aplikasi, bukan AI
  stimulus?: string; // hanya pada jawaban "ganti satu soal": ringkasan skenario baru untuk kisi-kisi
  indikator?: string; // hanya pada jawaban "minta perubahan": indikator baru untuk kisi-kisi
  // Soal grup (Latihan TKA, Tahap E): soal berurutan berbentuk sama dengan nomor grup sama memakai satu wacana,
  // yang disalin ke setiap soal grup itu (tampil sekali, sebelum soal pertamanya). Diisi aplikasi dari kisi-kisi.
  grup?: number;
  wacana?: string;
};

export type Bab = {
  id: string;
  judul: string;
  mapel?: string; // kosong pada set/materi lama (semuanya Al-Qur'an Hadis kelas XI) → lihat identitasBab
  kelas?: string; // "X" | "XI" | "XII"
  // Tahap F: "bahasa" = teks Arab adalah isi pelajaran (mis. Bahasa Arab), boleh ditulis AI; yang mirip ayat tetap dijaga.
  // Kosong/"dalil" = semua teks Arab wajib persis data terverifikasi (aturan 5).
  teksArab?: "dalil" | "bahasa";
  tp: { kode: string; teks: string }[];
  // mushaf: teks Arab diambil/dicocokkan dari data mushaf (langkah 9), bukan ketikan guru
  dalil: { id: string; sumber: string; arab: string; terjemah: string; mufradat: { arab: string; arti: string }[]; mushaf?: boolean }[];
  materi: string[];
  pokok?: string[]; // pokok-pokok materi hasil analisa AI (ringkasan untuk guru & sebaran soal)
};

/** Maksimal materi yang digabung dalam satu set (PTS/PAS). */
export const MAKS_GABUNG = 5;

/**
 * Beberapa materi → satu bab untuk satu set (PTS/PAS). Kode TP dan id dalil dinomori ulang supaya tidak bentrok
 * (TP 1.. dan dalil-1..); isi tiap materi diberi judul bagian. Satu materi dikembalikan apa adanya.
 */
export function gabungBab(babs: Bab[]): Bab {
  if (babs.length === 1) return babs[0];
  const [awal] = babs;
  return {
    id: babs.map((b) => b.id).join(","),
    mapel: awal.mapel,
    kelas: awal.kelas,
    ...(awal.teksArab && { teksArab: awal.teksArab }),
    judul: babs.map((b) => b.judul).join(" + ").slice(0, 300),
    tp: babs.flatMap((b) => b.tp.map((t) => t.teks)).map((teks, i) => ({ kode: `TP ${i + 1}`, teks })),
    dalil: babs.flatMap((b) => b.dalil).map((d, i) => ({ ...d, id: `dalil-${i + 1}` })),
    materi: babs.flatMap((b) => [`MATERI: ${b.judul}`, ...b.materi]),
    pokok: babs.flatMap((b) => b.pokok ?? []),
  };
}

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
  grup?: number | null; // soal grup (Latihan TKA): nomor grup, atau null untuk soal tunggal
  wacana?: string; // teks wacana bersama grup itu (disusun AI bersama kisi-kisi)
};

const URUTAN_BENTUK: Bentuk[] = ["PG", "PGK", "BS", "MJ", "ISIAN", "URAIAN"]; // harus sama dengan urutan NAMA_BENTUK (prompt.ts)

export const KELAS = ["X", "XI", "XII"];

/** Pasangan label soal Kategori (ATURAN-SOAL.md bagian 3 & 9) dan jumlah pernyataannya (MA kelas 10–12: 4). */
export const LABEL_KATEGORI = [
  ["Benar", "Salah"],
  ["Fakta", "Opini"],
  ["Sesuai", "Tidak Sesuai"],
  ["Tepat", "Tidak Tepat"],
  ["Didukung", "Tidak Didukung"],
];
export const JUMLAH_PERNYATAAN = 4;
/** Soal Kategori model baru (bukan B/S satu pernyataan dari set lama). */
export const kategoriBaru = (s: Pick<Soal, "bentuk" | "pernyataan">) => s.bentuk === "BS" && Array.isArray(s.pernyataan);

/** Label resmi yang cocok (abaikan besar-kecil huruf), atau null. */
function cariLabel(label: unknown): string[] | null {
  const kecil = (x: unknown) => String(x ?? "").trim().toLowerCase();
  const l = Array.isArray(label) ? label.map(kecil) : [];
  return LABEL_KATEGORI.find((p) => p.every((x, i) => x.toLowerCase() === l[i])) ?? null;
}

/**
 * Rapikan bagian Kategori (pernyataan, label, kunci) dari AI atau editan guru: label disamakan ejaannya dengan
 * daftar resmi, kunci tiap pernyataan disamakan dengan salah satu label. Yang tidak cocok dibiarkan (ditandai periksaSoal).
 */
function rapikanKategori(s: Soal): Soal {
  if (!kategoriBaru(s)) return s;
  const teks = (x: unknown) => String(x ?? "").trim();
  const label = cariLabel(s.label) ?? (Array.isArray(s.label) ? s.label.map(teks) : []);
  const kunci = [s.kunci].flat().map((k) => label.find((l) => l.toLowerCase() === teks(k).toLowerCase()) ?? teks(k));
  return { ...s, pernyataan: s.pernyataan!.map(teks), label, kunci };
}

/** Menjodohkan: 5 premis (lajur kiri) dan 6 jawaban (lajur kanan, satu pengecoh). */
export const JUMLAH_PREMIS = 5;
const HURUF_MJ = "ABCDEFG";
const norm = (t: string) => t.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Soal Menjodohkan dari jawaban AI (`pasangan` benar + `pengecoh`) → premis, jawaban DIACAK aplikasi, dan kunci huruf
 * (seperti ratakanKunci untuk PG: AI cenderung menaruh jawaban sejajar dengan premisnya). Urutan acak dicoba ulang
 * beberapa kali supaya tidak persis sama dengan urutan premis. Soal yang sudah berbentuk premis/jawaban/kunci dibiarkan.
 * Bentuk selain MJ hanya dibersihkan dari field mentah `pasangan`/`pengecoh`.
 */
export function susunMenjodohkan(s: Soal, acak: () => number = Math.random): Soal {
  const { pasangan, pengecoh, ...sisa } = s;
  if (s.bentuk !== "MJ" || !Array.isArray(pasangan)) return sisa;
  const teks = (x: unknown) => String(x ?? "").trim();
  const pas = pasangan.slice(0, JUMLAH_PREMIS).map((p) => ({ premis: teks(p?.premis), jawaban: teks(p?.jawaban) }));
  const tambahan = (Array.isArray(pengecoh) ? pengecoh : []).map(teks).filter(Boolean).slice(0, 1);
  const benar = pas.map((p) => p.jawaban);
  const semua = [...benar, ...tambahan];
  const sejajar = (j: string[]) => !j.slice(0, benar.length).some((x, k) => x !== benar[k]);
  let jawaban = [...semua];
  for (let i = 0; i < 10 && sejajar(jawaban); i++) jawaban = kocok([...semua], acak);
  // Cadangan pasti (mis. pengacak yang macet): geser satu posisi, sehingga tidak persis sejajar dengan premis.
  if (semua.length >= 3 && sejajar(jawaban)) jawaban = [...semua.slice(1), semua[0]];
  const kunci = benar.map((b) => HURUF_MJ[jawaban.indexOf(b)] ?? "");
  return { ...sisa, premis: pas.map((p) => p.premis), jawaban, kunci };
}

/** Kebalikan susunMenjodohkan, untuk "Ubah soal": soal MJ dikirim ke AI dalam format pasangan + pengecoh. */
export function keFormatAI(s: Soal): Omit<Soal, "premis" | "jawaban" | "kunci"> & { pasangan?: { premis: string; jawaban: string }[]; pengecoh?: string[]; kunci?: string | string[] } {
  if (s.bentuk !== "MJ" || !s.premis || !s.jawaban) return s;
  const { premis, jawaban, kunci, ...sisa } = s;
  const idx = [kunci].flat().map((h) => HURUF_MJ.indexOf(String(h).trim().toUpperCase()));
  return { ...sisa, pasangan: premis.map((p, i) => ({ premis: p, jawaban: jawaban[idx[i]] ?? "" })), pengecoh: jawaban.filter((_, j) => !idx.includes(j)) };
}

/** Mapel & kelas sebuah bab. Data lama tanpa keduanya = Al-Qur'an Hadis kelas XI (satu-satunya mapel waktu itu). */
export function identitasBab(bab: Pick<Bab, "mapel" | "kelas">) {
  const kelas = String(bab.kelas ?? "").trim().split(" ")[0].toUpperCase();
  return { mapel: bab.mapel?.trim() || "Al-Qur'an Hadis", kelas: KELAS.includes(kelas) ? kelas : "XI" };
}

/**
 * Tanggapan AI atas catatan guru (tampil di atas hasil). Dipotong, dan teks Arab yang tidak ada di data
 * terverifikasi dibuang (aturan 5), karena tanggapan juga tulisan AI.
 */
export function bersihkanTanggapan(x: unknown, bab: Bab, cekAyat?: CekAyat): string {
  const t = String(x ?? "").trim().slice(0, 1000);
  const asing = new Set(pemeriksaArab(bab, cekAyat)(t));
  return asing.size ? t.replace(new RegExp(POLA_ARAB, "g"), (p) => (asing.has(p) ? "…" : p)) : t;
}

/**
 * Rapikan kisi-kisi dari AI: jumlah baris per bentuk harus pas dengan permintaan (kelebihan dibuang),
 * diurutkan PG → PGK → BS → URAIAN dan diberi nomor. Dalil yang tidak ada di data bab dikosongkan.
 * Melempar error kalau ada bentuk yang kurang (supaya model cadangan dicoba).
 */
export function periksaKisi(data: unknown, jumlah: Record<Bentuk, number>, bab: Bab, cekAyat?: CekAyat): BarisKisi[] {
  const teks = (x: unknown) => String(x ?? "").trim();
  const mentah = Array.isArray(data) ? (data as Partial<BarisKisi>[]) : [];
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  const arabAsingDi = pemeriksaArab(bab, cekAyat);
  const hasil = URUTAN_BENTUK.flatMap((b) => {
    const baris = mentah.filter((k) => teks(k?.bentuk).toUpperCase() === b).slice(0, jumlah[b]);
    if (baris.length < jumlah[b]) throw new Error(`kisi-kisi ${b} hanya ${baris.length} dari ${jumlah[b]} baris.`);
    return baris.map((k) => {
      const isi = { materi: teks(k.materi), indikator: teks(k.indikator), stimulus: teks(k.stimulus) };
      const arabAsing = Object.values(isi).flatMap(arabAsingDi);
      return {
        no: 0,
        bentuk: b,
        tp: teks(k.tp),
        ...isi,
        level: teks(k.level).toUpperCase(),
        dalil_id: k.dalil_id && dalilAda.has(teks(k.dalil_id)) ? teks(k.dalil_id) : null,
        peringatan: arabAsing.length ? [`Teks Arab tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`] : [],
        // nomor grup usulan AI; disahkan/dinomori ulang oleh pasangWacana
        grup: k.grup !== null && k.grup !== undefined && Number.isInteger(Number(k.grup)) ? Number(k.grup) : null,
      };
    });
  });
  return hasil.map((k, i) => ({ ...k, no: i + 1 }));
}

/**
 * Soal grup (Latihan TKA): pasang wacana dari AI ke baris kisi-kisi. Grup sah = minimal 2 nomor BERURUTAN dengan
 * bentuk sama dan nomor grup sama, dan wacananya ada. Selebihnya jadi soal tunggal. Grup dinomori ulang 1, 2, ...
 * `kisi[i].grup` = nomor grup usulan AI (dari periksaKisi). Teks Arab di wacana dicek (aturan 5).
 */
export function pasangWacana(kisi: BarisKisi[], wacana: unknown, bab: Bab, cekAyat?: CekAyat): BarisKisi[] {
  const teksWacana = new Map<number, string>();
  for (const w of Array.isArray(wacana) ? wacana : []) {
    const t = String((w as { teks?: unknown })?.teks ?? "").trim().slice(0, 3000);
    const g = Number((w as { grup?: unknown })?.grup);
    if (t && Number.isInteger(g)) teksWacana.set(g, t);
  }
  const g = kisi.map((k) => k.grup ?? NaN);
  const arabAsingDi = pemeriksaArab(bab, cekAyat);
  const hasil = kisi.map((k) => ({ ...k, grup: null as number | null, wacana: undefined as string | undefined }));
  let nomor = 0;
  for (let i = 0; i < hasil.length; ) {
    let j = i;
    while (j + 1 < hasil.length && Number.isInteger(g[i]) && g[j + 1] === g[i] && hasil[j + 1].bentuk === hasil[i].bentuk) j++;
    const teks = teksWacana.get(g[i]);
    if (j > i && teks) {
      nomor++;
      const arab = arabAsingDi(teks);
      for (let x = i; x <= j; x++) {
        hasil[x] = { ...hasil[x], grup: nomor, wacana: teks };
        if (arab.length) hasil[x].peringatan = [...(hasil[x].peringatan ?? []), `Teks Arab di wacana tidak cocok dengan data terverifikasi: ${arab.join(" | ")}`];
      }
    }
    i = j + 1;
  }
  return hasil;
}

/** Samakan bentuk, TP, dan level soal dengan baris kisi-kisinya (kisi-kisi = rencana yang dipegang). */
export function samakanDenganKisi(soal: Soal, k: BarisKisi): Soal {
  const { grup, wacana, ...isi } = soal; // grup & wacana hanya dari kisi-kisi, bukan dari jawaban AI
  void grup;
  void wacana;
  const s: Soal = { ...isi, bentuk: k.bentuk, tp: k.tp || soal.tp, level: LEVEL.includes(k.level) ? k.level : soal.level, ...(k.grup && k.wacana ? { grup: k.grup, wacana: k.wacana } : {}) };
  // Soal BS baru wajib model Kategori; kalau AI memberi B/S satu pernyataan, pernyataan kosong → ditandai periksaSoal.
  return s.bentuk === "BS" && !Array.isArray(s.pernyataan) ? { ...s, pernyataan: [] } : s;
}

const HURUF_ARAB ="؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
// Satu potongan teks Arab: huruf Arab, boleh berisi spasi di tengah.
export const POLA_ARAB = `[${HURUF_ARAB}]+(?:[\\s${HURUF_ARAB}]*[${HURUF_ARAB}])?`;
const rapikan = (s: string) => s.replace(/\s+/g, " ").normalize("NFC");

/** Semua teks Arab terverifikasi milik bab (ayat, hadis, mufradat, materi) dalam satu teks. */
export const korpusArab = (bab: Bab) => rapikan(JSON.stringify(bab));

/** Paragraf yang hampir seluruhnya huruf Arab (ayat/hadis), bukan kalimat Latin yang menyelipkan lafaz. */
export function paragrafArab(t: string) {
  const arab = (t.match(new RegExp(POLA_ARAB, "g")) ?? []).join("").replace(/\s/g, "").length;
  const latin = (t.match(/[A-Za-zÀ-ɏḀ-ỿ]/g) ?? []).length;
  return arab > 0 && arab >= latin * 4;
}

/**
 * Pecah teks soal menjadi baris (baris kosong dibuang). `arab` = baris hampir seluruhnya huruf Arab (mis. satu ucapan
 * hiwar): ditampilkan sebagai satu blok kanan-ke-kiri, supaya titik dua, angka, dan tanda baca ikut urutan yang benar.
 */
export function pecahBaris(t: string): { teks: string; arab: boolean }[] {
  return String(t ?? "")
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => ({ teks: b, arab: paragrafArab(b) }));
}

/** Potongan teks Arab yang TIDAK ada persis (huruf + harakat) di data terverifikasi. Harus kosong. */
export function arabTakTerverifikasi(teks: string, korpus: string): string[] {
  return (teks.match(new RegExp(POLA_ARAB, "g")) ?? []).filter((p) => !korpus.includes(rapikan(p)));
}

/** "Apakah teks Arab ini potongan ayat Al-Qur'an?" (server: mushaf().cari). Disuntikkan supaya file ini tetap bisa dites. */
export type CekAyat = (arab: string) => boolean;

/**
 * Penjaga teks Arab sebuah bab (aturan 5): mengembalikan potongan Arab yang harus ditandai.
 * Mode "dalil": semua Arab yang tidak persis data terverifikasi. Mode "bahasa" (mapel Bahasa Arab): Arab bebas,
 * KECUALI yang dikenali sebagai ayat Al-Qur'an (`cekAyat`) tetapi tidak persis data terverifikasi.
 */
export function pemeriksaArab(bab: Bab, cekAyat?: CekAyat) {
  const korpus = korpusArab(bab);
  if (bab.teksArab !== "bahasa") return (t: string) => arabTakTerverifikasi(t, korpus);
  return (t: string) => arabTakTerverifikasi(t, korpus).filter((p) => cekAyat?.(p) ?? false);
}

export const LEVEL = ["C1", "C2", "C3", "C4", "C5", "C6"];

/** Rapikan soal hasil edit guru (data dari browser tidak dipercaya begitu saja). Bentuk soal tidak bisa diubah. */
export function rapikanSoal(s: Partial<Soal>, bentuk: Bentuk): Soal {
  const teks = (x: unknown) => String(x ?? "").trim();
  const kunci = [s.kunci].flat().map(teks).filter(Boolean);
  const rubrik = (s.rubrik ?? []).map((r) => ({ kriteria: teks(r?.kriteria), skor: Math.max(0, Number(r?.skor) || 0) })).filter((r) => r.kriteria);
  const kategori = bentuk === "BS" && Array.isArray(s.pernyataan);
  const alt = (Array.isArray(s.kunciAlt) ? s.kunciAlt : []).map(teks).filter((x) => x && x !== kunci[0]).slice(0, 5);
  // Menjodohkan: posisi penting (kunci[i] = huruf untuk premis ke-i), jadi baris kosong tidak dibuang.
  const premis = (Array.isArray(s.premis) ? s.premis : []).slice(0, JUMLAH_PREMIS).map(teks);
  const jawaban = (Array.isArray(s.jawaban) ? s.jawaban : []).slice(0, JUMLAH_PREMIS + 2).map(teks);
  const kunciMj = [s.kunci].flat().slice(0, premis.length).map((h) => teks(h).toUpperCase());
  return {
    bentuk,
    dalil_id: s.dalil_id ? teks(s.dalil_id) : null,
    pertanyaan: teks(s.pertanyaan),
    ...(bentuk === "PG" || bentuk === "PGK" ? { pilihan: [0, 1, 2, 3, 4].map((i) => teks(s.pilihan?.[i])) } : {}),
    ...(kategori
      ? {
          pernyataan: s.pernyataan!.slice(0, JUMLAH_PERNYATAAN).map(teks),
          label: (Array.isArray(s.label) ? s.label : []).slice(0, 2).map(teks),
        }
      : {}),
    kunci: bentuk === "PGK" ? kunci : bentuk === "MJ" ? kunciMj : kategori ? [s.kunci].flat().slice(0, JUMLAH_PERNYATAAN).map(teks) : (kunci[0] ?? ""),
    ...(bentuk === "URAIAN" ? { rubrik } : {}),
    ...(bentuk === "ISIAN" ? { kunciAlt: alt } : {}),
    ...(bentuk === "MJ" ? { premis, jawaban } : {}),
    ...(Number.isInteger(s.grup) && s.grup! > 0 && teks(s.wacana) ? { grup: s.grup, wacana: teks(s.wacana).slice(0, 3000) } : {}),
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

/** Bagian kosong soal isian: "....", "…", atau "____". */
const TITIK_ISIAN = /\.{3,}|…|_{3,}/;
const MAKS_KATA_ISIAN = 6;

/** Peringatan khusus soal Menjodohkan: jumlah, terisi, kunci sah, satu jawaban untuk satu premis, tidak ada kembar. */
function periksaMenjodohkan(s: Soal): string[] {
  const w: string[] = [];
  const premis = s.premis ?? [];
  const jawaban = s.jawaban ?? [];
  const kunci = [s.kunci].flat().map((h) => String(h ?? "").trim().toUpperCase());
  if (premis.length !== JUMLAH_PREMIS || premis.some((p) => !p)) w.push(`Menjodohkan harus berisi ${JUMLAH_PREMIS} premis yang terisi.`);
  if (jawaban.length <= premis.length || jawaban.some((j) => !j)) w.push("Jawaban harus lebih banyak dari premis (satu pengecoh) dan terisi semua.");
  const sah = HURUF_MJ.slice(0, jawaban.length);
  if (kunci.length !== premis.length || kunci.some((h) => !h || !sah.includes(h))) w.push("Kunci menjodohkan harus satu huruf jawaban untuk setiap premis.");
  else if (new Set(kunci).size !== kunci.length) w.push("Dua premis memakai jawaban yang sama.");
  if (new Set(premis.map(norm)).size !== premis.length || new Set(jawaban.map(norm)).size !== jawaban.length) w.push("Ada premis atau jawaban yang sama persis.");
  return w;
}

/** Peringatan khusus soal Isian: bagian kosong ada, jawaban singkat, dan jawaban tidak bocor di soal. */
function periksaIsian(s: Soal): string[] {
  const w: string[] = [];
  const kunci = String([s.kunci].flat()[0] ?? "").trim();
  if (!TITIK_ISIAN.test(s.pertanyaan)) w.push("Soal isian harus punya bagian kosong (....).");
  if (!kunci) w.push("Kunci isian kosong.");
  else {
    if (kunci.split(/\s+/).length > MAKS_KATA_ISIAN || kunci.length > 60) w.push(`Jawaban isian terlalu panjang (maksimal ${MAKS_KATA_ISIAN} kata).`);
    if (kunci.length >= 3 && s.pertanyaan.toLowerCase().includes(kunci.toLowerCase())) w.push("Jawaban isian muncul di dalam soal.");
  }
  return w;
}

/** Beri peringatan pada soal yang bermasalah. Aturan 5: teks Arab hanya boleh dari data terverifikasi. */
export function periksaSoal(soal: Soal[], bab: Bab, cekAyat?: CekAyat): Soal[] {
  const arabAsingDi = pemeriksaArab(bab, cekAyat);
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  return soal.map((asli) => {
    // Bersihkan kode dalil yang bocor; kalau AI lupa mengisi dalil_id, pakai kode yang ditemukan di teks.
    let ditemukan: string | null = null;
    const bersih = (t: string) => {
      const r = bersihkanKodeDalil(t, dalilAda);
      ditemukan ??= r.ditemukan;
      return r.bersih;
    };
    const s: Soal = rapikanKategori({
      ...asli,
      pertanyaan: bersih(asli.pertanyaan),
      pembahasan: bersih(asli.pembahasan),
      ...(asli.pilihan ? { pilihan: asli.pilihan.map(bersih) } : {}),
      ...(Array.isArray(asli.pernyataan) ? { pernyataan: asli.pernyataan.map(bersih) } : {}),
      ...(Array.isArray(asli.premis) ? { premis: asli.premis.map(bersih) } : {}),
      ...(Array.isArray(asli.jawaban) ? { jawaban: asli.jawaban.map(bersih) } : {}),
    });
    if (!s.dalil_id && ditemukan) s.dalil_id = ditemukan;
    const peringatan: string[] = [];
    const semuaTeks = [s.wacana ?? "", s.pertanyaan, ...(s.pilihan ?? []), ...(s.pernyataan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...[s.kunci].flat(), ...(s.kunciAlt ?? []), s.pembahasan, ...(s.rubrik ?? []).map((r) => r.kriteria)];
    const arabAsing = semuaTeks.flatMap((t) => arabAsingDi(String(t ?? "")));
    if (arabAsing.length)
      peringatan.push(`${bab.teksArab === "bahasa" ? "Teks Arab mirip ayat Al-Qur'an tetapi" : "Teks Arab"} tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`);
    if (s.dalil_id && !dalilAda.has(s.dalil_id)) peringatan.push(`Dalil "${s.dalil_id}" tidak ada di data bab.`);
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && s.pilihan?.length !== 5) peringatan.push("Jumlah pilihan bukan 5.");
    if (s.bentuk === "PGK" && !KUNCI_PGK.includes(new Set([s.kunci].flat()).size)) peringatan.push("Kunci PG kompleks harus 2 atau 3 jawaban.");
    if (s.bentuk === "ISIAN") peringatan.push(...periksaIsian(s));
    if (s.bentuk === "MJ") peringatan.push(...periksaMenjodohkan(s));
    if (kategoriBaru(s)) {
      if (s.pernyataan!.length !== JUMLAH_PERNYATAAN || s.pernyataan!.some((p) => !p)) peringatan.push(`Soal kategori harus berisi ${JUMLAH_PERNYATAAN} pernyataan.`);
      if (!cariLabel(s.label)) peringatan.push(`Label kategori tidak dikenal: ${(s.label ?? []).join(" / ") || "(kosong)"}.`);
      const kunci = [s.kunci].flat();
      if (kunci.length !== s.pernyataan!.length || kunci.some((k) => !s.label?.includes(k))) peringatan.push("Kunci kategori harus satu label untuk setiap pernyataan.");
    }
    return { ...s, peringatan };
  });
}

const HURUF = "ABCDE";
/** PG kompleks (MCMA, ATURAN-SOAL.md bagian 3): 2 atau 3 jawaban benar dari 5. */
export const KUNCI_PGK = [2, 3];
// Semua gabungan k posisi dari 5: k=2 → AB, AC, ... DE (10); k=3 → ABC, ... CDE (10)
const gabungan = (k: number, mulai = 0): number[][] =>
  k === 0 ? [[]] : [0, 1, 2, 3, 4].filter((i) => i >= mulai).flatMap((i) => gabungan(k - 1, i + 1).map((g) => [i, ...g]));

/**
 * Nilai angka sebuah pilihan ("12", "-3,5 m/s", "Rp 1.500.000", "1945 M"), atau null kalau bukan diawali angka.
 * Format Indonesia: titik = ribuan, koma = desimal.
 */
function nilaiAngka(t: string): number | null {
  const m = /^\s*(?:Rp\.?\s*)?([-+−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-+−]?\d+(?:,\d+)?)(?!\d)/i.exec(String(t ?? ""));
  return m ? Number(m[1].replace("−", "-").replace(/\./g, "").replace(",", ".")) : null;
}

/** Pilihan PG/PGK yang semuanya angka (ATURAN-SOAL.md 2b no. 8: harus urut kecil → besar dan tidak diacak). */
export const pilihanAngka = (s: Pick<Soal, "pilihan">) => !!s.pilihan?.length && s.pilihan.every((p) => nilaiAngka(p) !== null);

/** Urutkan pilihan angka kecil → besar; huruf kunci ikut menyesuaikan. */
function urutkanAngka(s: Soal) {
  const lama = [s.kunci].flat().map((h) => s.pilihan![HURUF.indexOf(String(h).trim().toUpperCase())]);
  s.pilihan = [...s.pilihan!].sort((a, b) => nilaiAngka(a)! - nilaiAngka(b)!);
  const kunci = lama.map((isi) => HURUF[s.pilihan!.indexOf(isi)]).filter(Boolean).sort();
  s.kunci = s.bentuk === "PG" ? (kunci[0] ?? s.kunci) : kunci;
}

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
  const boleh = s.bentuk === "PG" ? [1] : s.bentuk === "PGK" ? KUNCI_PGK : [];
  const idx = [...new Set(kunci.map((h) => HURUF.indexOf(String(h).trim().toUpperCase())))];
  return boleh.includes(idx.length) && kunci.length === idx.length && !idx.includes(-1) ? idx : null;
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
 * PG: setiap huruf A–E jadi kunci bergiliran. PGK: gabungan 2 (AB..DE) atau 3 (ABC..CDE) kunci bergiliran,
 * jadi tiap huruf seimbang. Pilihan berupa angka tidak diacak, melainkan diurutkan kecil → besar.
 */
export function ratakanKunci(soal: Soal[], acak = Math.random): void {
  for (const s of soal) if ((s.bentuk === "PG" || s.bentuk === "PGK") && pilihanAngka(s) && indeksKunci(s)) urutkanAngka(s);
  const kelompok = [
    { bentuk: "PG", k: 1 },
    ...KUNCI_PGK.map((k) => ({ bentuk: "PGK", k })),
  ];
  for (const { bentuk, k } of kelompok) {
    const daftar = soal.filter((s) => s.bentuk === bentuk && !pilihanAngka(s) && indeksKunci(s)?.length === k);
    const target = targetMerata(gabungan(k), daftar.length, acak);
    daftar.forEach((s, i) => susunUlang(s, indeksKunci(s)!, target[i], acak));
  }
}
