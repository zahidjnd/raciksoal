"use client";

import { useEffect, useState } from "react";

type Status = "tanya" | "ditolak" | null; // null = sudah diizinkan / tidak perlu ditampilkan

/**
 * Kotak "Izinkan kamera" di halaman Koreksi LJK (HP saja): guru mengizinkan kamera sekali di awal, bukan di tengah
 * memindai. Web tidak bisa memberi izin sendiri (aturan browser); Chrome mengingat izinnya untuk situs ini.
 * Tanpa navigator.permissions (browser lama) kotak tampil sampai tombolnya berhasil sekali (localStorage).
 */
export function IzinKamera() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (typeof navigator.mediaDevices?.getUserMedia !== "function" || !matchMedia("(pointer: coarse)").matches) return;
    let izin: PermissionStatus | null = null;
    const baca = () => setStatus(izin?.state === "granted" ? null : izin?.state === "denied" ? "ditolak" : "tanya");
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((p) => {
        izin = p;
        baca();
        p.onchange = baca;
      })
      .catch(() => {
        try {
          if (localStorage.getItem("raciksoal-kamera") !== "ya") setStatus("tanya");
        } catch {
          setStatus("tanya");
        }
      });
    return () => {
      if (izin) izin.onchange = null;
    };
  }, []);

  async function minta() {
    try {
      const aliran = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      aliran.getTracks().forEach((t) => t.stop());
      try {
        localStorage.setItem("raciksoal-kamera", "ya");
      } catch {}
      setStatus(null);
    } catch (e) {
      if ((e as Error)?.name === "NotAllowedError") setStatus("ditolak");
    }
  }

  if (!status) return null;
  return (
    <section className="space-y-2 rounded-xl border border-peringatan-garis bg-peringatan-muda p-4 text-sm">
      {status === "tanya" ? (
        <>
          <p className="font-semibold text-tinta">Izinkan kamera sekali saja</p>
          <p className="text-pudar">
            Koreksi LJK memakai kamera HP untuk memindai. Ketuk tombol di bawah, lalu pilih <b>Izinkan saat mengunjungi situs</b> (bukan &ldquo;Izinkan kali ini&rdquo;).
            Setelah itu kamera tidak ditanya lagi.
          </p>
          <button onClick={minta} className="h-11 rounded-lg bg-hijau px-5 font-semibold text-white hover:bg-hijau-tua">
            Izinkan kamera
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-tinta">Kamera masih diblokir untuk situs ini</p>
          {/* Lewat menu ⋮ (pilihan pemilik): ikon di kiri alamat web kadang tidak tampil. Tulisan menu = Chrome Android. */}
          <ol className="list-decimal space-y-0.5 pl-5 text-pudar">
            <li>
              Ketuk <b>⋮</b> (titik tiga) di pojok kanan atas Chrome.
            </li>
            <li>
              Pilih <b>Kontrol situs</b>.
            </li>
            <li>
              Pilih <b>Izin</b> → <b>Kamera</b> → <b>Izinkan</b>.
            </li>
            <li>Muat ulang halaman ini.</li>
          </ol>
          <p className="text-pudar">Sementara itu, memindai tetap bisa lewat kamera bawaan HP.</p>
        </>
      )}
    </section>
  );
}
