// 0.68.0: simpanan di browser guru supaya hasil AI tidak hilang saat halaman di-refresh atau guru pindah menu.
// 1. Hasil baca AI per halaman PDF / foto (IndexedDB, karena memuat potongan gambar): file yang sama dilampirkan lagi
//    → halaman yang sudah terbaca tidak dikirim ke AI lagi (hemat token & jatah).
// 2. Hasil analisa materi yang belum dipakai (localStorage, hanya Set baru): ditawarkan lagi saat Set baru dibuka.
// Aturan 3: semua simpanan bertanda id guru; guru lain di browser yang sama tidak melihatnya. Kedaluwarsa 3 hari.
// Kenyamanan saja: penyimpanan diblokir/penuh → semua fungsi diam-diam tidak menyimpan, aplikasi tetap jalan.
import type { IsianMateri } from "@/lib/materi";
import type { GambarFile } from "@/lib/office";

const UMUR = 3 * 24 * 60 * 60 * 1000;
const NAMA_DB = "raciksoal";
const TOKO = "halaman";

export type IsiHalaman = { paragraf: string[]; gambar: GambarFile[] };

/** Tanda pengenal file (tanpa membaca isinya): nama + ukuran + waktu ubah. */
export const sidikFile = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

let dbJanji: Promise<IDBDatabase | null> | null = null;
function bukaDb() {
  dbJanji ??= new Promise((ok) => {
    try {
      const r = indexedDB.open(NAMA_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(TOKO);
      r.onsuccess = () => {
        ok(r.result);
        bersihkanLama(r.result);
      };
      r.onerror = () => ok(null);
    } catch {
      ok(null);
    }
  });
  return dbJanji;
}

/** Buang simpanan halaman yang lebih tua dari 3 hari (sekali tiap halaman dimuat). */
function bersihkanLama(db: IDBDatabase) {
  try {
    const t = db.transaction(TOKO, "readwrite").objectStore(TOKO).openCursor();
    t.onsuccess = () => {
      const c = t.result;
      if (!c) return;
      if (!(Date.now() - (c.value?.waktu ?? 0) < UMUR)) c.delete();
      c.continue();
    };
  } catch {
    // diabaikan
  }
}

const kunciHalaman = (pemilik: string, sidik: string, mapel: string, no: number) => `${pemilik}|${mapel}|${sidik}|${no}`;

/** Hasil baca AI satu halaman yang tersimpan (null = belum ada / kedaluwarsa / bukan milik guru ini). */
export async function ambilHalaman(pemilik: string, sidik: string, mapel: string, no: number): Promise<IsiHalaman | null> {
  const db = pemilik ? await bukaDb() : null;
  if (!db) return null;
  return new Promise((ok) => {
    try {
      const r = db.transaction(TOKO).objectStore(TOKO).get(kunciHalaman(pemilik, sidik, mapel, no));
      r.onsuccess = () => ok(r.result && Date.now() - r.result.waktu < UMUR ? r.result.isi : null);
      r.onerror = () => ok(null);
    } catch {
      ok(null);
    }
  });
}

export async function simpanHalaman(pemilik: string, sidik: string, mapel: string, no: number, isi: IsiHalaman) {
  const db = pemilik ? await bukaDb() : null;
  if (!db) return;
  try {
    db.transaction(TOKO, "readwrite").objectStore(TOKO).put({ waktu: Date.now(), isi }, kunciHalaman(pemilik, sidik, mapel, no));
  } catch {
    // penuh/diblokir: tidak disimpan
  }
}

// ---- Hasil analisa yang belum dipakai (Set baru) ----
const KUNCI_DRAF = "raciksoal-draf-analisa";
export const EVENT_DRAF = "raciksoal-draf-analisa"; // dikirim saat analisa selesai (mis. guru sudah pindah menu lalu kembali)
export type DrafTersimpan = { pemilik: string; waktu: number; mapel: string; kelas: string; draf: IsianMateri };

export function simpanDraf(pemilik: string, mapel: string, kelas: string, draf: IsianMateri) {
  if (!pemilik) return;
  try {
    localStorage.setItem(KUNCI_DRAF, JSON.stringify({ pemilik, waktu: Date.now(), mapel, kelas, draf } satisfies DrafTersimpan));
    window.dispatchEvent(new Event(EVENT_DRAF));
  } catch {
    // penuh/diblokir
  }
}

export function ambilDraf(pemilik: string): DrafTersimpan | null {
  try {
    const x = JSON.parse(localStorage.getItem(KUNCI_DRAF) ?? "null") as DrafTersimpan | null;
    if (!x?.draf) return null;
    if (x.pemilik !== pemilik) return (hapusDraf(), null); // aturan 3: milik guru lain di browser yang sama → dibuang
    if (!(Date.now() - x.waktu < UMUR)) return (hapusDraf(), null);
    return x;
  } catch {
    return null;
  }
}

export function hapusDraf() {
  try {
    localStorage.removeItem(KUNCI_DRAF);
  } catch {
    // diblokir
  }
}
