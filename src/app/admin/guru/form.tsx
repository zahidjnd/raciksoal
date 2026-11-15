"use client";

import { useActionState, useRef, useState } from "react";
import { tanya } from "../../tanya";
import { resetKataSandi, tambahGuru, ubahStatus } from "./actions";

const kotak = "mt-1 w-full rounded-lg border p-2";
const Pesan = ({ h }: { h: { ok: boolean; pesan: string } | null }) =>
  h && <p className={`text-sm ${h.ok ? "text-hijau-teks" : "text-bahaya"}`}>{h.pesan}</p>;

export function FormTambahGuru() {
  const [hasil, kirim, proses] = useActionState(tambahGuru, null);
  return (
    <form action={kirim} className="space-y-3 rounded-xl border bg-kartu p-4" key={hasil?.ok ? hasil.pesan : "isi"}>
      <h2>Tambah akun guru</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Nama lengkap
          <input name="nama" required className={kotak} />
        </label>
        <label className="block text-sm">
          Nama pengguna
          <input name="username" required autoCapitalize="none" placeholder="mis. ustadz.ahmad" className={kotak} />
        </label>
        <label className="block text-sm">
          Kata sandi awal (min. 8)
          <input name="password" type="text" required minLength={8} autoComplete="off" className={kotak} />
        </label>
      </div>
      <button className="rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50" disabled={proses}>
        {proses ? "Membuat..." : "Tambah guru"}
      </button>
      <Pesan h={hasil} />
    </form>
  );
}

/** Tombol per akun: reset kata sandi dan aktif/nonaktifkan. */
export function AksiGuru({ userId, nonaktif, dirinya }: { userId: string; nonaktif: boolean; dirinya: boolean }) {
  const [buka, setBuka] = useState(false);
  const yakin = useRef(false); // sudah menjawab "Nonaktifkan" di jendela konfirmasi
  const [hasilReset, kirimReset, prosesReset] = useActionState(resetKataSandi, null);
  const [hasilStatus, kirimStatus, prosesStatus] = useActionState(ubahStatus, null);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border h-8 px-3 text-sm" onClick={() => setBuka(!buka)}>
          Reset kata sandi
        </button>
        {!dirinya && (
          <form
            action={kirimStatus}
            onSubmit={(e) => {
              // Jendela aplikasi tidak bisa menahan kiriman form sambil menunggu: tahan dulu, kirim ulang setelah "Nonaktifkan".
              if (nonaktif || yakin.current) return void (yakin.current = false);
              e.preventDefault();
              const form = e.currentTarget;
              tanya("Guru tidak bisa masuk sampai diaktifkan lagi. Set soalnya tetap tersimpan.", { judul: "Nonaktifkan akun ini?", ya: "Nonaktifkan", bahaya: true }).then((ok) => {
                if (!ok) return;
                yakin.current = true;
                form.requestSubmit();
              });
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="aksi" value={nonaktif ? "aktifkan" : "nonaktifkan"} />
            <button className={`rounded-lg border h-8 px-3 text-sm ${nonaktif ? "" : "border-bahaya-garis text-bahaya"}`} disabled={prosesStatus}>
              {nonaktif ? "Aktifkan" : "Nonaktifkan"}
            </button>
          </form>
        )}
      </div>
      {buka && (
        <form action={kirimReset} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <label className="text-sm">
            Kata sandi baru (min. 8)
            <input name="baru" type="text" required minLength={8} autoComplete="off" className="mt-1 block rounded-lg border p-1" />
          </label>
          <button className="rounded-lg bg-hijau h-8 px-3 text-sm text-white disabled:opacity-50" disabled={prosesReset}>
            {prosesReset ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      )}
      <Pesan h={hasilReset} />
      <Pesan h={hasilStatus} />
    </div>
  );
}
