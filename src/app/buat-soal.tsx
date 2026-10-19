"use client";

import { useEffect, useState } from "react";
import { ambilDaftarBab, ambilDaftarModel, ambilJatah, cekHasil, mulaiBuatSoal } from "./actions";
import { KartuSoal, Teks } from "./kartu-soal";
import { ATURAN_TUJUAN, BOBOT_BAWAAN, KESULITAN, MAKS_CATATAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
import type { BarisKisi, Bentuk } from "@/lib/soal";
import { DAFTAR_BAB as SEMUA_BAB } from "@/data";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BAB_BAWAAN = Object.values(SEMUA_BAB);
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

function Angka({ label, nilai, ubah }: { label: string; nilai: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}
      <input type="number" min={0} max={MAKS_SOAL} value={nilai} onChange={(e) => ubah(Number(e.target.value))} className="w-20 rounded border p-1 text-right" />
    </label>
  );
}

/** Tabel kisi-kisi (langkah 6): satu baris per soal. Set lama tidak punya kisi-kisi. */
function TabelKisi({ kisi }: { kisi: BarisKisi[] }) {
  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer font-semibold">📋 Kisi-kisi ({kisi.length} soal)</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              {["No. Soal", "TP", "Materi", "Indikator Soal", "Level", "Bentuk"].map((j) => (
                <th key={j} className="border p-2">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kisi.map((k) => (
              <tr key={k.no} className={`align-top ${k.peringatan?.length ? "bg-red-50" : ""}`}>
                <td className="border p-2 text-center">{k.no}</td>
                <td className="border p-2 whitespace-nowrap">{k.tp}</td>
                <td className="border p-2"><Teks teks={k.materi} /></td>
                <td className="border p-2">
                  {k.peringatan?.map((w, i) => <span key={i} className="block font-semibold text-red-700">⚠️ {w}</span>)}
                  <Teks teks={k.indikator} />
                  <span className="block text-xs text-gray-500">Stimulus: <Teks teks={k.stimulus} /></span>
                </td>
                <td className="border p-2 text-center">{k.level}</td>
                <td className="border p-2 whitespace-nowrap">{NAMA_BENTUK[k.bentuk]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function BuatSoal({ nama }: { nama: string }) {
  const router = useRouter();
  const [p, setP] = useState<Pengaturan>({
    babId: BAB_BAWAAN[0].id,
    tujuan: TUJUAN[0],
    jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 },
    level: ATURAN_TUJUAN[TUJUAN[0]].level,
    kesulitan: "Sedang",
    bobot: BOBOT_BAWAAN,
    modelSlot: 1,
  });
  const [daftarModel, setDaftarModel] = useState<{ slot: number; nama: string }[]>([]);
  // Bab bawaan + materi sendiri milik guru (langkah 8); sebelum termuat, tampilkan bab bawaan saja.
  const [daftarBab, setDaftarBab] = useState(BAB_BAWAAN.map((b) => ({ id: b.id, judul: b.judul, sendiri: false })));
  const [banding, setBanding] = useState<{ nama: string; id?: number; pesan?: string }[]>([]);
  const [id, setId] = useState<number | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState("");
  const [detik, setDetik] = useState(0);
  const [buka, setBuka] = useState<"jumlah" | "lanjutan" | null>(null); // panel di bawah kotak ketik
  const [jatah, setJatah] = useState<Awaited<ReturnType<typeof ambilJatah>>>(null);
  const muatJatah = () => ambilJatah().then(setJatah).catch(() => {});
  const jatahHabis = !!jatah?.batas && jatah.terpakai >= jatah.batas;

  const total = BENTUK.reduce((s, b) => s + p.jumlah[b], 0);
  const bobot = p.bobot ?? BOBOT_BAWAAN;
  const totalSkor = BENTUK.reduce((s, b) => s + p.jumlah[b] * bobot[b], 0);
  const totalLevel = p.level.LOTS + p.level.MOTS + p.level.HOTS;
  const proses = id !== null && (!hasil || hasil.status === "proses");

  // Buka hasil lama lewat alamat ?id=... (misalnya setelah halaman dimuat ulang).
  useEffect(() => {
    const lama = Number(new URLSearchParams(location.search).get("id"));
    if (lama) setId(lama);
    ambilDaftarModel().then(setDaftarModel).catch(() => {});
    ambilDaftarBab().then((d) => d.length && setDaftarBab(d)).catch(() => {});
    muatJatah();
  }, []);

  // Cek hasil tiap 3 detik selama AI masih bekerja.
  useEffect(() => {
    if (id === null) return;
    let berhenti = false;
    let sempatProses = false;
    const mulai = Date.now();
    const cek = async () => {
      if (berhenti) return;
      setDetik(Math.round((Date.now() - mulai) / 1000));
      const h = await cekHasil(id).catch(() => null);
      if (berhenti) return;
      if (!h) {
        setId(null);
        return setError("Hasil tidak ditemukan.");
      }
      setHasil(h);
      if (h.status === "proses") {
        sempatProses = true;
        setTimeout(cek, 3000);
      } else {
        muatJatah(); // selesai/gagal: perbarui sisa jatah (set gagal tidak dihitung)
        if (sempatProses) router.refresh(); // riwayat di sidebar ikut diperbarui
      }
    };
    cek();
    return () => {
      berhenti = true;
    };
  }, [id]);

  async function buat() {
    setError("");
    setHasil(null);
    setBanding([]);
    if (p.modelSlot === 0) {
      // Bandingkan: pengaturan sama persis, satu set per model. Tiap hasil dibuka di tab sendiri.
      for (const m of daftarModel) {
        const r = await mulaiBuatSoal({ ...p, modelSlot: m.slot, bandingkan: true }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus." }));
        setBanding((b) => [...b, r.ok ? { nama: m.nama, id: r.id } : { nama: m.nama, pesan: r.pesan }]);
      }
      return;
    }
    const r = await mulaiBuatSoal(p);
    if (!r.ok) return setError(r.pesan);
    // Buka halaman set baru dengan pemuatan penuh (sama seperti membuka dari riwayat): sidebar langsung memuat
    // set ini (⏳) dan pengecekan status dimulai dari ?id=. JANGAN router.replace / history.replaceState + router.refresh
    // di sini: navigasi router di tengah pengecekan memutusnya (macet "0 detik"), dan refresh mengembalikan alamat ke "/".
    location.assign(`/?id=${r.id}`);
  }

  const bab = hasil?.bab ?? BAB_BAWAAN[0]; // salinan bab milik set (berisi ayat terverifikasi untuk tampilan & edit)
  const soal = hasil?.soal ?? [];

  // Form tampil saat belum ada set yang dibuka, atau set gagal (supaya bisa langsung dicoba lagi).
  const tampilForm = id === null || hasil?.status === "gagal";
  const alasanTerkunci =
    total < 1 ? "Isi jumlah soal dulu." :
    total > MAKS_SOAL ? `Jumlah soal maksimal ${MAKS_SOAL}.` :
    totalLevel !== 100 ? `Komposisi level harus 100% (sekarang ${totalLevel}%), buka Lanjutan.` : "";
  const chip = "rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50";
  const chipPanel = (b: typeof buka) => `${chip} ${buka === b ? "border-emerald-600 bg-emerald-50 text-emerald-900" : ""}`;

  return (
    <div className="space-y-6">

      {tampilForm && (
        <section className="mx-auto max-w-2xl space-y-3 pt-4 md:pt-16">
          <div className="pb-2 text-center">
            <p className="text-gray-600">Assalamu&apos;alaikum, {nama}</p>
            <h1 className="text-2xl font-semibold">Mau buat soal apa hari ini?</h1>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-white p-3 shadow-sm focus-within:border-emerald-600">
            <textarea
              className="w-full resize-none p-1 outline-none"
              rows={3}
              maxLength={MAKS_CATATAN}
              aria-label="Catatan untuk AI (opsional)"
              placeholder="Catatan untuk AI (opsional), mis. fokus QS An-Nur ayat 2; pakai nama santri putri; perbanyak soal mufradat"
              value={p.catatan ?? ""}
              onChange={(e) => setP({ ...p, catatan: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Bab" className={`${chip} max-w-[15rem] truncate`} value={p.babId} onChange={(e) => setP({ ...p, babId: e.target.value })}>
                <optgroup label="Bab bawaan">
                  {daftarBab.filter((b) => !b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                </optgroup>
                {daftarBab.some((b) => b.sendiri) && (
                  <optgroup label="Materi saya">
                    {daftarBab.filter((b) => b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                  </optgroup>
                )}
              </select>
              <select
                aria-label="Tujuan soal"
                className={chip}
                value={p.tujuan}
                onChange={(e) => {
                  const tujuan = e.target.value as (typeof TUJUAN)[number];
                  setP({ ...p, tujuan, level: ATURAN_TUJUAN[tujuan].level }); // komposisi level ikut tujuan
                }}
              >
                {TUJUAN.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select aria-label="Tingkat kesulitan" className={chip} value={p.kesulitan} onChange={(e) => setP({ ...p, kesulitan: e.target.value })}>
                {KESULITAN.map((k) => <option key={k} value={k}>Kesulitan: {k}</option>)}
              </select>
              <button className={chipPanel("jumlah")} aria-expanded={buka === "jumlah"} onClick={() => setBuka(buka === "jumlah" ? null : "jumlah")}>
                {total} soal ▾
              </button>
              <button className={chipPanel("lanjutan")} aria-expanded={buka === "lanjutan"} onClick={() => setBuka(buka === "lanjutan" ? null : "lanjutan")}>
                ⚙ Lanjutan
              </button>
              <span className="flex-1" />
              <button
                aria-label="Buat soal"
                title="Buat soal"
                className="h-10 w-10 rounded-full bg-emerald-700 text-xl font-bold text-white hover:bg-emerald-800 disabled:opacity-40"
                disabled={proses || jatahHabis || !!alasanTerkunci}
                onClick={buat}
              >
                ↑
              </button>
            </div>

            {buka === "jumlah" && (
              <fieldset className="mt-3 space-y-2 border-t pt-3">
                <legend className="sr-only">Jumlah soal × skor per soal</legend>
                <p className="text-xs text-gray-500">Jumlah soal × skor per soal</p>
                {BENTUK.map((b) => (
                  <div key={b} className="flex items-center justify-between gap-2 text-sm">
                    {NAMA_BENTUK[b]}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <input type="number" min={0} max={MAKS_SOAL} aria-label={`Jumlah ${NAMA_BENTUK[b]}`} value={p.jumlah[b]} onChange={(e) => setP({ ...p, jumlah: { ...p.jumlah, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                      ×
                      <input type="number" min={0} max={100} aria-label={`Skor per soal ${NAMA_BENTUK[b]}`} value={bobot[b]} onChange={(e) => setP({ ...p, bobot: { ...bobot, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                    </span>
                  </div>
                ))}
                <p className={`text-sm ${totalSkor === 100 ? "text-gray-600" : "text-amber-700"}`}>
                  Total: {total} soal (maks {MAKS_SOAL}), skor {totalSkor}
                  {totalSkor !== 100 && " (bukan 100)"}
                </p>
              </fieldset>
            )}

            {buka === "lanjutan" && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
                  <p className="text-xs text-gray-500">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
                  <Angka label="LOTS (C1–C2) %" nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
                  <Angka label="MOTS (C3) %" nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
                  <Angka label="HOTS (C4–C6) %" nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
                </fieldset>
                {/* Daftar model hanya dikirim server untuk admin; guru tidak melihat pilihan ini. */}
                {daftarModel.length > 0 && (
                  <label className="block text-sm">
                    Model AI <span className="rounded bg-amber-100 px-1 text-xs">admin</span>
                    <select className="mt-1 w-full rounded border p-2" value={p.modelSlot} onChange={(e) => setP({ ...p, modelSlot: Number(e.target.value) })}>
                      {daftarModel.map((m) => (
                        <option key={m.slot} value={m.slot}>{m.nama}</option>
                      ))}
                      {daftarModel.length > 1 && <option value={0}>Bandingkan semua model (pengaturan sama)</option>}
                    </select>
                  </label>
                )}
              </div>
            )}
          </div>

          {alasanTerkunci && <p className="text-center text-sm text-amber-700">{alasanTerkunci}</p>}
          <p className="text-center text-xs text-gray-500">
            {jatah &&
              (jatah.batas
                ? `Sisa jatah hari ini: ${Math.max(0, jatah.batas - jatah.terpakai)} dari ${jatah.batas} set. `
                : `Hari ini Anda membuat ${jatah.terpakai} set (admin, tanpa batas). `)}
            AI tetap wajib mengikuti aturan, termasuk larangan mengarang ayat dan hadis.{" "}
            <Link href="/materi" className="text-emerald-800 underline">Pakai materi sendiri</Link>
          </p>
          {jatahHabis && <p className="text-center font-semibold text-red-600">Jatah hari ini habis. Silakan lanjutkan besok.</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {banding.length > 0 && (
            <div className="space-y-1 rounded border border-blue-300 bg-blue-50 p-3 text-sm">
              <p className="font-semibold">Perbandingan dimulai. Buka tiap hasil (tab baru), tunggu sampai selesai:</p>
              {banding.map((b) =>
                b.id ? (
                  <a key={b.nama} className="block text-blue-700 underline" href={`?id=${b.id}`} target="_blank" rel="noreferrer">
                    {b.nama} (set {b.id})
                  </a>
                ) : (
                  <p key={b.nama} className="text-red-600">{b.nama}: {b.pesan}</p>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {proses && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          ⏳ Sedang membuat soal... {hasil?.pesan ? `${hasil.pesan}, ` : ""}{detik} detik (bisa 1–3 menit). Halaman ini boleh ditinggal; set tersimpan di riwayat.
        </p>
      )}

      {hasil?.status === "gagal" && <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && (
        <section className="space-y-6">
          <p className="rounded border border-amber-400 bg-amber-50 p-3 font-semibold text-amber-900">
            ⚠️ Soal dibuat AI, wajib diperiksa guru sebelum dipakai.
          </p>
          <p className="text-sm text-gray-500">
            {bab.judul} · {soal.length} soal
            {hasil.model && <> · model: <b>{hasil.model}</b></>}
            {hasil.info && ` · ${hasil.info.detik} detik · ${(hasil.info.tokenMasuk + hasil.info.tokenKeluar).toLocaleString("id-ID")} token`}
            {` · ${soal.filter((s) => s.peringatan?.length).length} soal ditandai`}
          </p>
          {!!hasil.info?.catatan?.length && (
            <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">⚠️ Model cadangan dipakai, karena model utama gagal:</p>
              <ul className="list-disc pl-5">
                {hasil.info.catatan.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <a className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/api/word?id=${id}&jenis=soal`}>
              ⬇️ Unduh Soal (Word)
            </a>
            <a className="rounded border border-blue-700 px-4 py-2 font-semibold text-blue-700" href={`/api/word?id=${id}&jenis=kunci`}>
              ⬇️ Unduh Kunci & Pembahasan (Word)
            </a>
            {!!hasil.kisi?.length && (
              <a className="rounded border border-blue-700 px-4 py-2 font-semibold text-blue-700" href={`/api/word?id=${id}&jenis=kisi`}>
                ⬇️ Unduh Kisi-kisi (Word)
              </a>
            )}
          </div>
          <p className="text-xs text-gray-500">File Word mengikuti isi terbaru, termasuk soal yang sudah Anda edit atau ganti.</p>

          {!!hasil.kisi?.length && <TabelKisi kisi={hasil.kisi} />}

          {BENTUK.filter((b) => soal.some((s) => s.bentuk === b)).map((b) => (
            <div key={b} className="space-y-4">
              <h2 className="text-lg font-bold">{NAMA_BENTUK[b]}</h2>
              {soal.map(
                (s, i) =>
                  s.bentuk === b && (
                    <KartuSoal
                      key={i}
                      hasilId={id!}
                      no={i + 1}
                      s={s}
                      bab={bab}
                      onUbah={(baru) => {
                        setHasil({ ...hasil, soal: soal.map((x, j) => (j === i ? baru : x)) });
                        cekHasil(id!).then((h) => h && setHasil(h)).catch(() => {}); // kisi-kisi ikut berubah di server
                      }}
                    />
                  ),
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

