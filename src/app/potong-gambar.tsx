"use client";

// Potong gambar materi (0.34.0): AI kadang memotong gambar PDF terlalu lebar (ikut tulisan). Guru memotong ulang di
// browser (kanvas bawaan, tanpa library), hasilnya diunggah sebagai gambar BARU lewat `unggah` (batas & pemilik sama).
// Gambar lama tidak diubah: set yang sudah dibuat tetap memakai gambar lamanya.
import { useEffect, useRef, useState } from "react";
import { TOMBOL_KECIL, unggah, urlGambar } from "./gambar";
import { geserKotak, type KotakPotong as Kotak, type Pegangan } from "@/lib/gambar";

const PENUH: Kotak = { kiri: 0, atas: 0, kanan: 1, bawah: 1 };

/** Tombol "✂ Potong" + jendelanya. `selesai` menerima id gambar hasil potongan. */
export function PotongGambar({ id, nomor, selesai }: { id: number; nomor: number; selesai: (idBaru: number) => void }) {
  const jendela = useRef<HTMLDialogElement>(null);
  const bidang = useRef<HTMLDivElement>(null);
  const gambar = useRef<HTMLImageElement>(null);
  const tarik = useRef<{ p: Pegangan; x: number; y: number; k: Kotak } | null>(null);
  const [kotak, setKotak] = useState<Kotak>(PENUH);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState("");
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka) jendela.current?.showModal();
  }, [buka]);

  const tutup = () => {
    jendela.current?.close();
    setBuka(false);
  };

  function mulai(p: Pegangan, e: React.PointerEvent) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    tarik.current = { p, x: e.clientX, y: e.clientY, k: kotak };
  }
  function gerak(e: React.PointerEvent) {
    const t = tarik.current;
    const r = bidang.current?.getBoundingClientRect();
    if (!t || !r?.width) return;
    setKotak(geserKotak(t.k, t.p, (e.clientX - t.x) / r.width, (e.clientY - t.y) / r.height));
  }

  /** Papan ketik: panah = geser kotak, Shift+panah = ubah ukuran dari sudut kanan bawah (1% per tekan). */
  function tombol(e: React.KeyboardEvent) {
    const arah: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const a = arah[e.key];
    if (!a) return;
    e.preventDefault();
    setKotak((k) => geserKotak(k, e.shiftKey ? "kanan-bawah" : "geser", a[0] * 0.01, a[1] * 0.01));
  }

  async function simpan() {
    const img = gambar.current;
    if (!img?.naturalWidth) return;
    if (kotak.kiri === 0 && kotak.atas === 0 && kotak.kanan === 1 && kotak.bawah === 1) return tutup(); // tidak dipotong
    setProses(true);
    setPesan("");
    try {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const sx = Math.round(kotak.kiri * W);
      const sy = Math.round(kotak.atas * H);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(kotak.kanan * W) - sx);
      c.height = Math.max(1, Math.round(kotak.bawah * H) - sy);
      c.getContext("2d")!.drawImage(img, sx, sy, c.width, c.height, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.95));
      if (!blob) throw new Error("Gambar gagal dipotong. Coba lagi.");
      selesai(await unggah(blob));
      tutup();
    } catch (e) {
      setPesan((e as Error).message);
    }
    setProses(false);
  }

  const persen = (n: number) => `${n * 100}%`;
  const sudut: [Exclude<Pegangan, "geser">, string][] = [
    // Di DALAM sudut kotak: bidang ber-overflow-hidden, pegangan di luar tepi gambar akan terpotong.
    ["kiri-atas", "left-0 top-0 items-start justify-start cursor-nwse-resize"],
    ["kanan-atas", "right-0 top-0 items-start justify-end cursor-nesw-resize"],
    ["kiri-bawah", "bottom-0 left-0 items-end justify-start cursor-nesw-resize"],
    ["kanan-bawah", "bottom-0 right-0 items-end justify-end cursor-nwse-resize"],
  ];

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        className={TOMBOL_KECIL}
        onClick={() => {
          setKotak(PENUH);
          setPesan("");
          setBuka(true);
        }}
      >
        ✂ Potong
      </button>
      {buka && (
        <dialog
          ref={jendela}
          aria-labelledby={`judul-potong-${id}`}
          onClose={() => setBuka(false)}
          onClick={(e) => e.target === jendela.current && !proses && tutup()}
          className="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:w-[calc(100vw-1rem)]"
        >
          <div className="space-y-3 p-4">
            <h2 id={`judul-potong-${id}`}>Potong gambar {nomor}</h2>
            <p className="text-sm text-pudar">Geser kotak, atau tarik sudutnya, sampai hanya bagian gambar yang dipakai yang ada di dalam kotak.</p>
            <div className="flex justify-center bg-krem p-4 max-md:p-1">
              {/* Bidang seukuran gambar: kotak potong dihitung dalam persen dari bidang ini. */}
              <div ref={bidang} className="relative touch-none select-none overflow-hidden" onPointerMove={gerak} onPointerUp={() => (tarik.current = null)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={gambar} src={urlGambar(id)} alt={`Gambar ${nomor}`} draggable={false} className="block max-h-[60vh] max-w-full" />
                <div
                  role="group"
                  tabIndex={0}
                  aria-label="Kotak potong. Panah untuk menggeser, Shift dan panah untuk mengubah ukuran."
                  onKeyDown={tombol}
                  onPointerDown={(e) => mulai("geser", e)}
                  className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] outline-none ring-hijau focus-visible:ring-4"
                  style={{ left: persen(kotak.kiri), top: persen(kotak.atas), width: persen(kotak.kanan - kotak.kiri), height: persen(kotak.bawah - kotak.atas) }}
                >
                  {sudut.map(([p, letak]) => (
                    <span
                      key={p}
                      aria-hidden
                      onPointerDown={(e) => mulai(p, e)}
                      // Daerah sentuh 32 px (HP), tanda putih di pojoknya.
                      className={`absolute flex h-8 w-8 ${letak}`}
                    >
                      <span className="h-4 w-4 rounded-sm border-2 border-hijau bg-white" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {pesan && (
              <p className="text-sm text-bahaya" role="alert">
                {pesan}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={proses} onClick={() => setKotak(PENUH)} className="mr-auto h-10 rounded-lg px-3 text-sm text-pudar hover:bg-krem-sorot disabled:opacity-50 max-md:min-h-11">
                Ulang
              </button>
              <button type="button" disabled={proses} onClick={tutup} className="h-10 rounded-lg border px-4 hover:bg-krem disabled:opacity-50 max-md:min-h-11">
                Batal
              </button>
              <button type="button" disabled={proses} onClick={simpan} className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white hover:bg-hijau-tua disabled:opacity-50 max-md:min-h-11">
                {proses ? "Menyimpan..." : "Simpan potongan"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
