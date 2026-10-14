import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";
import { DAFTAR_BAB } from "@/data";
import type { Pengaturan } from "@/lib/prompt";
import type { Soal } from "@/lib/soal";
import { buatWordKunci, buatWordSoal } from "@/lib/word";

// Unduh Word: /api/word?id=6&jenis=soal (lembar siswa) atau jenis=kunci (pegangan guru).
// ponytail: siapa pun yang tahu id bisa mengunduh. Batasi per guru setelah ada login (langkah 5).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const jenis = url.searchParams.get("jenis") === "kunci" ? "kunci" : "soal";

  const [h] = Number.isInteger(id) ? await db.select().from(hasilSoal).where(eq(hasilSoal.id, id)) : [];
  const bab = h && DAFTAR_BAB[h.babId];
  if (!h || h.status !== "selesai" || !bab) return new Response("Set soal tidak ditemukan atau belum selesai.", { status: 404 });

  const p = h.pengaturan as Pengaturan;
  const buat = jenis === "kunci" ? buatWordKunci : buatWordSoal;
  const isi = await buat(h.soal as Soal[], bab, p, h.dibuat);
  const nama = `${jenis === "kunci" ? "Kunci" : "Soal"} ${p.tujuan} ${bab.judul.split(":")[0]} (set ${id}).docx`;

  return new Response(new Uint8Array(isi), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nama}"`,
      "Cache-Control": "no-store", // hosting punya cache depan; selalu ambil versi terbaru
    },
  });
}
