// Nama surah (transliterasi gaya Kemenag) dan pembaca rujukan "QS An-Nur: 2" (langkah 9).
// Dipakai di browser (daftar pilihan) dan server. Tanpa import "@/..." supaya bisa dites: npm test

/** Indeks 0 = surah 1. */
export const NAMA_SURAH = [
  "Al-Fātiḥah", "Al-Baqarah", "Āli ‘Imrān", "An-Nisā'", "Al-Mā'idah", "Al-An‘ām", "Al-A‘rāf", "Al-Anfāl", "At-Taubah", "Yūnus",
  "Hūd", "Yūsuf", "Ar-Ra‘d", "Ibrāhīm", "Al-Ḥijr", "An-Naḥl", "Al-Isrā'", "Al-Kahf", "Maryam", "Ṭāhā",
  "Al-Anbiyā'", "Al-Ḥajj", "Al-Mu'minūn", "An-Nūr", "Al-Furqān", "Asy-Syu‘arā'", "An-Naml", "Al-Qaṣaṣ", "Al-‘Ankabūt", "Ar-Rūm",
  "Luqmān", "As-Sajdah", "Al-Aḥzāb", "Saba'", "Fāṭir", "Yāsīn", "Aṣ-Ṣāffāt", "Ṣād", "Az-Zumar", "Gāfir",
  "Fuṣṣilat", "Asy-Syūrā", "Az-Zukhruf", "Ad-Dukhān", "Al-Jāṡiyah", "Al-Aḥqāf", "Muḥammad", "Al-Fatḥ", "Al-Ḥujurāt", "Qāf",
  "Aż-Żāriyāt", "Aṭ-Ṭūr", "An-Najm", "Al-Qamar", "Ar-Raḥmān", "Al-Wāqi‘ah", "Al-Ḥadīd", "Al-Mujādalah", "Al-Ḥasyr", "Al-Mumtaḥanah",
  "Aṣ-Ṣaff", "Al-Jumu‘ah", "Al-Munāfiqūn", "At-Tagābun", "Aṭ-Ṭalāq", "At-Taḥrīm", "Al-Mulk", "Al-Qalam", "Al-Ḥāqqah", "Al-Ma‘ārij",
  "Nūḥ", "Al-Jinn", "Al-Muzzammil", "Al-Muddaṡṡir", "Al-Qiyāmah", "Al-Insān", "Al-Mursalāt", "An-Naba'", "An-Nāzi‘āt", "‘Abasa",
  "At-Takwīr", "Al-Infiṭār", "Al-Muṭaffifīn", "Al-Insyiqāq", "Al-Burūj", "Aṭ-Ṭāriq", "Al-A‘lā", "Al-Gāsyiyah", "Al-Fajr", "Al-Balad",
  "Asy-Syams", "Al-Lail", "Aḍ-Ḍuḥā", "Asy-Syarḥ", "At-Tīn", "Al-‘Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-‘Ādiyāt",
  "Al-Qāri‘ah", "At-Takāṡur", "Al-‘Aṣr", "Al-Humazah", "Al-Fīl", "Quraisy", "Al-Mā‘ūn", "Al-Kauṡar", "Al-Kāfirūn", "An-Naṣr",
  "Al-Lahab", "Al-Ikhlāṣ", "Al-Falaq", "An-Nās",
];

/** Nama lain yang lazim dipakai guru. */
const NAMA_LAIN: Record<string, number> = { "Bani Israil": 17, "Al-Mu'min": 40, "Ha Mim Sajdah": 41, "Al-Insyirah": 94, "Alam Nasyrah": 94, "Al-Masad": 111, "Tabbat": 111 };

/** Kunci pencarian nama: tanpa tanda baca/garis bawah huruf, tanpa "Al-/An-/..." di depan, huruf kembar disatukan. */
function kunciNama(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^\s*(a[lnrstdz]|asy|ash|adz|adh|ats|ath)\s*[-\s]\s*/, "")
    .replace(/gh/g, "g").replace(/sh/g, "sy").replace(/[td][sz]/g, (x) => x[1]).replace(/dh/g, "z")
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
}

const PETA_NAMA = new Map<string, number>([
  ...NAMA_SURAH.map((n, i) => [kunciNama(n), i + 1] as [string, number]),
  ...Object.entries(NAMA_LAIN).map(([n, i]) => [kunciNama(n), i] as [string, number]),
]);

/** Nomor surah dari namanya (ejaan longgar), atau null. */
export const cariSurah = (nama: string) => PETA_NAMA.get(kunciNama(nama)) ?? null;

/**
 * Baca rujukan seperti "QS An-Nur: 2", "QS. Al-Isrā' [17]: 32", "An-Nur 2-3", "24:2".
 * Tidak memeriksa apakah nomor ayatnya ada (itu tugas mushaf.ts).
 */
export function bacaRujukan(s: string): { surah: number; dari: number; sampai: number } | null {
  let t = String(s ?? "").replace(/^\s*(q\.?\s*s\.?|surat|surah)(?![a-z])\.?/i, " ");
  const kurung = /[[(]\s*(\d+)\s*[\])]/.exec(t);
  if (kurung) t = t.replace(kurung[0], " ");
  t = t.replace(/\(potongan\)|\bayat\b/gi, " ");
  const m = /^\s*([^\d]*?)[\s:,.]*(\d+)(?:\s*[:.]\s*(\d+))?(?:\s*[-–]\s*(\d+))?\s*$/.exec(t);
  if (!m) return null;
  const [, nama, a, b, c] = m;
  let surah: number | null, dari: number, sampai: number;
  if (nama.trim()) {
    surah = cariSurah(nama) ?? (kurung ? Number(kurung[1]) : null);
    if (b) {
      // "An-Nur/24: 2": angka pertama = nomor surah, harus sama dengan namanya
      if (surah && surah !== Number(a)) return null;
      [surah, dari, sampai] = [Number(a), Number(b), Number(c ?? b)];
    } else [dari, sampai] = [Number(a), Number(c ?? a)];
  } else {
    if (!b) return null;
    [surah, dari, sampai] = [Number(a), Number(b), Number(c ?? b)];
  }
  if (!surah || surah < 1 || surah > 114 || dari < 1 || sampai < dari) return null;
  return { surah, dari, sampai };
}

/** "QS. An-Nūr [24]: 2-3" */
export const tulisRujukan = (surah: number, dari: number, sampai: number, potongan = false) =>
  `QS. ${NAMA_SURAH[surah - 1]} [${surah}]: ${dari}${sampai > dari ? `-${sampai}` : ""}${potongan ? " (potongan)" : ""}`;
