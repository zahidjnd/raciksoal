"use client";

import { semesterDari, WAKTU_BAWAAN, type Identitas } from "@/lib/prompt";

/**
 * Identitas ujian untuk kop Word: semester, tahun pelajaran, hari/tanggal, waktu. Kosong → bawaan (semester & tahun
 * dari tanggal hari ini, waktu 90 menit). Dipakai di form Buat Soal dan di halaman hasil (bisa diubah tanpa AI).
 */
export function FormIdentitas({ nilai, ubah }: { nilai: Identitas; ubah: (i: Identitas) => void }) {
  const awal = semesterDari(new Date());
  const kotak = "mt-1 h-10 w-full rounded-lg border bg-kartu px-2 text-sm";
  return (
    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
      <label className="block">
        Semester
        <select className={kotak} value={nilai.semester ?? awal.semester} onChange={(e) => ubah({ ...nilai, semester: e.target.value })}>
          <option>Ganjil</option>
          <option>Genap</option>
        </select>
      </label>
      <label className="block">
        Tahun pelajaran
        <input className={kotak} placeholder={awal.tahun} value={nilai.tahun ?? awal.tahun} onChange={(e) => ubah({ ...nilai, tahun: e.target.value })} />
      </label>
      <label className="block">
        Hari, tanggal
        <input type="date" className={kotak} value={nilai.tanggal ?? ""} onChange={(e) => ubah({ ...nilai, tanggal: e.target.value })} />
      </label>
      <label className="block">
        Waktu (menit)
        <input type="number" min={1} max={600} className={kotak} value={nilai.waktu ?? WAKTU_BAWAAN} onChange={(e) => ubah({ ...nilai, waktu: Number(e.target.value) })} />
      </label>
    </div>
  );
}
