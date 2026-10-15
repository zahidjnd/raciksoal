import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import type { Pengguna } from "@/lib/auth";
import { keluar } from "./masuk/actions";

/** Ringkas alasan kegagalan: buang "Tahap n:" dan isi JSON panjang dari penyedia AI. */
const ringkas = (t: string) =>
  t
    .replace(/^Tahap \d+:\s*/, "")
    .replace(/(\(kode \d+\)\.?)[\s\S]*$/, "$1")
    .slice(0, 140);

/** Khusus admin: kegagalan model dalam 24 jam terakhir (cadangan dipakai atau set gagal). */
async function PeringatanAdmin() {
  const masalah = await db
    .select({ status: hasilSoal.status, pesan: hasilSoal.pesan, catatan: sql<string[] | null>`${hasilSoal.info} -> 'catatan'` })
    .from(hasilSoal)
    .where(
      and(
        gte(hasilSoal.dibuat, sql`now() - interval '24 hours'`),
        or(eq(hasilSoal.status, "gagal"), sql`jsonb_array_length(coalesce(${hasilSoal.info} -> 'catatan', '[]'::jsonb)) > 0`),
      ),
    )
    .orderBy(desc(hasilSoal.dibuat))
    .limit(50);
  if (!masalah.length) return null;

  const gagal = masalah.filter((m) => m.status === "gagal").length;
  const cadangan = masalah.length - gagal;
  const alasan = [...new Set(masalah.flatMap((m) => [...(m.catatan ?? []), ...(m.status === "gagal" && m.pesan ? [m.pesan] : [])]).map(ringkas))].slice(0, 3);

  return (
    <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      <p className="font-semibold">
        ⚠️ 24 jam terakhir: {cadangan > 0 && `${cadangan} set memakai model cadangan`}
        {cadangan > 0 && gagal > 0 && ", "}
        {gagal > 0 && `${gagal} set gagal`}. Cek saldo/kunci model AI.
      </p>
      <ul className="list-disc pl-5">
        {alasan.map((a) => <li key={a}>{a}</li>)}
      </ul>
      <Link href="/admin/set" className="underline">Lihat Semua Set</Link>
    </div>
  );
}

/**
 * Khusus admin: status backup malam (langkah 7). File ditulis deploy/backup.sh di folder induk aplikasi
 * (~/raciksoal-app/backup-status.txt). Peringatan bila backup terakhir gagal atau sudah > 36 jam.
 */
async function PeringatanBackup() {
  const file = path.join(process.cwd(), "..", "backup-status.txt");
  const [isi, info] = await Promise.all([readFile(file, "utf8"), stat(file)]).catch(() => [null, null] as const);
  let pesan: string | null = null;
  if (!isi || !info) {
    // Di laptop memang tidak ada backup; di hosting berarti backup belum pernah jalan.
    if (process.env.NODE_ENV === "production") pesan = "Backup database belum pernah berhasil berjalan.";
  } else if (!isi.startsWith("OK")) {
    pesan = `Backup database terakhir gagal: ${isi.trim()}`;
  } else {
    const jam = Math.floor((Date.now() - info.mtimeMs) / 3_600_000);
    if (jam > 36) pesan = `Backup database terakhir berhasil ${jam} jam lalu (seharusnya tiap malam).`;
  }
  if (!pesan) return null;
  return (
    <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      ⚠️ {pesan} Cek <code>backup.log</code> di hosting.
    </div>
  );
}

/** Bagian atas setiap halaman setelah masuk: judul, menu, nama pengguna, tombol Keluar. */
export function Kepala({ p }: { p: Pengguna }) {
  const admin = p.peran === "admin";
  const menu = [
    { href: "/", label: "Buat Soal" },
    { href: "/riwayat", label: "Riwayat" },
    { href: "/materi", label: "Materi Saya" },
    ...(admin
      ? [
          { href: "/admin/set", label: "Semua Set" },
          { href: "/admin/guru", label: "Kelola Guru" },
        ]
      : []),
    { href: "/akun", label: "Akun" },
  ];
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Racik Soal</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {p.nama} {admin && <span className="rounded bg-amber-100 px-1 text-xs">admin</span>}
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
      {admin && <PeringatanAdmin />}
      {admin && <PeringatanBackup />}
    </header>
  );
}
