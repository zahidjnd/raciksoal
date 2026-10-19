import Link from "next/link";
import { judulPendek } from "@/lib/bab";
import type { Pengaturan } from "@/lib/prompt";
import { wajibMasuk } from "@/lib/sesi";
import { ambilRiwayat, Kerangka } from "../kepala";

const BATAS_TAMPIL = 100;
const LABEL_STATUS: Record<string, string> = { proses: "sedang dibuat", selesai: "selesai", gagal: "gagal" };

export default async function Riwayat() {
  const p = await wajibMasuk();
  // Aturan 3: hanya set milik pengguna yang sedang masuk (admin melihat semua set di halaman admin, langkah 5d).
  const daftar = await ambilRiwayat(p.id, BATAS_TAMPIL);

  return (
    <Kerangka p={p}>
      <section className="space-y-3">
        <h1 className="text-2xl">Riwayat set soal Anda ({daftar.length}{daftar.length === BATAS_TAMPIL ? " terbaru" : ""})</h1>
        {daftar.length === 0 && (
          <p className="text-sm text-pudar">
            Belum ada set soal. <Link href="/" className="text-hijau underline">Buat soal pertama Anda</Link>.
          </p>
        )}
        {daftar.length > 0 && (
        <div className="divide-y divide-batas overflow-hidden rounded-xl border bg-white">
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
                <span className="font-semibold">{pg.tujuan}</span> · {bab} · {pg.kesulitan}
                {s.status === "selesai" && <span className="text-pudar"> · {s.jumlahSoal} soal</span>}
                {s.status !== "selesai" && (
                  <span className={`ml-1 rounded px-1 text-xs ${s.status === "gagal" ? "bg-red-100 text-red-700" : "bg-amber-100"}`}>
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
