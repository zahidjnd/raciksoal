"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bacaBarisSiswa, JUDUL_TEMPLATE, type DataSiswa } from "@/lib/koreksi";
import { bacaXlsx, buatXlsx } from "@/lib/xlsx";
import { beriTahu, tanya } from "../../tanya";
import { keluarkanSiswa, simpanSiswa, tambahSiswa, ubahSiswa } from "./actions";

const tombol = "inline-flex h-10 items-center gap-2 rounded-lg border bg-kartu px-4 text-sm hover:bg-krem disabled:opacity-50 max-md:min-h-11";
const tombolHijau = "inline-flex h-10 items-center gap-2 rounded-lg bg-hijau px-4 text-sm font-semibold text-white hover:bg-hijau-tua disabled:opacity-50 max-md:min-h-11";
const kotak = "h-10 rounded-lg border bg-kartu px-2 max-md:min-h-11";

function unduh(blob: Blob, nama: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/** Template Excel: No | Nama | NISN | Kelas (NISN berformat Teks supaya 0 di depan tidak hilang). */
export function TombolTemplate({ kelas }: { kelas?: string }) {
  return (
    <button
      type="button"
      className={tombol}
      onClick={async () =>
        unduh(
          await buatXlsx([{ nama: "Daftar siswa", lebar: [6, 34, 14, 10], teks: [2], baris: [JUDUL_TEMPLATE, [1, "Ahmad Fauzi (contoh, hapus baris ini)", "0012345678", kelas ?? "X A"]] }]),
          `Template daftar siswa${kelas ? ` ${kelas}` : ""}.xlsx`,
        )
      }
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      Unduh template
    </button>
  );
}

/** Pilih file Excel → pratinjau (jumlah per kelas, masalah per baris) → Simpan. File bermasalah tidak bisa disimpan
 *  (kelasnya diganti isi, jadi baris yang terlewat = siswa ikut tersembunyi). */
export function ImporExcel({ kelasIni }: { kelasIni?: string }) {
  const router = useRouter();
  const masukan = useRef<HTMLInputElement>(null);
  const [hasil, setHasil] = useState<{ file: string; siswa: DataSiswa[]; masalah: string[] } | null>(null);
  const [proses, setProses] = useState(false);

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) return beriTahu("Pilih file Excel berakhiran .xlsx. File .xls lama: buka di Excel, lalu Simpan Sebagai → Buku Kerja Excel (.xlsx).", "Format file");
    try {
      setHasil({ file: f.name, ...bacaBarisSiswa(await bacaXlsx(await f.arrayBuffer()), kelasIni) });
    } catch {
      beriTahu("File ini tidak bisa dibaca sebagai Excel. Coba simpan ulang dari Excel sebagai .xlsx.", "File tidak terbaca");
    }
  }

  async function simpan() {
    if (!hasil) return;
    setProses(true);
    const r = await simpanSiswa(hasil.siswa).catch(() => ({ ok: false, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return beriTahu(r.pesan);
    setHasil(null);
    beriTahu(r.pesan, "Daftar siswa tersimpan");
    router.refresh();
  }

  const kelompok = new Map<string, DataSiswa[]>();
  for (const s of hasil?.siswa ?? []) kelompok.set(s.kelas, [...(kelompok.get(s.kelas) ?? []), s]);
  const perKelas = [...kelompok].sort(([a], [b]) => a.localeCompare(b, "id", { numeric: true }));
  return (
    <>
      <input ref={masukan} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={pilih} />
      <button type="button" className={tombolHijau} onClick={() => masukan.current?.click()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 21V9M7 14l5-5 5 5M5 3h14" />
        </svg>
        Impor Excel
      </button>
      {hasil && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-tinta/40 sm:items-center" onClick={() => setHasil(null)}>
          <div className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-krem p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg">Pratinjau impor</h2>
            <p className="truncate text-sm text-pudar">{hasil.file}</p>
            {hasil.masalah.length > 0 ? (
              <div className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-sm text-bahaya">
                <p className="font-semibold">{hasil.masalah.length} baris perlu diperbaiki di Excel dulu, lalu pilih file lagi:</p>
                <ul className="mt-1 list-disc pl-5">
                  {hasil.masalah.slice(0, 20).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                  {hasil.masalah.length > 20 && <li>… dan {hasil.masalah.length - 20} lagi</li>}
                </ul>
              </div>
            ) : !hasil.siswa.length ? (
              <p className="text-sm text-bahaya">Tidak ada nama siswa di file ini. Pastikan kolomnya sesuai template.</p>
            ) : (
              <p className="text-sm">
                <b>{hasil.siswa.length} siswa</b> di {perKelas.length} kelas siap disimpan.
              </p>
            )}
            {perKelas.map(([k, d]) => (
              <details key={k} className="rounded-lg border bg-kartu">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 text-sm">
                  <b>{k}</b>
                  <span className="text-pudar">{d.length} siswa</span>
                </summary>
                <ol className="border-t px-3 py-2 text-sm">
                  {d.map((s) => (
                    <li key={s.nama} className="flex gap-2">
                      <span className="w-7 text-right text-pudar">{s.nomor}.</span>
                      <span className="flex-1 truncate">{s.nama}</span>
                      <span className="text-pudar">{s.nisn ?? "–"}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
            <div className="flex gap-2">
              <button type="button" className={tombol} onClick={() => setHasil(null)}>
                Batal
              </button>
              <button type="button" className={`${tombolHijau} flex-1 justify-center`} disabled={proses || !!hasil.masalah.length || !hasil.siswa.length} onClick={simpan}>
                {proses ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Tambah kelas = buka halaman kelas itu (masih kosong); kelas tersimpan begitu siswanya diisi. */
export function TambahKelas() {
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  if (!buka)
    return (
      <button type="button" className={tombol} onClick={() => setBuka(true)}>
        + Tambah kelas
      </button>
    );
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (nama.trim()) location.assign(`/admin/siswa?kelas=${encodeURIComponent(nama.trim())}`);
      }}
    >
      <input autoFocus value={nama} onChange={(e) => setNama(e.target.value)} maxLength={20} placeholder="mis. X A" aria-label="Nama kelas" className={`${kotak} w-28`} />
      <button className={tombolHijau}>Buka</button>
    </form>
  );
}

type Baris = { id: number; nomor: number; nama: string; nisn: string | null };

/** Satu baris siswa di halaman kelas: ketuk Ubah untuk mengganti nomor/nama/NISN, atau mengeluarkannya. */
export function BarisSiswa({ s }: { s: Baris }) {
  const router = useRouter();
  const [ubah, setUbah] = useState(false);
  const [isi, setIsi] = useState({ nomor: String(s.nomor), nama: s.nama, nisn: s.nisn ?? "" });
  const [proses, setProses] = useState(false);

  async function jalankan(aksi: () => Promise<{ ok: boolean; pesan: string }>) {
    setProses(true);
    const r = await aksi().catch(() => ({ ok: false, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return beriTahu(r.pesan);
    setUbah(false);
    router.refresh();
  }

  if (!ubah)
    return (
      <div className="grid grid-cols-[2.5rem_1fr_6.5rem_2.75rem] items-center gap-2 border-b px-3 py-1 text-sm last:border-b-0">
        <span className="text-pudar">{s.nomor}</span>
        <span className="truncate">{s.nama}</span>
        <span className="text-pudar tabular-nums">{s.nisn ?? "–"}</span>
        <button type="button" onClick={() => setUbah(true)} aria-label={`Ubah ${s.nama}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-pudar hover:bg-krem-sorot hover:text-tinta max-md:h-11 max-md:w-11">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      </div>
    );
  return (
    <div className="space-y-2 border-b bg-krem px-3 py-3 last:border-b-0">
      <div className="grid grid-cols-[3.5rem_1fr] gap-2 sm:grid-cols-[3.5rem_1fr_8rem]">
        <input value={isi.nomor} onChange={(e) => setIsi({ ...isi, nomor: e.target.value.replace(/\D/g, "").slice(0, 3) })} inputMode="numeric" aria-label="Nomor absen" className={`${kotak} text-center`} />
        <input value={isi.nama} onChange={(e) => setIsi({ ...isi, nama: e.target.value })} maxLength={80} aria-label="Nama" className={kotak} />
        <input value={isi.nisn} onChange={(e) => setIsi({ ...isi, nisn: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" placeholder="NISN" aria-label="NISN" className={`${kotak} col-span-2 sm:col-span-1`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={proses} className={tombolHijau} onClick={() => jalankan(() => ubahSiswa(s.id, { nomor: Number(isi.nomor), nama: isi.nama, nisn: isi.nisn || null }))}>
          Simpan
        </button>
        <button type="button" className={tombol} onClick={() => setUbah(false)}>
          Batal
        </button>
        <button
          type="button"
          disabled={proses}
          className="ml-auto h-10 rounded-lg px-3 text-sm text-bahaya hover:bg-bahaya-muda max-md:min-h-11"
          onClick={async () => {
            if (await tanya(`Keluarkan ${s.nama} dari kelas ini? Nilai lamanya tetap tersimpan.`, { judul: "Keluarkan siswa", ya: "Keluarkan", bahaya: true })) jalankan(() => keluarkanSiswa(s.id));
          }}
        >
          Keluarkan
        </button>
      </div>
    </div>
  );
}

/** Tambah satu siswa di akhir absen kelas (mis. siswa pindahan). */
export function TambahSiswa({ kelas }: { kelas: string }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nisn, setNisn] = useState("");
  const [proses, setProses] = useState(false);
  return (
    <form
      className="space-y-2 rounded-xl border bg-kartu p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setProses(true);
        const r = await tambahSiswa({ kelas, nama, nisn: nisn || null }).catch(() => ({ ok: false, pesan: "Koneksi terputus. Coba lagi." }));
        setProses(false);
        if (!r.ok) return beriTahu(r.pesan);
        setNama("");
        setNisn("");
        router.refresh();
      }}
    >
      <h2 className="text-lg">Tambah siswa</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
        <input value={nama} onChange={(e) => setNama(e.target.value)} required maxLength={80} placeholder="Nama siswa" aria-label="Nama siswa baru" className={kotak} />
        <input value={nisn} onChange={(e) => setNisn(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="NISN (boleh kosong)" aria-label="NISN siswa baru" className={kotak} />
        <button disabled={proses} className={tombolHijau}>
          {proses ? "Menambah…" : "Tambah"}
        </button>
      </div>
      <p className="text-xs text-pudar">Siswa baru masuk di nomor absen terakhir. Nomor bisa diubah lewat ikon pensil.</p>
    </form>
  );
}
