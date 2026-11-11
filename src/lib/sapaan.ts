// Sapaan halaman Set baru yang berganti-ganti seperti halaman awal aplikasi AI (pilihan pemilik 2026-11-08):
// separuh formal, separuh santai tapi sopan, disesuaikan waktu WIB, hari, dan musim ujian. Tanpa ayat/hadis (aturan 5).
// Tanpa import Next/DB supaya bisa dites: npm test. "{n}" = nama depan guru.

const UMUM = [
  "Assalamu'alaikum, {n}",
  "Mau racik soal apa hari ini, {n}?",
  "Siap meracik soal, {n}?",
  "Ahlan wa sahlan, {n}",
  "Semangat mengajar, {n}",
  "Kopi dulu, baru racik soal, {n} ☕",
  "Bismillah, kita mulai racik, {n}",
  "Soal hari ini mau rasa apa, {n}?",
  "Racikan spesial hari ini, {n}?",
  "Ide soal datang, tinggal diracik, {n}",
  "Satu set soal, siap meluncur, {n}?",
  "Murid-murid menunggu karyamu, {n}",
  "Waktunya meracik, {n}",
];

const PAGI = ["Selamat pagi, {n}", "Pagi yang berkah, {n}", "Sabahul khair, {n}", "Teh hangat dan soal segar, {n}?", "Pagi cerah, ide pun cerah, {n}", "Mulai pagi dengan bismillah, {n}"];
const SIANG = ["Selamat siang, {n}", "Tetap semangat siang ini, {n}", "Habis zuhur, enaknya meracik soal, {n}", "Istirahat sebentar, lalu meracik, {n}?"];
const SORE = ["Selamat sore, {n}", "Sore yang produktif, {n}?", "Sore santai, soal tetap jalan, {n}", "Selepas asar, racik dulu yuk, {n}"];
const MALAM = ["Selamat malam, {n}", "Lembur menyiapkan soal, {n}?", "Masaul khair, {n}", "Malam tenang, waktunya meracik, {n}", "Lembur sedikit demi murid, {n}?", "Jangan lupa istirahat ya, {n} 🌙"];
const JUMAT = ["Jumat berkah, {n}", "Jumat berkah, semoga lancar meraciknya, {n}"];
const SENIN = ["Senin semangat, {n}!"];
const AKHIR_PEKAN = ["Akhir pekan pun tetap berkarya, {n}"];
const MUSIM_UJIAN = ["Musim ASAS tiba, siap meracik, {n}?", "Soal ujian, kita racik bareng, {n}"];

/** Daftar sapaan yang boleh muncul pada saat `waktu` (dihitung dalam WIB). */
export function daftarSapaan(waktu: Date): string[] {
  const bagian = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "numeric", hourCycle: "h23", weekday: "short", month: "numeric" }).formatToParts(waktu);
  const ambil = (t: string) => bagian.find((b) => b.type === t)?.value ?? "";
  const jam = Number(ambil("hour"));
  const hari = ambil("weekday"); // Mon, Tue, ...
  const bulan = Number(ambil("month"));
  return [
    ...UMUM,
    ...(jam >= 4 && jam < 11 ? PAGI : jam < 15 && jam >= 11 ? SIANG : jam >= 15 && jam < 18 ? SORE : MALAM),
    ...(hari === "Fri" ? JUMAT : hari === "Mon" ? SENIN : hari === "Sat" || hari === "Sun" ? AKHIR_PEKAN : []),
    // Musim asesmen akhir semester: Ganjil (Nov–Des) dan Genap (Mei–Jun).
    ...([11, 12, 5, 6].includes(bulan) ? MUSIM_UJIAN : []),
  ];
}

// Gelar di depan nama (nama tampil bisa diubah guru sejak 0.32.0): ikut disebut bersama nama depan ("Ust. Ahmad").
const GELAR_DEPAN = /^(ust(adz|adzah|az|azah)?|ustaz(ah)?|ustadz(ah)?|bapak|pak|ibu|bu|dr|drs|dra|h|hj|kh|kyai|kiai|prof)\.?$/i;

/** Satu sapaan acak dengan nama depan guru ("Zahid Jundullah" → "Zahid", "Ust. Ahmad Fauzi" → "Ust. Ahmad"). */
export function pilihSapaan(nama: string, waktu = new Date(), acak = Math.random): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  const gelar = kata.findIndex((k) => !GELAR_DEPAN.test(k));
  const depan = (gelar < 0 ? kata : kata.slice(0, gelar + 1)).join(" ") || "Bapak/Ibu";
  const daftar = daftarSapaan(waktu);
  return daftar[Math.floor(acak() * daftar.length)].replace("{n}", depan);
}
