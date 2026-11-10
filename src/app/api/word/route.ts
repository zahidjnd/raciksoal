import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { babDariSet, dataGambar } from "@/lib/bab";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";
import { ambilNamaMadrasah } from "@/lib/sekolah";
import { namaTujuan, type Pengaturan } from "@/lib/prompt";
import { identitasBab, type BarisKisi, type Soal } from "@/lib/soal";
import { buatWordKisi, buatWordKunci, buatWordSoal } from "@/lib/word";
import { headerUnduh } from "@/lib/nama-file";
import { bacaPaket, susunPaket } from "@/lib/paket";

const NAMA_FILE = { soal: "Soal", kunci: "Kunci", kisi: "Kisi-kisi" } as const;

// Unduh Word: /api/word?id=6&jenis=soal (lembar siswa), jenis=kunci atau jenis=kisi (pegangan guru).
// &paket=A..D (bila guru memilih beberapa paket): soal/kunci disusun per paket (paket.ts); kisi-kisi tetap urutan Paket A.
// Hanya pemilik set atau admin (aturan 3).
export async function GET(req: Request) {
  const saya = await penggunaSaatIni();
  if (!saya) return new Response("Silakan masuk terlebih dahulu.", { status: 401 });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const diminta = url.searchParams.get("jenis");
  const jenis = diminta === "kunci" || diminta === "kisi" ? diminta : "soal";

  const [h] = Number.isInteger(id) ? await db.select().from(hasilSoal).where(eq(hasilSoal.id, id)) : [];
  const bab = h && babDariSet(h);
  if (!h || h.dihapus || !bolehAkses(h.guruId, saya) || h.status !== "selesai" || !bab) {
    return new Response("Set soal tidak ditemukan atau belum selesai.", { status: 404 });
  }

  const p = h.pengaturan as Pengaturan;
  const adaPaket = url.searchParams.has("paket") && jenis !== "kisi";
  const paket = bacaPaket(url.searchParams.get("paket"));
  const susunan = susunPaket(h.soal as Soal[], id, adaPaket ? paket : "A");
  const kisi = h.kisi as BarisKisi[] | null;
  if (jenis === "kisi" && !kisi?.length) return new Response("Set soal ini dibuat sebelum ada fitur kisi-kisi.", { status: 404 });
  const isi =
    jenis === "kisi"
      ? await buatWordKisi(kisi!, bab, p, h.dibuat)
      : jenis === "kunci"
        ? await buatWordKunci(susunan.soal, bab, p, h.dibuat, adaPaket ? paket : undefined, susunan.asal)
        : await buatWordSoal(
            susunan.soal, bab, p, h.dibuat, await ambilNamaMadrasah(), adaPaket ? paket : undefined,
            // Gambar milik pemilik set saja (aturan 3), bukan milik yang mengunduh (admin boleh mengunduh set guru).
            h.guruId ? await dataGambar(susunan.soal.map((s) => Number(s.gambar_id)), h.guruId) : new Map(),
          );
  const nama = `${NAMA_FILE[jenis]}${adaPaket ? ` Paket ${paket}` : ""} ${h.nama ?? `${namaTujuan(p.tujuan, identitasBab(bab).mapel)} ${bab.judul.split(":")[0]}`} (set ${id}).docx`;

  return new Response(new Uint8Array(isi), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": headerUnduh(nama), // judul bab bisa berhuruf Arab: tidak boleh langsung masuk header
      "Cache-Control": "no-store", // hosting punya cache depan; selalu ambil versi terbaru
    },
  });
}
