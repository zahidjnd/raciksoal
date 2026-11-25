"use client";

import { useState } from "react";
import { bacaLjk, hitungBenar, HURUF, keAbu, LJK, potong, type Jawab } from "@/lib/ljk";

type Hasil = { nama: string; ms: number; pesan?: string; jawab?: Jawab[]; potongNama?: string };

const SISI = 1600; // foto dikecilkan dulu: cukup tajam untuk bulatan, tetap cepat di HP

async function baca(file: File): Promise<Hasil> {
  const t0 = performance.now();
  const bmp = await createImageBitmap(file);
  const f = Math.min(1, SISI / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * f), h = Math.round(bmp.height * f);
  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  const g = keAbu(ctx.getImageData(0, 0, w, h).data, w, h);
  const r = bacaLjk(g);
  const ms = Math.round(performance.now() - t0);
  if (!r.ok) return { nama: file.name, ms, pesan: r.pesan };
  const n = potong(g, r.H, LJK.nama, 520);
  const k2 = document.createElement("canvas");
  k2.width = n.w;
  k2.height = n.h;
  const img = k2.getContext("2d")!.createImageData(n.w, n.h);
  n.d.forEach((v, i) => img.data.set([v, v, v, 255], i * 4));
  k2.getContext("2d")!.putImageData(img, 0, 0);
  return { nama: file.name, ms, jawab: r.jawab, potongNama: k2.toDataURL("image/jpeg", 0.7) };
}

export function CobaBaca() {
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const [sibuk, setSibuk] = useState(false);
  const [kunci, setKunci] = useState("");
  const kunciIdx = kunci.toUpperCase().replace(/[^A-E-]/g, "").split("").map((h) => (h === "-" ? null : HURUF.indexOf(h)));

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    if (!files.length) return;
    setSibuk(true);
    const baru: Hasil[] = [];
    for (const f of files) baru.push(await baca(f).catch(() => ({ nama: f.name, ms: 0, pesan: "Foto tidak bisa dibuka." })));
    setHasil(baru);
    setSibuk(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-kartu p-4">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-hijau px-4 text-sm text-white hover:bg-hijau-tua">
          {sibuk ? "Membaca…" : "Pilih foto LJK"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={pilih} disabled={sibuk} />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="shrink-0 text-pudar">Kunci (boleh kosong)</span>
          <input
            value={kunci}
            onChange={(e) => setKunci(e.target.value)}
            placeholder="ABCDE… satu huruf per nomor"
            className="h-10 min-w-0 flex-1 rounded-lg border bg-kartu px-3 font-mono uppercase"
          />
        </label>
      </div>

      {hasil.map((h, i) => (
        <section key={i} className="space-y-3 rounded-xl border bg-kartu p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <b className="truncate">{h.nama}</b>
            <span className="text-pudar">{h.ms} md</span>
          </div>
          {h.pesan && <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm text-peringatan">{h.pesan}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {h.potongNama && <img src={h.potongNama} alt="Tulisan nama siswa" className="w-full max-w-md rounded border" />}
          {h.jawab && (
            <>
              {kunciIdx.length > 0 && (
                <p className="text-lg">
                  <b>{hitungBenar(h.jawab, kunciIdx)}</b>
                  <span className="text-sm text-pudar"> benar dari {kunciIdx.filter((k) => k !== null).length} nomor</span>
                </p>
              )}
              <div className="grid grid-cols-5 gap-1.5 text-sm sm:grid-cols-8">
                {h.jawab.map((j, n) => {
                  const k = kunciIdx[n];
                  const benar = k !== undefined && k !== null && j.pilih.length === 1 && j.pilih[0] === k;
                  const warna = j.ragu
                    ? "border-peringatan-garis bg-peringatan-muda text-peringatan"
                    : k !== undefined && k !== null
                      ? benar
                        ? "border-hijau bg-hijau-muda text-hijau-teks"
                        : "border-bahaya-garis bg-bahaya-muda text-bahaya"
                      : "bg-kartu";
                  return (
                    <div key={n} className={`rounded-md border px-1.5 py-1 text-center ${warna}`} title={j.hitam.map((v, o) => `${HURUF[o]} ${v}`).join(" · ")}>
                      <span className="text-xs opacity-70">{n + 1}.</span> <b>{j.pilih.map((p) => HURUF[p]).join("") || "–"}</b>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-pudar">Kuning = ragu (setengah hitam, dua jawaban, atau coretan): guru yang memutuskan. “–” = kosong.</p>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
