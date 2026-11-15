"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pengganti confirm()/alert() bawaan browser (0.48.1): jendela bergaya aplikasi, dipasang sekali di Kerangka.
 * `await tanya("Hapus …?", { ya: "Hapus", bahaya: true })` → true/false. `beriTahu(pesan)` = satu tombol Oke.
 * Halaman tanpa Kerangka (mis. halaman Masuk) → jatuh ke confirm()/alert() bawaan.
 */
type Opsi = { judul?: string; ya?: string; tidak?: string | null; bahaya?: boolean };
type Permintaan = Opsi & { pesan: string; selesai: (ok: boolean) => void };

const ACARA = "raciksoal:tanya";
let terpasang = false;

export function tanya(pesan: string, opsi: Opsi = {}): Promise<boolean> {
  if (!terpasang) return Promise.resolve(opsi.tidak === null ? (alert(pesan), true) : confirm(pesan));
  return new Promise((selesai) => window.dispatchEvent(new CustomEvent<Permintaan>(ACARA, { detail: { ...opsi, pesan, selesai } })));
}

export const beriTahu = (pesan: string, judul = "Tidak berhasil") => tanya(pesan, { judul, ya: "Oke", tidak: null }).then(() => undefined);

export function JendelaTanya() {
  const jendela = useRef<HTMLDialogElement>(null);
  const [t, setT] = useState<Permintaan | null>(null);
  const sekarang = useRef<Permintaan | null>(null);

  useEffect(() => {
    terpasang = true;
    const buka = (e: Event) => {
      sekarang.current?.selesai(false); // permintaan lama yang belum dijawab dianggap batal
      sekarang.current = (e as CustomEvent<Permintaan>).detail;
      setT(sekarang.current);
    };
    window.addEventListener(ACARA, buka);
    return () => {
      terpasang = false;
      window.removeEventListener(ACARA, buka);
    };
  }, []);

  useEffect(() => {
    if (t && !jendela.current?.open) jendela.current?.showModal();
  }, [t]);

  const jawab = (ok: boolean) => {
    sekarang.current?.selesai(ok);
    sekarang.current = null;
    jendela.current?.close();
    setT(null);
  };

  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-tanya"
      aria-describedby="isi-tanya"
      onCancel={(e) => {
        e.preventDefault(); // Esc = batal, lewat jawab() supaya pemanggil tidak menunggu selamanya
        jawab(false);
      }}
      onClick={(e) => e.target === jendela.current && jawab(false)}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      {t && (
        <div className="space-y-4 p-5">
          <h2 id="judul-tanya" className="text-lg">{t.judul ?? "Konfirmasi"}</h2>
          <p id="isi-tanya" className="whitespace-pre-line leading-relaxed">{t.pesan}</p>
          <div className="flex justify-end gap-2 max-md:flex-col-reverse">
            {t.tidak !== null && (
              // Tindakan berbahaya: fokus awal di Batal, supaya Enter tidak langsung menghapus.
              <button autoFocus={t.bahaya} onClick={() => jawab(false)} className="h-11 rounded-lg border px-4 hover:bg-krem-sorot">
                {t.tidak ?? "Batal"}
              </button>
            )}
            <button
              autoFocus={!t.bahaya}
              onClick={() => jawab(true)}
              className={`h-11 rounded-lg px-5 font-semibold ${t.bahaya ? "border border-bahaya-garis bg-bahaya-muda text-bahaya hover:opacity-90" : "bg-hijau text-white hover:bg-hijau-tua"}`}
            >
              {t.ya ?? "Ya"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
