"use client";

import { useEffect, useRef, useState } from "react";
import { jumlahSetSelesai, kirimMasukan } from "./actions";

/**
 * Masukan & saran guru (0.48.0). Satu jendela untuk dua cara:
 * - otomatis: muncul sendiri di pojok kanan bawah (HP: panel bawah) setelah set baru selesai, pada set selesai ke-3,
 *   10, 25, 50, 100, lalu tiap 50; paling sering seminggu sekali. Tidak menutupi soal (dialog non-modal).
 * - sidebar "Kirim masukan": jendela di tengah (modal), tulisan wajib.
 * Bila sedang membuka set, centang "Tentang set ..." mengikutkan set itu (dicek milik guru di server).
 * ponytail: jadwal disimpan di localStorage, jadi di perangkat lain jendela bisa muncul sekali lagi; pindah ke DB bila mengganggu.
 */
const ACARA = "raciksoal:masukan";
const INGAT = "raciksoal-masukan"; // { berikut: jumlah set saat boleh muncul lagi, kapan: terakhir muncul/kirim (ms) }
const PATOK = [3, 10, 25, 50, 100];
const SEMINGGU = 7 * 24 * 3600_000;
const WAJAH = [
  { e: "😞", label: "Sangat tidak membantu" },
  { e: "🙁", label: "Kurang membantu" },
  { e: "😐", label: "Biasa saja" },
  { e: "🙂", label: "Membantu" },
  { e: "😄", label: "Sangat membantu" },
];

type Ingat = { berikut: number; kapan: number };
type Mode = { otomatis: boolean; n: number };

const patokBerikut = (n: number) => PATOK.find((p) => p > n) ?? (Math.floor(n / 50) + 1) * 50;

function baca(): Ingat {
  try {
    const x = JSON.parse(localStorage.getItem(INGAT) ?? "null");
    if (x && typeof x.berikut === "number" && typeof x.kapan === "number") return x;
  } catch {} // localStorage diblokir / isi rusak → anggap belum pernah
  return { berikut: PATOK[0], kapan: 0 };
}
function simpan(x: Partial<Ingat>) {
  try {
    localStorage.setItem(INGAT, JSON.stringify({ ...baca(), ...x }));
  } catch {} // diblokir: jendela bisa muncul lagi, tidak berbahaya
}

/** Dipanggil halaman set tepat setelah set baru selesai dibuat. */
export async function tanyaBilaWaktunya() {
  const n = await jumlahSetSelesai().catch(() => 0);
  const ingat = baca();
  if (n < ingat.berikut || Date.now() - ingat.kapan < SEMINGGU) return;
  window.dispatchEvent(new CustomEvent<Mode>(ACARA, { detail: { otomatis: true, n } }));
}

/** Tautan sidebar. data-tutup-laci: laci HP ikut tertutup saat diklik (laci-sidebar.tsx). */
export function TombolMasukan({ kelas }: { kelas: string }) {
  return (
    <button
      type="button"
      data-tutup-laci
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new CustomEvent<Mode>(ACARA, { detail: { otomatis: false, n: 0 } }))}
      className={`${kelas} text-left`}
    >
      Kirim masukan
    </button>
  );
}

/** Jendelanya, dipasang sekali di Kerangka (di luar laci sidebar supaya tetap tampil saat laci HP tertutup). */
export function JendelaMasukan({ set }: { set: { id: number; label: string } | null }) {
  const jendela = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [nilai, setNilai] = useState<number | null>(null);
  const [isi, setIsi] = useState("");
  const [ikutSet, setIkutSet] = useState(true);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  const [terkirim, setTerkirim] = useState(false);

  useEffect(() => {
    const buka = (e: Event) => {
      const m = (e as CustomEvent<Mode>).detail;
      const d = jendela.current;
      if (!d || (d.open && m.otomatis)) return; // jangan menimpa jendela yang sedang dipakai
      d.close();
      setMode(m);
      setNilai(null);
      setIsi("");
      setIkutSet(true);
      setPesan("");
      setTerkirim(false);
      if (m.otomatis) {
        simpan({ berikut: m.n + 3, kapan: Date.now() }); // bawaan = "Nanti saja" (juga bila halaman ditinggal)
        d.show();
      } else d.showModal();
    };
    window.addEventListener(ACARA, buka);
    return () => window.removeEventListener(ACARA, buka);
  }, []);

  const tutup = (jangan = false) => {
    if (jangan && mode?.otomatis) simpan({ berikut: patokBerikut(mode.n), kapan: Date.now() }); // ✕ = tunggu patok berikutnya
    jendela.current?.close();
  };

  async function kirim() {
    if (!mode) return;
    if (!mode.otomatis && !isi.trim()) return setPesan("Tulis keluhan atau saran dulu.");
    if (mode.otomatis && !nilai && !isi.trim()) return setPesan("Pilih wajah atau tulis saran dulu.");
    setSibuk(true);
    setPesan("");
    const r = await kirimMasukan({ nilai, isi, setId: set && ikutSet ? set.id : null, otomatis: mode.otomatis }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setSibuk(false);
    if (!r.ok) return setPesan(r.pesan);
    simpan(mode.otomatis ? { berikut: patokBerikut(mode.n), kapan: Date.now() } : { kapan: Date.now() });
    setTerkirim(true);
    setTimeout(() => jendela.current?.close(), 2000);
  }

  const otomatis = !!mode?.otomatis;
  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-masukan"
      onClick={(e) => e.target === jendela.current && !otomatis && tutup()}
      className={`rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 ${
        otomatis
          ? "fixed inset-auto right-4 bottom-4 z-40 m-0 w-[min(24rem,calc(100vw-2rem))] max-md:inset-x-0 max-md:bottom-0 max-md:w-full max-md:rounded-b-none"
          : "m-auto w-[min(32rem,calc(100vw-2rem))] max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
      }`}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 id="judul-masukan" className="text-lg">{otomatis ? "Bagaimana Racik Soal sejauh ini?" : "Kirim masukan"}</h2>
          <button onClick={() => tutup(true)} aria-label="Tutup" className="-mt-1 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-krem-sorot">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {terkirim ? (
          <p className="rounded-lg bg-hijau-muda p-3 text-hijau-teks" role="status">Terima kasih! Masukan sudah terkirim ✓</p>
        ) : (
          <>
            <fieldset>
              <legend className="mb-2 text-sm">
                {otomatis ? `Bapak/Ibu sudah membuat ${mode?.n} set. Seberapa membantu?` : "Seberapa membantu? (boleh dilewati)"}
              </legend>
              <div className="flex gap-1">
                {WAJAH.map((w, i) => (
                  <button
                    key={w.e}
                    type="button"
                    aria-label={w.label}
                    title={w.label}
                    aria-pressed={nilai === i + 1}
                    onClick={() => setNilai(nilai === i + 1 ? null : i + 1)}
                    className={`h-12 flex-1 rounded-lg border text-2xl ${nilai === i + 1 ? "border-hijau bg-hijau-muda" : "bg-kartu opacity-70 hover:bg-krem hover:opacity-100"}`}
                  >
                    {w.e}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block space-y-1 text-sm">
              <span>{otomatis ? "Ada keluhan atau saran? (boleh kosong)" : "Ceritakan keluhan atau saran Bapak/Ibu"}</span>
              <textarea
                rows={otomatis ? 2 : 4}
                maxLength={1000}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                className="w-full resize-y rounded-lg border bg-kartu px-3 py-2 text-base"
                placeholder="mis. kunci soal no. 7 salah, PDF saya gagal dibaca, tombol X membingungkan"
              />
            </label>

            {set && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-krem">
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-hijau" checked={ikutSet} onChange={(e) => setIkutSet(e.target.checked)} />
                <span className="min-w-0">
                  Tentang set: <bdi className="font-semibold">{set.label}</bdi>
                </span>
              </label>
            )}

            {pesan && <p className="text-sm text-bahaya" role="alert">{pesan}</p>}

            <div className="flex gap-2">
              <button onClick={kirim} disabled={sibuk} className="h-11 flex-1 rounded-lg bg-hijau font-semibold text-white hover:bg-hijau-tua disabled:opacity-40">
                {sibuk ? "Mengirim..." : "Kirim"}
              </button>
              <button onClick={() => tutup()} className="h-11 rounded-lg border px-4 hover:bg-krem-sorot">
                {otomatis ? "Nanti saja" : "Batal"}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
