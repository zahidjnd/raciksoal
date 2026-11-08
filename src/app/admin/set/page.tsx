import { asc, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { judulPendek } from "@/lib/bab";
import { namaTujuan, type Pengaturan } from "@/lib/prompt";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { adaSaringan, bacaSaringan, FormSaring, kolomMapel, syaratSaringan } from "../../saring-set";

const BATAS_TAMPIL = 200;

/** Khusus admin: semua set soal dari semua guru, untuk memantau pemakaian dan kegagalan model. */
export default async function SemuaSet({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");
  const f = bacaSaringan(await searchParams);
  const mapel = (await db.selectDistinct({ m: kolomMapel }).from(hasilSoal)).map((x) => x.m).sort();
  const guru = await db.select({ id: pengguna.id, nama: pengguna.name }).from(pengguna).orderBy(asc(pengguna.name));

  const daftar = await db
    .select({
      id: hasilSoal.id,
      dibuat: hasilSoal.dibuat,
      status: hasilSoal.status,
      babId: hasilSoal.babId,
      judulBab: sql<string | null>`${hasilSoal.bab}->>'judul'`,
      mapel: sql<string>`coalesce(${hasilSoal.bab}->>'mapel', 'Al-Qur''an Hadis')`,
      pengaturan: hasilSoal.pengaturan,
      model: hasilSoal.model,
      pesan: hasilSoal.pesan,
      guru: pengguna.name,
      jumlahSoal: sql<number>`coalesce(jsonb_array_length(${hasilSoal.soal}), 0)::int`,
      cadangan: sql<number>`coalesce(jsonb_array_length(${hasilSoal.info} -> 'catatan'), 0)::int`,
      dihapus: hasilSoal.dihapus,
    })
    .from(hasilSoal)
    .leftJoin(pengguna, eq(pengguna.id, hasilSoal.guruId))
    .where(syaratSaringan(f, true))
    .orderBy(desc(hasilSoal.dibuat))
    .limit(BATAS_TAMPIL);

  return (
    <Kerangka p={p}>
      <section className="space-y-3">
        <h1 className="text-2xl">Semua set soal ({daftar.length}{daftar.length === BATAS_TAMPIL ? " terbaru" : ""})</h1>
        <FormSaring f={f} mapel={mapel} guru={guru} ada={adaSaringan(f)} />
        {daftar.length === 0 && <p className="text-sm text-pudar">Tidak ada set yang cocok dengan saringan.</p>}
        <div className="divide-y divide-batas overflow-hidden rounded-xl border bg-kartu">
        {daftar.map((s) => {
          const pg = s.pengaturan as Pengaturan;
          const bab = judulPendek(s.judulBab, s.babId);
          return (
            <Link
              key={s.id}
              href={`/?id=${s.id}`}
              className="block space-y-1 px-4 py-3 hover:bg-krem"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className="font-semibold">{s.guru ?? "(tanpa pemilik)"}</span> · {namaTujuan(pg.tujuan, s.mapel)} · <bdi>{bab}</bdi> · {pg.kesulitan}
                  {s.status === "selesai" && <span className="text-pudar"> · {s.jumlahSoal} soal</span>}
                </span>
                <span className="text-xs text-pudar">
                  {s.dibuat.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} · set {s.id}
                </span>
              </div>
              <p className="text-xs text-pudar">
                model: {s.model ?? "-"}
                {!!s.cadangan && <span className="ml-1 rounded bg-peringatan-muda px-1 text-peringatan">cadangan dipakai</span>}
                {s.status === "gagal" && <span className="ml-1 rounded bg-bahaya-muda px-1 text-bahaya">gagal: {s.pesan?.slice(0, 160)}</span>}
                {s.status === "proses" && <span className="ml-1 rounded bg-peringatan-muda px-1">sedang dibuat</span>}
                {/* Set terhapus tidak bisa dibuka lagi; pulihkan lewat database: dihapus = null. */}
                {s.dihapus && <span className="ml-1 rounded bg-krem-sorot px-1">dihapus guru</span>}
              </p>
            </Link>
          );
        })}
        </div>
      </section>
    </Kerangka>
  );
}
