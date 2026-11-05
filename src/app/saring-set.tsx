import { and, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { hasilSoal } from "@/db/schema";
import { namaTujuan, TUJUAN } from "@/lib/prompt";

/**
 * Saringan daftar set (halaman Riwayat & Semua set, audit 2026-11-04). Memakai formulir GET biasa: alamat halaman
 * memuat saringannya, jadi bisa dimuat ulang/dibagikan dan tidak butuh JavaScript. Nilai dari alamat tidak dipercaya:
 * dibersihkan di `bacaSaringan` dan dipakai lewat parameter SQL (bukan disambung ke teks SQL).
 */
export type Saringan = { q: string; jenis: string; mapel: string; guru: string; status: string };

const MAPEL_LAMA = "Al-Qur'an Hadis"; // set lama tanpa mapel (lihat identitasBab di soal.ts)
const mapelSet = sql<string>`coalesce(nullif(${hasilSoal.bab}->>'mapel', ''), ${MAPEL_LAMA})`;
export const STATUS = { selesai: "Selesai", proses: "Sedang dibuat", gagal: "Gagal", dihapus: "Dihapus guru" } as const;

export function bacaSaringan(q: Record<string, string | string[] | undefined>): Saringan {
  const s = (k: string) => String([q[k]].flat()[0] ?? "").trim().slice(0, 80);
  return {
    q: s("q").replace(/[%_\\]/g, ""), // tanda khusus ILIKE dibuang
    jenis: (TUJUAN as readonly string[]).includes(s("jenis")) ? s("jenis") : "",
    mapel: s("mapel"),
    guru: s("guru"),
    status: s("status") in STATUS ? s("status") : "",
  };
}

/** Syarat SQL dari saringan. `semuaGuru`: halaman admin (boleh saring guru & melihat set terhapus). */
export function syaratSaringan(f: Saringan, semuaGuru: boolean): SQL | undefined {
  return and(
    f.q ? sql`(coalesce(${hasilSoal.nama}, '') || ' ' || coalesce(${hasilSoal.bab}->>'judul', '')) ilike ${`%${f.q}%`}` : undefined,
    f.jenis ? sql`${hasilSoal.pengaturan}->>'tujuan' = ${f.jenis}` : undefined,
    f.mapel ? sql`${mapelSet} = ${f.mapel}` : undefined,
    semuaGuru && f.guru ? eq(hasilSoal.guruId, f.guru) : undefined,
    semuaGuru && f.status === "dihapus" ? isNotNull(hasilSoal.dihapus) : undefined,
    semuaGuru && f.status && f.status !== "dihapus" ? and(eq(hasilSoal.status, f.status), isNull(hasilSoal.dihapus)) : undefined,
  );
}

/** Daftar mapel yang benar-benar ada di set (untuk pilihan Mapel). */
export const kolomMapel = mapelSet;

/** Baris formulir saringan. `guru`: daftar guru (hanya halaman admin). */
export function FormSaring({ f, mapel, guru, ada }: { f: Saringan; mapel: string[]; guru?: { id: string; nama: string }[]; ada: boolean }) {
  const kotak = "h-10 rounded-lg border bg-kartu px-2 text-sm max-md:min-h-11";
  return (
    <form method="get" className="flex flex-wrap items-center gap-2" role="search">
      <input name="q" defaultValue={f.q} placeholder="Cari nama set atau materi" aria-label="Cari nama set atau materi" className={`${kotak} min-w-0 flex-1 basis-48`} />
      <select name="jenis" defaultValue={f.jenis} aria-label="Jenis soal" className={kotak}>
        <option value="">Semua jenis</option>
        {TUJUAN.map((t) => <option key={t} value={t}>{namaTujuan(t)}</option>)}
      </select>
      <select name="mapel" defaultValue={f.mapel} aria-label="Mata pelajaran" className={`${kotak} max-w-48`}>
        <option value="">Semua mapel</option>
        {mapel.map((m) => <option key={m}>{m}</option>)}
      </select>
      {guru && (
        <>
          <select name="guru" defaultValue={f.guru} aria-label="Guru" className={`${kotak} max-w-48`}>
            <option value="">Semua guru</option>
            {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </select>
          <select name="status" defaultValue={f.status} aria-label="Status" className={kotak}>
            <option value="">Semua status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </>
      )}
      <button className="h-10 rounded-lg bg-hijau px-4 text-sm font-semibold text-white hover:bg-hijau-tua max-md:min-h-11">Cari</button>
      {/* Tautan biasa ke halaman yang sama tanpa saringan. */}
      {ada && <a href="?" className="text-sm text-hijau-teks underline">Hapus saringan</a>}
    </form>
  );
}

export const adaSaringan = (f: Saringan) => Object.values(f).some(Boolean);
