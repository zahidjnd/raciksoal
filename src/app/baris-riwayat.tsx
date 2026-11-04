"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hapusSet, ubahNamaSet } from "./actions";
import { MAKS_NAMA_SET } from "@/lib/prompt";

/** Tanda "sedang dibuka" di sidebar (riwayat & menu admin): satu baris saja yang memakainya. */
const TANDA_AKTIF = "bg-krem-sorot font-semibold";

/** Tautan menu sidebar (Semua set, Kelola guru, Pengaturan): ditandai bila alamat halaman sama dengan tautannya. */
export function TautanMenu({ href, kelas, children }: { href: string; kelas: string; children: React.ReactNode }) {
  const aktif = usePathname() === href;
  return (
    <Link href={href} className={`${kelas} ${aktif ? TANDA_AKTIF : ""}`} aria-current={aktif ? "page" : undefined}>
      {children}
    </Link>
  );
}

/**
 * Satu baris riwayat di sidebar, gaya claude.ai (pilihan pemilik 2026-11-04): tombol ⋯ (muncul saat diarahkan di
 * laptop, selalu tampil di HP) atau klik kanan membuka menu Ganti nama / Hapus. Ganti nama langsung di baris itu:
 * Enter atau klik di luar = simpan, Esc = batal. Pemeriksaan pemilik tetap di server (ubahNamaSet, hapusSet).
 * Tautan sengaja <a> biasa (muat penuh), lihat komentar di kepala.tsx.
 */
// aktif: set ini yang sedang dibuka → latar sorot tetap + judul tebal (TANDA_AKTIF, dipakai juga menu admin).
export function BarisRiwayat({ id, label, nama, keterangan, gagal, aktif, kelas }: { id: number; label: string; nama: string | null; keterangan: string; gagal: boolean; aktif: boolean; kelas: string }) {
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
        className={`${kelas} pr-11 ${aktif ? TANDA_AKTIF : menu ? "bg-krem-sorot" : ""}`} // baris tetap tersorot selama menunya terbuka
        aria-current={aktif ? "page" : undefined}
        title={`${label} (set ${id})`}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu(true);
        }}
      >
        <span className={`block truncate ${gagal ? "text-bahaya" : ""}`}>{label}</span>
        <span className="block text-xs font-normal text-pudar">{keterangan}</span>
      </a>
      <button
        aria-label={`Pilihan untuk ${label}`}
        aria-haspopup="menu"
        aria-expanded={menu}
        disabled={sibuk}
        onClick={() => setMenu(!menu)}
        // Bentuk tombol (garis + latar kartu) supaya jelas bisa diklik; hover/terbuka = latar sorot (tertekan).
        // focus-visible (bukan focus): hanya fokus dari keyboard yang menahan ⋯ tetap tampil; setelah diklik
        // mouse lalu menu ditutup, ⋯ hilang begitu kursor pergi (dulu "nyangkut" sampai klik tempat lain).
        className={`absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-batas text-pudar shadow-sm hover:bg-krem-sorot hover:text-tinta focus-visible:opacity-100 max-md:h-10 max-md:w-10 md:opacity-0 md:group-hover:opacity-100 ${menu ? "bg-krem-sorot text-tinta md:opacity-100" : "bg-kartu"}`}
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
