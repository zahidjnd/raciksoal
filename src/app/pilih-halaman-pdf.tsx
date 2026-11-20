"use client";
// 0.64.0: pemilih halaman PDF bergambar. Guru melihat gambar kecil tiap halaman lalu mengetuk halaman pertama dan
// terakhir bab, jadi tidak perlu menebak nomor halaman PDF (selisih dengan nomor cetak buku). Jalan untuk semua jenis
// PDF (cetakan, scan, foto, ber-bookmark) karena yang dilihat gambarnya. Gambar dibuat hanya saat halaman terlihat
// (IntersectionObserver), satu per satu, supaya PDF ratusan halaman tidak memberatkan HP.
import { useEffect, useRef, useState } from "react";
import type { bukaPdf } from "@/lib/office";

type Dok = Awaited<ReturnType<typeof bukaPdf>>["doc"];
type Antrean = { current: Promise<void> };

const LEBAR = 160; // px lebar gambar kecil (cukup untuk membaca judul bab)

function Gambar({ no, dok, antrean }: { no: number; dok: Dok; antrean: Antrean }) {
  const kotak = useRef<HTMLSpanElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = kotak.current;
    if (!el) return;
    let batal = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        antrean.current = antrean.current
          .then(async () => {
            if (batal) return;
            const halaman = await dok.getPage(no);
            const vp = halaman.getViewport({ scale: LEBAR / halaman.getViewport({ scale: 1 }).width });
            const c = kanvas.current;
            if (!c || batal) return;
            c.width = Math.round(vp.width);
            c.height = Math.round(vp.height);
            // intent "print": tanpa requestAnimationFrame (berhenti di tab tersembunyi), sama seperti baca-pdf.ts.
            await halaman.render({ canvas: c, viewport: vp, background: "#ffffff", intent: "print" }).promise;
          })
          .catch(() => {}); // dokumen sudah ditutup / halaman gagal: kotak abu-abu saja
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      batal = true;
      io.disconnect();
    };
  }, [no, dok, antrean]);
  return (
    <span ref={kotak} className="block aspect-[3/4] w-full overflow-hidden rounded bg-krem">
      <canvas ref={kanvas} className="h-full w-full object-contain" aria-hidden />
    </span>
  );
}

export function PilihHalamanPdf({
  f,
  jumlah,
  dari,
  sampai,
  maks,
  ubah,
}: {
  f: File;
  jumlah: number;
  dari: number;
  sampai: number;
  maks: number;
  ubah: (dari: number, sampai: number) => void;
}) {
  const [dok, setDok] = useState<Dok | null>(null);
  const [galat, setGalat] = useState(false);
  const [menunggu, setMenunggu] = useState(false); // sudah mengetuk halaman pertama, menunggu halaman terakhir
  const [catatan, setCatatan] = useState("");
  const antrean = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let batal = false;
    let tutup: (() => Promise<void> | void) | null = null;
    (async () => {
      const { bukaPdf } = await import("@/lib/office");
      const r = await bukaPdf(await f.arrayBuffer());
      if (batal) return void r.tutup();
      tutup = r.tutup;
      setDok(r.doc);
    })().catch(() => !batal && setGalat(true));
    return () => {
      batal = true;
      setDok(null);
      void tutup?.();
    };
  }, [f]);

  function ketuk(n: number) {
    setCatatan("");
    if (!menunggu || n < dari) {
      ubah(n, n);
      setMenunggu(true);
      return;
    }
    const akhir = Math.min(n, dari + maks - 1);
    if (akhir < n) setCatatan(`AI membaca paling banyak ${maks} halaman sekali lampir, jadi pilihan berhenti di halaman ${akhir}.`);
    ubah(dari, akhir);
    setMenunggu(false);
  }

  if (galat) return null; // pemilih gambar gagal: isian angka di bawahnya tetap bisa dipakai
  return (
    <div className="space-y-1">
      <p className="text-sm" role="status">
        {menunggu ? (
          <b>Halaman pertama: {dari}. Sekarang ketuk halaman terakhir bab ini.</b>
        ) : (
          <>Terpilih: halaman {dari}–{sampai} ({sampai - dari + 1} halaman). Ingin ganti? Ketuk halaman pertama bab, lalu halaman terakhirnya.</>
        )}
      </p>
      {catatan && <p className="text-sm text-peringatan">{catatan}</p>}
      <div className="max-h-72 overflow-y-auto rounded-lg border bg-kartu p-2">
        {!dok ? (
          <p className="p-4 text-center text-sm text-pudar">Menyiapkan gambar halaman...</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: jumlah }, (_, i) => i + 1).map((n) => {
              const dalam = n >= dari && n <= sampai;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`Halaman ${n}`}
                  aria-pressed={dalam}
                  onClick={() => ketuk(n)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-1 text-xs ${dalam ? "border-hijau bg-hijau-muda ring-1 ring-hijau" : "bg-kartu hover:border-pudar/40"}`}
                >
                  <Gambar no={n} dok={dok} antrean={antrean} />
                  <span className={dalam ? "font-semibold text-hijau-teks" : "text-pudar"}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
