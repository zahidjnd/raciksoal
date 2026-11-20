"use client";
// 0.64.0: pemilih halaman PDF bergambar. Guru melihat gambar kecil tiap halaman lalu mengetuk halaman pertama dan
// terakhir bab, jadi tidak perlu menebak nomor halaman PDF (selisih dengan nomor cetak buku). Jalan untuk semua jenis
// PDF (cetakan, scan, foto, ber-bookmark) karena yang dilihat gambarnya. Uji 20 Nov: 15 buku guru 175–312 halaman,
// 10 tanpa bookmark.
// 0.64.1: tombol Perbesar (judul bab terbaca), gambar setajam layar (devicePixelRatio), gambar yang jauh dari kotak
// gulir dilepas lagi (memori tetap kecil walau seluruh buku digulir), belum ada halaman terpilih sebelum guru mengetuk.
import { useEffect, useRef, useState, type RefObject } from "react";
import type { bukaPdf } from "@/lib/office";

type Dok = Awaited<ReturnType<typeof bukaPdf>>["doc"];
type Antrean = { current: Promise<void> };

const MAKS_LEBAR = 700; // px gambar terlebar (mode besar di HP layar rapat)

/**
 * Satu gambar halaman. Digambar saat mendekati kotak gulir (antrean: satu halaman sekaligus), dilepas lagi saat
 * menjauh. Lebar gambar = lebar kotaknya × kerapatan layar, jadi tajam di HP dan ikut membesar di mode besar.
 */
function Gambar({ no, dok, antrean, akar }: { no: number; dok: Dok; antrean: Antrean; akar: RefObject<HTMLDivElement | null> }) {
  const kotak = useRef<HTMLSpanElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = kotak.current;
    const c = kanvas.current;
    if (!el || !c) return;
    let batal = false;
    let dekat = false; // di dalam kotak gulir (± ruang)
    let ada = false; // kanvas berisi gambar halaman
    let antre = false;
    const lepas = () => {
      c.width = 0;
      c.height = 0;
      ada = false;
    };
    const gambar = () => {
      if (antre) return;
      antre = true;
      antrean.current = antrean.current
        .then(async () => {
          antre = false;
          if (batal || !dekat || ada) return; // digulir lewat sebelum gilirannya: lewati
          const halaman = await dok.getPage(no);
          const lebar = Math.min(MAKS_LEBAR, Math.ceil(el.clientWidth * (window.devicePixelRatio || 1)));
          const vp = halaman.getViewport({ scale: lebar / halaman.getViewport({ scale: 1 }).width });
          if (batal || !dekat) return;
          c.width = Math.round(vp.width);
          c.height = Math.round(vp.height);
          // intent "print": tanpa requestAnimationFrame (berhenti di tab tersembunyi), sama seperti baca-pdf.ts.
          await halaman.render({ canvas: c, viewport: vp, background: "#ffffff", intent: "print" }).promise;
          halaman.cleanup();
          if (batal) return;
          if (dekat) ada = true;
          else lepas(); // menjauh saat sedang digambar
        })
        .catch(() => {}); // dokumen sudah ditutup / halaman gagal: kotak polos saja
    };
    const io = new IntersectionObserver(
      ([e]) => {
        dekat = e.isIntersecting;
        if (dekat && !ada) gambar();
        else if (!dekat && ada) lepas();
      },
      { root: akar.current, rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => {
      batal = true;
      io.disconnect();
    };
  }, [no, dok, antrean, akar]);
  return (
    <span ref={kotak} className="block aspect-[3/4] w-full overflow-hidden rounded bg-krem">
      <canvas ref={kanvas} width={0} height={0} className="h-full w-full object-contain" aria-hidden />
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
  /** 0 = belum dipilih */
  dari: number;
  sampai: number;
  maks: number;
  ubah: (dari: number, sampai: number) => void;
}) {
  const [dok, setDok] = useState<Dok | null>(null);
  const [galat, setGalat] = useState(false);
  const [menunggu, setMenunggu] = useState(false); // sudah mengetuk halaman pertama, menunggu halaman terakhir
  const [catatan, setCatatan] = useState("");
  const [besar, setBesar] = useState(false);
  const antrean = useRef<Promise<void>>(Promise.resolve());
  const wadah = useRef<HTMLDivElement>(null);
  const jangkar = useRef<number | null>(null); // halaman teratas saat ukuran diganti, supaya letak gulir tetap

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

  // Setelah ganti ukuran: gulir kembali ke halaman yang tadi paling atas.
  useEffect(() => {
    const w = wadah.current;
    const n = jangkar.current;
    jangkar.current = null;
    const el = n ? w?.querySelector<HTMLElement>(`[data-hal="${n}"]`) : null;
    if (w && el) w.scrollTop = el.offsetTop - 8;
  }, [besar]);

  function gantiUkuran() {
    const w = wadah.current;
    if (w) {
      const atas = w.getBoundingClientRect().top;
      const el = [...w.querySelectorAll<HTMLElement>("[data-hal]")].find((x) => x.getBoundingClientRect().bottom > atas + 4);
      jangkar.current = el ? Number(el.dataset.hal) : null;
    }
    setBesar(!besar);
  }

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
  const sah = dari >= 1 && sampai >= dari && sampai <= jumlah;
  const banyak = sampai - dari + 1;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm" role="status">
          {menunggu ? (
            <b>Halaman pertama: {dari}. Sekarang ketuk halaman terakhir bab ini.</b>
          ) : sah ? (
            <>
              Terpilih: <b>halaman {dari}–{sampai}</b> ({banyak} halaman). Ingin ganti? Ketuk halaman pertama bab, lalu halaman terakhirnya.
              {banyak > maks && <span className="text-peringatan"> Lebih dari {maks} halaman: hanya halaman {dari}–{dari + maks - 1} yang dibaca.</span>}
            </>
          ) : (
            <b>Gulir, lalu ketuk halaman pertama bab dan halaman terakhirnya.</b>
          )}
        </p>
        <button
          type="button"
          aria-pressed={besar}
          onClick={gantiUkuran}
          className={`h-8 shrink-0 rounded-lg border px-3 text-sm max-md:min-h-11 ${besar ? "border-hijau bg-hijau-muda text-hijau-teks" : "bg-kartu hover:bg-krem"}`}
        >
          {besar ? "Perkecil gambar" : "Perbesar gambar"}
        </button>
      </div>
      {!besar && <p className="text-sm text-pudar">Tulisan belum terbaca? Tekan <b>Perbesar gambar</b>.</p>}
      {catatan && <p className="text-sm text-peringatan">{catatan}</p>}
      <div ref={wadah} className={`relative overflow-y-auto rounded-lg border bg-kartu p-2 ${besar ? "max-h-[70vh]" : "max-h-72"}`}>
        {!dok ? (
          <p className="p-4 text-center text-sm text-pudar">Menyiapkan gambar halaman...</p>
        ) : (
          // key: ganti ukuran = gambar dibuat ulang selebar kotaknya yang baru
          <div key={besar ? "besar" : "kecil"} className={`grid gap-2 ${besar ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"}`}>
            {Array.from({ length: jumlah }, (_, i) => i + 1).map((n) => {
              const dalam = n >= dari && n <= sampai;
              return (
                <button
                  key={n}
                  type="button"
                  data-hal={n}
                  aria-label={`Halaman ${n}`}
                  aria-pressed={dalam}
                  onClick={() => ketuk(n)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-1 text-xs ${dalam ? "border-hijau bg-hijau-muda ring-1 ring-hijau" : "bg-kartu hover:border-pudar/40"}`}
                >
                  <Gambar no={n} dok={dok} antrean={antrean} akar={wadah} />
                  <span className={`${besar ? "text-sm" : ""} ${dalam ? "font-semibold text-hijau-teks" : "text-pudar"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
