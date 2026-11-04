import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import type { Pengguna } from "@/lib/auth";
import { judulPendek } from "@/lib/bab";
import { namaTujuan, type Pengaturan } from "@/lib/prompt";
import { keluar } from "./masuk/actions";
import { LaciSidebar } from "./laci-sidebar";
import { BarisRiwayat, TautanMenu } from "./baris-riwayat";
import { TombolTema } from "./tombol-tema";
import paket from "../../package.json";

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
    <div className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-sm text-bahaya">
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
    <div className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-sm text-bahaya">
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
      nama: hasilSoal.nama,
      pengaturan: hasilSoal.pengaturan,
      jumlahSoal: sql<number>`coalesce(jsonb_array_length(${hasilSoal.soal}), 0)::int`,
    })
    .from(hasilSoal)
    .where(and(eq(hasilSoal.guruId, guruId), isNull(hasilSoal.dihapus)))
    .orderBy(desc(hasilSoal.dibuat))
    .limit(batas);
}

const BATAS_SIDEBAR = 15;
const tautan = "block shrink-0 truncate rounded-lg px-3 py-3 text-tinta hover:bg-krem-sorot md:py-1.5"; // shrink-0: jangan diperas di daftar yang digulir

/**
 * Kerangka setiap halaman setelah masuk (gaya claude.ai, DESIGN.md): sidebar tiga bagian (atas & bawah diam,
 * menu + riwayat di tengah digulir); di HP menjadi laci dari kiri (LaciSidebar). Isi halaman di sebelah kanan.
 */
// lebar: halaman Buat Soal & hasil memakai 1024px (pilihan pemilik 2026-10-20, layar lebar terlihat kosong); halaman lain 768px.
// setAktif: nomor set yang sedang dibuka (?id=, dari page.tsx) → barisnya di riwayat ditandai "sedang dibuka".
export async function Kerangka({ p, lebar = false, setAktif = null, children }: { p: Pengguna; lebar?: boolean; setAktif?: number | null; children: React.ReactNode }) {
  const admin = p.peran === "admin";
  const riwayat = await ambilRiwayat(p.id, BATAS_SIDEBAR);
  const tema = (await cookies()).get("tema")?.value === "gelap" ? "gelap" : "terang";
  // Materi kini dimasukkan langsung di halaman utama (2026-10-20); halaman kelolanya lewat tautan "Kelola materi" di sana.
  // Panduan untuk semua akun (persiapan uji coba guru); menu admin di atasnya.
  const menu = [
    ...(admin
      ? [
          { href: "/admin/set", label: "Semua set" },
          { href: "/admin/guru", label: "Kelola guru" },
          { href: "/admin/pengaturan", label: "Pengaturan" },
        ]
      : []),
    { href: "/panduan", label: "Panduan" },
  ];

  // Tautan ke halaman utama sengaja <a> biasa (bukan Link): halaman Buat Soal membaca ?id= hanya saat dimuat.
  return (
    <div className="md:pl-64 xl:pl-72">
      <LaciSidebar>
        {/* Atas (diam): Set baru selalu terlihat. */}
        <div className="shrink-0 px-3 pb-2 text-sm">
          {/* Tombol biasa, bukan penanda halaman (pilihan pemilik 2026-11-04): latar polos, "+" di lingkaran hijau
              seperti "New chat" claude.ai; tidak pernah ditandai "sedang dibuka". */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- sengaja muat penuh, lihat komentar di atas */}
          <a href="/" className={`${tautan.replace("block", "flex")} items-center gap-2 font-semibold`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hijau text-white" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Set baru
          </a>
        </div>

        {/* Tengah (digulir): menu & riwayat. */}
        <nav aria-label="Menu dan riwayat" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3 text-sm">
          {/* TautanMenu: menu halaman yang sedang dibuka ditandai (komponen browser, membaca alamat halaman). */}
          {menu.map((m) => (
            <TautanMenu key={m.href} href={m.href} kelas={tautan}>{m.label}</TautanMenu>
          ))}

          <p className="shrink-0 px-3 pt-5 pb-1 text-xs text-pudar">Riwayat</p>
          {riwayat.length === 0 && <p className="px-3 text-xs text-pudar">Belum ada set soal.</p>}
          {riwayat.map((s) => {
            const pg = s.pengaturan as Pengaturan;
            const label = s.nama ?? `${namaTujuan(pg.tujuan)} · ${judulPendek(s.judulBab, s.babId)}`;
            // Baris kedua (tanggal · jumlah soal): set dengan judul sama bisa dibedakan (audit 2026-11-04).
            const tanggal = s.dibuat.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
            const keterangan = s.status === "gagal" ? "gagal" : s.status === "proses" ? "sedang dibuat" : `${s.jumlahSoal} soal`;
            // Menu ⋯ / klik kanan (Ganti nama, Hapus) ala claude.ai: BarisRiwayat (komponen browser).
            return <BarisRiwayat key={s.id} id={s.id} label={label} nama={s.nama} keterangan={`${tanggal} · ${keterangan}`} gagal={s.status === "gagal"} aktif={s.id === setAktif} kelas={tautan} />;
          })}
          {riwayat.length === BATAS_SIDEBAR && (
            <Link href="/riwayat" className="flex min-h-11 shrink-0 items-center px-3 text-xs text-hijau-teks hover:underline md:min-h-0 md:py-1">Lihat semua riwayat</Link>
          )}
        </nav>

        {/* Bawah (diam): akun, tema, Keluar selalu terlihat. */}
        <div className="flex shrink-0 items-center gap-2 border-t border-garis px-3 py-3 text-sm">
          <Link href="/akun" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 hover:bg-krem-sorot" title="Akun">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hijau text-sm font-semibold text-white" aria-hidden>
              {p.nama.trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate">{p.nama}</span>
              {/* Nomor versi (package.json, lihat CATATAN-VERSI.md): kalau guru melapor masalah, versinya langsung terlihat. */}
              <span className="block text-xs text-pudar">{admin ? "Admin" : "Guru"} · v{paket.version}</span>
            </span>
          </Link>
          <TombolTema awal={tema} />
          <form action={keluar}>
            <button className="h-8 rounded-lg px-2 text-xs text-pudar hover:bg-krem-sorot hover:text-tinta">Keluar</button>
          </form>
        </div>
      </LaciSidebar>
      <main className={`mx-auto w-full ${lebar ? "max-w-5xl" : "max-w-3xl"} min-w-0 space-y-6 p-4 md:p-8`}>
        {admin && <PeringatanAdmin />}
        {admin && <PeringatanBackup />}
        {children}
      </main>
    </div>
  );
}
