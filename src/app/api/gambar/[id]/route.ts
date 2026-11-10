import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gambar } from "@/db/schema";
import { bolehAkses } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/sesi";

// Tampilkan satu gambar materi/soal: /api/gambar/12. Hanya pemiliknya atau admin (aturan 3); gambar guru lain = 404.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const saya = await penggunaSaatIni();
  if (!saya) return new Response("Silakan masuk terlebih dahulu.", { status: 401 });
  const id = Number((await params).id);
  const [g] = Number.isInteger(id) && id > 0 ? await db.select({ guruId: gambar.guruId, data: gambar.data }).from(gambar).where(eq(gambar.id, id)) : [];
  if (!g || !bolehAkses(g.guruId, saya)) return new Response("Gambar tidak ditemukan.", { status: 404 });
  return new Response(new Uint8Array(g.data), {
    headers: {
      "Content-Type": "image/jpeg",
      // Isi gambar tidak pernah berubah. "private": hanya browser guru yang menyimpan, bukan cache depan hosting.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
