import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { nilaiLjk, pengguna, ujianLjk } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka, judulIkut } from "../../kepala";

export const generateMetadata = judulIkut("Ujian semua guru");

/** Khusus admin (aturan 3): semua ujian Koreksi LJK dari semua guru, hanya dilihat. Klik = buka halaman ujiannya. */
export default async function HalamanUjianSemua({ searchParams }: { searchParams: Promise<{ guru?: string; kelas?: string }> }) {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");
  const { guru = "", kelas = "" } = await searchParams;

  const semua = await db
    .select({
      id: ujianLjk.id,
      nama: ujianLjk.nama,
      kelas: ujianLjk.kelas,
      dibuat: ujianLjk.dibuat,
      guruId: ujianLjk.guruId,
      guru: pengguna.name,
      dipindai: sql<number>`(select count(*) from ${nilaiLjk} where ${nilaiLjk.ujianId} = ${ujianLjk.id} and ${nilaiLjk.jawab} is not null)::int`,
    })
    .from(ujianLjk)
    .innerJoin(pengguna, eq(pengguna.id, ujianLjk.guruId))
    .where(and(isNull(ujianLjk.dihapus)))
    .orderBy(desc(ujianLjk.dibuat))
    .limit(500);

  const urut = (a: string, b: string) => a.localeCompare(b, "id", { numeric: true });
  const daftarGuru = [...new Map(semua.map((u) => [u.guruId, u.guru])).entries()].sort((a, b) => urut(a[1], b[1]));
  const daftarKelas = [...new Set(semua.map((u) => u.kelas))].sort(urut);
  const tampil = semua.filter((u) => (!guru || u.guruId === guru) && (!kelas || u.kelas === kelas));
  const tanggal = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

  return (
    <Kerangka p={p} aplikasi="ikut">
      <div>
        <h1 className="text-2xl">Ujian semua guru</h1>
        <p className="text-sm text-pudar">Hanya untuk dilihat. Klik ujian untuk membuka nilai dan analisisnya.</p>
      </div>
      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="block">
          Guru
          <select name="guru" defaultValue={guru} className="mt-1 block h-10 rounded-lg border bg-kartu px-2">
            <option value="">Semua guru</option>
            {daftarGuru.map(([id, nama]) => (
              <option key={id} value={id}>{nama}</option>
            ))}
          </select>
        </label>
        <label className="block">
          Kelas
          <select name="kelas" defaultValue={kelas} className="mt-1 block h-10 rounded-lg border bg-kartu px-2">
            <option value="">Semua kelas</option>
            {daftarKelas.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white">Terapkan</button>
        {(guru || kelas) && (
          <a href="/admin/ujian" className="flex h-10 items-center text-hijau-teks hover:underline">Hapus saringan</a>
        )}
      </form>
      <p className="text-sm text-pudar">
        {tampil.length} ujian dari {new Set(tampil.map((u) => u.guruId)).size} guru
        {semua.length >= 500 && " (500 terbaru)"}.
      </p>
      <section className="space-y-1">
        {tampil.length === 0 && <p className="text-pudar">Belum ada ujian yang cocok.</p>}
        {tampil.map((u) => (
          <a key={u.id} href={`/koreksi/${u.id}`} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl border bg-kartu px-4 py-3 hover:bg-krem-sorot">
            <span className="min-w-0">
              <b>{u.nama}</b> <span className="text-pudar">· {u.kelas}</span>
              <span className="block text-sm text-pudar">{u.guru} · {tanggal(u.dibuat)}</span>
            </span>
            <span className="shrink-0 text-sm text-pudar">{u.dipindai} dipindai</span>
          </a>
        ))}
      </section>
    </Kerangka>
  );
}
