import { asc, count, eq, max, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { BATAS_PER_GURU, BATAS_TOTAL } from "@/lib/pembatas";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { AksiGuru, FormTambahGuru } from "./form";

export default async function KelolaGuru() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");

  const daftar = await db
    .select({
      id: pengguna.id,
      nama: pengguna.name,
      username: pengguna.username,
      peran: pengguna.role,
      nonaktif: pengguna.banned,
      dibuat: pengguna.createdAt,
      jumlahSet: count(hasilSoal.id),
    })
    .from(pengguna)
    .leftJoin(hasilSoal, eq(hasilSoal.guruId, pengguna.id))
    .groupBy(pengguna.id)
    .orderBy(asc(pengguna.createdAt));

  // Ringkasan pemakaian (audit 2026-11-04): "hari ini" dihitung sama dengan jatah harian (WIB, set gagal tidak
  // dihitung, set terhapus tetap dihitung); token = jumlah token masuk + keluar 30 hari terakhir (perkiraan biaya AI).
  const awalHariIni = sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
  const tigaPuluhHari = sql`now() - interval '30 days'`;
  const pakai = await db
    .select({
      guruId: hasilSoal.guruId,
      hariIni: sql<number>`count(*) filter (where ${hasilSoal.dibuat} >= ${awalHariIni} and ${hasilSoal.status} <> 'gagal')::int`,
      bulan: sql<number>`count(*) filter (where ${hasilSoal.dibuat} >= ${tigaPuluhHari} and ${hasilSoal.status} <> 'gagal')::int`,
      terakhir: max(hasilSoal.dibuat),
      token: sql<number>`coalesce(sum(coalesce((${hasilSoal.info}->>'tokenMasuk')::int, 0) + coalesce((${hasilSoal.info}->>'tokenKeluar')::int, 0)) filter (where ${hasilSoal.dibuat} >= ${tigaPuluhHari}), 0)::int`,
    })
    .from(hasilSoal)
    .groupBy(hasilSoal.guruId);
  const pakaiDari = (id: string) => pakai.find((x) => x.guruId === id);
  const total = { hariIni: pakai.reduce((s, x) => s + x.hariIni, 0), token: pakai.reduce((s, x) => s + x.token, 0) };
  const angka = (n: number) => n.toLocaleString("id-ID");

  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Kelola guru</h1>
      <p className="rounded-xl border bg-kartu p-3 text-sm">
        <span className="font-semibold">Pemakaian seluruh web:</span> hari ini {total.hariIni} dari {BATAS_TOTAL} set · token AI 30 hari{" "}
        {angka(total.token)}
      </p>
      <FormTambahGuru />
      <section className="space-y-3">
        <h2>Daftar akun ({daftar.length})</h2>
        {daftar.map((g) => (
          <article key={g.id} className={`space-y-2 rounded-xl border p-3 ${g.nonaktif ? "bg-krem-sorot opacity-75" : "bg-kartu"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <span className="font-semibold">{g.nama}</span> <span className="text-sm text-pudar">@{g.username}</span>{" "}
                {g.peran === "admin" && <span className="rounded bg-peringatan-muda px-1 text-xs">admin</span>}{" "}
                {g.nonaktif && <span className="rounded bg-bahaya-muda px-1 text-xs text-bahaya">nonaktif</span>}
              </p>
              <p className="text-xs text-pudar">
                {g.jumlahSet} set soal · dibuat {g.dibuat.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
              </p>
            </div>
            <p className="text-sm text-pudar">
              Hari ini <span className="font-semibold text-tinta">{pakaiDari(g.id)?.hariIni ?? 0}</span>
              {g.peran === "admin" ? " set (tanpa batas)" : ` dari ${BATAS_PER_GURU} set`} · 30 hari: {pakaiDari(g.id)?.bulan ?? 0} set,{" "}
              {angka(pakaiDari(g.id)?.token ?? 0)} token · set terakhir{" "}
              {/* Bukan "terakhir masuk": sesi login terhapus saat guru Keluar, jadi tanggal set terakhir lebih bisa dipercaya. */}
              {pakaiDari(g.id)?.terakhir?.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) ?? "belum ada"}
            </p>
            <AksiGuru userId={g.id} nonaktif={!!g.nonaktif} dirinya={g.id === p.id} />
          </article>
        ))}
      </section>
    </Kerangka>
  );
}
