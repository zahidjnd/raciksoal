"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hapusSet, ubahNamaSet } from "./actions";
import { MAKS_NAMA_SET } from "@/lib/prompt";

/**
 * Satu baris riwayat di sidebar, gaya claude.ai (pilihan pemilik 2026-11-04): tombol ⋯ (muncul saat diarahkan di
 * laptop, selalu tampil di HP) atau klik kanan membuka menu Ganti nama / Hapus. Ganti nama langsung di baris itu:
 * Enter atau klik di luar = simpan, Esc = batal. Pemeriksaan pemilik tetap di server (ubahNamaSet, hapusSet).
 * Tautan sengaja <a> biasa (muat penuh), lihat komentar di kepala.tsx.
 */
export function BarisRiwayat({ id, label, nama, keterangan, gagal, kelas }: { id: number; label: string; nama: string | null; keterangan: string; gagal: boolean; kelas: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [ketik, setKetik] = useState<string | null>(null); // null = tidak sedang mengganti nama
  const [sibuk, setSibuk] = useState(false);
  const kotak = useRef<HTMLDivElement>(null);
  const sedangDibuka = () => new URLSearchParams(location.search).get("id") === String(id);

  // Menu tertutup saat klik di luar atau Esc.
  useEffect(() => {
    if (!menu) return;
    const luar = (e: MouseEvent) => !kotak.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", luar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  async function simpanNama() {
    const baru = (ketik ?? "").trim();
    setKetik(null);
    if (baru === (nama ?? label)) return; // tidak berubah
    setSibuk(true);
    const r = await ubahNamaSet(id, baru).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setSibuk(false);
    if (!r.ok) return alert(r.pesan);
    // Set ini sedang dibuka → muat ulang supaya judul halaman ikut berubah; selain itu cukup perbarui sidebar.
    if (sedangDibuka()) location.reload();
    else router.refresh();
  }

  async function hapus() {
    setMenu(false);
    if (!confirm(`Hapus "${nama ?? label}"? Set akan hilang dari riwayat dan tidak bisa dibuka lagi. (Jatah hari ini tidak kembali.)`)) return;
    setSibuk(true);
    const r = await hapusSet(id).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setSibuk(false);
    if (!r.ok) return alert(r.pesan);
    if (sedangDibuka()) location.assign("/");
    else router.refresh();
  }

  if (ketik !== null)
    return (
      <div className="shrink-0 px-1 py-1">
        <input
          autoFocus
          aria-label="Nama set"
          maxLength={MAKS_NAMA_SET}
          className="h-10 w-full rounded-lg border border-hijau bg-kartu px-2 text-sm"
          value={ketik}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setKetik(e.target.value)}
          onBlur={simpanNama}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setKetik(null);
          }}
        />
        <p className="px-1 pt-1 text-xs text-pudar">Kosongkan untuk kembali ke judul materi.</p>
      </div>
    );

  const itemMenu = "flex w-full items-center rounded-md px-3 text-left text-sm hover:bg-krem-sorot h-9 max-md:min-h-11";
  return (
    <div ref={kotak} className={`group relative shrink-0 ${sibuk ? "opacity-50" : ""}`}>
      <a
        href={`/?id=${id}`}
        className={`${kelas} pr-10`}
        title={`${label} (set ${id})`}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu(true);
        }}
      >
        <span className={`block truncate ${gagal ? "text-bahaya" : ""}`}>{label}</span>
        <span className="block text-xs text-pudar">{keterangan}</span>
      </a>
      <button
        aria-label={`Pilihan untuk ${label}`}
        aria-haspopup="menu"
        aria-expanded={menu}
        disabled={sibuk}
        onClick={() => setMenu(!menu)}
        className={`absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-pudar hover:bg-krem-tua hover:text-tinta focus:opacity-100 max-md:h-11 max-md:w-11 md:opacity-0 md:group-hover:opacity-100 ${menu ? "md:opacity-100" : ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {menu && (
        <div role="menu" className="absolute top-full right-1 z-20 w-40 rounded-lg border bg-kartu p-1 shadow-lg">
          <button
            role="menuitem"
            className={itemMenu}
            onClick={() => {
              setMenu(false);
              setKetik(nama ?? label);
            }}
          >
            Ganti nama
          </button>
          <button role="menuitem" className={`${itemMenu} text-bahaya`} onClick={hapus}>
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
