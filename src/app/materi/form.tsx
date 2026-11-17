"use client";

import Link from "next/link";
import { beriTahu, tanya } from "../tanya";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KELAS } from "@/lib/soal";
import { KartuMateri, KotakMateri, lihatDalil, PilihMapel } from "../kotak-materi";
import { alasanDalil, modeArab, type IsianMateri } from "@/lib/materi";
import { hapusMateri, simpanMateri } from "./actions";

const TERSIMPAN = "Materi tersimpan. Bisa dipilih lewat “Pakai materi sebelumnya” saat membuat soal.";

/**
 * Tambah/ubah materi di halaman Materi saya. Memakai kotak & kartu yang SAMA dengan Set baru (kotak-materi.tsx):
 * materi baru = tempel/lampirkan → Analisa materi → kartu → Simpan materi (tanpa membuat soal).
 */
export function FormMateri({ id: idAwal, awal, bawaan }: { id: number | null; awal: IsianMateri | null; bawaan: { mapel: string[]; kelas: string } }) {
  const router = useRouter();
  const [id, setId] = useState(idAwal);
  const [draf, setDraf] = useState<IsianMateri | null>(awal);
  // Materi baru: mapel & kelas bawaan guru (halaman Akun, 0.32.0).
  const [mapel, setMapel] = useState(awal ? awal.mapel ?? "" : bawaan.mapel[0] ?? "");
  const [kelas, setKelas] = useState(awal ? awal.kelas ?? "" : bawaan.kelas);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string; dihapus?: string[] } | null>(null);

  function pilihMapel(m: string, k: string) {
    setMapel(m);
    setKelas(k);
    setPesan(null);
    // Materi tersimpan: mode teks Arab hanya ikut berubah bila mapelnya diganti (materi lama bisa memilih mode sendiri).
    if (id && draf) setDraf({ ...draf, mapel: m, kelas: k, ...(m !== draf.mapel && { teksArab: modeArab(m) }) });
    else setDraf(null); // materi baru: analisa bergantung pada mapel, jadi diulang (sama seperti Set baru)
  }

  const dalilKurang = draf ? alasanDalil(draf) : null;
  const alasan =
    !mapel || !kelas ? "Pilih mata pelajaran dan kelas dulu." :
    !draf ? "Tempel teks atau lampirkan file, lalu tekan Analisa materi." :
    !draf.tp.trim() ? "Isi Tujuan Pembelajaran (TP) di kartu materi dulu." :
    draf.tpUsulan && !draf.tpDibaca ? "Baca TP usulan AI di kartu materi, lalu centang persetujuannya." :
    dalilKurang ? dalilKurang.pesan : "";

  async function simpan() {
    if (!draf || alasan) return;
    setMenyimpan(true);
    setPesan(null);
    const r = await simpanMateri(id, { ...draf, mapel, kelas }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setMenyimpan(false);
    if (!r.ok) return setPesan({ ok: false, teks: r.pesan });
    // Pilihan pemilik 2026-11-17: tersimpan → kembali ke daftar Materi saya (materinya disorot). replace: tombol
    // Kembali tidak membuka form lama lagi. Kecuali ada teks Arab dibuang: tetap di sini supaya peringatannya terbaca.
    if (!r.dihapus.length) return router.replace(`/materi?tersimpan=${r.id}`);
    setDraf(r.isian); // tampilkan isi yang benar-benar tersimpan
    setId(r.id);
    setPesan({ ok: true, teks: TERSIMPAN, dihapus: r.dihapus });
  }

  return (
    <section className="space-y-4">
      <Link href="/materi" className="text-sm text-pudar underline">← Materi saya</Link>
      <h1 className="text-2xl">{id ? "Ubah materi" : "Tambah materi"}</h1>
      <PilihMapel mapel={mapel} kelas={kelas} ubah={pilihMapel} utama={bawaan.mapel} />
      {id && draf ? (
        <KartuMateri draf={draf} setDraf={setDraf} judul="Isi materi (semua bisa diubah)" />
      ) : (
        <KotakMateri mapel={mapel} kelas={kelas} daftar={[]} pilihan={[]} setPilihan={() => {}} draf={draf} setDraf={setDraf} gabung={false} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={menyimpan || !!alasan} onClick={simpan}>
          {menyimpan ? "Menyimpan..." : "Simpan materi"}
        </button>
        {id && (
          // <a> biasa (muat penuh): Buat Soal membaca ?materi= hanya saat dimuat
          <a href={`/?materi=materi-${id}`} className="inline-flex h-10 items-center rounded-lg border px-4 text-sm max-md:min-h-11">Buat soal dari materi ini</a>
        )}
      </div>
      {alasan && (
        <p className="text-sm text-pudar">
          {alasan}
          {dalilKurang && alasan === dalilKurang.pesan && (
            <> <button className="underline hover:text-tinta" onClick={() => lihatDalil(dalilKurang)}>Lihat kotaknya</button></>
          )}
        </p>
      )}
      {pesan && (
        <div className={`text-sm ${pesan.ok ? "text-hijau-teks" : "text-bahaya"}`} role={pesan.ok ? "status" : "alert"}>
          <p>{pesan.teks}</p>
          {!!pesan.dihapus?.length && (
            <p className="mt-1 rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan">
              ⚠️ {pesan.dihapus.length} potongan teks Arab dibuang dari judul/TP/isi karena tidak ada di kotak Ayat &amp; hadis:{" "}
              <span dir="rtl" lang="ar" className="font-arab text-lg">{pesan.dihapus.join(" | ")}</span>. Bila perlu, tambahkan ayat/hadis lengkapnya ke kotak itu.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Tombol hapus di daftar materi (dengan konfirmasi). */
function TombolHapusMateri({ id, judul, kelas }: { id: number; judul: string; kelas: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  async function hapus() {
    if (!(await tanya(`Materi "${judul}" akan dihapus. Set soal yang sudah dibuat dari materi ini tetap aman.`, { judul: "Hapus materi?", ya: "Hapus", bahaya: true }))) return;
    setProses(true);
    const r = await hapusMateri(id).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return beriTahu(r.pesan);
    router.refresh();
  }
  return (
    <button role="menuitem" className={kelas} disabled={proses} onClick={hapus}>
      {proses ? "Menghapus..." : "Hapus"}
    </button>
  );
}

/** Satu baris daftar Materi saya (disusun server: hanya materi milik guru yang masuk). */
export type BarisMateri = { id: number; judul: string; mapel: string; kelas: string; info: string };

const chip = (aktif: boolean) =>
  `h-8 rounded-full border px-3 text-sm max-md:min-h-11 ${aktif ? "border-hijau bg-hijau font-semibold text-white" : "bg-kartu hover:bg-krem-sorot"}`;

/**
 * Daftar Materi saya (permintaan pemilik 2026-11-17: guru 3 mapel × 3 kelas = daftar sangat panjang).
 * Saring per mapel (bawaan: mapel materi yang terakhir diubah) & kelas; kotak cari mencari di SEMUA mapel.
 * Bab diurutkan menurut nomornya (Bab 2 sebelum Bab 10). Ubah & Hapus di menu ⋯ (gaya riwayat sidebar).
 */
// sorot: materi yang baru disimpan → mapelnya terpilih, barisnya disorot & digulir ke layar.
export function DaftarMateri({ daftar, sorot }: { daftar: BarisMateri[]; sorot?: BarisMateri }) {
  const semuaMapel = [...new Set(daftar.map((m) => m.mapel))].sort((a, b) => a.localeCompare(b, "id"));
  const [pilihan, setMapel] = useState(sorot?.mapel ?? daftar[0]?.mapel ?? "");
  const [kelas, setKelas] = useState("");
  const [cari, setCari] = useState("");
  // Mapel terpilih bisa hilang setelah materinya dihapus semua → pakai mapel pertama.
  const mapel = semuaMapel.includes(pilihan) ? pilihan : semuaMapel[0];
  const kelasMapel = KELAS.filter((k) => daftar.some((m) => m.mapel === mapel && m.kelas === k));
  const q = cari.trim().toLowerCase();

  const tampil = daftar.filter((m) => (q ? m.judul.toLowerCase().includes(q) : m.mapel === mapel && (!kelas || m.kelas === kelas)));
  const kelompok = new Map<string, BarisMateri[]>();
  for (const m of [...tampil].sort((a, b) => a.mapel.localeCompare(b.mapel, "id") || KELAS.indexOf(a.kelas) - KELAS.indexOf(b.kelas) || a.judul.localeCompare(b.judul, "id", { numeric: true }))) {
    const kunci = `${m.mapel} · Kelas ${m.kelas}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), m]);
  }

  if (!daftar.length) return null;
  return (
    <div className="space-y-4">
      <input
        type="search"
        aria-label="Cari judul materi"
        placeholder="Cari judul materi (semua mapel)..."
        className="h-10 w-full rounded-lg border bg-kartu px-3 text-sm max-md:min-h-11"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
      />
      {!q && semuaMapel.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mata pelajaran">
          {semuaMapel.map((m) => (
            <button key={m} className={chip(m === mapel)} aria-pressed={m === mapel} onClick={() => (setMapel(m), setKelas(""))}>{m}</button>
          ))}
        </div>
      )}
      {!q && kelasMapel.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kelas">
          {["", ...kelasMapel].map((k) => (
            <button key={k} className={chip(k === kelas)} aria-pressed={k === kelas} onClick={() => setKelas(k)}>{k ? `Kelas ${k}` : "Semua kelas"}</button>
          ))}
        </div>
      )}
      {q && !tampil.length && <p className="rounded-xl border bg-kartu p-4 text-sm text-pudar">Tidak ada materi berjudul &ldquo;{cari.trim()}&rdquo;.</p>}

      {[...kelompok].map(([judul, isi]) => (
        <div key={judul} className="space-y-2">
          <h2 className="text-lg">{judul} <span className="text-sm text-pudar">({isi.length} materi)</span></h2>
          <div className="divide-y divide-batas rounded-xl border bg-kartu">
            {isi.map((m) => <BarisMateriSaya key={m.id} m={m} sorot={m.id === sorot?.id} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function BarisMateriSaya({ m, sorot }: { m: BarisMateri; sorot: boolean }) {
  const [menu, setMenu] = useState(false);
  const kotak = useRef<HTMLDivElement>(null);
  const baris = useRef<HTMLElement>(null);
  useEffect(() => {
    if (sorot) baris.current?.scrollIntoView({ block: "center" });
  }, [sorot]);
  // Menu tertutup saat klik di luar atau Esc (sama dengan menu riwayat sidebar).
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
  const itemMenu = "flex w-full items-center rounded-md px-3 text-left text-sm hover:bg-krem-sorot h-9 max-md:min-h-11 disabled:opacity-50";

  return (
    <article ref={baris} className={`flex items-center gap-2 p-3 first:rounded-t-xl last:rounded-b-xl ${sorot ? "bg-hijau-muda" : ""}`}>
      <div className="min-w-0 flex-1">
        <p dir="auto" className="font-semibold">{m.judul}</p>
        <p className="text-xs text-pudar">{m.info}</p>
      </div>
      {/* <a> biasa (muat penuh): Buat Soal membaca ?materi= hanya saat dimuat */}
      <a href={`/?materi=materi-${m.id}`} className="inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-sm hover:bg-krem max-md:min-h-11">Buat soal</a>
      <div ref={kotak} className="relative shrink-0">
        <button
          aria-label={`Pilihan untuk ${m.judul}`}
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-pudar hover:bg-krem-sorot hover:text-tinta max-md:h-11 max-md:w-11 ${menu ? "bg-krem-sorot text-tinta" : "bg-kartu"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        {menu && (
          <div role="menu" className="absolute top-full right-0 z-20 mt-1 w-40 rounded-lg border bg-kartu p-1 shadow-lg">
            <Link role="menuitem" href={`/materi/${m.id}`} className={itemMenu}>Ubah</Link>
            <TombolHapusMateri id={m.id} judul={m.judul} kelas={`${itemMenu} text-bahaya`} />
          </div>
        )}
      </div>
    </article>
  );
}
