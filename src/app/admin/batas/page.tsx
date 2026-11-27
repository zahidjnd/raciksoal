import { and, gte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { awalBulanIni, awalHariIni, db } from "@/db";
import { batasGuru, hasilSoal, pemakaianAi, pengguna } from "@/db/schema";
import { ambilBawaan } from "@/lib/batas";
import { dihentikan, gabungBatas, JENIS_BATAS, NAMA_JENIS, rapikanKhusus, type JenisBatas } from "@/lib/batas-nilai";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka, judulIkut } from "../../kepala";
import { AturGuru, FormBawaan, KartuRem } from "./form";

export const generateMetadata = judulIkut("Batas pemakaian");

/** Khusus admin (aturan 4): batas bawaan semua guru, batas khusus per guru, dan rem darurat. */
export default async function HalamanBatas() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");

  const bawaan = await ambilBawaan();
  const guru = await db
    .select({ id: pengguna.id, nama: pengguna.name, username: pengguna.username, nonaktif: pengguna.banned })
    .from(pengguna)
    .where(sql`coalesce(${pengguna.role}, 'user') <> 'admin'`)
    .orderBy(pengguna.name);
  const khususSemua = await db.select().from(batasGuru);
  // Set (tidak gagal) hari ini & bulan ini per guru, lalu pemakaian AI lain hari ini.
  const setPakai = await db
    .select({
      guruId: hasilSoal.guruId,
      hari: sql<number>`count(*) filter (where ${hasilSoal.dibuat} >= ${awalHariIni})::int`,
      bulan: sql<number>`count(*)::int`,
    })
    .from(hasilSoal)
    .where(and(gte(hasilSoal.dibuat, awalBulanIni), sql`${hasilSoal.status} <> 'gagal'`))
    .groupBy(hasilSoal.guruId);
  const lainPakai = await db
    .select({ guruId: pemakaianAi.guruId, jenis: pemakaianAi.jenis, n: sql<number>`count(*)::int` })
    .from(pemakaianAi)
    .where(gte(pemakaianAi.waktu, awalHariIni))
    .groupBy(pemakaianAi.guruId, pemakaianAi.jenis);
  const totalHari = setPakai.reduce((s, x) => s + x.hari, 0);

  const baris = guru.map((g) => {
    const k = khususSemua.find((x) => x.guruId === g.id);
    const { angka, khusus } = gabungBatas(bawaan, k ? rapikanKhusus(k.nilai) : null, k?.sampai ?? null);
    const lain = (j: string) => lainPakai.filter((x) => x.guruId === g.id && (j === "ubah" ? ["ganti", "ubah", "tambah"].includes(x.jenis) : x.jenis === j)).reduce((s, x) => s + x.n, 0);
    const s = setPakai.find((x) => x.guruId === g.id);
    const pakai: Record<JenisBatas, number> = { set: s?.hari ?? 0, bulan: s?.bulan ?? 0, ubah: lain("ubah"), analisa: lain("analisa"), halaman: lain("halaman") };
    return { ...g, k, angka, khusus, pakai };
  });

  const jam = (d: Date) => d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Kerangka p={p} aplikasi="ikut">
      <h1 className="text-2xl">Batas pemakaian</h1>
      <p className="text-sm text-pudar">
        Mengatur seberapa banyak guru boleh memakai AI (biaya). Berlaku langsung tanpa deploy. Akun admin tidak dibatasi dan tidak kena rem darurat.
      </p>

      <KartuRem nyala={bawaan.rem} pesan={bawaan.remPesan} />
      <FormBawaan awal={bawaan} totalHari={totalHari} />

      <section className="space-y-3">
        <h2>Per guru ({baris.length})</h2>
        <p className="text-sm text-pudar">Batas khusus mengalahkan batas bawaan. Bilah kuning = pemakaian sudah di atas 80%.</p>
        {baris.map((g) => {
          const stop = g.khusus && dihentikan(g.angka);
          return (
            <article key={g.id} className={`space-y-2 rounded-xl border p-3 ${g.nonaktif ? "bg-krem-sorot opacity-75" : "bg-kartu"} ${stop ? "border-bahaya-garis" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p>
                  <span className="font-semibold">{g.nama}</span> <span className="text-sm text-pudar">@{g.username}</span>{" "}
                  {g.nonaktif && <span className="rounded bg-bahaya-muda px-1 text-xs text-bahaya">akun nonaktif</span>}
                </p>
                <p className="text-sm">
                  {stop ? (
                    <span className="rounded bg-bahaya-muda px-2 py-0.5 text-bahaya">⛔ Dihentikan</span>
                  ) : g.khusus ? (
                    <span className="rounded bg-peringatan-muda px-2 py-0.5 text-peringatan">Batas khusus</span>
                  ) : (
                    <span className="rounded bg-hijau-muda px-2 py-0.5 text-hijau-teks">Ikut bawaan</span>
                  )}
                  {g.khusus && <span className="text-xs text-pudar"> {g.k?.sampai ? `sampai ${jam(g.k.sampai)} WIB` : "sampai diubah lagi"}</span>}
                </p>
              </div>
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {JENIS_BATAS.map((j) => {
                  const batas = g.angka[j];
                  const n = g.pakai[j];
                  const bebas = !Number.isFinite(batas);
                  const persen = bebas ? 0 : batas ? Math.min(100, (n / batas) * 100) : 100;
                  return (
                    <li key={j}>
                      <div className="flex justify-between gap-2">
                        <span className="text-pudar">{NAMA_JENIS[j].nama} / {NAMA_JENIS[j].per}</span>
                        <span className="tabular-nums">{n}{bebas ? " (tanpa batas)" : ` / ${batas}`}</span>
                      </div>
                      {!bebas && (
                        <div className="mt-0.5 h-1.5 rounded-full bg-krem-sorot" aria-hidden>
                          <div className={`h-1.5 rounded-full ${persen >= 100 ? "bg-bahaya" : persen >= 80 ? "bg-peringatan-garis" : "bg-hijau"}`} style={{ width: `${persen}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {g.k?.catatan && <p className="text-xs text-pudar">Catatan: {g.k.catatan}</p>}
              <AturGuru guruId={g.id} nama={g.nama} ada={g.khusus} awal={rapikanKhusus(g.k?.nilai)} bawaan={bawaan} catatan={g.k?.catatan ?? ""} />
            </article>
          );
        })}
      </section>
    </Kerangka>
  );
}
