import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { judulPendek } from "@/lib/bab";
import type { Pengaturan } from "@/lib/prompt";
import { wajibMasuk } from "@/lib/sesi";
import { Kepala } from "../kepala";

const BATAS_TAMPIL = 100;
const LABEL_STATUS: Record<string, string> = { proses: "sedang dibuat", selesai: "selesai", gagal: "gagal" };

export default async function Riwayat() {
  const p = await wajibMasuk();
  // Aturan 3: hanya set milik pengguna yang sedang masuk (admin melihat semua set di halaman admin, langkah 5d).
  const daftar = await db
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
    .where(eq(hasilSoal.guruId, p.id))
    .orderBy(desc(hasilSoal.dibuat))
    .limit(BATAS_TAMPIL);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <section className="space-y-3">
        <h2 className="font-semibold">Riwayat set soal Anda ({daftar.length}{daftar.length === BATAS_TAMPIL ? " terbaru" : ""})</h2>
        {daftar.length === 0 && (
          <p className="text-sm text-gray-600">
            Belum ada set soal. <Link href="/" className="text-emerald-800 underline">Buat soal pertama Anda</Link>.
          </p>
        )}
        {daftar.map((s) => {
          const pg = s.pengaturan as Pengaturan;
          const bab = judulPendek(s.judulBab, s.babId);
          return (
            <Link
              key={s.id}
              href={`/?id=${s.id}`}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border p-3 hover:bg-emerald-50"
            >
              <span>
                <span className="font-semibold">{pg.tujuan}</span> · {bab} · {pg.kesulitan}
                {s.status === "selesai" && <span className="text-gray-600"> · {s.jumlahSoal} soal</span>}
                {s.status !== "selesai" && (
                  <span className={`ml-1 rounded px-1 text-xs ${s.status === "gagal" ? "bg-red-100 text-red-700" : "bg-amber-100"}`}>
                    {LABEL_STATUS[s.status] ?? s.status}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500">
                {s.dibuat.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} · set {s.id}
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
