import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { DAFTAR_BAB } from "@/data";
import type { Pengaturan } from "@/lib/prompt";
import { wajibMasuk } from "@/lib/sesi";
import { Kepala } from "../../kepala";

const BATAS_TAMPIL = 200;

/** Khusus admin: semua set soal dari semua guru, untuk memantau pemakaian dan kegagalan model. */
export default async function SemuaSet() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");

  const daftar = await db
    .select({
      id: hasilSoal.id,
      dibuat: hasilSoal.dibuat,
      status: hasilSoal.status,
      babId: hasilSoal.babId,
      pengaturan: hasilSoal.pengaturan,
      model: hasilSoal.model,
      pesan: hasilSoal.pesan,
      guru: pengguna.name,
      jumlahSoal: sql<number>`coalesce(jsonb_array_length(${hasilSoal.soal}), 0)::int`,
      cadangan: sql<number>`coalesce(jsonb_array_length(${hasilSoal.info} -> 'catatan'), 0)::int`,
    })
    .from(hasilSoal)
    .leftJoin(pengguna, eq(pengguna.id, hasilSoal.guruId))
    .orderBy(desc(hasilSoal.dibuat))
    .limit(BATAS_TAMPIL);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <section className="space-y-3">
        <h2 className="font-semibold">Semua set soal ({daftar.length}{daftar.length === BATAS_TAMPIL ? " terbaru" : ""})</h2>
        {daftar.map((s) => {
          const pg = s.pengaturan as Pengaturan;
          const bab = DAFTAR_BAB[s.babId]?.judul.split(":")[0] ?? s.babId;
          return (
            <Link
              key={s.id}
              href={`/?id=${s.id}`}
              className={`block space-y-1 rounded-lg border p-3 hover:bg-emerald-50 ${s.status === "gagal" ? "border-red-300" : s.cadangan ? "border-amber-400" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className="font-semibold">{s.guru ?? "(tanpa pemilik)"}</span> · {pg.tujuan} · {bab} · {pg.kesulitan}
                  {s.status === "selesai" && <span className="text-gray-600"> · {s.jumlahSoal} soal</span>}
                </span>
                <span className="text-xs text-gray-500">
                  {s.dibuat.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} · set {s.id}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                model: {s.model ?? "-"}
                {!!s.cadangan && <span className="ml-1 rounded bg-amber-100 px-1 text-amber-900">cadangan dipakai</span>}
                {s.status === "gagal" && <span className="ml-1 rounded bg-red-100 px-1 text-red-700">gagal: {s.pesan?.slice(0, 160)}</span>}
                {s.status === "proses" && <span className="ml-1 rounded bg-amber-100 px-1">sedang dibuat</span>}
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
