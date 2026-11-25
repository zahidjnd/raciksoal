import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { siswa } from "@/db/schema";
import { rapikanKelas } from "@/lib/koreksi";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { BarisSiswa, ImporExcel, TambahKelas, TambahSiswa, TombolTemplate } from "./form";

export const metadata = { title: "Daftar siswa · Koreksi LJK" };

/** Daftar siswa untuk Koreksi LJK (admin): kartu kelas, impor Excel dari template; ?kelas= = isi satu kelas. */
export default async function DaftarSiswa({ searchParams }: { searchParams: Promise<{ kelas?: string }> }) {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");
  const kelasIni = rapikanKelas((await searchParams).kelas);
  return <Kerangka p={p} aplikasi="koreksi">{kelasIni ? <SatuKelas kelas={kelasIni} /> : <SemuaKelas />}</Kerangka>;
}

async function SemuaKelas() {
  const kelas = (await db.select({ kelas: siswa.kelas, n: count() }).from(siswa).where(eq(siswa.aktif, true)).groupBy(siswa.kelas)).sort((a, b) =>
    a.kelas.localeCompare(b.kelas, "id", { numeric: true }),
  );
  return (
    <>
      <div>
        <h1 className="text-2xl">Daftar siswa</h1>
        <p className="text-sm text-pudar">Dipakai semua guru di Koreksi LJK: guru memilih kelas, nama siswa muncul urut absen.</p>
      </div>
      <section className="space-y-3 rounded-xl border bg-kartu p-4">
        <h2 className="text-lg">Impor dari Excel</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Unduh template, isi kolom <b>No</b>, <b>Nama</b>, <b>NISN</b>, <b>Kelas</b>. Satu file boleh berisi banyak kelas.</li>
          <li>Pilih file yang sudah diisi, periksa pratinjaunya, lalu Simpan.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <TombolTemplate />
          <ImporExcel />
        </div>
        <p className="text-xs text-pudar">Kelas yang ada di file diganti isinya; siswa yang tidak ada lagi disembunyikan (nilai lamanya tetap aman). Kelas lain tidak berubah.</p>
      </section>
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg">Kelas</h2>
          <TambahKelas />
        </div>
        {kelas.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kelas.map((k) => (
              <Link key={k.kelas} href={`/admin/siswa?kelas=${encodeURIComponent(k.kelas)}`} className="rounded-xl border bg-kartu px-4 py-3 hover:bg-krem-sorot">
                <b className="block">{k.kelas}</b>
                <span className="text-sm text-pudar">{k.n} siswa</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-kartu p-4 text-sm text-pudar">Belum ada kelas. Impor file Excel, atau tambah kelas satu per satu.</p>
        )}
      </section>
    </>
  );
}

async function SatuKelas({ kelas }: { kelas: string }) {
  const daftar = await db
    .select({ id: siswa.id, nomor: siswa.nomor, nama: siswa.nama, nisn: siswa.nisn })
    .from(siswa)
    .where(and(eq(siswa.kelas, kelas), eq(siswa.aktif, true)))
    .orderBy(asc(siswa.nomor), asc(siswa.nama));
  return (
    <>
      <div>
        <Link href="/admin/siswa" className="-ml-2 mb-1 inline-flex h-10 items-center gap-1 rounded-lg pr-3 pl-1.5 text-pudar hover:bg-krem-sorot hover:text-tinta max-md:min-h-11">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Semua kelas
        </Link>
        <h1 className="text-2xl">Kelas {kelas}</h1>
        <p className="text-sm text-pudar">{daftar.length} siswa</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <TombolTemplate kelas={kelas} />
        <ImporExcel kelasIni={kelas} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-kartu">
        <div className="grid grid-cols-[2.5rem_1fr_6.5rem_2.75rem] items-center gap-2 border-b px-3 py-2 text-xs text-pudar">
          <span>No</span>
          <span>Nama</span>
          <span>NISN</span>
          <span />
        </div>
        {daftar.map((s) => (
          <BarisSiswa key={s.id} s={s} />
        ))}
        {!daftar.length && <p className="px-3 py-4 text-sm text-pudar">Kelas ini masih kosong. Impor file Excel, atau tambah siswa di bawah.</p>}
      </div>
      <TambahSiswa kelas={kelas} />
    </>
  );
}
