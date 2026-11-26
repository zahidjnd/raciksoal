"use client";

import { useEffect, useRef, useState } from "react";
import { cariKotak } from "@/lib/ljk";
import { bacaGambar, keKanvas, type HasilFoto } from "../baca-foto";

type Titik = [number, number];
type Hasil = Extract<HasilFoto, { ok: true }>;

const SISI_BIDIK = 640; // bingkai kecil untuk mencari 4 kotak (cepat di HP); jepretan dibaca 1600 px
const JEDA = 150; // ms antar bidikan
const DIAM = 3;
// Pergeseran pojok antar bidikan yang masih dianggap "diam" (bagian dari sisi terpanjang; 0,008 ≈ 15 px pada 1920).
// ponytail: angka tebakan, setel dari uji HP (terlalu sulit jepret → naikkan; foto kabur → turunkan).
const GESER = 0.008; // berapa bidikan berturut-turut yang hampir tak bergeser sebelum memotret sendiri

/** Pesan awam untuk kamera yang gagal menyala (nama galat dari browser). */
function alasanKamera(nama?: string) {
  if (nama === "NotAllowedError" || nama === "SecurityError")
    return "Izin kamera ditolak. Ketuk ikon di kiri alamat web → Izin/Setelan situs → Kamera → Izinkan, lalu ketuk nama siswa lagi. Bila tetap ditolak, periksa izin Kamera untuk Chrome di Setelan HP → Aplikasi.";
  if (nama === "NotReadableError" || nama === "AbortError") return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera/video call, lalu coba lagi.";
  if (nama === "NotFoundError" || nama === "OverconstrainedError") return "Kamera belakang tidak ditemukan di perangkat ini.";
  return `Kamera tidak bisa dibuka di sini${nama ? ` (${nama})` : ""}.`;
}

const luas = (k: Titik[]) => Math.abs(k.reduce((s, [x, y], i) => s + x * k[(i + 1) % 4][1] - k[(i + 1) % 4][0] * y, 0)) / 2;

/**
 * Kamera langsung (Koreksi LJK tahap 3): bidik terus, 4 kotak pojok ditandai hijau, gambar diam ±½ detik = jepret
 * sendiri. Foto tidak disimpan. Kamera ditolak / tidak ada → `pakaiFoto` (kamera bawaan HP, cara lama).
 */
export function KameraLjk({ nama, hasil, batal, pakaiFoto, galeri }: { nama: string; hasil: (h: Hasil) => void; batal: () => void; pakaiFoto: () => void; galeri: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ukuran, setUkuran] = useState<[number, number] | null>(null);
  const [kotak, setKotak] = useState<Titik[] | null>(null);
  const [pesan, setPesan] = useState("Menyalakan kamera…");
  const [gagal, setGagal] = useState(false);
  const [senter, setSenter] = useState<boolean | null>(null); // null = HP tidak punya senter yang bisa diatur
  const selesai = useRef(false);
  const hasilRef = useRef(hasil);
  hasilRef.current = hasil;

  useEffect(() => {
    let aliran: MediaStream | null = null;
    let waktu: ReturnType<typeof setTimeout>;
    let lalu: Titik[] | null = null;
    let diam = 0;
    let mati = false; // putaran efek ini sudah dibongkar (React dev menjalankan efek dua kali)
    selesai.current = false;

    function jepret(v: HTMLVideoElement) {
      const r = bacaGambar(v, v.videoWidth, v.videoHeight);
      if (!r.ok) return false;
      selesai.current = true;
      navigator.vibrate?.(60);
      hasilRef.current(r);
      return true;
    }

    function bidik() {
      const v = video.current;
      if (mati || selesai.current || !v) return;
      if (v.readyState >= 2 && v.videoWidth) {
        const [vw, vh] = [v.videoWidth, v.videoHeight];
        setUkuran((u) => (u?.[0] === vw && u?.[1] === vh ? u : [vw, vh]));
        const g = keKanvas(v, vw, vh, SISI_BIDIK);
        const k = cariKotak(g);
        const titik = k ? k.kotak.map(([x, y]) => [(x * vw) / g.w, (y * vh) / g.h] as Titik) : null;
        setKotak(titik);
        if (!titik) {
          diam = 0;
          setPesan("Arahkan ke bagian atas LJK sampai 4 kotak hitam di pojok terlihat");
        } else if (luas(titik) / (vw * vh) < 0.12) {
          diam = 0;
          setPesan("Dekatkan HP ke LJK");
        } else {
          const geser = lalu ? Math.max(...titik.map((t, i) => Math.hypot(t[0] - lalu![i][0], t[1] - lalu![i][1]))) / Math.max(vw, vh) : 1;
          diam = geser < GESER ? diam + 1 : 0;
          setPesan("Tahan sebentar…");
          if (diam >= DIAM && jepret(v)) return;
        }
        lalu = titik;
      }
      waktu = setTimeout(bidik, JEDA);
    }

    (async () => {
      try {
        aliran = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
          // sebagian HP menolak permintaan ukuran: coba sekali lagi tanpa ukuran
          .catch((e) => (e?.name === "NotAllowedError" ? Promise.reject(e) : navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })));
      } catch (e) {
        if (mati) return;
        setGagal(true);
        setPesan(alasanKamera((e as Error)?.name));
        return;
      }
      const v = video.current;
      const a = aliran!;
      if (!v || mati) return a.getTracks().forEach((t) => t.stop());
      v.srcObject = a;
      v.play().catch(() => {}); // tidak ditunggu: bidik() sendiri menunggu bingkai pertama
      const jalur = a.getVideoTracks()[0];
      if ((jalur.getCapabilities?.() as { torch?: boolean } | undefined)?.torch) setSenter(false);
      bidik();
    })();

    return () => {
      mati = true;
      clearTimeout(waktu);
      aliran?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function ubahSenter() {
    const jalur = (video.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
    if (!jalur || senter === null) return;
    await jalur.applyConstraints({ advanced: [{ torch: !senter } as MediaTrackConstraintSet] }).catch(() => {});
    setSenter(!senter);
  }

  function jepretSendiri() {
    const v = video.current;
    if (!v?.videoWidth) return;
    const r = bacaGambar(v, v.videoWidth, v.videoHeight);
    if (!r.ok) return setPesan(r.pesan);
    selesai.current = true;
    hasil(r);
  }

  const tombol = "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-white hover:bg-white/15";
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <div className="flex shrink-0 items-center gap-2 p-2">
        <button onClick={batal} aria-label="Batal" className={tombol}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="min-w-0 flex-1 truncate text-center font-semibold">{nama}</p>
        {senter !== null ? (
          <button onClick={ubahSenter} aria-label={senter ? "Matikan senter" : "Nyalakan senter"} aria-pressed={senter} className={`${tombol} ${senter ? "bg-white/25" : ""}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 2h8l-2 6v12a2 2 0 0 1-4 0V8z" />
            </svg>
          </button>
        ) : (
          <span className="w-11" />
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <video ref={video} playsInline muted className="h-full w-full object-contain" />
        {ukuran && kotak && (
          <svg viewBox={`0 0 ${ukuran[0]} ${ukuran[1]}`} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full">
            <polygon points={kotak.map((t) => t.join(",")).join(" ")} fill="rgb(0 99 22 / 0.15)" stroke="#3fbf5a" strokeWidth={Math.max(ukuran[0], ukuran[1]) / 200} strokeLinejoin="round" />
            {kotak.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={Math.max(ukuran[0], ukuran[1]) / 60} fill="#3fbf5a" />
            ))}
          </svg>
        )}
      </div>

      <div className="shrink-0 space-y-3 p-4 pb-6 text-center">
        <p className="text-sm" aria-live="polite">{pesan}</p>
        {gagal ? (
          <button onClick={pakaiFoto} className="h-12 rounded-xl bg-hijau px-6 font-semibold">
            Pakai kamera HP
          </button>
        ) : (
          <div className="flex items-center justify-center">
            <button onClick={jepretSendiri} aria-label="Jepret" className="h-16 w-16 rounded-full border-4 border-white bg-white/30 hover:bg-white/50" />
          </div>
        )}
        {!gagal && (
          <button onClick={galeri} className="text-xs text-white/70 underline">
            Pilih foto dari galeri
          </button>
        )}
      </div>
    </div>
  );
}
