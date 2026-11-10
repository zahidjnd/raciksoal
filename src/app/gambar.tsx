"use client";

// Gambar materi/soal di browser (0.30.0): dikecilkan & diubah jadi JPEG di perangkat guru, baru diunggah (unggahGambar).
import { unggahGambar } from "./actions";
import { BATAS_GAMBAR } from "@/lib/gambar";

export const urlGambar = (id: number) => `/api/gambar/${id}`;

/**
 * Kecilkan (sisi terpanjang <= 1280 px) lalu jadikan JPEG; latar putih supaya PNG transparan tidak jadi hitam.
 * Masih kebesaran → dikecilkan lagi sampai muat batas server.
 */
async function kecilkan(blob: Blob): Promise<string> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob);
  } catch {
    throw new Error("Format gambar ini tidak bisa dibaca. Pakai JPG atau PNG.");
  }
  let sisi = BATAS_GAMBAR.sisi;
  let mutu = 0.85;
  for (let coba = 0; coba < 5; coba++) {
    const skala = Math.min(1, sisi / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * skala));
    c.height = Math.max(1, Math.round(bmp.height * skala));
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", mutu);
    if ((url.length - 23) * 0.75 <= BATAS_GAMBAR.bita) return url;
    sisi = Math.round(sisi * 0.8);
    mutu = 0.75;
  }
  throw new Error("Gambar terlalu besar. Potong atau kecilkan dulu.");
}

/** Kecilkan lalu unggah satu gambar; mengembalikan id-nya, atau melempar Error berbahasa Indonesia. */
export async function unggah(blob: Blob): Promise<number> {
  const r = await unggahGambar(await kecilkan(blob)).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
  if (!r.ok) throw new Error(r.pesan);
  return r.id;
}

/** File gambar yang ditempel (Ctrl+V). Kosong → biarkan tempel teks berjalan seperti biasa. */
export function gambarTempelan(e: React.ClipboardEvent) {
  const daftar = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
  if (daftar.length) e.preventDefault();
  return daftar;
}

export function Gambar({ id, alt, className = "" }: { id: number; alt?: string; className?: string }) {
  // Gambar dari rute sendiri (dicek pemiliknya), jadi <img> biasa cukup; next/image tidak perlu.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={urlGambar(id)} alt={alt || "Gambar"} loading="lazy" className={className} />;
}

/** Tombol pilih file gambar (boleh beberapa sekaligus). */
export function TombolGambar({ label, disabled, banyak = true, onPilih }: { label: string; disabled?: boolean; banyak?: boolean; onPilih: (f: File[]) => void }) {
  return (
    <label className={`inline-flex h-8 cursor-pointer items-center rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11 focus-within:ring-2 focus-within:ring-hijau ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={banyak}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = [...(e.target.files ?? [])];
          e.target.value = "";
          if (f.length) onPilih(f);
        }}
      />
    </label>
  );
}
