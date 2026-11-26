"use client";

import { useState } from "react";
import type { ButirKunci } from "@/lib/koreksi";
import { HURUF } from "@/lib/ljk";
import { beriTahu, tanya } from "../../tanya";
import { ubahKunci } from "../actions";

const NAMA = { PG: "PG", PGK: "PG kompleks", BS: "B/S & jodohkan" } as const;

/** Jendela Ubah kunci: huruf kunci per nomor (bentuk & skor tetap). Simpan = nilai semua lembar dihitung ulang. */
export function UbahKunci({ ujianId, kunci, dipindai, tutup, tersimpan }: { ujianId: number; kunci: ButirKunci[]; dipindai: number; tutup: () => void; tersimpan: (k: ButirKunci[]) => void }) {
  const [huruf, setHuruf] = useState(kunci.map((k) => k.kunci));
  const [proses, setProses] = useState(false);
  const berubah = huruf.filter((h, i) => h.join() !== kunci[i].kunci.join()).length;

  function ketuk(n: number, h: number) {
    setHuruf((d) => d.map((lama, i) => (i !== n ? lama : kunci[n].bentuk === "PGK" ? (lama.includes(h) ? lama.filter((x) => x !== h) : [...lama, h].sort()) : [h])));
  }

  async function simpan() {
    const kosong = huruf.findIndex((h) => !h.length);
    if (kosong >= 0) return beriTahu(`Kunci nomor ${kosong + 1} belum diisi.`);
    if (dipindai && !(await tanya(`${berubah} nomor diubah. Nilai ${dipindai} lembar yang sudah dipindai akan dihitung ulang dengan kunci baru.`, { judul: "Simpan kunci baru", ya: "Simpan & hitung ulang" }))) return;
    setProses(true);
    const r = await ubahKunci(ujianId, huruf).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return beriTahu(r.pesan ?? "Kunci belum tersimpan.");
    tersimpan(r.kunci);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-tinta/40 sm:items-center">
      <div className="flex max-h-[95dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-krem sm:rounded-2xl">
        <div className="space-y-1 border-b p-4">
          <h2 className="text-xl">Ubah kunci</h2>
          <p className="text-sm text-pudar">Ketuk huruf yang benar. Bentuk dan skor tiap nomor tetap. Jawaban siswa tidak perlu dipindai ulang.</p>
        </div>
        {/* Urut ke bawah dulu (seperti LJK), baru pindah kolom. */}
        <div className="min-h-0 flex-1 gap-x-6 overflow-y-auto p-4 sm:columns-2">
          {kunci.map((k, n) => {
            const beda = huruf[n].join() !== k.kunci.join();
            return (
              <div key={n} className={`mb-1 flex break-inside-avoid items-center gap-1.5 rounded-lg px-1 ${beda ? "bg-peringatan-muda" : ""}`}>
                <span className="w-7 shrink-0 text-right text-sm text-pudar">{n + 1}.</span>
                {HURUF.map((h, i) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => ketuk(n, i)}
                    className={`h-9 w-9 shrink-0 rounded-full border text-sm max-md:w-11 ${huruf[n].includes(i) ? "border-hijau bg-hijau text-white" : "bg-kartu"}`}
                  >
                    {h}
                  </button>
                ))}
                {k.bentuk !== "PG" && <span className="text-xs text-pudar">{NAMA[k.bentuk]}</span>}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 border-t p-4">
          <button type="button" onClick={tutup} className="h-12 rounded-xl border bg-kartu px-4">
            Batal
          </button>
          <span className="flex-1 text-sm text-pudar">{berubah ? `${berubah} nomor diubah` : "Belum ada perubahan"}</span>
          <button type="button" onClick={simpan} disabled={proses || !berubah} className="h-12 rounded-xl bg-hijau px-5 font-semibold text-white hover:bg-hijau-tua disabled:opacity-50">
            {proses ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
