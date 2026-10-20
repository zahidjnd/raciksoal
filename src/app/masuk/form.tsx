"use client";

import { useActionState, useState } from "react";
import { buatAdminPertama, masuk } from "./actions";

const tombol = "w-full rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50";
const kartu = "space-y-4 rounded-xl border bg-kartu p-5";

function KataSandi({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
      <form action={kirim} className={kartu}>
        <label className="block text-sm">
          Nama pengguna
          <input name="username" autoComplete="username" autoCapitalize="none" required className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <KataSandi label="Kata sandi" name="password" autoComplete="current-password" />
        <Pesan hasil={hasil} />
        <button className={tombol} disabled={proses}>{proses ? "Memeriksa..." : "Masuk"}</button>
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
