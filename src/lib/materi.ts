// "Materi sendiri" milik guru (langkah 8). Tanpa import "@/..." supaya bisa dites langsung: npm test
import { rapikanGambar, type GambarBab } from "./gambar.ts";
import { MAPEL_BAHASA_ARAB } from "./mapel.ts";
import { arabTakTerverifikasi, bukanDalil, identitasBab, istilahArab, KELAS, korpusArab, paragrafArab, POLA_ARAB, SUMBER_BUKAN, type Bab } from "./soal.ts";

// perGuru 300: materi kini tersimpan otomatis setiap kali guru memasukkan materi baru di halaman utama.
export const BATAS_MATERI = { judul: 150, mapel: 60, tp: 15, teksTp: 500, isiMin: 100, isi: 30000, dalil: 20, teksDalil: 3000, perGuru: 300 };


/** Isian form "Materi Saya" (apa adanya dari browser, belum dipercaya). */
export type IsianMateri = {
  mapel: string;
  kelas: string; // "X" | "XI" | "XII"
  teksArab: "dalil" | "bahasa"; // Tahap F: "bahasa" untuk mapel yang teks Arabnya isi pelajaran (Bahasa Arab)
  judul: string;
  tp: string; // satu TP per baris, boleh diawali kode, mis. "TP 1.2: ..."
  isi: string;
  // usulan: teks Arab dari file yang tidak ditemukan di mushaf; mushaf: teks dari data mushaf (keduanya tampilan saja,
  // server selalu mencocokkan ulang ke mushaf); bukan: guru menekan "Bukan ayat/hadis" (tanpa sumber, tanpa centang)
  dalil: { sumber: string; arab: string; terjemah: string; usulan?: boolean; mushaf?: boolean; bukan?: boolean }[];
  diverifikasi: boolean; // centang: guru sudah memeriksa teks hadis / teks Arab yang tidak ada di mushaf
  pokok?: string[]; // pokok materi hasil analisa AI (opsional)
  gambar?: GambarBab[]; // 0.30.0: gambar yang sudah diunggah (id tabel `gambar`); kepemilikan dicek di simpanMateri
  // TP dirumuskan guru (RUJUKAN.md D): kalau ada TP usulan AI (tidak tertulis di teks guru), guru wajib mencentang
  // bahwa TP sudah dibaca. Penanda diberi server saat analisa; tidak disimpan di bab.
  tpUsulan?: boolean;
  tpDibaca?: boolean;
};

/**
 * Penanda paragraf Arab dari PDF (dibuat `paragrafPdf`, office.ts). Teks Arab hasil ekstrak PDF sering rusak (huruf
 * tertukar, harakat lepas), jadi TIDAK PERNAH dipakai apa adanya: hanya untuk mencari ayat di mushaf (`susunDraf`),
 * yang tidak ketemu dibuang. Baris-baris satu blok dipisah "\n".
 */
export const TANDA_PDF = "[[PDF]]";

/**
 * Tanda letak gambar file di teks materi (0.30.0, dibuat office.ts): "[[GAMBAR 3]]" = gambar ke-3 dari file itu. Untuk AI
 * analisa ditulis "[GAMBAR 3]" (sama dengan label gambarnya); dari isi materi yang disimpan dibuang.
 */
export const tandaGambar = (n: number) => `[[GAMBAR ${n}]]`;
export const POLA_TANDA_GAMBAR = /\[\[GAMBAR (\d+)\]\]/g;
export const buangTandaGambar = (t: string) => t.replace(POLA_TANDA_GAMBAR, " ").replace(/\s+/g, " ").trim();
/** Nomor tanda gambar digeser (file kedua dan seterusnya, serta gambar tempelan yang bernomor lebih dulu). */
export const geserTandaGambar = (t: string, geser: number) => (geser ? t.replace(POLA_TANDA_GAMBAR, (_, n) => tandaGambar(Number(n) + geser)) : t);

/** Bacaan satu halaman PDF oleh AI (0.31.0), sudah dirapikan: paragraf materi + gambar yang dipotong browser. */
export type BacaanHalaman = { paragraf: string[]; gambar: { kotak: [number, number, number, number]; keterangan: string }[] };

/**
 * Jawaban AI pembaca halaman PDF → paragraf materi (format sama dengan file Word: tabel = baris "| a | b |", rumus $...$,
 * letak gambar = [[GAMBAR n]] nomor per halaman). Aturan 5: teks Arab hasil bacaan AI TIDAK dipakai apa adanya:
 * - blok Arab (ayat/hadis) → bertanda TANDA_PDF, jadi hanya penunjuk ayat di mushaf (susunDraf), sisanya dibuang;
 * - tulisan Arab di teks/tabel (mis. lafal mufradat) → diganti potongan RESMI ayat halaman itu yang kerangka hurufnya
 *   sama (`potong`, dari mushaf), selain itu dibuang.
 * Mode "bahasa" (Bahasa Arab, Nahwu): tulisan Arab adalah isi pelajaran, jadi dipertahankan; yang dikenali mushaf sebagai
 * ayat tetap jadi penunjuk mushaf.
 */
export function rapikanBacaanHalaman(
  data: unknown,
  cariAyat: CariAyat,
  potong: (ayat: string, arab: string) => string | null,
  bahasa = false,
): BacaanHalaman {
  const mentah = (data as { blok?: unknown })?.blok;
  const blok = (Array.isArray(mentah) ? mentah : []).slice(0, 300) as Record<string, unknown>[];
  const ayat = blok.flatMap((b) => (b?.jenis === "arab" ? [cariAyat(teks(b.isi), "")?.arab ?? ""] : [])).filter(Boolean);
  const pola = new RegExp(POLA_ARAB, "g");
  const aman = (t: string) =>
    bahasa
      ? t
      : t.replace(pola, (arab) => ayat.map((a) => potong(a, arab)).find(Boolean) ?? "").replace(/[ \t]{2,}/g, " ").replace(/\(\s*\)/g, "").trim();
  const paragraf: string[] = [];
  const gambar: BacaanHalaman["gambar"] = [];
  for (const b of blok) {
    if (b?.jenis === "teks") {
      const t = aman(teks(b.isi).slice(0, 5000));
      if (t) paragraf.push(t);
    } else if (b?.jenis === "arab") {
      const t = teks(b.isi).slice(0, 5000);
      if (t) paragraf.push(bahasa && !cariAyat(t, "") ? t : TANDA_PDF + t);
    } else if (b?.jenis === "tabel" && Array.isArray(b.baris)) {
      const baris = (b.baris as unknown[])
        .slice(0, 40)
        .map((r) => (Array.isArray(r) ? r : []).slice(0, 8).map((s) => aman(teks(s)).replace(/\|/g, "/").replace(/\s+/g, " ")))
        .filter((r) => r.some(Boolean));
      baris.forEach((r, i) => {
        paragraf.push(`| ${r.join(" | ")} |`);
        if (i === 0) paragraf.push(`|${"---|".repeat(r.length)}`);
      });
    } else if (b?.jenis === "gambar" && b.pakai !== false && gambar.length < 10) {
      const k = (Array.isArray(b.kotak) ? b.kotak : []).map(Number);
      if (k.length !== 4 || k.some((x) => !Number.isFinite(x))) continue;
      const [x0, y0, x1, y1] = k.map((x) => Math.min(1000, Math.max(0, x)));
      if (x1 - x0 < 20 || y1 - y0 < 20) continue; // terlalu kecil (atau terbalik): bukan gambar yang bisa dipakai
      gambar.push({ kotak: [x0, y0, x1, y1], keterangan: teks(b.keterangan).replace(pola, "").slice(0, 200) });
      paragraf.push(tandaGambar(gambar.length));
    }
  }
  return { paragraf, gambar };
}

/** Pencari ayat di mushaf (mushaf().cari); disuntikkan supaya file ini tetap bisa dites tanpa membaca mushaf. */
export type CariAyat = (arab: string, petunjuk: string) => { sumber: string; arab: string } | null;

const teks = (x: unknown) => String(x ?? "").normalize("NFC").trim();

/**
 * Rapikan isian materi menjadi data bab. Aturan 5: teks Arab hanya dipercaya dari kotak "Ayat & Hadis Terverifikasi".
 * Teks yang ditemukan di mushaf (`cariAyat`) DIGANTI teks resmi mushaf + sumbernya, tanpa perlu centang; selebihnya
 * (hadis, dll.) wajib dicentang guru. Teks Arab di judul/TP/isi yang tidak ada di kotak itu dibuang dan dilaporkan di
 * `dihapus`. Mengembalikan pesan kalau isian tidak valid.
 */
export function rapikanMateri(x: Partial<IsianMateri>, id: string, cariAyat?: CariAyat): { bab: Bab; dihapus: string[] } | string {
  const B = BATAS_MATERI;
  const mapel = teks(x?.mapel).replace(/\s+/g, " ");
  if (!mapel) return "Mata pelajaran wajib diisi.";
  if (mapel.length > B.mapel) return `Nama mata pelajaran maksimal ${B.mapel} huruf.`;
  const kelas = teks(x?.kelas);
  if (!KELAS.includes(kelas)) return "Pilih kelas X, XI, atau XII.";
  const judul = teks(x?.judul);
  if (!judul) return "Judul materi wajib diisi.";
  if (judul.length > B.judul) return `Judul maksimal ${B.judul} huruf.`;

  const dalilMentah = (Array.isArray(x?.dalil) ? x.dalil : [])
    .map((d) => ({ sumber: teks(d?.sumber), arab: teks(d?.arab), terjemah: teks(d?.terjemah), bukan: d?.bukan === true }))
    .filter((d) => d.sumber || d.arab || d.terjemah)
    .map((d) => {
      // Ditemukan di mushaf → tetap ayat, walau guru menandai "bukan ayat/hadis".
      const ayat = d.arab ? cariAyat?.(d.arab, d.sumber) : null;
      if (ayat) return { ...d, ...ayat, mushaf: true, bukan: false };
      const bukan = bukanDalil(d);
      return { ...d, mushaf: false, bukan, sumber: bukan ? SUMBER_BUKAN : d.sumber };
    });
  if (dalilMentah.length > B.dalil) return `Ayat/hadis maksimal ${B.dalil}.`;
  for (const [i, d] of dalilMentah.entries()) {
    // Terjemah boleh kosong (guru dibuat mudah); sumber wajib supaya soal bisa menyebut asal dalil.
    if (!d.sumber || !d.arab) return `Ayat/hadis ke-${i + 1}: sumber dan teks Arab wajib diisi.`;
    if (!new RegExp(POLA_ARAB).test(d.arab)) return `Ayat/hadis ke-${i + 1}: kolom teks Arab tidak berisi huruf Arab.`;
    if ([d.sumber, d.arab, d.terjemah].some((t) => t.length > B.teksDalil)) return `Ayat/hadis ke-${i + 1}: teks terlalu panjang (maks ${B.teksDalil} huruf).`;
  }
  // Centang hanya untuk hadis (bukan dari mushaf dan tidak ditandai "Bukan ayat/hadis" oleh guru).
  if (dalilMentah.some((d) => !d.mushaf && !d.bukan) && x?.diverifikasi !== true)
    return "Ada teks Arab yang tidak ditemukan di mushaf (hadis atau lainnya). Centang pernyataan bahwa teks itu sudah Anda periksa, atau tekan \"Bukan ayat/hadis\" bila memang bukan.";
  const dalil = dalilMentah.map(({ mushaf, bukan, ...d }, i) => ({ id: `dalil-${i + 1}`, ...d, mufradat: [], ...(mushaf && { mushaf }), ...(bukan && { bukan }) }));

  // Buang teks Arab yang tidak berasal dari kotak ayat/hadis terverifikasi, KECUALI istilah pendek (istilahArab, <= 3 kata).
  // Mode "bahasa" (Bahasa Arab): teks Arab materi adalah isi pelajaran, jadi dipertahankan; ayat tetap dijaga saat soal dibuat.
  const bahasa = x?.teksArab === "bahasa";
  const korpus = korpusArab({ id: "", judul: "", tp: [], materi: [], dalil });
  const dihapus: string[] = [];
  const bersihkan = (t: string) => {
    if (bahasa) return t;
    const istilah = istilahArab(t);
    const asing = new Set(arabTakTerverifikasi(t, korpus).filter((p) => !istilah.has(p)));
    dihapus.push(...asing);
    return asing.size ? t.replace(new RegExp(POLA_ARAB, "g"), (p) => (asing.has(p) ? "" : p)).replace(/[ \t]{2,}/g, " ").trim() : t;
  };

  const barisTp = teks(x?.tp).split("\n").map((b) => b.trim()).filter(Boolean);
  if (!barisTp.length) return "Tujuan Pembelajaran (TP) wajib diisi, satu per baris.";
  if (barisTp.length > B.tp) return `TP maksimal ${B.tp} baris.`;
  if (barisTp.some((b) => b.length > B.teksTp)) return `Satu TP maksimal ${B.teksTp} huruf.`;
  if (x?.tpUsulan && x?.tpDibaca !== true) return "Ada TP usulan AI. Baca TP-nya, ubah bila perlu, lalu centang pernyataan bahwa TP sudah Anda baca.";
  const tp = barisTp.map((b, i) => {
    const m = /^TP\s*([\d.]+)\s*[:.\-–]?\s*(.+)$/i.exec(b);
    return m ? { kode: `TP ${m[1].replace(/\.$/, "")}`, teks: bersihkan(m[2]) } : { kode: `TP ${i + 1}`, teks: bersihkan(b) };
  });

  const isi = teks(x?.isi);
  if (isi.length < B.isiMin) return `Isi materi terlalu pendek (minimal ${B.isiMin} huruf).`;
  if (isi.length > B.isi) return `Isi materi terlalu panjang (maksimal ${B.isi.toLocaleString("id-ID")} huruf, sekarang ${isi.length.toLocaleString("id-ID")}).`;
  const materi = isi.split("\n").map((b) => bersihkan(b.trim())).filter(Boolean);

  const pokok = (Array.isArray(x?.pokok) ? x.pokok : []).map((p) => bersihkan(teks(p)).slice(0, 300)).filter(Boolean).slice(0, 15);
  const gambar = rapikanGambar(x?.gambar).map((g) => ({ ...g, keterangan: bersihkan(g.keterangan) }));
  return { bab: { id, mapel: bersihkan(mapel), kelas, ...(bahasa && { teksArab: "bahasa" as const }), judul: bersihkan(judul), tp, dalil, materi, ...(pokok.length && { pokok }), ...(gambar.length && { gambar }) }, dihapus };
}

/** Mapel yang teks Arabnya isi pelajaran (Tahap F; Nahwu sejak 2026-11-09). */
export const modeArab = (mapel: string): IsianMateri["teksArab"] => (MAPEL_BAHASA_ARAB.test(mapel) ? "bahasa" : "dalil");

/**
 * Materi dari halaman utama (tempel teks / file, urut seperti aslinya) → draf isian + teks untuk dianalisa AI.
 * Paragraf Arab: ayat (ditemukan di mushaf) → kotak dalil dengan teks resmi; basmalah dibuang; lainnya → usulan hadis
 * yang wajib dicentang guru (aturan 5), kecuali mapel Bahasa Arab (tetap di isi). Di teks untuk AI, setiap dalil
 * ditandai [DALIL n] supaya AI bisa menunjuk sumber & terjemah yang tertulis di dekatnya.
 */
export function susunDraf(
  x: { mapel: string; kelas: string; paragraf: string[] },
  cariAyat: CariAyat,
  basmalah: (arab: string) => boolean,
): { isian: IsianMateri; untukAi: string; dibuangPdf: number } {
  const teksArab = modeArab(teks(x.mapel));
  const isi: string[] = [];
  const untukAi: string[] = [];
  const dalil: IsianMateri["dalil"] = [];
  let dibuangPdf = 0;
  for (const asli of x.paragraf.map(teks).filter(Boolean)) {
    // Letak gambar: hanya untuk AI analisa (di baris sendiri, sebelum teks paragrafnya), tidak masuk isi materi.
    const tanda = [...asli.matchAll(POLA_TANDA_GAMBAR)].map((m) => `[GAMBAR ${m[1]}]`);
    if (tanda.length) untukAi.push(tanda.join(" "));
    const p = tanda.length ? buangTandaGambar(asli) : asli;
    if (!p) continue;
    if (p.startsWith(TANDA_PDF)) {
      // Teks Arab PDF tidak dipercaya (aturan 5): hanya penunjuk ayat; yang dipakai teks mushaf, sisanya dibuang.
      const { ayat, dibuang } = ayatDariPdf(p.slice(TANDA_PDF.length), cariAyat, basmalah);
      dibuangPdf += dibuang;
      for (const a of ayat) {
        let n = dalil.findIndex((y) => y.arab === a.arab);
        if (n < 0 && dalil.length < BATAS_MATERI.dalil) n = dalil.push({ ...a, terjemah: "", mushaf: true }) - 1;
        if (n >= 0) untukAi.push(`[DALIL ${n + 1}, ${a.sumber}] ${a.arab}`);
      }
      continue;
    }
    if (!paragrafArab(p)) {
      isi.push(p);
      untukAi.push(p);
      continue;
    }
    if (basmalah(p)) continue;
    // Istilah pendek (<= 3 kata, mis. "مُعْجِزَةٌ", "ق"): tetap di isi, tidak dicari di mushaf, tidak jadi usulan hadis.
    const istilah = istilahArab(p);
    if ((p.match(new RegExp(POLA_ARAB, "g")) ?? []).every((x) => istilah.has(x))) {
      isi.push(p);
      untukAi.push(p);
      continue;
    }
    const ayat = cariAyat(p, "");
    if (!ayat && teksArab === "bahasa") {
      isi.push(p);
      untukAi.push(p);
      continue;
    }
    const d = ayat ? { ...ayat, terjemah: "", mushaf: true } : { sumber: "", arab: p, terjemah: "", usulan: true };
    let n = dalil.findIndex((y) => y.arab === d.arab);
    if (n < 0 && dalil.length < BATAS_MATERI.dalil) n = dalil.push(d) - 1;
    untukAi.push(n < 0 ? p : `[DALIL ${n + 1}${d.sumber ? `, ${d.sumber}` : ""}] ${p}`);
  }
  return {
    isian: { mapel: teks(x.mapel), kelas: teks(x.kelas), teksArab, judul: "", tp: "", isi: isi.join("\n"), dalil, diverifikasi: false },
    untukAi: untukAi.join("\n"),
    dibuangPdf,
  };
}

/**
 * Blok Arab dari PDF (baris dipisah "\n") → ayat-ayat mushaf. Dicoba seluruh blok dulu (satu dalil utuh), lalu per
 * baris; tiap kali juga versi huruf terbalik (sebagian PDF menyimpan Arab dari kiri ke kanan). `dibuang` = baris
 * berhuruf cukup yang tidak dikenali (hadis, atau teks yang terlalu rusak).
 * ponytail: potongan ayat per baris tidak digabung jadi satu dalil; gabungkan bila guru sering mendapat potongan.
 */
export function ayatDariPdf(blok: string, cariAyat: CariAyat, basmalah: (arab: string) => boolean) {
  const balik = (t: string) => [...t].reverse().join("");
  const coba = (baris: string[]) => cariAyat(baris.join(" "), "") ?? cariAyat(baris.map(balik).join(" "), "");
  const baris = blok.split("\n").filter((b) => !basmalah(b) && !basmalah(balik(b)));
  const utuh = baris.length > 1 ? coba(baris) : null;
  if (utuh) return { ayat: [utuh], dibuang: 0 };
  const ayat: NonNullable<ReturnType<CariAyat>>[] = [];
  let dibuang = 0;
  for (const b of baris) {
    const a = coba([b]);
    if (a) ayat.push(a);
    else if ((b.match(/[ب-ي]/g) ?? []).length >= 10) dibuang++;
  }
  return { ayat, dibuang };
}

/** Huruf & angka saja, huruf kecil: untuk memeriksa bahwa sesuatu benar-benar tertulis di teks guru. */
const kerangka = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Pasang hasil analisa AI ke draf: judul, TP, pokok materi, serta sumber/terjemah dalil. TP, sumber & terjemah
 * HANYA dipakai bila memang tertulis di teks guru (AI tidak boleh mengarang, aturan 5; TP tugas guru). Teks Arab dari AI di
 * judul/TP/pokok dibuang (kecuali mapel Bahasa Arab).
 */
export function terapkanAnalisa(ai: unknown, draf: IsianMateri, teksGuru: string): { isian: IsianMateri; catatan: string } {
  const a = (ai ?? {}) as { judul?: unknown; tp?: unknown; pokok?: unknown; dalil?: unknown; catatan?: unknown };
  const asal = ` ${kerangka(teksGuru)} `;
  const tertulis = (t: string, min: number) => t.length >= min && asal.includes(` ${kerangka(t)} `);
  const tanpaArab = (t: string) =>
    draf.teksArab === "bahasa" ? t : t.replace(new RegExp(POLA_ARAB, "g"), "").replace(/[ \t]{2,}/g, " ").replace(/\(\s*\)/g, "").trim();
  const daftar = (x: unknown, maks: number) =>
    (Array.isArray(x) ? x : []).map((t) => tanpaArab(teks(t)).replace(/^TP\s*[\d.]*\s*[:.\-–]?\s*/i, "").slice(0, 300)).filter(Boolean).slice(0, maks);

  // TP dirumuskan guru (RUJUKAN.md D): TP yang tertulis di teks guru disalin dengan kodenya; selebihnya = usulan AI,
  // yang wajib dibaca & dicentang guru (`tpUsulan`).
  const tp = (Array.isArray(a.tp) ? a.tp : [])
    .map((t) => /^(?:TP\s*([\d.]*\d)\.?\s*[:.\-–]?\s*)?(.+)$/i.exec(teks(t).slice(0, BATAS_MATERI.teksTp)))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ kode: m[1], isi: tertulis(m[2], 15) ? m[2] : tanpaArab(m[2]), usulan: !tertulis(m[2], 15) }))
    .filter((t) => t.isi)
    .slice(0, BATAS_MATERI.tp);
  const tpUsulan = tp.some((t) => t.usulan);
  const dalil = draf.dalil.map((d, i) => {
    const usul = (Array.isArray(a.dalil) ? a.dalil : []).find((x) => Number((x as { no?: unknown })?.no) === i + 1) as { sumber?: unknown; terjemah?: unknown } | undefined;
    const terjemah = teks(usul?.terjemah);
    const sumber = teks(usul?.sumber);
    return {
      ...d,
      terjemah: d.terjemah || (tertulis(terjemah, 10) ? terjemah : ""),
      sumber: d.sumber || (tertulis(sumber, 4) ? sumber.slice(0, 200) : ""),
    };
  });
  return {
    isian: {
      ...draf,
      judul: tanpaArab(teks(a.judul)).slice(0, BATAS_MATERI.judul) || draf.judul,
      tp: tp.map((t, i) => `TP ${t.kode ?? i + 1}: ${t.isi}`).join("\n") || draf.tp,
      tpUsulan,
      tpDibaca: false,
      pokok: daftar(a.pokok, 10),
      dalil,
    },
    catatan: tanpaArab(teks(a.catatan)).slice(0, 300),
  };
}

/** Kebalikan rapikanMateri: data bab tersimpan → isian form (untuk mengedit). Materi lama tanpa mapel → identitasBab. */
export function keIsian(bab: Bab): IsianMateri {
  return {
    ...identitasBab(bab),
    teksArab: bab.teksArab === "bahasa" ? "bahasa" : "dalil",
    judul: bab.judul,
    tp: bab.tp.map((t) => `${t.kode}: ${t.teks}`).join("\n"),
    isi: bab.materi.join("\n"),
    dalil: bab.dalil.map((d) => ({ sumber: d.sumber, arab: d.arab, terjemah: d.terjemah, ...(d.mushaf && { mushaf: true }), ...(bukanDalil(d) && { bukan: true }) })),
    diverifikasi: bab.dalil.some((d) => !d.mushaf && !bukanDalil(d)),
    ...(bab.pokok?.length && { pokok: bab.pokok }),
    ...(bab.gambar?.length && { gambar: bab.gambar }),
  };
}
