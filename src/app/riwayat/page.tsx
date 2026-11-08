import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { adaSaringan, bacaSaringan, FormSaring, kolomMapel, syaratSaringan } from "../saring-set";
import { judulPendek } from "@/lib/bab";
import { namaTujuan, type Pengaturan } from "@/lib/prompt";
import { wajibMasuk } from "@/lib/sesi";
import { ambilRiwayat, Kerangka } from "../kepala";

const BATAS_TAMPIL = 100;
const LABEL_STATUS: Record<string, string> = { proses: "sedang dibuat", selesai: "selesai", gagal: "gagal" };

export default async function Riwayat({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await wajibMasuk();
  const f = bacaSaringan(await searchParams);
  // Aturan 3: hanya set milik pengguna yang sedang masuk (admin melihat semua set di halaman admin, langkah 5d).
  const daftar = await ambilRiwayat(p.id, BATAS_TAMPIL, syaratSaringan(f, false));
  const mapel = (await db.selectDistinct({ m: kolomMapel }).from(hasilSoal).where(and(eq(hasilSoal.guruId, p.id), isNull(hasilSoal.dihapus)))).map((x) => x.m).sort();

  return (
    <Kerangka p={p}>
      <section className="space-y-3">
        <h1 className="text-2xl">Riwayat set soal Anda ({daftar.length}{daftar.length === BATAS_TAMPIL ? " terbaru" : ""})</h1>
        <FormSaring f={f} mapel={mapel} ada={adaSaringan(f)} />
        {daftar.length === 0 && adaSaringan(f) && <p className="text-sm text-pudar">Tidak ada set yang cocok dengan saringan.</p>}
        {daftar.length === 0 && !adaSaringan(f) && (
          <p className="text-sm text-pudar">
            Belum ada set soal. <Link href="/" className="text-hijau-teks underline">Buat soal pertama Anda</Link>.
          </p>
        )}
        {daftar.length > 0 && (
        <div className="divide-y divide-batas overflow-hidden rounded-xl border bg-kartu">
        {daftar.map((s) => {
          const pg = s.pengaturan as Pengaturan;
          const bab = judulPendek(s.judulBab, s.babId);
          return (
            <Link
              key={s.id}
              href={`/?id=${s.id}`}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-krem"
            >
              <span>
                {s.nama && <span className="font-semibold">{s.nama} · </span>}
                <span className={s.nama ? "" : "font-semibold"}>{namaTujuan(pg.tujuan, s.mapel)}</span> · {bab} · {pg.kesulitan}
                {s.status === "selesai" && <span className="text-pudar"> · {s.jumlahSoal} soal</span>}
                {s.status !== "selesai" && (
                  <span className={`ml-1 rounded px-1 text-xs ${s.status === "gagal" ? "bg-bahaya-muda text-bahaya" : "bg-peringatan-muda"}`}>
                    {LABEL_STATUS[s.status] ?? s.status}
                  </span>
                )}
              </span>
              <span className="text-xs text-pudar">
                {s.dibuat.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} · set {s.id}
              </span>
            </Link>
          );
        })}
        </div>
        )}
      </section>
    </Kerangka>
  );
}
