"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { angka, bulat, nilaiAkhir, skorObjektif, totalObjektif, type ButirKunci } from "@/lib/koreksi";
import { HURUF } from "@/lib/ljk";
import { beriTahu, tanya } from "../../tanya";
import { hapusUjian, simpanEsai, simpanLembar } from "../actions";
import { bacaFoto, type HasilFoto } from "../baca-foto";
import { KameraLjk } from "./kamera-ljk";
import { AnalisisButir, TombolExcel } from "./analisis";

type Siswa = { id: number; nomor: number; nama: string; nisn: string | null; jawab: number[][] | null; objektif: number | null; esai: number | null; potong: string | null };
type Ujian = { id: number; nama: string; kelas: string; kunci: ButirKunci[]; esaiMaks: number };
/** Lembar yang sedang diperiksa guru (hasil pindai baru, atau lembar tersimpan yang dibuka lagi). */
type Lembar = { siswaId: number; jawab: number[][]; ragu: boolean[]; potong: string | null; baru: boolean };

// Semua bentuk dijawab huruf A–E di LJK.
const huruf = (j: number[]) => (j.length ? j.map((h) => HURUF[h]).join("") : "–");

/** Satu ujian: daftar siswa urut absen. Pindai → hasil langsung tampil → Simpan & lanjut ke siswa berikutnya. */
export function HalamanUjian({ ujian, siswa: awal }: { ujian: Ujian; siswa: Siswa[] }) {
  const [siswa, setSiswa] = useState(awal);
  const [lembar, setLembar] = useState<Lembar | null>(null);
  const [pilihNo, setPilihNo] = useState<number | null>(null);
  const [membaca, setMembaca] = useState(false);
  const [cari, setCari] = useState("");
  const [kamera, setKamera] = useState(false);
  const target = useRef<number | null>(null);
  const masukan = useRef<HTMLInputElement>(null);
  const { kunci, esaiMaks } = ujian;
  const maks = totalObjektif(kunci) + esaiMaks;

  // Kamera langsung (tahap 3) bila browser mengizinkan (hanya di https); selain itu kamera bawaan HP.
  function pindai(siswaId: number) {
    target.current = siswaId;
    if (typeof navigator.mediaDevices?.getUserMedia === "function") setKamera(true);
    else pakaiFoto();
  }

  function pakaiFoto() {
    setKamera(false);
    masukan.current?.click(); // harus langsung dari ketukan guru (aturan browser)
  }

  async function fotoDipilih(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setMembaca(true);
    const r = await bacaFoto(f);
    setMembaca(false);
    tampilkan(r);
  }

  function tampilkan(r: HasilFoto) {
    setKamera(false);
    if (!r.ok) return beriTahu(r.pesan, "LJK belum terbaca");
    const jawab = kunci.map((_, i) => r.jawab[i].pilih);
    setPilihNo(null);
    setLembar({ siswaId: target.current ?? siswa[0].id, jawab, ragu: kunci.map((_, i) => r.jawab[i].ragu), potong: r.potong, baru: true });
  }

  function buka(s: Siswa) {
    if (!s.jawab) return pindai(s.id);
    setPilihNo(null);
    setLembar({ siswaId: s.id, jawab: s.jawab, ragu: kunci.map(() => false), potong: s.potong, baru: false });
  }

  function simpan() {
    if (!lembar) return;
    const l = lembar;
    const nama = siswa.find((s) => s.id === l.siswaId)?.nama ?? "";
    const objektif = skorObjektif(kunci, l.jawab).skor;
    setSiswa((d) => d.map((s) => (s.id === l.siswaId ? { ...s, jawab: l.jawab, objektif, potong: l.potong } : s)));
    setLembar(null);
    setCari("");
    simpanLembar(ujian.id, l.siswaId, l.jawab, l.potong)
      .then((r) => !r.ok && beriTahu(`${nama}: ${r.pesan}`, "Belum tersimpan"))
      .catch(() => beriTahu(`Nilai ${nama} belum tersimpan (koneksi terputus). Buka lagi namanya lalu Simpan.`, "Belum tersimpan"));
  }

  async function esai(s: Siswa, teks: string) {
    const nilai = teks.trim() === "" ? null : Number(teks.replace(",", "."));
    if (nilai === s.esai) return;
    if (nilai !== null && !(nilai >= 0 && nilai <= esaiMaks)) return beriTahu(`Nilai esai ${s.nama} harus 0–${esaiMaks}.`);
    setSiswa((d) => d.map((x) => (x.id === s.id ? { ...x, esai: nilai } : x)));
    const r = await simpanEsai(ujian.id, s.id, nilai).catch(() => ({ ok: false as const, pesan: "Koneksi terputus." }));
    if (!r.ok) beriTahu(`Esai ${s.nama}: ${r.pesan}`, "Belum tersimpan");
  }

  async function hapus() {
    if (!(await tanya(`Hapus ujian "${ujian.nama}" beserta nilainya dari daftar?`, { judul: "Hapus ujian", ya: "Hapus", bahaya: true }))) return;
    const r = await hapusUjian(ujian.id);
    if (r.ok) location.assign("/koreksi");
    else beriTahu(r.pesan ?? "");
  }

  // Tumpukan LJK di lapangan acak: guru membaca nama di LJK lalu mencarinya di sini.
  const kata = cari.trim().toLowerCase();
  const tampil = kata ? siswa.filter((s) => s.nama.toLowerCase().includes(kata) || String(s.nomor) === kata) : siswa;
  const dipindai = siswa.filter((s) => s.jawab).length;
  const akhir = siswa.map((s) => nilaiAkhir(s.objektif, s.esai)).filter((n): n is number => n !== null);
  const rata = akhir.length ? bulat(akhir.reduce((a, b) => a + b, 0) / akhir.length) : null;

  return (
    <div className="space-y-4">
      <input ref={masukan} type="file" accept="image/*" capture="environment" className="hidden" onChange={fotoDipilih} />
      <div>
        <Link href="/koreksi" className="-ml-2 mb-1 inline-flex h-10 items-center gap-1 rounded-lg pr-3 pl-1.5 text-pudar hover:bg-krem-sorot hover:text-tinta max-md:min-h-11">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Semua ujian
        </Link>
        <h1 className="text-2xl">{ujian.nama}</h1>
        <p className="text-sm text-pudar">
          {ujian.kelas} · {dipindai} dari {siswa.length} dipindai{rata !== null && ` · rata-rata ${angka(rata)}`} · nilai maks {angka(maks)}
        </p>
        {dipindai > 0 && (
          <div className="mt-3">
            <TombolExcel ujian={ujian} siswa={siswa} />
          </div>
        )}
      </div>

      <div className="sticky top-0 z-10 -mx-1 bg-krem/95 px-1 py-2">
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama di LJK…"
          aria-label="Cari nama siswa"
          className="h-11 w-full rounded-lg border bg-kartu px-3 text-base"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-kartu">
        <div className="grid grid-cols-[2rem_1fr_3rem_4rem_3rem] items-center gap-2 border-b px-3 py-2 text-xs text-pudar">
          <span>No</span><span>Nama</span><span className="text-right">Pilihan</span><span className="text-center">Esai</span><span className="text-right">Nilai</span>
        </div>
        {!tampil.length && <p className="px-3 py-4 text-sm text-pudar">Tidak ada nama “{cari.trim()}” di {ujian.kelas}.</p>}
        {tampil.map((s, i) => {
          const n = nilaiAkhir(s.objektif, s.esai);
          return (
            <div key={s.id} className={`grid grid-cols-[2rem_1fr_3rem_4rem_3rem] items-center gap-2 border-b px-3 py-1.5 last:border-b-0`}>
              <span className="text-sm text-pudar">{s.nomor}</span>
              <button onClick={() => buka(s)} className="truncate py-1.5 text-left hover:underline" title={s.jawab ? "Lihat / betulkan lembar" : "Pindai LJK siswa ini"}>
                {s.nama}
              </button>
              <span className="text-right">{s.objektif !== null ? angka(s.objektif) : <span className="text-pudar">–</span>}</span>
              <input
                key={`${s.id}-${s.esai}`}
                defaultValue={s.esai ?? ""}
                inputMode="decimal"
                aria-label={`Esai ${s.nama}`}
                data-esai={i}
                onBlur={(e) => esai(s, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const lanjut = document.querySelector<HTMLInputElement>(`[data-esai="${i + 1}"]`);
                  if (lanjut) lanjut.focus();
                  else e.currentTarget.blur();
                }}
                className="h-9 w-full rounded-lg border bg-kartu px-2 text-center"
              />
              <b className="text-right">{n !== null ? angka(n) : <span className="font-normal text-pudar">–</span>}</b>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-pudar">Cari nama yang tertulis di LJK, ketuk namanya, kamera terbuka. Nama yang sudah dipindai: ketuk untuk melihat atau membetulkan. Nilai esai: ketik lalu Enter, otomatis tersimpan.</p>
      <AnalisisButir kunci={kunci} siswa={siswa} />
      <button onClick={hapus} className="text-sm text-bahaya hover:underline">Hapus ujian</button>

      {kamera && (
        <KameraLjk nama={siswa.find((s) => s.id === target.current)?.nama ?? ""} hasil={tampilkan} batal={() => setKamera(false)} pakaiFoto={pakaiFoto} />
      )}
      {membaca && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-tinta/40">
          <p className="rounded-xl bg-krem px-6 py-4 font-semibold">Membaca LJK…</p>
        </div>
      )}

      {lembar && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-tinta/40 sm:items-center" onClick={() => setLembar(null)}>
          <div className="max-h-[95dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-krem p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {lembar.potong && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/jpeg;base64,${lembar.potong}`} alt="Tulisan nama di LJK" className="w-full rounded-lg border bg-kartu" />
            )}
            <label className="block text-sm">
              <span className="text-pudar">LJK milik</span>
              <select value={lembar.siswaId} onChange={(e) => setLembar({ ...lembar, siswaId: Number(e.target.value) })} className="mt-1 h-11 w-full rounded-lg border bg-kartu px-3 text-base">
                {siswa.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nomor}. {s.nama}
                    {s.jawab && s.id !== lembar.siswaId ? " (sudah dipindai)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {(() => {
              const { skor, bagian } = skorObjektif(kunci, lembar.jawab);
              const sebagian = bagian.filter((b) => b > 0 && b < 1).length;
              const ragu = lembar.ragu.filter(Boolean).length;
              return (
                <>
                  <p>
                    <b className="text-3xl">{bagian.filter((b) => b === 1).length}</b>
                    <span className="text-sm text-pudar"> dari {kunci.length} benar{sebagian > 0 && ` (+${sebagian} benar sebagian)`} · skor pilihan {angka(skor)} dari {angka(totalObjektif(kunci))}</span>
                  </p>
                  {ragu > 0 && <p className="text-sm text-peringatan">{ragu} nomor kuning perlu dicek: ketuk nomornya, lalu pilih jawaban yang benar.</p>}
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                    {kunci.map((_, n) => (
                      <button
                        key={n}
                        onClick={() => setPilihNo(pilihNo === n ? null : n)}
                        className={`rounded-md border px-1 py-1.5 text-sm ${pilihNo === n ? "ring-2 ring-tinta" : ""} ${
                          lembar.ragu[n] ? "border-peringatan-garis bg-peringatan-muda text-peringatan" : bagian[n] === 1 ? "border-hijau bg-hijau-muda text-hijau-teks" : bagian[n] > 0 ? "border-hijau bg-kartu text-hijau-teks" : "border-bahaya-garis bg-bahaya-muda text-bahaya"
                        }`}
                      >
                        <span className="text-xs">{n + 1}.</span> <b>{huruf(lembar.jawab[n])}</b>{bagian[n] > 0 && bagian[n] < 1 && <span className="text-xs"> {bagian[n] === 0.5 ? "½" : `${Math.round(bagian[n] * 100)}%`}</span>}
                      </button>
                    ))}
                  </div>
                  {pilihNo !== null && (
                    <div className="space-y-2 rounded-lg border bg-kartu p-3">
                      <p className="text-sm">
                        Nomor {pilihNo + 1} · kunci <b>{huruf(kunci[pilihNo].kunci)}</b>
                        {kunci[pilihNo].bentuk === "PGK" && <span className="text-pudar"> (boleh lebih dari satu)</span>}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {HURUF.map((h, i) => {
                          const dipilih = lembar.jawab[pilihNo].includes(i);
                          return (
                            <button
                              key={h}
                              onClick={() => {
                                const lama = lembar.jawab[pilihNo];
                                const baru = kunci[pilihNo].bentuk === "PGK" ? (dipilih ? lama.filter((x) => x !== i) : [...lama, i].sort()) : dipilih ? [] : [i];
                                setLembar({ ...lembar, jawab: lembar.jawab.map((j, n) => (n === pilihNo ? baru : j)), ragu: lembar.ragu.map((r, n) => (n === pilihNo ? false : r)) });
                              }}
                              className={`h-10 rounded-full border px-3 ${dipilih ? "border-hijau bg-hijau text-white" : "bg-kartu"}`}
                            >
                              {h}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setLembar({ ...lembar, jawab: lembar.jawab.map((j, n) => (n === pilihNo ? [] : j)), ragu: lembar.ragu.map((r, n) => (n === pilihNo ? false : r)) })}
                          className="h-10 rounded-full border bg-kartu px-3 text-pudar"
                        >
                          Kosong
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="flex gap-2">
              <button onClick={() => setLembar(null)} className="h-12 rounded-xl border bg-kartu px-4">Batal</button>
              {!lembar.baru && (
                <button onClick={() => pindai(lembar.siswaId)} className="h-12 rounded-xl border bg-kartu px-4">Pindai ulang</button>
              )}
              <button onClick={simpan} className="h-12 flex-1 rounded-xl bg-hijau font-semibold text-white hover:bg-hijau-tua">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
