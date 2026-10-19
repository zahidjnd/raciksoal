import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import type { Pengguna } from "@/lib/auth";
import { judulPendek } from "@/lib/bab";
import type { Pengaturan } from "@/lib/prompt";
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

/** Set soal milik satu guru, terbaru dulu (aturan 3: selalu disaring per guru). Dipakai sidebar dan /riwayat. */
export function ambilRiwayat(guruId: string, batas: number) {
  return db
    .select({
      id: hasilSoal.id,
      dibuat: hasilSoal.dibuat,
      status: hasilSoal.status,
      babId: hasilSoal.babId,
      judulBab: sql<string | null>`${hasilSoal.bab}->>'judul'`,
      pengaturan: hasilSoal.pengaturan,
      jumlahSoal: sql<number>`coalesce(jsonb_array_length(${hasilSoal.soal}), 0)::int`,
    })
    .from(hasilSoal)
    .where(eq(hasilSoal.guruId, guruId))
    .orderBy(desc(hasilSoal.dibuat))
    .limit(batas);
}

const BATAS_SIDEBAR = 15;
const tautan = "block truncate rounded-md px-2 py-3 text-gray-700 hover:bg-gray-200 md:py-1.5";

/**
 * Kerangka setiap halaman setelah masuk (gaya aplikasi AI): sidebar kiri berisi Set baru, riwayat set,
 * menu, dan tombol Keluar; di HP sidebar dilipat di balik tombol ☰. Isi halaman di sebelah kanan.
 */
export async function Kerangka({ p, children }: { p: Pengguna; children: React.ReactNode }) {
  const admin = p.peran === "admin";
  const riwayat = await ambilRiwayat(p.id, BATAS_SIDEBAR);
  const menu = [
    { href: "/materi", label: "Materi Saya" },
    ...(admin
      ? [
          { href: "/admin/set", label: "Semua Set" },
          { href: "/admin/guru", label: "Kelola Guru" },
        ]
      : []),
    { href: "/akun", label: "Akun" },
  ];

  // Tautan ke halaman utama sengaja <a> biasa (bukan Link): halaman Buat Soal membaca ?id= hanya saat dimuat.
  const isi = (
    <div className="flex flex-1 flex-col gap-1 p-3 text-sm">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- sengaja muat penuh, lihat komentar di atas */}
      <a href="/" className="mb-2 rounded-lg border border-gray-300 bg-white px-3 py-3 font-semibold md:py-2 text-hijau hover:bg-hijau-muda">
        + Set baru
      </a>
      <p className="px-2 pt-2 text-xs text-gray-500">Riwayat</p>
      {riwayat.length === 0 && <p className="px-2 text-xs text-gray-600">Belum ada set soal.</p>}
      {riwayat.map((s) => {
        const pg = s.pengaturan as Pengaturan;
        return (
          <a key={s.id} href={`/?id=${s.id}`} className={tautan} title={`set ${s.id}`}>
            {s.status === "gagal" && "⚠️ "}
            {pg.tujuan} · {judulPendek(s.judulBab, s.babId)}
            {s.status === "proses" && <span className="text-gray-600"> (proses)</span>}
          </a>
        );
      })}
      {riwayat.length === BATAS_SIDEBAR && (
        <Link href="/riwayat" className="flex min-h-11 items-center px-2 text-xs text-hijau hover:underline md:min-h-0 md:py-1">Lihat semua riwayat</Link>
      )}

      <div className="mt-auto space-y-1 border-t border-gray-200 pt-3">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className={tautan}>{m.label}</Link>
        ))}
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          <span className="truncate text-gray-600">
            {p.nama} {admin && <span className="rounded bg-amber-100 px-1 text-xs">admin</span>}
          </span>
          <form action={keluar}>
            <button className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100">Keluar</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <p className="px-5 pt-4 text-lg font-bold">Racik Soal</p>
        {isi}
      </aside>
      {/* HP: sidebar dilipat. <details> bawaan browser, tanpa JavaScript. */}
      <details className="border-b border-gray-200 bg-gray-50 md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-lg font-bold">
          <span aria-hidden>☰</span> Racik Soal
        </summary>
        {isi}
      </details>
      <main className="mx-auto w-full max-w-3xl min-w-0 space-y-6 p-4 md:p-8">
        {admin && <PeringatanAdmin />}
        {admin && <PeringatanBackup />}
        {children}
      </main>
    </div>
  );
}
