import Link from "next/link";
import type { Pengguna } from "@/lib/auth";
import { keluar } from "./masuk/actions";

/** Bagian atas setiap halaman setelah masuk: judul, menu, nama pengguna, tombol Keluar. */
export function Kepala({ p }: { p: Pengguna }) {
  const menu = [
    { href: "/", label: "Buat Soal" },
    { href: "/riwayat", label: "Riwayat" },
    ...(p.peran === "admin" ? [{ href: "/admin/guru", label: "Kelola Guru" }] : []),
    { href: "/akun", label: "Akun" },
  ];
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Racik Soal</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {p.nama} {p.peran === "admin" && <span className="rounded bg-amber-100 px-1 text-xs">admin</span>}
          </span>
          <form action={keluar}>
            <button className="rounded border px-3 py-1">Keluar</button>
          </form>
        </div>
      </div>
      <nav className="flex flex-wrap gap-4 border-b pb-2 text-sm">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="text-emerald-800 underline-offset-4 hover:underline">
            {m.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
