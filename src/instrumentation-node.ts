// Terapkan migrasi database di folder drizzle/. Hanya dimuat di server Node (lihat instrumentation.ts).
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal } from "@/db/schema";

try {
  // Catatan migrasi di schema public: user database cPanel belum tentu boleh membuat schema baru.
  await migrate(db, { migrationsFolder: "drizzle", migrationsSchema: "public" });
  console.log("Migrasi database selesai");
} catch (e) {
  // Drizzle membungkus error asli PostgreSQL di `cause`; tampilkan supaya penyebabnya jelas.
  const err = e as Error;
  console.error("Migrasi database gagal:", (err.cause as Error)?.message ?? err.message);
}

try {
  // Pembuatan soal berjalan di dalam proses server ini (`kerjakan`, actions.ts). Server baru menyala = proses lama
  // sudah mati, jadi set yang masih "proses" tidak akan pernah selesai: tandai gagal supaya guru tidak menunggu
  // selamanya dan jatah hariannya kembali (set gagal tidak dihitung).
  const macet = await db
    .update(hasilSoal)
    .set({ status: "gagal", pesan: "Terhenti karena server dinyalakan ulang saat soal sedang dibuat." })
    .where(eq(hasilSoal.status, "proses"))
    .returning({ id: hasilSoal.id });
  if (macet.length) console.log(`Set macet ditandai gagal: ${macet.map((m) => m.id).join(", ")}`);
} catch (e) {
  console.error("Gagal membersihkan set macet:", (e as Error).message);
}
