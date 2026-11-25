// Daftar "aplikasi" di dalam Racik Soal (1.0.0). SATU sumber untuk kartu di halaman awal ("/") dan tombol
// pindah aplikasi di pojok kiri atas sidebar. Aplikasi baru = tambah satu baris di sini + halamannya.
// segera: true = belum jadi; diklik hanya memunculkan pemberitahuan (tidak pindah halaman).

export type IdAplikasi = "racik" | "koreksi";

export type Aplikasi = {
  id: IdAplikasi;
  nama: string;
  href: string;
  isi: string; // satu kalimat penjelasan di kartu halaman awal
  ikon: string; // jalur SVG (atribut d) bergaris, kotak 24×24
  segera: boolean;
};

export const APLIKASI: Aplikasi[] = [
  {
    id: "racik",
    nama: "Racik Soal",
    href: "/racik",
    isi: "Susun kisi-kisi, soal, kunci, dan pembahasan dari materi Anda, lalu unduh sebagai Word berkop.",
    ikon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
    segera: false,
  },
  {
    id: "koreksi",
    nama: "Koreksi LJK",
    href: "/koreksi",
    isi: "Cukup foto atau unggah LJK siswa, nilai dihitung otomatis.",
    ikon: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
    segera: false,
  },
];

export const pesanSegera = (nama: string) => `${nama} sedang dalam pengembangan. Mohon ditunggu ya, nanti kami kabari bila sudah bisa dipakai.`;
