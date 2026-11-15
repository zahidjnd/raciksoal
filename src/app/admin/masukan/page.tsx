import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, masukan, pengguna } from "@/db/schema";
import { judulPendek } from "@/lib/bab";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";

const BATAS_TAMPIL = 200;
const WAJAH = ["", "😞", "🙁", "😐", "🙂", "😄"];

/** Khusus admin: masukan & saran guru (0.48.0), terbaru dulu. */
export default async function MasukanGuru() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");

  const [ringkas] = await db
    .select({ jumlah: sql<number>`count(*)::int`, rata: sql<number | null>`round(avg(${masukan.nilai}), 1)::float`, bernilai: sql<number>`count(${masukan.nilai})::int` })
    .from(masukan);
  const daftar = await db
    .select({
      id: masukan.id,
      dibuat: masukan.dibuat,
      nilai: masukan.nilai,
      isi: masukan.isi,
      otomatis: masukan.otomatis,
      versi: masukan.versi,
      guru: pengguna.name,
      setId: masukan.setId,
      namaSet: hasilSoal.nama,
      judulBab: sql<string | null>`${hasilSoal.bab}->>'judul'`,
      babId: hasilSoal.babId,
    })
    .from(masukan)
    .leftJoin(pengguna, eq(pengguna.id, masukan.guruId))
    .leftJoin(hasilSoal, eq(hasilSoal.id, masukan.setId))
    .orderBy(desc(masukan.dibuat))
    .limit(BATAS_TAMPIL);

  return (
    <Kerangka p={p}>
      <section className="space-y-3">
        <h1 className="text-2xl">Masukan guru</h1>
        <p className="text-sm text-pudar">
          {ringkas.jumlah} masukan
          {ringkas.bernilai > 0 && ` · rata-rata ${ringkas.rata} dari 5 (${ringkas.bernilai} memberi nilai)`}
          {daftar.length === BATAS_TAMPIL && ` · menampilkan ${BATAS_TAMPIL} terbaru`}
        </p>
        {daftar.length === 0 && <p className="text-sm text-pudar">Belum ada masukan.</p>}
        <div className="divide-y divide-batas overflow-hidden rounded-xl border bg-kartu">
          {daftar.map((m) => (
            <div key={m.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className="font-semibold">{m.guru ?? "-"}</span>
                  {m.nilai && <span className="ml-2 text-xl" title={`${m.nilai} dari 5`}>{WAJAH[m.nilai]}</span>}
                </span>
                <span className="text-xs text-pudar">
                  {m.dibuat.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
                  {" · "}{m.otomatis ? "jendela otomatis" : "tautan sidebar"}
                  {m.versi && ` · v${m.versi}`}
                </span>
              </div>
              {m.isi && <p className="whitespace-pre-wrap break-words">{m.isi}</p>}
              {m.setId && (
                <Link href={`/?id=${m.setId}`} className="inline-block text-sm text-hijau-teks hover:underline">
                  Buka set: <bdi>{m.namaSet ?? judulPendek(m.judulBab, m.babId ?? "")}</bdi> (set {m.setId})
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </Kerangka>
  );
}
