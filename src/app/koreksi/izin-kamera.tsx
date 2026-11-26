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
            Koreksi LJK memakai kamera HP untuk memindai. Ketuk tombol di bawah, lalu pilih <b>Izinkan saat situs dibuka</b> (bukan &ldquo;Hanya kali ini&rdquo;). Setelah itu
            tidak ditanya lagi.
          </p>
          <button onClick={minta} className="h-11 rounded-lg bg-hijau px-5 font-semibold text-white hover:bg-hijau-tua">
            Izinkan kamera
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-tinta">Kamera masih diblokir untuk situs ini</p>
          <p className="text-pudar">
            Ketuk ikon di kiri alamat web → <b>Izin</b> (atau Setelan situs) → <b>Kamera</b> → <b>Izinkan</b>, lalu muat ulang halaman. Bila tetap diblokir, periksa izin
            Kamera untuk Chrome di Setelan HP → Aplikasi. Sementara itu, memindai tetap bisa lewat kamera bawaan HP.
          </p>
        </>
      )}
    </section>
  );
}
