// Pemeriksaan hasil AI. Tanpa import "@/..." supaya bisa dites langsung: npm test
import { BATAS_GAMBAR, type GambarBab } from "./gambar.ts";
import { MAPEL_SEJARAH } from "./mapel.ts";

export type Bentuk = "PG" | "PGK" | "BS" | "MJ" | "ISIAN" | "URAIAN";

export type Soal = {
  bentuk: Bentuk;
  dalil_id: string | null;
  // 0.42.0 (ATURAN-SOAL 5a): cara dalil tampil di soal; kosong = soal lama (kotak Arab saja). Potongan = nomor kata
  // [awal, akhir] (mulai 1) dari teks Arab ("potong") atau terjemah ("potong-terjemah"), disusun aplikasi dari data.
  dalil_tampil?: CaraDalil | null;
  dalil_potong?: number[] | null;
  // 0.30.0: gambar materi yang ditampilkan di bawah pokok soal (id tabel `gambar`, harus ada di bab.gambar), atau kosong.
  gambar_id?: number | null;
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
  // MENJODOHKAN GAYA LAMA (0.22.0, gaya Al-Fatah, semua jenis kecuali TKA): SATU NOMOR = satu pernyataan lajur kiri
  // (`pertanyaan`), tanpa `premis`. Nomor-nomor satu blok (`grup` sama, tanpa wacana) memakai daftar `jawaban` yang SAMA
  // (lajur kanan, satu pengecoh); `kunci` = satu huruf. `jodoh` = pasangan benar di jawaban AI, disusun jadi daftar
  // bersama oleh susunMjLama dan tidak pernah disimpan. Lihat mjLama().
  premis?: string[];
  jawaban?: string[];
  pasangan?: { premis: string; jawaban: string }[];
  pengecoh?: string[];
  jodoh?: string;
  rubrik?: { kriteria: string; skor: number }[];
  pembahasan: string;
  level: string;
  tp: string;
  skor: number;
  peringatan?: string[]; // diisi aplikasi, bukan AI
  // Hanya di jawaban AI untuk PG (0.18.2): langkah hitung/penalaran + isi jawaban benar, ditulis SEBELUM pilihan supaya
  // kunci tidak terlanjur ditulis sebelum dihitung. Dicocokkan dengan pilihan kunci di periksaSoal, lalu dibuang (tidak disimpan).
  langkah?: string;
  jawaban_benar?: string;
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
  // kitab: teks hadis dari data 9 kitab (0.36.0, hadis.ts)
  dalil: { id: string; sumber: string; arab: string; terjemah: string; mufradat: { arab: string; arti: string }[]; mushaf?: boolean; kitab?: boolean; bukan?: boolean; terjemahKemenag?: boolean }[];
  materi: string[];
  pokok?: string[]; // pokok-pokok materi hasil analisa AI (ringkasan untuk guru & sebaran soal)
  gambar?: GambarBab[]; // 0.30.0: gambar materi yang dipilih guru (AI melihatnya, soal boleh memakainya lewat gambar_id)
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
    gambar: babs.flatMap((b) => b.gambar ?? []).slice(0, BATAS_GAMBAR.perSet),
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
  dalil_tampil?: CaraDalil | null; // 0.42.0: direncanakan aplikasi (rencanaDalil/pasangDalil); kosong = kisi lama
  gambar_id?: number | null; // 0.30.0: gambar materi yang dipakai soal ini (direncanakan di kisi-kisi)
  stimulus: string; // jenis + skenario singkat, supaya skenario tidak berulang dalam satu set
  peringatan?: string[]; // diisi aplikasi (aturan 5: teks Arab tak terverifikasi)
  grup?: number | null; // soal grup (Latihan TKA): nomor grup, atau null untuk soal tunggal
  wacana?: string; // teks wacana bersama grup itu (disusun AI bersama kisi-kisi)
  // ISIAN (0.18.3): rencana jawaban dari tahap kisi-kisi. Dikirim ke tahap soal lain sebagai kata terlarang (laranganIsian),
  // karena soal isian ditulis paling akhir dan jawabannya dulu sering sudah terpakai sebagai pengecoh soal PG.
  jawaban?: string;
  kunciPgk?: number; // PGK: jumlah jawaban benar, ditentukan aplikasi (pasangKunciPgk, prompt.ts)
  jumlahPernyataan?: number; // Kategori (TKA): 3, ditentukan aplikasi (pasangKunciPgk)
  kunciBs?: string; // Benar/Salah gaya lama: "Benar"/"Salah", ditentukan aplikasi supaya seimbang (pasangKunciPgk)
};

const URUTAN_BENTUK: Bentuk[] = ["PG", "PGK", "BS", "MJ", "ISIAN", "URAIAN"]; // harus sama dengan urutan NAMA_BENTUK (prompt.ts)

export const KELAS = ["X", "XI", "XII"];

/**
 * Pasangan label soal Kategori (ATURAN-SOAL.md bagian 3 & 9) dan jumlah pernyataannya: 4 untuk soal madrasah,
 * 3 untuk Latihan TKA (semua contoh resmi Perka BSKAP 045/2025; versi web kadang 4), jadi keduanya sah (RUJUKAN.md I2).
 * Setuju/Logis = label contoh resmi TKA; Fakta/Opini & Didukung = variasi madrasah.
 */
export const LABEL_KATEGORI = [
  ["Benar", "Salah"],
  ["Fakta", "Opini"],
  ["Sesuai", "Tidak Sesuai"],
  ["Tepat", "Tidak Tepat"],
  ["Didukung", "Tidak Didukung"],
  ["Setuju", "Tidak Setuju"],
  ["Logis", "Tidak Logis"],
  ["True", "False"], // mapel Bahasa Inggris (ATURAN_INGGRIS, prompt.ts)
];
export const JUMLAH_PERNYATAAN = 4; // paling banyak
export const PERNYATAAN_BOLEH = [3, 4];
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

/** Menjodohkan gaya lama: satu nomor = satu pernyataan, daftar jawaban dipakai bersama satu blok (`grup`). */
export const mjLama = (s: Pick<Soal, "bentuk" | "premis">) => s.bentuk === "MJ" && !Array.isArray(s.premis);

/**
 * Menjodohkan gaya lama yang dibagi aplikasi: jumlah nomor MJ → ukuran blok (masing-masing maks 5, min 3 bila lebih
 * dari 5), mis. 5 → [5], 7 → [4, 3]. Satu blok = satu daftar jawaban bersama, selalu di satu tahap AI.
 */
export function blokMj(n: number): number[] {
  if (n <= 0) return [];
  const k = Math.ceil(n / JUMLAH_PREMIS);
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

/**
 * Menjodohkan gaya lama dari jawaban AI: tiap nomor MJ ber-`grup` membawa `jodoh` (pasangan benarnya) dan salah satu
 * membawa `pengecoh`. Per blok disusun SATU daftar jawaban (benar + 1 pengecoh) yang diacak aplikasi (tidak sejajar
 * dengan urutan nomor), lalu setiap nomor mendapat daftar itu + huruf kuncinya. Soal lain dikembalikan apa adanya.
 */
export function susunMjLama(soal: Soal[], acak: () => number = Math.random): Soal[] {
  const teks = (x: unknown) => String(x ?? "").trim();
  const hasil = soal.map((s) => ({ ...s }));
  const blok = new Map<number, number[]>();
  hasil.forEach((s, i) => {
    if (mjLama(s) && s.grup && typeof s.jodoh === "string") blok.set(s.grup, [...(blok.get(s.grup) ?? []), i]);
  });
  for (const idx of blok.values()) {
    const benar = idx.map((i) => teks(hasil[i].jodoh));
    const pengecoh = idx.flatMap((i) => (Array.isArray(hasil[i].pengecoh) ? hasil[i].pengecoh! : [])).map(teks).filter((x) => x && !benar.includes(x)).slice(0, 1);
    const semua = [...benar, ...pengecoh];
    const sejajar = (j: string[]) => benar.every((x, k) => j[k] === x);
    let daftar = [...semua];
    for (let n = 0; n < 10 && sejajar(daftar); n++) daftar = kocok([...semua], acak);
    if (semua.length >= 3 && sejajar(daftar)) daftar = [...semua.slice(1), semua[0]];
    idx.forEach((i, k) => {
      const { jodoh: _j, pengecoh: _p, ...s } = hasil[i];
      void _j;
      void _p;
      hasil[i] = { ...s, jawaban: daftar, kunci: HURUF_MJ[daftar.indexOf(benar[k])] ?? "" };
    });
  }
  return hasil;
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
  const gambarAda = new Set((bab.gambar ?? []).map((g) => g.id));
  const arabAsingDi = pemeriksaArab(bab, cekAyat);
  const hasil = URUTAN_BENTUK.flatMap((b) => {
    const baris = mentah.filter((k) => teks(k?.bentuk).toUpperCase() === b).slice(0, jumlah[b]);
    if (baris.length < jumlah[b]) throw new Error(`kisi-kisi ${b} hanya ${baris.length} dari ${jumlah[b]} baris.`);
    return baris.map((k) => {
      const isi = { materi: teks(k.materi), indikator: teks(k.indikator), stimulus: teks(k.stimulus) };
      const jawaban = b === "ISIAN" ? teks(k.jawaban).slice(0, 60) : "";
      const arabAsing = [...Object.values(isi), jawaban].flatMap(arabAsingDi);
      return {
        no: 0,
        bentuk: b,
        tp: teks(k.tp),
        ...isi,
        ...(jawaban && { jawaban }),
        level: teks(k.level).toUpperCase(),
        dalil_id: k.dalil_id && dalilAda.has(teks(k.dalil_id)) ? teks(k.dalil_id) : null,
        gambar_id: b !== "MJ" && gambarAda.has(Number(k.gambar_id)) ? Number(k.gambar_id) : null,
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
  const s: Soal = {
    ...isi,
    bentuk: k.bentuk,
    tp: k.tp || soal.tp,
    level: LEVEL.includes(k.level) ? k.level : soal.level,
    // Gambar mengikuti rencana kisi-kisi: AI hanya melihat gambar yang direncanakan untuk soal itu.
    gambar_id: k.gambar_id ?? null,
    // 0.42.0: dalil & cara tampilnya mengikuti rencana aplikasi; potongan dari AI dipertahankan bila cara tampilnya potongan.
    ...(k.dalil_tampil !== undefined && { dalil_id: k.dalil_id, dalil_tampil: k.dalil_tampil ?? null, dalil_potong: k.dalil_tampil?.startsWith("potong") ? (soal.dalil_potong ?? null) : null }),
    // grup = wacana bersama (TKA) atau blok menjodohkan gaya lama (tanpa wacana)
    ...(k.grup && k.wacana ? { grup: k.grup, wacana: k.wacana } : k.grup && k.bentuk === "MJ" ? { grup: k.grup } : {}),
  };
  if (s.bentuk !== "BS") return s;
  // Kategori (TKA, kisi menulis jumlahPernyataan): kalau AI memberi B/S satu pernyataan, pernyataan kosong → ditandai.
  if (k.jumlahPernyataan) return Array.isArray(s.pernyataan) ? s : { ...s, pernyataan: [] };
  // Benar/Salah gaya lama: kunci dirapikan ("benar"/"B" → "Benar").
  const kunci = String([s.kunci].flat()[0] ?? "").trim();
  return { ...s, kunci: /^b(enar)?$/i.test(kunci) ? "Benar" : /^s(alah)?$/i.test(kunci) ? "Salah" : kunci };
}

const HURUF_ARAB ="؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
// Satu potongan teks Arab: huruf Arab, boleh berisi spasi di tengah.
export const POLA_ARAB = `[${HURUF_ARAB}]+(?:[\\s${HURUF_ARAB}]*[${HURUF_ARAB}])?`;
const rapikan = (s: string) => s.replace(/\s+/g, " ").normalize("NFC");

/** Batas kata istilah Arab: tulisan Arab sependek ini di materi guru diterima apa adanya (bukan dalil). */
export const MAKS_ISTILAH = 3;

/**
 * Potongan Arab (POLA_ARAB) di teks yang tergolong ISTILAH (2026-11-09, pilihan pemilik): bagian di antara huruf Latin
 * yang berisi paling banyak MAKS_ISTILAH kata Arab, mis. "Mukjizat (مُعْجِزَةٌ)", "ق", "عَقِيْدَةٌ ← عَقَائِدُ". Dihitung per
 * bagian tanpa huruf Latin (bukan per potongan), supaya hadis panjang yang dipisah koma/angka tidak lolos sebagai istilah.
 * Dulu semua tulisan Arab di materi diperlakukan sebagai calon ayat/hadis, jadi guru menulis istilah di kotak dalil
 * dengan sumber "bukan ayat/hadis" (21 isian di data laptop).
 */
export function istilahArab(t: string): Set<string> {
  const hasil = new Set<string>();
  for (const bagian of t.split(/[A-Za-zÀ-ɏḀ-ỿ]+/)) {
    const potong = bagian.match(new RegExp(POLA_ARAB, "g")) ?? [];
    const kata = potong.join(" ").split(/\s+/).filter(Boolean).length;
    if (kata && kata <= MAKS_ISTILAH) potong.forEach((x) => hasil.add(x));
  }
  return hasil;
}

/** Isian kotak dalil yang ditandai guru "Bukan ayat/hadis" (tombol), termasuk materi lama yang sumbernya ditulis begitu. */
export const bukanDalil = (d: { bukan?: boolean; sumber?: string; mushaf?: boolean; kitab?: boolean }) =>
  !d.mushaf && !d.kitab && (d.bukan === true || /^\s*bukan\s+(ayat|hadis)/i.test(d.sumber ?? ""));
export const SUMBER_BUKAN = "Bukan ayat/hadis";

// ---------- Ayat & hadis di soal (0.42.0, ATURAN-SOAL 5a) ----------
/** Cara dalil tampil di soal. Urutan = urutan giliran rencanaDalil. */
export const CARA_DALIL = ["utuh", "potong", "terjemah", "arab", "pembahasan", "potong-terjemah", "rujukan"] as const;
export type CaraDalil = (typeof CARA_DALIL)[number];
export const NAMA_CARA_DALIL: Record<CaraDalil, string> = {
  utuh: "Arab + terjemah",
  arab: "Arab saja",
  terjemah: "Terjemah saja",
  potong: "Potongan Arab",
  "potong-terjemah": "Potongan terjemah",
  rujukan: "Nama sumber saja (tanpa kotak)",
  pembahasan: "Hanya di pembahasan",
};
type Dalil = Bab["dalil"][number];
export const butuhTerjemah = (c: CaraDalil) => c === "utuh" || c === "terjemah" || c === "potong-terjemah";
/** Kata-kata dalil bernomor (mulai 1): AI menunjuk potongan lewat nomor, aplikasi yang menyusun teksnya. */
export const kataArab = (d: Pick<Dalil, "arab">) => d.arab.normalize("NFC").trim().split(/\s+/).filter(Boolean);
export const kataTerjemah = (d: Pick<Dalil, "terjemah">) => String(d.terjemah ?? "").trim().split(/\s+/).filter(Boolean);
const dalilAyat = (d: Dalil) => !!d.mushaf || /^\s*Q\.?\s*S\b/i.test(d.sumber);

/** Cara ini bisa dipakai dalil `d`? (terjemah harus ada; "nama sumber saja" hanya untuk ayat; teks Arab materi: Arab saja/potongan). */
export function cocokCara(c: CaraDalil, d: Dalil) {
  if (bukanDalil(d)) return c === "arab" || c === "potong";
  if (butuhTerjemah(c) && !d.terjemah?.trim()) return false;
  return c !== "rujukan" || dalilAyat(d);
}

/** Cara tampil yang benar-benar dipakai. Soal lama (tanpa cara) = Arab saja; cara yang tidak cocok dengan dalilnya → Arab saja. */
export function caraDalil(s: Pick<Soal, "dalil_tampil">, d: Dalil): CaraDalil {
  const c = CARA_DALIL.includes(s.dalil_tampil as CaraDalil) ? (s.dalil_tampil as CaraDalil) : "arab";
  if (cocokCara(c, d)) return c;
  return c === "potong-terjemah" && cocokCara("potong", d) ? "potong" : "arab";
}

/** Potongan [awal, akhir] yang sah untuk `n` kata, atau null. */
export function potonganSah(p: unknown, n: number): [number, number] | null {
  if (!Array.isArray(p) || !p.length) return null;
  const a = Math.round(Number(p[0]));
  const b = Math.round(Number(p[1] ?? p[0]));
  return a >= 1 && b >= a && b <= n ? [a, b] : null;
}

/** Nama yang disebut sumber dalil: nama surah ("Al-Baqarah") atau kitab hadis ("Bukhari"). */
function namaSumber(d: Dalil): string {
  const t = d.sumber.replace(/\(potongan\)/i, "").replace(/\[[^\]]*\]/g, " ");
  if (dalilAyat(d)) return t.replace(/^\s*Q\.?\s*S\.?/i, "").replace(/[\d:–,-]+/g, " ").trim();
  return t.replace(/^\s*H\.?\s*R\.?/i, "").replace(/\bno\.?\s*\d+/i, " ").replace(/\d+/g, " ").trim();
}

/** Sumber dalil adalah JAWABAN soal ini (tertulis di pilihan/pernyataan/lajur/kunci): jangan ditampilkan di soal. */
export function sumberDitanya(s: Soal, d: Dalil): boolean {
  const nama = polos(namaSumber(d)).trim();
  if (nama.length < 3) return false;
  const isi = [...(s.pilihan ?? []), ...(s.pernyataan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...(s.bentuk === "ISIAN" || s.bentuk === "URAIAN" ? [s.kunci].flat() : [])];
  return isi.some((t) => polos(t).includes(` ${nama} `));
}

export type TampilDalil = { arab?: string; terjemah?: string; sumber?: string; bukan?: boolean };

/** Bagian dalil yang tampil DI SOAL (web & Word). null = tidak ada kotak dalil (tanpa dalil, "nama sumber saja", "di pembahasan"). */
export function tampilanDalil(s: Soal, bab: Pick<Bab, "dalil">): TampilDalil | null {
  const d = bab.dalil.find((x) => x.id === s.dalil_id);
  if (!d) return null;
  const c = caraDalil(s, d);
  if (c === "rujukan" || c === "pembahasan") return null;
  const bukan = bukanDalil(d);
  const sumber = bukan || sumberDitanya(s, d) ? undefined : d.sumber;
  if (c === "potong" || c === "potong-terjemah") {
    const kata = c === "potong" ? kataArab(d) : kataTerjemah(d);
    const p = potonganSah(s.dalil_potong, kata.length);
    const isi = p ? kata.slice(p[0] - 1, p[1]).join(" ") : kata.join(" ");
    return c === "potong" ? { arab: isi, sumber, bukan } : { terjemah: isi, sumber };
  }
  return { ...(c !== "terjemah" && { arab: d.arab }), ...(c !== "arab" && d.terjemah?.trim() && { terjemah: d.terjemah }), sumber, bukan };
}

/**
 * Dalil lengkap untuk kunci & pembahasan (web dan Word): untuk soal 0.42.0 yang dalilnya tidak tampil utuh di soal
 * (potongan, Arab/terjemah saja, nama sumber, di pembahasan) atau sumbernya disembunyikan. Soal lama: null (tidak berubah).
 */
export function dalilKunci(s: Soal, bab: Pick<Bab, "dalil">): { arab: string; terjemah: string; sumber: string } | null {
  const d = bab.dalil.find((x) => x.id === s.dalil_id);
  if (!d || !s.dalil_tampil || bukanDalil(d)) return null;
  if (caraDalil(s, d) === "utuh" && !sumberDitanya(s, d)) return null;
  return { arab: d.arab, terjemah: d.terjemah?.trim() ?? "", sumber: d.sumber };
}

/**
 * Rencana aplikasi (rencanaDalil, prompt.ts) dipasang ke kisi-kisi AI: nomor berdalil wajib punya dalil (bila AI lupa:
 * dalil yang paling jarang dipakai dan cocok dengan caranya), nomor lain tanpa dalil. Dalil pilihan AI yang tidak cocok
 * dengan caranya (mis. hadis tanpa terjemah untuk "terjemah saja") tetap dipakai dengan cara "Arab saja".
 * `ikutAi` (ada catatan guru): nomor berdalil yang sengaja dikosongkan AI (guru minta tanpa teks Arab) dibiarkan kosong.
 */
export function pasangDalil<T extends BarisKisi>(kisi: T[], rencana: (CaraDalil | null)[], bab: Bab, ikutAi = false): T[] {
  const dalil = bab.dalil.filter((d) => !bukanDalil(d));
  const pakai = new Map<string, number>();
  const hitung = (id: string) => pakai.set(id, (pakai.get(id) ?? 0) + 1);
  const jarang = (c: CaraDalil) => [...dalil].sort((a, b) => Number(!cocokCara(c, a)) - Number(!cocokCara(c, b)) || (pakai.get(a.id) ?? 0) - (pakai.get(b.id) ?? 0))[0];
  // Dalil pilihan AI dihitung dulu, supaya pengisi nomor kosong memilih dalil yang belum dipakai.
  kisi.forEach((k, i) => rencana[i] && k.dalil_id && dalil.some((d) => d.id === k.dalil_id) && hitung(k.dalil_id));
  return kisi.map((k, i) => {
    const c = rencana[i];
    const pilihan = bab.dalil.find((d) => d.id === k.dalil_id);
    if (!c || !dalil.length) {
      // Teks Arab materi biasa (bukan ayat/hadis) boleh dipakai AI di nomor mana pun sebagai teks Arab.
      return pilihan && bukanDalil(pilihan) ? { ...k, dalil_tampil: "arab" as CaraDalil } : { ...k, dalil_id: null, dalil_tampil: null };
    }
    if (!pilihan && ikutAi) return { ...k, dalil_id: null, dalil_tampil: null };
    const d = pilihan && !bukanDalil(pilihan) ? pilihan : jarang(c);
    if (!pilihan || bukanDalil(pilihan)) hitung(d.id);
    return { ...k, dalil_id: d.id, dalil_tampil: cocokCara(c, d) ? c : "arab" };
  });
}

/** Semua teks Arab terverifikasi milik bab (ayat, hadis, mufradat, materi) dalam satu teks. */
export const korpusArab = (bab: Bab) => rapikan(JSON.stringify(bab));

/** Paragraf yang hampir seluruhnya huruf Arab (ayat/hadis), bukan kalimat Latin yang menyelipkan lafaz. */
export function paragrafArab(t: string) {
  const arab = (t.match(new RegExp(POLA_ARAB, "g")) ?? []).join("").replace(/\s/g, "").length;
  const latin = (t.match(/[A-Za-zÀ-ɏḀ-ỿ]/g) ?? []).length;
  return arab > 0 && arab >= latin * 4;
}

/**
 * Rumus LaTeX di teks soal (0.29.0): "$...$" di satu baris. Seperti Pandoc: setelah "$" pembuka dan sebelum "$" penutup
 * tidak boleh spasi, dan penutup tidak diikuti angka, supaya "US$ 5 dan US$ 10" tidak terbaca rumus.
 */
export const POLA_RUMUS = String.raw`\$(?=[^\s$])[^$\n]*?[^\s$]\$(?!\d)`;
export const adaRumus = (t: string) => new RegExp(POLA_RUMUS).test(String(t ?? ""));

/** Satu baris teks soal, atau satu tabel utuh (`tabel` terisi, `teks` kosong). */
export type Baris = { teks: string; arab: boolean; tabel?: string[][] };

const BARIS_TABEL = /^\|.*\|$/;
const PEMISAH_TABEL = /^\|(\s*:?-+:?\s*\|)+$/;

/**
 * Sel menjorok (0.41.0, mis. akun kredit di jurnal umum): di teks ditulis dengan ≥ 3 spasi setelah "|"
 * ("|    Pendapatan Jasa |"); di hasil `pecahBaris`/`cariTabel` selnya diawali JOROK, isi selnya tanpa spasi.
 */
export const JOROK = "\t";
const sel = (s: string) => (/^ {3,}\S/.test(s) ? JOROK : "") + s.trim();
const isiBaris = (b: string) => b.slice(1, -1).split("|").map(sel);

/** Baris-baris tabel → teks "| a | b |" (baris pertama judul, lalu pemisah). "|" & baris baru di dalam sel dibuang. */
export function tulisTabel(isi: string[][]): string {
  const kolom = Math.max(...isi.map((b) => b.length));
  const baris = isi.map(
    (b) => `| ${[...b, ...Array(kolom - b.length).fill("")].map((t) => (t.startsWith(JOROK) ? "   " : "") + t.replace(/\s*[|\r\n\t]+\s*/g, " ").trim()).join(" | ")} |`,
  );
  return [baris[0], `|${"---|".repeat(kolom)}`, ...baris.slice(1)].join("\n");
}

/** Letak setiap tabel di teks mentah (urutannya sama dengan tabel di `pecahBaris`): untuk jendela Ubah tabel. */
export function cariTabel(t: string): { awal: number; akhir: number; isi: string[][] }[] {
  const hasil: { awal: number; akhir: number; isi: string[][] }[] = [];
  const baris = [...String(t ?? "").matchAll(/[^\r\n]*/g)].filter((m) => m[0].trim()).map((m) => ({ awal: m.index, akhir: m.index + m[0].length, teks: m[0].trim() }));
  for (let i = 0; i < baris.length; ) {
    let j = i;
    while (j < baris.length && BARIS_TABEL.test(baris[j].teks)) j++;
    const isi = baris.slice(i, j).filter((b) => !PEMISAH_TABEL.test(b.teks)).map((b) => isiBaris(b.teks));
    if (isi.length >= 2) {
      const kolom = Math.max(...isi.map((x) => x.length));
      hasil.push({ awal: baris[i].awal, akhir: baris[j - 1].akhir, isi: isi.map((x) => [...x, ...Array(kolom - x.length).fill("")]) });
    }
    i = Math.max(j, i + 1);
  }
  return hasil;
}

/**
 * Pecah teks soal menjadi baris (baris kosong dibuang). `arab` = baris hampir seluruhnya huruf Arab (mis. satu ucapan
 * hiwar): ditampilkan sebagai satu blok kanan-ke-kiri, supaya titik dua, angka, dan tanda baca ikut urutan yang benar.
 * Tabel (0.28.0): baris-baris berurutan berbentuk "| a | b |" (minimal judul + 1 baris isi; baris "|---|---|" dibuang)
 * menjadi SATU baris ber-`tabel` (baris pertama = judul kolom, semua baris dibuat sama panjang). Kurang dari itu = teks biasa.
 */
export function pecahBaris(t: string): Baris[] {
  const baris = String(t ?? "")
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const hasil: Baris[] = [];
  for (let i = 0; i < baris.length; ) {
    let j = i;
    while (j < baris.length && BARIS_TABEL.test(baris[j])) j++;
    const isi = baris.slice(i, j).filter((b) => !PEMISAH_TABEL.test(b)).map(isiBaris);
    if (isi.length >= 2) {
      const kolom = Math.max(...isi.map((x) => x.length));
      hasil.push({ teks: "", arab: false, tabel: isi.map((x) => [...x, ...Array(kolom - x.length).fill("")]) });
      i = j;
    } else {
      for (const b of baris.slice(i, Math.max(j, i + 1))) hasil.push({ teks: b, arab: paragrafArab(b) });
      i = Math.max(j, i + 1);
    }
  }
  return hasil;
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
  const lamaMj = bentuk === "MJ" && !Array.isArray(s.premis); // menjodohkan gaya lama: satu nomor, kunci satu huruf
  return {
    bentuk,
    dalil_id: s.dalil_id ? teks(s.dalil_id) : null,
    ...(s.dalil_tampil !== undefined && { dalil_tampil: CARA_DALIL.includes(s.dalil_tampil as CaraDalil) ? s.dalil_tampil : null }),
    ...(Array.isArray(s.dalil_potong) && { dalil_potong: s.dalil_potong.slice(0, 2).map((n) => Math.round(Number(n)) || 0) }),
    gambar_id: Number.isInteger(Number(s.gambar_id)) && Number(s.gambar_id) > 0 ? Number(s.gambar_id) : null,
    pertanyaan: teks(s.pertanyaan),
    ...(bentuk === "PG" || bentuk === "PGK" ? { pilihan: [0, 1, 2, 3, 4].map((i) => teks(s.pilihan?.[i])) } : {}),
    ...(kategori
      ? {
          pernyataan: s.pernyataan!.slice(0, JUMLAH_PERNYATAAN).map(teks),
          label: (Array.isArray(s.label) ? s.label : []).slice(0, 2).map(teks),
        }
      : {}),
    kunci: bentuk === "PGK" ? kunci : lamaMj ? (kunci[0] ?? "").toUpperCase() : bentuk === "MJ" ? kunciMj : kategori ? [s.kunci].flat().slice(0, JUMLAH_PERNYATAAN).map(teks) : (kunci[0] ?? ""),
    ...(bentuk === "URAIAN" ? { rubrik } : {}),
    ...(bentuk === "ISIAN" ? { kunciAlt: alt } : {}),
    ...(lamaMj ? { jawaban } : bentuk === "MJ" ? { premis, jawaban } : {}),
    ...(Number.isInteger(s.grup) && s.grup! > 0 && (teks(s.wacana) || lamaMj) ? { grup: s.grup, ...(teks(s.wacana) && { wacana: teks(s.wacana).slice(0, 3000) }) } : {}),
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

/**
 * Menjodohkan gaya lama (satu nomor): pernyataan terisi, kunci satu huruf dari daftar jawaban, daftar tanpa kembar.
 * Bila seluruh set ikut diperiksa: dalam satu blok tiap nomor memakai jawaban berbeda dan daftar punya pengecoh.
 */
function periksaMjLama(soal: Soal[], i: number, s: Soal): string[] {
  const w: string[] = [];
  const jawaban = s.jawaban ?? [];
  const huruf = (x: Soal) => String([x.kunci].flat()[0] ?? "").trim().toUpperCase();
  const k = huruf(s);
  if (!String(s.pertanyaan ?? "").trim()) w.push("Pernyataan menjodohkan kosong.");
  if (jawaban.length < 3 || jawaban.some((j) => !j)) w.push("Daftar jawaban menjodohkan harus terisi (minimal 3).");
  if (!k || HURUF_MJ.indexOf(k) < 0 || HURUF_MJ.indexOf(k) >= jawaban.length) w.push("Kunci menjodohkan harus satu huruf dari daftar jawaban.");
  if (new Set(jawaban.map(norm)).size !== jawaban.length) w.push("Ada jawaban yang sama persis di daftar menjodohkan.");
  const blok = s.grup ? soal.filter((x, j) => j !== i && mjLama(x) && x.grup === s.grup) : [];
  if (blok.length) {
    if (k && blok.some((x) => huruf(x) === k)) w.push("Dua nomor menjodohkan memakai jawaban yang sama.");
    if (jawaban.length <= blok.length + 1) w.push("Daftar jawaban harus lebih banyak dari jumlah nomor menjodohkan (satu pengecoh).");
  }
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

/** Teks disederhanakan untuk dibandingkan: tanda diakritik dibuang (ḥ→h, ā→a), huruf kecil, tanda baca jadi spasi. */
const polos = (t: unknown) => ` ${String(t ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;

/**
 * Soal lain yang sudah memuat kunci isian soal ke-i (ATURAN-SOAL 2b no. 11), berikut potongan teksnya ("8 (…hiperinflasi…)"),
 * supaya guru dan perbaikan otomatis tahu persis letaknya (0.18.3; dulu hanya nomor, AI tidak melihat pengecoh soal itu).
 * Kunci isian lain yang sama persis juga dihitung bocor.
 */
function bocorDi(soal: Soal[], i: number): string[] {
  const asli = String([soal[i].kunci].flat()[0] ?? "").trim();
  const kunci = polos(asli);
  if (kunci.trim().length < 2) return [];
  const potong = (t: string) => {
    const di = t.toLowerCase().indexOf(asli.toLowerCase());
    const a = Math.max(0, di - 25);
    return `${a ? "…" : ""}${t.slice(a, a + 60)}${t.length > a + 60 ? "…" : ""}`;
  };
  // Kunci berangka ("10%", "11"): angka sebagai pilihan/pernyataan/jawaban soal lain tidak membocorkan (siswa tetap
  // menghitung); yang bocor angka yang DIBERIKAN di pokok soal lain ("PPN dengan tarif 11%"). Diukur 2026-11-09: 4 tanda
  // di data laptop, hanya 1 sungguhan.
  // Tahun ("92 H", "tahun 1948") bukan hasil hitung: tahun yang tertulis di pilihan/pernyataan soal lain tetap membocorkan
  // (0.31.2, set 104: kunci "92 H" tertulis di pokok soal 5 dan 10).
  const angka = /\d/.test(asli) && !adalahTahun(asli);
  return soal.flatMap((s, j) => {
    if (j === i) return [];
    const teks = angka ? [s.pertanyaan] : [s.pertanyaan, ...(s.pilihan ?? []), ...(s.pernyataan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...(s.bentuk === "ISIAN" ? [s.kunci].flat() : [])];
    const kena = teks.find((t) => polos(t).includes(kunci));
    return kena === undefined ? [] : [`${j + 1} ("${potong(String(kena))}")`];
  });
}

/**
 * PG yang kuncinya pilihan TERPANJANG dan >= 1,5x rata-rata pengecoh (ATURAN-SOAL 2b no. 7): bisa ditebak tanpa paham.
 * Batas 1,5 diukur 2026-11-07 pada 274 PG lama: 60% kunci terpanjang (acak = 20%); 1,5x menandai 9%, semuanya
 * memang mencolok. Kunci < 15 huruf (satu-dua kata) dilewati: selisih kata pendek tidak berarti.
 */
function kunciTerpanjang(s: Soal) {
  const k = HURUF.indexOf(String(s.kunci ?? "").trim().toUpperCase());
  const pj = (s.pilihan ?? []).map((p) => String(p ?? "").trim().length);
  if (k < 0 || pj.length !== 5 || pj[k] < 15) return false;
  const lain = pj.filter((_, i) => i !== k);
  return pj[k] > Math.max(...lain) && pj[k] >= 1.5 * (lain.reduce((a, b) => a + b, 0) / lain.length);
}

/**
 * Pilihan terlarang (ATURAN-SOAL 2b no. 6): "semua benar/salah", "tidak ada yang benar", atau pilihan yang HANYA
 * menunjuk huruf pilihan lain ("A dan B benar") — huruf itu jadi salah setelah pilihan diacak. Sengaja hanya pilihan
 * yang isinya seluruhnya pola itu, supaya "1 dan 3" (nomor pernyataan di soal) dan "perusahaan A dan B rugi" lolos.
 */
const PILIHAN_TERLARANG = [
  /^(semua|semuanya|seluruh)\s*(jawaban|pilihan|pernyataan)?\s*(di atas)?\s*(benar|salah|tepat)\.?$/i,
  /^tidak\s+ada\s+(jawaban\s+|pilihan\s+|pernyataan\s+)?yang\s+(benar|tepat|salah)\.?$/i,
  /^([Jj]awaban\s+|[Pp]ilihan\s+)?[A-E](\s*,\s*[A-E])*\s*,?\s*(dan|serta|&)\s*[A-E]\s*(benar|tepat|salah)?\.?$/,
];
const adaPilihanTerlarang = (s: Soal) => (s.pilihan ?? []).some((p) => PILIHAN_TERLARANG.some((r) => r.test(String(p ?? "").trim())));

// PG kompleks: pilihan gabungan nomor ("(2) dan (3)", "1, 2, dan 4") membuat siswa yang memilihnya benar isinya tapi
// dinilai salah (audit 2026-11-07, set 70 no. 13). Di PG biasa pola ini tetap boleh (menunjuk pernyataan bernomor di soal).
const GABUNGAN_NOMOR = /^\(?\d\)?(\s*,\s*\(?\d\)?)*\s*,?\s*(dan|serta|&)\s*\(?\d\)?\.?$/;

// Pembahasan PG/PGK yang menunjuk pilihan dengan URUTAN ("pengecoh kedua"): salah setelah pilihan diacak (audit 2026-11-07).
const URUTAN_PILIHAN = /\b(pengecoh|pilihan|opsi)\s+(ke-?\s?[1-5]\b|pertama|kedua|ketiga|keempat|kelima|terakhir)/i;

/**
 * PG: jawaban benar yang ditulis AI SEBELUM pilihan (setelah menghitung) harus sama dengan pilihan yang ditandai kunci.
 * Audit 2026-11-07: 3 dari 52 kunci salah karena AI menulis kunci dulu, baru menghitung di pembahasan.
 * Dibandingkan persis dulu (tanpa spasi, "$", huruf besar), baru tanpa tanda baca ("Rp82.500.000" = "Rp 82.500.000").
 * Persis dulu (0.29.0): tanpa tanda baca, "x^2 + 2x - 24" = "x^2 - 2x - 24" (tanda +/− hilang) → kunci benar dianggap salah.
 */
function cekJawabanBenar(s: Soal): string | null {
  const persis = (t: unknown) => String(t ?? "").replace(/[\s$]+/g, "").toLowerCase();
  const rata = (t: unknown) => polos(t).replace(/\s+/g, "");
  if (!rata(s.jawaban_benar)) return null;
  const cari = (f: (t: unknown) => string) => (s.pilihan ?? []).findIndex((p) => f(p) === f(s.jawaban_benar));
  const di = cari(persis) >= 0 ? cari(persis) : cari(rata);
  if (di < 0) return `Jawaban benar hasil hitung/penalaran ("${String(s.jawaban_benar).slice(0, 80)}") tidak ada di pilihan.`;
  if (HURUF[di] !== String(s.kunci ?? "").trim().toUpperCase())
    return `Kunci tidak cocok: jawaban benar hasil hitung/penalaran adalah "${String(s.jawaban_benar).slice(0, 80)}", tetapi kunci menunjuk pilihan lain.`;
  return null;
}

// "622 M", "2 H", "1187 Masehi", "tahun 1948", "tahun ke-8". H/M/SM huruf besar saja ("100 m" = meter).
const POLA_TAHUN = /\b(\d{1,4})\s*(?:SM|SH|H|M)\b|\b(\d{1,4})\s*(?:[Hh]ijriy?ah|[Mm]asehi)\b|\b[Tt]ahun\s+(?:ke-?\s*)?(\d{1,4})\b/g;

/** Teks berisi tahun ("92 H", "711 M", "tahun 1948"). Angka biasa ("11%", "Rp110.000", "1948") bukan. */
export const adalahTahun = (t: unknown) => new RegExp(POLA_TAHUN.source).test(String(t ?? ""));

/**
 * Calon jawaban isian yang AMAN untuk perbaikan otomatis isian bocor (0.31.2): nama/istilah berhuruf besar dan tahun dari
 * materi yang BELUM tertulis di soal lain mana pun (pokok, wacana, pilihan, pernyataan, lajur, kunci isian). Dulu AI menebak
 * sendiri dan tebakannya juga sudah tertulis (set 104: "Al-Walid", "Damaskus" → 3 calon gagal). Kata berhuruf besar yang
 * juga muncul berhuruf kecil di materi ("Pada", "Ia") dibuang karena hanya awal kalimat.
 * ponytail: istilah berhuruf kecil ("fungsi anggaran") belum ikut; daftar kosong = AI tetap memilih sendiri.
 */
export function jawabanAman(bab: Bab, soal: Soal[], i: number, maks = 40): string[] {
  const teks = [...bab.materi, ...(bab.pokok ?? [])].join("\n");
  const kecil = new Set(teks.match(/\b\p{Ll}[\p{L}'-]*/gu) ?? []);
  const nama = (teks.match(/\p{Lu}[\p{L}'-]*(?:\s+(?:(?:bin|binti|ibn|ibnu|al|as|asy|ar|ad|at|wa)\s+)?\p{Lu}[\p{L}'-]*)*/gu) ?? [])
    .filter((n) => n.length >= 3 && (n.includes(" ") || !kecil.has(n.toLowerCase())));
  const tahun = teks.match(/\b\d{1,4}\s*(?:SM|SH|H|M|Hijriy?ah|Masehi)\b/g) ?? []; // "41 H", bukan "tahun 41" dari "tahun 41 H"
  const lain = polos(
    soal.flatMap((s, j) => (j === i ? [] : [s.wacana, s.pertanyaan, ...(s.pilihan ?? []), ...(s.pernyataan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...(s.bentuk === "ISIAN" ? [s.kunci].flat() : [])])).join(" "),
  );
  const kunci = polos([soal[i].kunci].flat()[0]);
  return [...new Set([...nama, ...tahun])].filter((c) => !lain.includes(polos(c)) && polos(c) !== kunci).slice(0, maks);
}

/**
 * Mapel sejarah (2026-11-09, pilihan pemilik): tahun di bagian soal yang dinyatakan BENAR (pokok, wacana, kunci,
 * pernyataan B/S yang benar, pasangan menjodohkan) harus tertulis di materi; tahun pengecoh boleh lain. Tahun >= 2010
 * dilewati: stimulus kekinian ("Pada tahun 2025, siswa MA ...").
 * ponytail: hanya angka tahun; nama tokoh & tempat dijaga lewat instruksi (ATURAN_SEJARAH), belum diperiksa aplikasi.
 */
export function tahunAsing(s: Soal, angkaMateri: Set<string>): string[] {
  const k = [s.kunci].flat().map((x) => String(x ?? ""));
  const benarBs = s.bentuk === "BS" && !Array.isArray(s.pernyataan) ? k[0] === "Benar" : true;
  const teks = [
    s.wacana ?? "",
    benarBs ? s.pertanyaan : "",
    ...(s.pilihan ?? []).filter((_, i) => k.includes(HURUF[i])),
    ...(s.pernyataan ?? []).filter((_, i) => k[i] === s.label?.[0]),
    ...(s.premis ?? []),
    ...(s.jawaban ?? []).filter((_, i) => k.includes(HURUF[i])),
    ...(s.bentuk === "ISIAN" || s.bentuk === "URAIAN" ? k : []),
  ];
  const asing = teks.flatMap((x) =>
    [...String(x ?? "").matchAll(POLA_TAHUN)].filter((m) => {
      const n = m[1] ?? m[2] ?? m[3];
      return Number(n) < 2010 && !angkaMateri.has(String(Number(n)));
    }).map((m) => m[0].trim()),
  );
  return [...new Set(asing)];
}

/**
 * Kata/frasa pendek (≤ 6 kata) yang sudah tertulis di soal LAIN: pilihan, isi lajur menjodohkan, kunci isian.
 * Untuk perbaikan otomatis isian yang bocor (0.19.1): dulu AI hanya melihat pertanyaan + kunci soal lain, bukan pengecohnya,
 * sehingga jawaban penggantinya sering juga sudah tertulis (set 78: "anggaran" → "redistribusi", keduanya pilihan soal 2).
 */
export function kataTerpakai(soal: Soal[], i: number, maks = 80): string[] {
  const kata = soal
    .flatMap((s, j) => (j === i ? [] : [...(s.pilihan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...(s.bentuk === "ISIAN" ? [s.kunci].flat() : [])]))
    .map((t) => String(t ?? "").trim())
    .filter((t) => t && t.split(/\s+/).length <= 6);
  return [...new Set(kata)].slice(0, maks);
}

/**
 * Menjodohkan yang memakai 3+ isi lajur (premis/jawaban) sama dengan Menjodohkan SEBELUMNYA di set: nomor soal itu, atau 0.
 * Hanya soal yang belakangan yang ditandai, supaya perbaikan otomatis tidak mengganti keduanya (audit 2026-11-07, set 70).
 */
function mjMirip(soal: Soal[], i: number): number {
  const isi = (s: Soal) => new Set([...(s.premis ?? []), ...(s.jawaban ?? [])].map((t) => polos(t).trim()).filter(Boolean));
  const ini = isi(soal[i]);
  const j = soal.findIndex((s, j) => j < i && s.bentuk === "MJ" && [...isi(s)].filter((t) => ini.has(t)).length >= 3);
  return j + 1;
}

// Pembahasan Kategori yang menunjuk pernyataan dengan urutan ("pernyataan pertama", "tiga pernyataan pertama", "pernyataan 2").
const URUTAN_PERNYATAAN = /\bpernyataan\s+(ke-?\s?[1-4]\b|nomor\s+[1-4]\b|\(?[1-4]\)?(?![\d%.,])|pertama|kedua|ketiga|keempat|terakhir)/i;

/**
 * Soal Kategori: urutan 4 pernyataan (dan kuncinya) diacak aplikasi, supaya letak pernyataan salah tidak berpola
 * (audit 2026-11-07: tiga soal berkunci Benar, Benar, Benar, Salah). Soal yang pembahasannya menunjuk urutan TIDAK diacak,
 * supaya pembahasannya tidak salah tunjuk (termasuk soal lama dan tulisan guru). Ikut berlaku untuk Paket B–D.
 */
function acakPernyataan(s: Soal, acak: () => number) {
  const p = s.pernyataan!;
  const k = [s.kunci].flat();
  if (p.length !== k.length || p.length < 2 || URUTAN_PERNYATAAN.test(s.pembahasan ?? "")) return;
  const urut = p.map((_, i) => i);
  for (let i = urut.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [urut[i], urut[j]] = [urut[j], urut[i]];
  }
  s.pernyataan = urut.map((i) => p[i]);
  s.kunci = urut.map((i) => k[i]);
}

// Pertanyaan yang membahas dalil: menyebut ayat/hadis/lafaz/terjemah/sumbernya (0.42.0).
const SEBUT_DALIL = /firman|\bayat\b|surah|surat\b|hadis|sabda|lafa[zl]|potongan|terjemah|kutipan|dalil|\bQS\b|\bHR\b/i;
// "Perhatikan firman Allah berikut!", "hadis di atas", "potongan ayat berikut": menunjuk dalil yang ditampilkan.
const TUNJUK_DALIL = /(firman|\bayat|hadis|sabda|potongan|terjemah(an)?|lafa[zl]|kutipan)\b[^!?\n]{0,40}?\b(berikut|di\s?atas)\b/i; // titik boleh: "firman Allah Swt. berikut"

/** Pemeriksa dalil (ATURAN-SOAL 5a no. 5). Soal lama (tanpa cara tampil) hanya diperiksa soal "terjemah" dan dalil yang hilang. */
function periksaDalil(s: Soal, bab: Bab): string[] {
  const w: string[] = [];
  const teks = `${s.wacana ?? ""} ${s.pertanyaan ?? ""}`;
  const d = bab.dalil.find((x) => x.id === s.dalil_id);
  if (!d) {
    if (TUNJUK_DALIL.test(teks)) w.push("Soal menyuruh memperhatikan ayat/hadis, tetapi tidak ada yang ditampilkan. Pilih dalilnya lewat Edit, atau ubah kalimatnya.");
    return w;
  }
  if (bukanDalil(d)) return w;
  const c = caraDalil(s, d);
  const tampil = c !== "rujukan" && c !== "pembahasan";
  if (tampil && !butuhTerjemah(c) && /terjemah/i.test(teks)) w.push("Soal menyebut terjemah, tetapi terjemahnya tidak ditampilkan. Pilih cara tampil yang memuat terjemah, atau ubah kalimatnya.");
  if (!s.dalil_tampil) return w;
  if (tampil && !SEBUT_DALIL.test(teks)) w.push("Ayat/hadis ditampilkan di soal, tetapi pertanyaannya tidak membahasnya. Tanyakan isi dalil itu, atau hapus dalilnya (Edit: Dalil = tidak ada).");
  if ((c === "potong" || c === "potong-terjemah") && !potonganSah(s.dalil_potong, (c === "potong" ? kataArab(d) : kataTerjemah(d)).length))
    w.push("Potongan dalil belum sah (nomor kata awal dan akhir). Atur lewat Edit.");
  if (c === "rujukan" && !polos(teks).includes(` ${polos(namaSumber(d)).trim()} `)) w.push(`Dalil hanya disebut namanya, tetapi soal tidak menyebut sumbernya (${d.sumber}).`);
  if (!tampil && TUNJUK_DALIL.test(teks)) w.push("Soal menyuruh memperhatikan ayat/hadis, tetapi cara tampil dalilnya tidak menampilkan teks. Ubah cara tampilnya lewat Edit.");
  return w;
}

// "Perhatikan gambar berikut", "gambar di atas", "pada gambar tersebut" (bukan "menggambarkan" / "gambaran").
const SEBUT_GAMBAR = /\bgambar\s+(berikut|di\s?(atas|bawah)|tersebut|ini)\b|\b(pada|dari|dalam)\s+gambar\b/i;

/**
 * Beri peringatan pada soal yang bermasalah. Aturan 5: teks Arab hanya boleh dari data terverifikasi.
 * `teman` = soal lain di set (untuk soal grup: gambar boleh ada di soal lain satu grup). Bawaan: `soal` itu sendiri;
 * pemeriksa satu soal (Edit/Ganti) mengirim isi set TANPA soal yang diperiksa.
 */
export function periksaSoal(soal: Soal[], bab: Bab, cekAyat?: CekAyat, teman: Soal[] = soal): Soal[] {
  const arabAsingDi = pemeriksaArab(bab, cekAyat);
  // Angka dari teks materi saja (bukan kode TP "TP 3.1" atau nomor ayat di sumber dalil, yang membuat tahun palsu lolos).
  const teksMateri = [bab.judul, ...bab.tp.map((t) => t.teks), ...bab.materi, ...(bab.pokok ?? [])].join(" ");
  const angkaMateri = MAPEL_SEJARAH.test(identitasBab(bab).mapel) ? new Set((teksMateri.match(/\d+/g) ?? []).map((n) => String(Number(n)))) : null;
  const dalilAda = new Set(bab.dalil.map((d) => d.id));
  const gambarAda = new Set((bab.gambar ?? []).map((g) => g.id));
  // Soal grup TKA berbagi wacana: "Perhatikan gambar berikut" di wacana cukup bila salah satu soal grup bergambar (set 128).
  const grupBergambar = new Set(teman.filter((t) => t.grup && t.wacana && gambarAda.has(Number(t.gambar_id))).map((t) => t.grup));
  return soal.map((asli, i) => {
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
    // Cara tampil & potongan dalil dari AI/guru: yang tidak dikenal dibuang (kembali ke tampilan bawaan).
    if (s.dalil_tampil !== undefined && !CARA_DALIL.includes(s.dalil_tampil as CaraDalil)) s.dalil_tampil = null;
    if (s.dalil_potong !== undefined) s.dalil_potong = Array.isArray(s.dalil_potong) ? s.dalil_potong.slice(0, 2).map((n) => Math.round(Number(n)) || 0) : null;
    // Gambar yang tidak ada di materi dibuang; soal yang menyebut gambar tanpa gambar ditandai.
    if (s.gambar_id != null && !gambarAda.has(Number(s.gambar_id))) s.gambar_id = null;
    const peringatan: string[] = [];
    if (!s.gambar_id && !(s.grup && s.wacana && grupBergambar.has(s.grup)) && SEBUT_GAMBAR.test(`${s.wacana ?? ""} ${s.pertanyaan}`)) peringatan.push("Soal menyebut gambar, tetapi tidak ada gambar yang ditampilkan. Pilih gambarnya lewat Edit, atau ubah kalimatnya.");
    const semuaTeks = [s.wacana ?? "", s.pertanyaan, ...(s.pilihan ?? []), ...(s.pernyataan ?? []), ...(s.premis ?? []), ...(s.jawaban ?? []), ...[s.kunci].flat(), ...(s.kunciAlt ?? []), s.pembahasan, ...(s.rubrik ?? []).map((r) => r.kriteria)];
    const arabAsing = semuaTeks.flatMap((t) => arabAsingDi(String(t ?? "")));
    if (arabAsing.length)
      peringatan.push(`${bab.teksArab === "bahasa" ? "Teks Arab mirip ayat Al-Qur'an tetapi" : "Teks Arab"} tidak cocok dengan data terverifikasi: ${arabAsing.join(" | ")}`);
    if (s.dalil_id && !dalilAda.has(s.dalil_id)) peringatan.push(`Dalil "${s.dalil_id}" tidak ada di data bab.`);
    peringatan.push(...periksaDalil(s, bab));
    const tahun = angkaMateri ? tahunAsing(s, angkaMateri) : [];
    if (tahun.length) peringatan.push(`Tahun tidak tertulis di materi (mapel sejarah, bisa jadi dikarang AI): ${tahun.join(", ")}. Pakai tahun dari materi.`);
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && s.pilihan?.length !== 5) peringatan.push("Jumlah pilihan bukan 5.");
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && adaPilihanTerlarang(s))
      peringatan.push('Ada pilihan "semua benar/salah", "tidak ada yang benar", atau yang menunjuk huruf pilihan lain (urutan pilihan diacak aplikasi). Ganti dengan pilihan berisi.');
    if (s.bentuk === "PGK" && (s.pilihan ?? []).some((p) => GABUNGAN_NOMOR.test(String(p ?? "").trim())))
      peringatan.push('Pilihan PG kompleks tidak boleh berupa gabungan nomor ("(2) dan (3)"): siswa sendiri yang memilih semua jawaban yang tepat. Tulis tiap pilihan sebagai satu pernyataan.');
    if ((s.bentuk === "PG" || s.bentuk === "PGK") && URUTAN_PILIHAN.test(s.pembahasan ?? ""))
      peringatan.push('Pembahasan menunjuk pilihan dengan urutan ("pengecoh kedua"), padahal urutan pilihan diacak aplikasi. Sebut isi pilihannya.');
    if (s.bentuk === "PG") {
      const w = cekJawabanBenar(s);
      if (w) peringatan.push(w);
    }
    // HOTS wajib stimulus (ATURAN-SOAL 1c no. 3). Batas 80 huruf diukur 2026-11-07 pada ±100 soal C4–C6 lama tanpa
    // wacana/dalil: hanya pertanyaan yang benar-benar kosong ("Tentukan apakah setiap pernyataan berikut Benar atau Salah!")
    // yang kena. Menjodohkan dilewati: isinya ada di pasangan, perintahnya memang pendek.
    if (/^C[4-6]$/i.test(s.level ?? "") && s.bentuk !== "MJ" && !s.wacana && !tampilanDalil(s, bab) && !s.gambar_id && String(s.pertanyaan ?? "").trim().length < 80)
      peringatan.push(`Soal HOTS (${s.level}) tanpa stimulus: tambahkan kasus, data, atau teks yang harus diolah siswa untuk menjawab.`);
    if (s.bentuk === "PG" && kunciTerpanjang(s)) peringatan.push("Jawaban benar jauh lebih panjang dari semua pengecoh, jadi mudah ditebak. Samakan panjang dan kerincian pilihan.");
    if (s.bentuk === "PGK" && !KUNCI_PGK.includes(new Set([s.kunci].flat()).size)) peringatan.push("Kunci PG kompleks harus 2 sampai 4 jawaban (tidak semua pilihan).");
    if (s.bentuk === "ISIAN") {
      peringatan.push(...periksaIsian(s));
      const di = bocorDi(soal, i);
      if (di.length) peringatan.push(`Jawaban isian sudah tertulis di soal nomor ${di.slice(0, 3).join(", ")}${di.length > 3 ? `, dan ${di.length - 3} soal lain` : ""}. Ganti jawaban isian ini (Ganti/Edit); bila materinya pendek, kurangi jumlah soal isian.`);
    }
    if (mjLama(s)) peringatan.push(...periksaMjLama(soal, i, s));
    else if (s.bentuk === "MJ") {
      peringatan.push(...periksaMenjodohkan(s));
      const mirip = mjMirip(soal, i);
      if (mirip) peringatan.push(`Menjodohkan ini mirip soal nomor ${mirip} (3 atau lebih isi lajur sama). Pakai pasangan dari sisi materi lain.`);
    }
    if (kategoriBaru(s)) {
      if (!PERNYATAAN_BOLEH.includes(s.pernyataan!.length) || s.pernyataan!.some((p) => !p)) peringatan.push("Soal kategori harus berisi 3 atau 4 pernyataan (tidak boleh kosong).");
      if (!cariLabel(s.label)) peringatan.push(`Label kategori tidak dikenal: ${(s.label ?? []).join(" / ") || "(kosong)"}.`);
      const kunci = [s.kunci].flat();
      if (kunci.length !== s.pernyataan!.length || kunci.some((k) => !s.label?.includes(k))) peringatan.push("Kunci kategori harus satu label untuk setiap pernyataan.");
    } else if (s.bentuk === "BS") {
      // Benar/Salah gaya lama: satu pernyataan per nomor.
      if (!["Benar", "Salah"].includes(String([s.kunci].flat()[0] ?? ""))) peringatan.push('Kunci benar/salah harus "Benar" atau "Salah".');
      if (String(s.pertanyaan ?? "").trim().endsWith("?")) peringatan.push("Soal benar/salah harus berupa pernyataan, bukan pertanyaan.");
    }
    // langkah & jawaban_benar hanya untuk pemeriksaan di atas: tidak disimpan (kalau disimpan, Edit guru membuatnya basi).
    // jodoh = format jawaban AI menjodohkan gaya lama yang tidak tersusun (mis. tanpa blok): juga tidak disimpan.
    const { langkah: _l, jawaban_benar: _j, jodoh: _o, ...simpan } = s;
    void _l;
    void _j;
    void _o;
    return { ...simpan, peringatan };
  });
}

const HURUF = "ABCDE";
/**
 * PG kompleks (MCMA, ATURAN-SOAL.md bagian 3): 2–4 jawaban benar dari 5. Soal madrasah diminta 2–3; Latihan TKA 2–4
 * seperti contoh resmi (RUJUKAN.md I2).
 */
export const KUNCI_PGK = [2, 3, 4];
// Semua gabungan k posisi dari 5: k=2 → AB, AC, ... DE (10); k=3 → ABC, ... CDE (10); k=4 → ABCD, ... BCDE (5)
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

export function kocok<T>(arr: T[], acak: () => number): T[] {
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
  for (const s of soal) if (kategoriBaru(s)) acakPernyataan(s, acak);
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
