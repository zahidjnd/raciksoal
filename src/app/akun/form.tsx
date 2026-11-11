"use client";

import { useActionState, useState } from "react";
import { KESULITAN, MAKS_CATATAN } from "@/lib/prompt";
import { DAFTAR_MAPEL } from "@/lib/mapel";
import { KELAS } from "@/lib/soal";
import { MAKS_MAPEL_SAYA, MAKS_NAMA, type Preferensi } from "@/lib/preferensi";
import { gantiKataSandi, gantiNama, keluarkanPerangkatLain, simpanPreferensi } from "./actions";

const kotak = "mt-1 w-full rounded-lg border bg-kartu p-2";
const tombol = "rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50 max-md:min-h-11";
const Pesan = ({ hasil }: { hasil: { ok: boolean; pesan: string } | null }) =>
  hasil && <p role="status" className={`text-sm ${hasil.ok ? "text-hijau-teks" : "text-bahaya"}`}>{hasil.pesan}</p>;

export function FormNama({ nama }: { nama: string }) {
  const [hasil, kirim, proses] = useActionState(gantiNama, null);
  return (
    <form action={kirim} className="space-y-2">
      <label className="block text-sm">
        Nama tampil <span className="text-pudar">(dipakai di sapaan; boleh dengan gelar)</span>
        <input name="nama" defaultValue={nama} minLength={3} maxLength={MAKS_NAMA} required className={kotak} />
      </label>
      <button className={tombol} disabled={proses}>{proses ? "Menyimpan..." : "Simpan nama"}</button>
      <Pesan hasil={hasil} />
    </form>
  );
}

export function FormPreferensi({ awal }: { awal: Preferensi }) {
  const [hasil, kirim, proses] = useActionState(simpanPreferensi, null);
  const [mapel, setMapel] = useState(awal.mapel);
  const penuh = mapel.length >= MAKS_MAPEL_SAYA;
  // Mapel lama di luar daftar (ketik sendiri) tetap ditampilkan supaya tidak hilang saat disimpan.
  const pilihan = [...DAFTAR_MAPEL, ...awal.mapel.filter((m) => !DAFTAR_MAPEL.includes(m))];
  return (
    <form action={kirim} className="space-y-4">
      {/* Dikirim menurut urutan dicentang (yang pertama = langsung terpilih), bukan urutan daftar. */}
      {mapel.map((m) => <input key={m} type="hidden" name="mapel" value={m} />)}
      <fieldset>
        <legend className="text-sm">
          Mapel yang saya ajar <span className="text-pudar">(maks. {MAKS_MAPEL_SAYA}; tampil paling atas di Set baru, yang pertama langsung terpilih)</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-1 md:grid-cols-3">
          {pilihan.map((m) => {
            const dipilih = mapel.includes(m);
            return (
              <label key={m} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm max-md:min-h-11 ${dipilih ? "bg-hijau-muda" : ""}`}>
                <input
                  type="checkbox"
                  value={m}
                  checked={dipilih}
                  disabled={!dipilih && penuh}
                  onChange={(e) => setMapel(e.target.checked ? [...mapel, m] : mapel.filter((x) => x !== m))}
                  className="size-4 accent-hijau"
                />
                {m}
                {dipilih && mapel[0] === m && <span className="text-xs text-pudar">(langsung terpilih)</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Kelas bawaan
          <select name="kelas" defaultValue={awal.kelas} className={`${kotak} h-10`}>
            <option value="">Tidak ada</option>
            {KELAS.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Lama ujian (menit)
          <input name="waktu" type="number" min={10} max={600} defaultValue={awal.waktu} className={`${kotak} h-10`} />
        </label>
        <label className="block text-sm">
          Kesulitan bawaan
          <select name="kesulitan" defaultValue={awal.kesulitan} className={`${kotak} h-10`}>
            {KESULITAN.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Catatan tetap untuk AI <span className="text-pudar">(opsional; otomatis mengisi kotak Catatan untuk AI di setiap set baru, tetap bisa diubah per set)</span>
        <textarea
          name="catatan"
          rows={3}
          maxLength={MAKS_CATATAN}
          defaultValue={awal.catatan}
          placeholder="mis. pakai nama dan suasana pesantren, bahasa sederhana"
          className={kotak}
        />
      </label>
      <button className={tombol} disabled={proses}>{proses ? "Menyimpan..." : "Simpan bawaan"}</button>
      <Pesan hasil={hasil} />
    </form>
  );
}

export function FormKataSandi() {
  const [hasil, kirim, proses] = useActionState(gantiKataSandi, null);
  return (
    <form action={kirim} className="space-y-4" key={hasil?.ok ? "selesai" : "isi"}>
      <h3 className="font-semibold">Ganti kata sandi</h3>
      <label className="block text-sm">
        Kata sandi lama
        <input name="lama" type="password" autoComplete="current-password" required className={kotak} />
      </label>
      <label className="block text-sm">
        Kata sandi baru (minimal 8 karakter)
        <input name="baru" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <label className="block text-sm">
        Ulangi kata sandi baru
        <input name="ulang" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <button className={tombol} disabled={proses}>{proses ? "Menyimpan..." : "Simpan kata sandi baru"}</button>
      <Pesan hasil={hasil} />
    </form>
  );
}

export function TombolKeluarkanPerangkat() {
  const [hasil, kirim, proses] = useActionState(keluarkanPerangkatLain, null);
  return (
    <form action={kirim} className="space-y-2">
      <h3 className="font-semibold">Perangkat lain</h3>
      <p className="text-sm text-pudar">Pernah masuk di komputer lab atau HP orang lain? Keluarkan semua perangkat selain yang sedang Anda pakai ini.</p>
      <button className="h-10 rounded-lg border bg-kartu px-4 text-sm hover:bg-krem disabled:opacity-50 max-md:min-h-11" disabled={proses}>
        {proses ? "Memproses..." : "Keluarkan perangkat lain"}
      </button>
      <Pesan hasil={hasil} />
    </form>
  );
}
