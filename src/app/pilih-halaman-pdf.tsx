"use client";
// 0.64.0: pemilih halaman PDF bergambar. Guru melihat gambar kecil tiap halaman lalu mengetuk halaman pertama dan
// terakhir bab, jadi tidak perlu menebak nomor halaman PDF (selisih dengan nomor cetak buku). Jalan untuk semua jenis
// PDF (cetakan, scan, foto, ber-bookmark) karena yang dilihat gambarnya. Uji 20 Nov: 15 buku guru 175–312 halaman,
// 10 tanpa bookmark.
// 0.64.1: gambar setajam layar (devicePixelRatio), gambar yang jauh dari kotak gulir dilepas lagi (memori tetap kecil
// walau seluruh buku digulir), belum ada halaman terpilih sebelum guru mengetuk.
// 0.64.2: tombol Perbesar diganti zoom 100–300% (tombol − / +, penggeser, Ctrl + roda mouse, cubit touchpad). Saat
// zoom berubah gambar langsung ditarik (CSS); ±½ detik setelah berhenti baru digambar ulang setajam ukuran barunya.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { bukaPdf } from "@/lib/office";

type Dok = Awaited<ReturnType<typeof bukaPdf>>["doc"];
type Antrean = { current: Promise<void> };

const MAKS_LEBAR = 700; // px gambar terlebar
const LEBAR_DASAR = 80; // px lebar gambar terkecil di zoom 100% (HP 375 px: 3 kolom; 300% = 1 kolom)
const ZOOM_MIN = 100;
const ZOOM_MAKS = 300;

/**
 * Satu gambar halaman. Digambar saat mendekati kotak gulir (antrean: satu halaman sekaligus), dilepas lagi saat
 * menjauh. Lebar gambar = lebar kotaknya × kerapatan layar; `ukuran` berubah (zoom selesai) → gambar yang
 * lebarnya sudah jauh berbeda digambar ulang. Gambar baru disiapkan di kanvas lain dulu supaya tidak berkedip.
 */
function Gambar({ no, dok, antrean, akar, ukuran }: { no: number; dok: Dok; antrean: Antrean; akar: RefObject<HTMLDivElement | null>; ukuran: number }) {
  const kotak = useRef<HTMLSpanElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = kotak.current;
    const c = kanvas.current;
    if (!el || !c) return;
    let batal = false;
    let dekat = false; // di dalam kotak gulir (± ruang)
    let ada = c.width > 0; // kanvas berisi gambar halaman (bisa sisa sebelum zoom)
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
          if (batal || !dekat) return; // digulir lewat sebelum gilirannya: lewati
          const lebar = Math.min(MAKS_LEBAR, Math.ceil(el.clientWidth * (window.devicePixelRatio || 1)));
          if (ada && Math.abs(c.width - lebar) <= lebar * 0.15) return; // sudah cukup tajam
          const halaman = await dok.getPage(no);
          const vp = halaman.getViewport({ scale: lebar / halaman.getViewport({ scale: 1 }).width });
          if (batal || !dekat) return;
          const kertas = document.createElement("canvas");
          kertas.width = Math.round(vp.width);
          kertas.height = Math.round(vp.height);
          // intent "print": tanpa requestAnimationFrame (berhenti di tab tersembunyi), sama seperti baca-pdf.ts.
          await halaman.render({ canvas: kertas, viewport: vp, background: "#ffffff", intent: "print" }).promise;
          halaman.cleanup();
          if (!batal && dekat) {
            c.width = kertas.width;
            c.height = kertas.height;
            c.getContext("2d")?.drawImage(kertas, 0, 0);
            ada = true;
          } else if (!batal) lepas(); // menjauh saat sedang digambar
          kertas.width = 0;
        })
        .catch(() => {}); // dokumen sudah ditutup / halaman gagal: kotak polos saja
    };
    const io = new IntersectionObserver(
      ([e]) => {
        dekat = e.isIntersecting;
        if (dekat) gambar();
        else if (ada) lepas();
      },
      { root: akar.current, rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => {
      batal = true;
      io.disconnect();
    };
  }, [no, dok, antrean, akar, ukuran]);
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
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [tajam, setTajam] = useState(ZOOM_MIN); // zoom yang sudah tenang ±½ detik → gambar ulang
  const antrean = useRef<Promise<void>>(Promise.resolve());
  const wadah = useRef<HTMLDivElement>(null);
  const zoomHalus = useRef(ZOOM_MIN); // roda/cubit menggeser sedikit-sedikit (pecahan)
  // Zoom terbesar = saat gambar sudah selebar kotak (1 kolom); di atas itu tidak ada yang berubah (HP: ±170%).
  const [maksZoom, setMaksZoom] = useState(ZOOM_MAKS);
  const maksRef = useRef(ZOOM_MAKS);
  // halaman teratas + bagian yang sudah tergulir saat zoom diganti, supaya letak gulir tetap
  const jangkar = useRef<{ n: number; bagian: number } | null>(null);

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

  const ubahZoom = useCallback((z: number) => {
    z = Math.min(maksRef.current, Math.max(ZOOM_MIN, z));
    zoomHalus.current = z;
    const w = wadah.current;
    if (w && !jangkar.current) {
      const atas = w.getBoundingClientRect().top;
      const el = [...w.querySelectorAll<HTMLElement>("[data-hal]")].find((x) => x.getBoundingClientRect().bottom > atas + 4);
      if (el) {
        const r = el.getBoundingClientRect();
        jangkar.current = { n: Number(el.dataset.hal), bagian: Math.max(0, (atas - r.top) / r.height) };
      }
    }
    setZoom(Math.round(z));
  }, []);

  // Setelah zoom berubah: gulir kembali ke halaman yang tadi paling atas (sebelum layar sempat digambar).
  useLayoutEffect(() => {
    const w = wadah.current;
    const j = jangkar.current;
    jangkar.current = null;
    const el = j ? w?.querySelector<HTMLElement>(`[data-hal="${j.n}"]`) : null;
    if (w && el && j) w.scrollTop = el.offsetTop + j.bagian * el.offsetHeight;
  }, [zoom]);

  useEffect(() => {
    const t = setTimeout(() => setTajam(zoom), 400);
    return () => clearTimeout(t);
  }, [zoom]);

  useEffect(() => {
    const w = wadah.current;
    if (!w) return;
    const ro = new ResizeObserver(() => {
      const isi = w.clientWidth - 16; // tanpa p-2
      if (isi <= 0) return;
      // 2 gambar + jarak 8 px tak muat lagi = 1 kolom
      const m = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, Math.ceil(((isi - 8) / 2 / LEBAR_DASAR) * 10 + 0.1) * 10));
      maksRef.current = m;
      setMaksZoom(m);
      if (zoomHalus.current > m) ubahZoom(m);
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [ubahZoom]);

  // Ctrl + roda mouse (juga cubit touchpad laptop, yang dikirim browser sebagai Ctrl + roda) = zoom di dalam kotak.
  useEffect(() => {
    const w = wadah.current;
    if (!w) return;
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // roda biasa = menggulir
      e.preventDefault(); // jangan ikut memperbesar seluruh halaman web
      const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      ubahZoom(zoomHalus.current * Math.exp(-dy * 0.002)); // satu klik roda (±100) ≈ 20%
    };
    w.addEventListener("wheel", roda, { passive: false });
    return () => w.removeEventListener("wheel", roda);
  }, [ubahZoom]);

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
  const tombol = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-kartu text-lg leading-none hover:bg-krem disabled:opacity-40 max-md:h-11 max-md:w-11";
  const lebar = Math.round((LEBAR_DASAR * zoom) / 100);
  return (
    <div className="space-y-1">
      <p className="text-sm" role="status">
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Perkecil gambar" disabled={zoom <= ZOOM_MIN} onClick={() => ubahZoom(Math.ceil(zoom / 10) * 10 - 10)} className={tombol}>
            −
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={maksZoom}
            step={1}
            value={zoom}
            onChange={(e) => ubahZoom(Number(e.target.value))}
            aria-label="Ukuran gambar halaman"
            aria-valuetext={`${zoom}%`}
            className="w-28 accent-hijau sm:w-36"
          />
          <button type="button" aria-label="Perbesar gambar" disabled={zoom >= maksZoom} onClick={() => ubahZoom(Math.floor(zoom / 10) * 10 + 10)} className={tombol}>
            +
          </button>
          <span className="w-11 text-right text-sm tabular-nums">{zoom}%</span>
        </div>
        <p className="text-sm text-pudar">
          Tulisan belum terbaca? Tekan <b>+</b>
          <span className="hidden pointer-fine:inline"> atau Ctrl + roda mouse</span>.
        </p>
      </div>
      {catatan && <p className="text-sm text-peringatan">{catatan}</p>}
      <div ref={wadah} className="relative max-h-[70vh] overflow-y-auto rounded-lg border bg-kartu p-2">
        {!dok ? (
          <p className="p-4 text-center text-sm text-pudar">Menyiapkan gambar halaman...</p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${lebar}px, 100%), 1fr))` }}>
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
                  <Gambar no={n} dok={dok} antrean={antrean} akar={wadah} ukuran={tajam} />
                  <span className={`${zoom >= 200 ? "text-sm" : ""} ${dalam ? "font-semibold text-hijau-teks" : "text-pudar"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
