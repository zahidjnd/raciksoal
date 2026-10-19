"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BATAS_MATERI, type IsianMateri } from "@/lib/materi";
import { NAMA_SURAH } from "@/lib/surah";
import { ambilAyat, cocokkanAyat, hapusMateri, simpanMateri } from "./actions";

const kotak = "mt-1 w-full rounded border p-2 text-sm";
const DALIL_KOSONG = { sumber: "", arab: "", terjemah: "" };
const BATAS_FILE = 30 * 1024 * 1024; // dibaca di browser, jadi boleh besar (PPT berisi gambar)

/** Form tambah/ubah materi sendiri (langkah 8a). */
export function FormMateri({ id: idAwal, awal }: { id: number | null; awal: IsianMateri }) {
  const [id, setId] = useState(idAwal);
  const [m, setM] = useState<IsianMateri>(awal);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string; dihapus?: string[] } | null>(null);
  const [membaca, setMembaca] = useState<{ ok: boolean; teks: string } | null>(null);
  const ubah = (sebagian: Partial<IsianMateri>) => setM({ ...m, ...sebagian });
  const ubahDalil = (i: number, sebagian: Partial<IsianMateri["dalil"][number]>) =>
    ubah({ dalil: m.dalil.map((d, j) => (j === i ? { ...d, ...sebagian } : d)) });
  const [rujukan, setRujukan] = useState("");
  const [ayat, setAyat] = useState<{ proses: boolean; pesan?: string }>({ proses: false });

  /** Langkah 9: ambil teks ayat dari data mushaf (tidak diketik guru). */
  async function ambil() {
    if (!rujukan.trim()) return;
    if (m.dalil.length >= BATAS_MATERI.dalil) return setAyat({ proses: false, pesan: `Kotak ayat sudah penuh (maks ${BATAS_MATERI.dalil}).` });
    setAyat({ proses: true });
    const r = await ambilAyat(rujukan).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    if (!r.ok) return setAyat({ proses: false, pesan: r.pesan });
    if (m.dalil.some((d) => d.arab === r.arab)) return setAyat({ proses: false, pesan: `${r.sumber} sudah ada di daftar.` });
    ubah({ dalil: [...m.dalil, { sumber: r.sumber, arab: r.arab, terjemah: "", mushaf: true }] });
    setRujukan("");
    setAyat({ proses: false });
  }
  const perluCentang = m.dalil.some((d) => !d.mushaf);

  /** Langkah 8b: ambil teks dari file Word/PowerPoint di browser (file tidak diunggah ke hosting). */
  async function ambilFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi
    if (!f) return;
    if (f.size > BATAS_FILE) return setMembaca({ ok: false, teks: `File terlalu besar (maks ${BATAS_FILE / 1024 / 1024} MB).` });
    setMembaca({ ok: true, teks: `Membaca ${f.name}...` });
    try {
      const { bacaFileOffice } = await import("@/lib/office"); // dimuat hanya saat dipakai
      const r = await bacaFileOffice(await f.arrayBuffer(), f.name);
      // Langkah 9: teks Arab dicocokkan ke mushaf di server. Ayat → teks resmi; basmalah → dibuang; sisanya usulan.
      const cocok = await cocokkanAyat(r.arab);
      if (!cocok) throw new Error("Sesi masuk sudah berakhir. Muat ulang halaman lalu masuk lagi.");
      const ada = new Set(m.dalil.map((d) => d.arab.trim()));
      const hasil: IsianMateri["dalil"] = [];
      r.arab.forEach((arab, i) => {
        const c = cocok[i];
        const d = c === "basmalah" ? null : c ? { ...c, terjemah: "", mushaf: true } : { sumber: "", arab, terjemah: "", usulan: true };
        if (d && !ada.has(d.arab)) {
          hasil.push(d);
          ada.add(d.arab);
        }
      });
      const baru = hasil.slice(0, Math.max(0, BATAS_MATERI.dalil - m.dalil.length));
      const nAyat = baru.filter((d) => d.mushaf).length;
      const nUsulan = baru.length - nAyat;
      setM({
        ...m,
        judul: m.judul || f.name.replace(/\.(docx|pptx)$/i, ""),
        isi: [m.isi.trim(), r.teks.join("\n")].filter(Boolean).join("\n\n"),
        dalil: [...m.dalil, ...baru],
        // Aturan 5: ada usulan teks Arab baru (bukan ayat mushaf) → guru wajib memeriksa & mencentang ulang.
        diverifikasi: nUsulan ? false : m.diverifikasi,
      });
      setMembaca({
        ok: true,
        teks:
          `Dari ${f.name}: ${r.teks.length} paragraf teks ditambahkan ke Isi materi (silakan rapikan/hapus yang tidak perlu).` +
          (nAyat ? ` ${nAyat} ayat ditemukan di mushaf (kotak hijau, teks diganti teks mushaf): tinggal isi terjemahnya.` : "") +
          (nUsulan ? ` ${nUsulan} teks Arab lain (hadis/doa?) diusulkan (kotak kuning): lengkapi sumber & terjemahnya, periksa harakatnya, hapus yang tidak perlu.` : "") +
          (hasil.length > baru.length ? ` ${hasil.length - baru.length} teks Arab lain tidak dimasukkan karena kotak ayat sudah penuh (maks ${BATAS_MATERI.dalil}).` : ""),
      });
    } catch (err) {
      setMembaca({ ok: false, teks: (err as Error).message || "File tidak bisa dibaca." });
    }
  }

  async function simpan() {
    setMenyimpan(true);
    setPesan(null);
    const r = await simpanMateri(id, m).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setMenyimpan(false);
    if (!r.ok) return setPesan({ ok: false, teks: r.pesan });
    setM(r.isian); // tampilkan isi yang benar-benar tersimpan
    if (!id) history.replaceState(history.state, "", `/materi/${r.id}`); // history.state: lihat catatan di buat-soal.tsx
    setId(r.id);
    setPesan({ ok: true, teks: "Materi tersimpan. Sekarang bisa dipilih di form Buat Soal.", dihapus: r.dihapus });
  }

  return (
    <section className="space-y-5 rounded-xl border p-4">
      <h1 className="garis-judul text-xl font-semibold">{id ? "Ubah materi" : "Tambah materi"}</h1>

      <div className="space-y-1 rounded border border-dashed border-hijau p-3 text-sm">
        <p className="font-semibold">Ambil dari file Word/PowerPoint (opsional)</p>
        <label className="inline-block cursor-pointer rounded-lg border border-hijau bg-white px-4 py-1.5 font-semibold text-hijau hover:bg-hijau-muda focus-within:ring-2 focus-within:ring-hijau">
          Pilih file Word/PowerPoint
          <input type="file" accept=".docx,.pptx" className="sr-only" onChange={ambilFile} />
        </label>
        <p className="text-xs text-gray-500">
          File .docx / .pptx dibaca di perangkat Anda (tidak diunggah). Teksnya ditambahkan ke Isi materi; teks Arabnya hanya menjadi
          USULAN ayat/hadis yang wajib Anda periksa. PDF tidak didukung.
        </p>
        {membaca && <p className={membaca.ok ? "text-hijau" : "text-red-600"}>{membaca.teks}</p>}
      </div>

      <label className="block text-sm">
        Judul materi
        <input className={kotak} maxLength={BATAS_MATERI.judul} placeholder="Contoh: Bab I: Berbakti kepada Orang Tua" value={m.judul} onChange={(e) => ubah({ judul: e.target.value })} />
      </label>

      <label className="block text-sm">
        Tujuan Pembelajaran (TP), satu per baris
        <textarea
          className={kotak}
          rows={4}
          placeholder={"TP 1.1: Peserta didik mampu ...\nTP 1.2: Peserta didik mampu ..."}
          value={m.tp}
          onChange={(e) => ubah({ tp: e.target.value })}
        />
        <span className="text-xs text-gray-500">Boleh diawali kode (mis. TP 1.1:); tanpa kode diberi nomor otomatis. Maks {BATAS_MATERI.tp} TP.</span>
      </label>

      <label className="block text-sm">
        Isi materi
        <textarea dir="auto" className={kotak} rows={12} placeholder="Tempel ringkasan materi di sini (dari buku, modul, atau PPT)." value={m.isi} onChange={(e) => ubah({ isi: e.target.value })} />
        <span className={`text-xs ${m.isi.length > BATAS_MATERI.isi ? "font-semibold text-red-600" : "text-gray-500"}`}>
          {m.isi.length.toLocaleString("id-ID")}/{BATAS_MATERI.isi.toLocaleString("id-ID")} huruf. Teks Arab di sini hanya dipakai bila sama persis dengan
          ayat/hadis di kotak bawah; selebihnya dibuang otomatis.
        </span>
      </label>

      <fieldset className="space-y-3 rounded border border-hijau/40 bg-hijau-muda/40 p-3">
        <legend className="px-1 text-sm font-semibold">Ayat & Hadis Terverifikasi</legend>
        <p className="text-xs text-gray-600">
          AI tidak boleh mengarang ayat/hadis. Hanya teks Arab di kotak ini yang boleh muncul di soal. Ayat Al-Qur&apos;an diambil otomatis dari
          data mushaf; hadis disalin dari kitab/sumber terpercaya (bukan dari PDF) dan wajib Anda periksa.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-64 rounded border p-2 text-sm"
            list="daftar-surah"
            placeholder="Ketik ayat, mis. QS An-Nur: 2 atau 24:2-3"
            value={rujukan}
            onChange={(e) => setRujukan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ambil()}
          />
          <datalist id="daftar-surah">
            {NAMA_SURAH.map((n, i) => (
              <option key={n} value={`QS ${n}: `}>{`${i + 1}. ${n}`}</option>
            ))}
          </datalist>
          <button className="rounded-lg bg-hijau px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={ayat.proses || !rujukan.trim()} onClick={ambil}>
            {ayat.proses ? "Mengambil..." : "Ambil ayat"}
          </button>
          {ayat.pesan && <span className="text-sm text-red-600">{ayat.pesan}</span>}
        </div>
        {m.dalil.map((d, i) => (
          <div key={i} className={`space-y-2 rounded border p-3 ${d.mushaf ? "border-hijau bg-white" : d.usulan ? "border-amber-400 bg-amber-50" : "bg-white"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                Dalil {i + 1}
                {d.mushaf && <span className="ml-2 font-normal text-hijau">✓ teks dari mushaf, tinggal isi terjemah</span>}
                {d.usulan && <span className="ml-2 font-normal text-amber-800">usulan dari file, tidak ditemukan di mushaf: periksa harakat & lengkapi sumber/terjemah</span>}
              </span>
              <button className="rounded border px-2 text-sm" aria-label={`Hapus dalil ${i + 1}`} onClick={() => ubah({ dalil: m.dalil.filter((_, j) => j !== i) })}>
                ✕ Hapus
              </button>
            </div>
            <input className={kotak} readOnly={d.mushaf} placeholder="Sumber hadis, mis. HR. Bukhari dan Muslim" value={d.sumber} onChange={(e) => ubahDalil(i, { sumber: e.target.value })} />
            <textarea dir="rtl" lang="ar" rows={3} readOnly={d.mushaf} className={`${kotak} font-arab text-2xl ${d.mushaf ? "bg-gray-50" : ""}`} placeholder="نص الحديث" value={d.arab} onChange={(e) => ubahDalil(i, { arab: e.target.value })} />
            <textarea rows={2} className={kotak} placeholder="Terjemah" value={d.terjemah} onChange={(e) => ubahDalil(i, { terjemah: e.target.value })} />
          </div>
        ))}
        {m.dalil.length < BATAS_MATERI.dalil && (
          <button className="rounded-lg border bg-white px-3 py-1 text-sm" onClick={() => ubah({ dalil: [...m.dalil, DALIL_KOSONG] })}>
            + Tambah hadis (ketik/tempel sendiri)
          </button>
        )}
        {perluCentang && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={m.diverifikasi} onChange={(e) => ubah({ diverifikasi: e.target.checked })} />
            Saya sudah memeriksa teks Arab, harakat, dan terjemah hadis/teks di atas yang bukan dari mushaf sesuai kitab sumbernya.
            (Ayat Al-Qur&apos;an yang ditempel sendiri akan dicocokkan otomatis ke mushaf saat disimpan.)
          </label>
        )}
        <p className="text-xs text-gray-500">
          Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a>. Terjemah diisi guru.
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg bg-hijau px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={menyimpan} onClick={simpan}>
          {menyimpan ? "Menyimpan..." : "Simpan materi"}
        </button>
        <Link href="/materi" className="inline-flex items-center rounded-lg border px-4 py-2 max-md:min-h-11">Kembali</Link>
        {id && <Link href="/" className="inline-flex items-center rounded-lg border px-4 py-2 max-md:min-h-11">Buat soal dari materi ini</Link>}
      </div>
      {pesan && (
        <div className={`text-sm ${pesan.ok ? "text-hijau" : "text-red-600"}`}>
          <p>{pesan.teks}</p>
          {!!pesan.dihapus?.length && (
            <p className="mt-1 rounded border border-amber-400 bg-amber-50 p-2 text-amber-900">
              ⚠️ {pesan.dihapus.length} potongan teks Arab dibuang dari judul/TP/isi karena tidak ada di kotak Ayat & Hadis Terverifikasi:{" "}
              <span dir="rtl" lang="ar" className="font-arab text-lg">{pesan.dihapus.join(" | ")}</span>. Bila perlu, tambahkan ayat/hadis lengkapnya ke kotak itu.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Tombol hapus di daftar materi (dengan konfirmasi). */
export function TombolHapusMateri({ id, judul }: { id: number; judul: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  async function hapus() {
    if (!confirm(`Hapus materi "${judul}"? Set soal yang sudah dibuat dari materi ini tetap aman.`)) return;
    setProses(true);
    const r = await hapusMateri(id).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return alert(r.pesan);
    router.refresh();
  }
  return (
    <button className="rounded-lg border px-3 py-1 text-sm text-red-700 disabled:opacity-50" disabled={proses} onClick={hapus}>
      {proses ? "Menghapus..." : "Hapus"}
    </button>
  );
}
