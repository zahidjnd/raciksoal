"use server";

// Koreksi LJK (tahap 2). Aturan 3: setiap aksi memeriksa pemilik ujian (admin boleh semua).
// Nilai objektif SELALU dihitung ulang di server dari kunci; kiriman browser hanya jawaban per nomor.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal, nilaiLjk, siswa, ujianLjk } from "@/db/schema";
import { bolehAkses } from "@/lib/akses";
import { kunciDariSet, rapikanJawab, rapikanKunci, skorObjektif, type ButirKunci } from "@/lib/koreksi";
import { penggunaSaatIni } from "@/lib/sesi";
import type { Soal } from "@/lib/soal";

const SESI_HABIS = "Sesi Anda habis. Muat ulang halaman, lalu masuk lagi.";
const TAK_ADA = "Ujian tidak ditemukan.";

async function ujianSaya(id: number) {
  const saya = await penggunaSaatIni();
  if (!saya) return { pesan: SESI_HABIS } as const;
  const [u] = await db.select().from(ujianLjk).where(eq(ujianLjk.id, Number(id) || 0));
  if (!u || u.dihapus || !bolehAkses(u.guruId, saya)) return { pesan: TAK_ADA } as const;
  return { u } as const;
}

export async function buatUjian(input: { nama: string; kelas: string; setId?: number | null; kunci?: ButirKunci[]; esaiMaks?: number }) {
  const saya = await penggunaSaatIni();
  if (!saya) return { ok: false as const, pesan: SESI_HABIS };
  const nama = String(input?.nama ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const kelas = String(input?.kelas ?? "").trim();
  if (!nama) return { ok: false as const, pesan: "Nama ujian wajib diisi." };
  const [ada] = await db.select({ id: siswa.id }).from(siswa).where(and(eq(siswa.kelas, kelas), eq(siswa.aktif, true))).limit(1);
  if (!ada) return { ok: false as const, pesan: "Kelas belum ada di daftar siswa." };

  let kunci: ButirKunci[] | null;
  let esaiMaks: number;
  let setId: number | null = null;
  if (input?.setId) {
    const [h] = await db.select({ guruId: hasilSoal.guruId, dihapus: hasilSoal.dihapus, status: hasilSoal.status, soal: hasilSoal.soal }).from(hasilSoal).where(eq(hasilSoal.id, Number(input.setId)));
    if (!h || h.dihapus || !bolehAkses(h.guruId, saya) || h.status !== "selesai") return { ok: false as const, pesan: "Set soal tidak ditemukan." };
    const r = kunciDariSet((h.soal as Soal[]) ?? []);
    if ("pesan" in r) return { ok: false as const, pesan: r.pesan };
    ({ kunci, esaiMaks } = r);
    setId = Number(input.setId);
  } else {
    kunci = rapikanKunci(input?.kunci);
    esaiMaks = Number(input?.esaiMaks);
    if (!kunci) return { ok: false as const, pesan: "Kunci belum lengkap: setiap nomor perlu jawaban." };
    if (!(esaiMaks >= 0 && esaiMaks <= 100)) return { ok: false as const, pesan: "Skor esai maksimal harus 0–100." };
  }
  const [baru] = await db.insert(ujianLjk).values({ guruId: saya.id, nama, kelas, setId, kunci, esaiMaks }).returning({ id: ujianLjk.id });
  return { ok: true as const, id: baru.id };
}

export async function hapusUjian(id: number) {
  const r = await ujianSaya(id);
  if ("pesan" in r) return { ok: false as const, pesan: r.pesan };
  await db.update(ujianLjk).set({ dihapus: sql`now()` }).where(eq(ujianLjk.id, r.u.id));
  return { ok: true as const };
}

async function siswaKelas(siswaId: number, kelas: string) {
  const [s] = await db.select({ id: siswa.id }).from(siswa).where(and(eq(siswa.id, Number(siswaId) || 0), eq(siswa.kelas, kelas)));
  return s;
}

/** Hasil pindai satu siswa. `potong` = JPEG potongan nama (base64, tanpa awalan data:), maks ±40 KB. */
export async function simpanLembar(ujianId: number, siswaId: number, jawab: unknown, potong?: string | null) {
  const r = await ujianSaya(ujianId);
  if ("pesan" in r) return { ok: false as const, pesan: r.pesan };
  if (!(await siswaKelas(siswaId, r.u.kelas))) return { ok: false as const, pesan: "Siswa tidak ada di kelas ini." };
  const kunci = r.u.kunci as ButirKunci[];
  const j = rapikanJawab(jawab, kunci.length);
  if (!j) return { ok: false as const, pesan: "Jawaban tidak lengkap. Pindai ulang." };
  let gambar: Buffer | null = null;
  if (potong) {
    gambar = Buffer.from(String(potong), "base64");
    if (gambar.length > 40_000 || gambar[0] !== 0xff || gambar[1] !== 0xd8) gambar = null; // bukan JPEG kecil → abaikan
  }
  const objektif = skorObjektif(kunci, j).skor;
  await db
    .insert(nilaiLjk)
    .values({ ujianId: r.u.id, siswaId: Number(siswaId), jawab: j, objektif, potongNama: gambar })
    .onConflictDoUpdate({ target: [nilaiLjk.ujianId, nilaiLjk.siswaId], set: { jawab: j, objektif, potongNama: gambar, diubah: sql`now()` } });
  return { ok: true as const, objektif };
}

export async function simpanEsai(ujianId: number, siswaId: number, esai: number | null) {
  const r = await ujianSaya(ujianId);
  if ("pesan" in r) return { ok: false as const, pesan: r.pesan };
  if (!(await siswaKelas(siswaId, r.u.kelas))) return { ok: false as const, pesan: "Siswa tidak ada di kelas ini." };
  const e = esai === null || esai === undefined || (esai as unknown) === "" ? null : Number(esai);
  if (e !== null && !(e >= 0 && e <= r.u.esaiMaks)) return { ok: false as const, pesan: `Nilai esai harus 0–${r.u.esaiMaks}.` };
  await db
    .insert(nilaiLjk)
    .values({ ujianId: r.u.id, siswaId: Number(siswaId), esai: e })
    .onConflictDoUpdate({ target: [nilaiLjk.ujianId, nilaiLjk.siswaId], set: { esai: e, diubah: sql`now()` } });
  return { ok: true as const };
}
