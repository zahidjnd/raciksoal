"use client";

import { useActionState, useEffect, useState } from "react";
import { buatAdminPertama, masuk } from "./actions";

const tombol =
  "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-hijau px-4 font-semibold text-white hover:bg-hijau-tua disabled:opacity-50";
const kartu = "space-y-4 rounded-xl border bg-kartu p-5";

/** Tanda Racik Soal: bintang delapan (khatam), dibuat sendiri. */
function Bintang({ className = "", putar = 0 }: { className?: string; putar?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={className}
      style={putar ? { transform: `rotate(${putar}deg)` } : undefined}
      aria-hidden
    >
      <rect x="5" y="5" width="14" height="14" />
      <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
    </svg>
  );
}

/** Cerita bergiliran di panel kiri: tiap cerita 3 kalimat, tiap kalimat selesai memunculkan 1 label. */
const CERITA = [
  {
    judul: "Al-Qur'an Hadis · Ulangan Harian",
    kalimat: [
      "Materi Bab 3 sudah terbaca. Kisi-kisinya saya racik dulu…",
      "Ayat diambil dari mushaf, bukan dikarang. Lanjut menyusun soal…",
      "Selesai: 25 soal, kunci, dan pembahasan siap diperiksa guru.",
    ],
    label: ["Kisi-kisi", "25 soal + kunci", "Word berkop"],
  },
  // ponytail: rumus, tabel, dan gambar di soal BELUM ada (cerita ini sengaja mendahului fitur, pilihan pemilik 2026-11-10).
  {
    judul: "Fisika · Ulangan Harian",
    kalimat: [
      "Materi gerak lurus terbaca. Rumus v = s ÷ t dan a = Δv ÷ Δt dikenali…",
      "Grafik kecepatan terhadap waktu digambar untuk soal nomor 4…",
      "Selesai: 20 soal hitungan, lengkap dengan langkah penyelesaian.",
    ],
    label: ["Rumus", "Grafik v–t", "Langkah penyelesaian"],
  },
  {
    judul: "Fiqih · AFTS",
    kalimat: [
      "Materi thaharah terbaca. Kisi-kisi 30 soal disusun…",
      "Hadis dari teks yang dicentang guru, bukan dikarang…",
      "Selesai: PG, B/S, dan uraian siap diperiksa guru.",
    ],
    label: ["Kisi-kisi", "Hadis dicentang guru", "PG + B/S + uraian"],
  },
  {
    judul: "Biologi · AFTS",
    kalimat: [
      "Materi sel terbaca. Gambar sel hewan dan sel tumbuhan disiapkan…",
      "Tabel perbandingan organel disusun untuk soal menjodohkan…",
      "Selesai: soal bergambar dan bertabel siap diperiksa guru.",
    ],
    label: ["Gambar sel", "Tabel organel", "Soal bergambar"],
  },
  {
    judul: "Bahasa Inggris · ASAS",
    kalimat: [
      "Reading text found. Building the question blueprint…",
      "Questions in English, pembahasan dalam Bahasa Indonesia…",
      "Selesai: 45 soal ASAS, siap diperiksa guru.",
    ],
    label: ["Kisi-kisi", "Soal berbahasa Inggris", "Format ASAS"],
  },
  {
    judul: "Matematika · ASAS",
    kalimat: [
      "Persamaan kuadrat terbaca. Rumus x = (−b ± √D) ÷ 2a disiapkan…",
      "Tabel nilai fungsi dan grafik parabola ikut ditampilkan…",
      "Selesai: 35 soal ASAS, format surat Kepala MA.",
    ],
    label: ["Rumus ABC", "Tabel + grafik", "Format ASAS"],
  },
];

/** Panel kiri halaman masuk: teks diketik huruf demi huruf, bintang berputar 45° tiap pindah tahap. */
export function Panggung() {
  const [ke, setKe] = useState(0); // berapa kalimat sudah dimulai (terus naik, untuk putaran bintang)
  const [n, setN] = useState(0); // jumlah huruf yang tampil
  const tahap = ke % 3;
  const cerita = CERITA[Math.floor(ke / 3) % CERITA.length];
  const teks = cerita.kalimat[tahap];

  useEffect(() => {
    // Pengguna yang mematikan animasi di perangkatnya: langsung tampilkan kalimat terakhir cerita pertama, tanpa mengetik.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setKe(2);
      setN(CERITA[0].kalimat[2].length);
      return;
    }
    const jeda = n < teks.length ? 32 : tahap < 2 ? 1400 : 3500;
    const id = setTimeout(() => {
      if (n < teks.length) setN(n + 1);
      else {
        setKe(ke + 1);
        setN(0);
      }
    }, jeda);
    return () => clearTimeout(id);
  }, [ke, n, tahap, teks]);

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Bintang className="h-7 w-7 text-hijau-teks transition-transform duration-1000 ease-out" putar={ke * 45} />
        <span className="font-serif text-xl font-medium">Racik Soal</span>
      </div>
      <p className="text-sm text-pudar md:hidden">Racik soal lebih cepat, hasilnya tetap cermat</p>
      <div className="hidden flex-1 flex-col justify-center gap-4 md:flex" aria-hidden>
        <p className="-mb-2 text-xs font-medium text-hijau-teks">{cerita.judul}</p>
        <p className="min-h-[5em] font-serif text-lg leading-relaxed">
          {teks.slice(0, n)}
          <span className="ml-0.5 inline-block h-[1em] w-2 translate-y-0.5 animate-pulse bg-hijau" />
        </p>
        <div className="flex flex-wrap gap-2">
          {cerita.label.map((l, i) => (
            <span
              key={l}
              className={`flex items-center gap-1 rounded-full border bg-kartu px-2.5 py-1 text-xs text-pudar transition-[opacity,translate] duration-500 ${
                i < tahap || (i === tahap && n === teks.length) ? "opacity-100" : "translate-y-1.5 opacity-0"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-hijau-teks" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" />
              </svg>
              {l}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/** Kotak kata sandi dengan tombol mata (lihat/sembunyikan). Dipakai juga di halaman Akun. */
export function KataSandi({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [lihat, setLihat] = useState(false);
  return (
    <label className="block text-sm">
      {label}
      <span className="relative mt-1 block">
        <input {...props} type={lihat ? "text" : "password"} required className="w-full rounded-lg border p-2 pr-11" />
        <button
          type="button"
          onClick={() => setLihat(!lihat)}
          aria-label={lihat ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
          title={lihat ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-pudar hover:text-tinta"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {lihat && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

function Pesan({ hasil }: { hasil: { pesan: string } | null }) {
  return hasil ? (
    <p role="alert" className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-sm text-bahaya">
      {hasil.pesan}
    </p>
  ) : null;
}

export function FormMasuk() {
  const [hasil, kirim, proses] = useActionState(masuk, null);
  return (
    <div className="space-y-3">
      <form action={kirim} className="space-y-4">
        <label className="block text-sm">
          Nama pengguna
          <input name="username" autoComplete="username" autoCapitalize="none" required className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <KataSandi label="Kata sandi" name="password" autoComplete="current-password" />
        <Pesan hasil={hasil} />
        <button className={tombol} disabled={proses}>
          {proses ? (
            <>
              <Bintang className="h-4 w-4 animate-spin" /> Memeriksa...
            </>
          ) : (
            <>
              Masuk
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </form>
      <p className="text-center text-xs text-pudar">Belum punya akun atau lupa kata sandi? Hubungi admin.</p>
    </div>
  );
}

export function FormAdminPertama() {
  const [hasil, kirim, proses] = useActionState(buatAdminPertama, null);
  return (
    <form action={kirim} className={`${kartu} border-peringatan-garis`}>
      <div>
        <p className="font-semibold">Buat akun admin pertama</p>
        <p className="text-xs text-pudar">Hanya muncul sekali. Nama pengguna harus sama dengan ADMIN_USERNAME di .env.</p>
      </div>
      <label className="block text-sm">
        Nama lengkap
        <input name="nama" required className="mt-1 w-full rounded-lg border p-2" />
      </label>
      <label className="block text-sm">
        Nama pengguna
        <input name="username" autoComplete="username" autoCapitalize="none" required className="mt-1 w-full rounded-lg border p-2" />
      </label>
      <KataSandi label="Kata sandi (minimal 8 karakter)" name="password" autoComplete="new-password" minLength={8} />
      <KataSandi label="Ulangi kata sandi" name="ulang" autoComplete="new-password" minLength={8} />
      <Pesan hasil={hasil} />
      <button className={tombol} disabled={proses}>{proses ? "Membuat..." : "Buat admin & masuk"}</button>
    </form>
  );
}
