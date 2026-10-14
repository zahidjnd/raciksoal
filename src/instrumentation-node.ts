// Terapkan migrasi database di folder drizzle/. Hanya dimuat di server Node (lihat instrumentation.ts).
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/db";

try {
  // Catatan migrasi di schema public: user database cPanel belum tentu boleh membuat schema baru.
  await migrate(db, { migrationsFolder: "drizzle", migrationsSchema: "public" });
  console.log("Migrasi database selesai");
} catch (e) {
  // Drizzle membungkus error asli PostgreSQL di `cause`; tampilkan supaya penyebabnya jelas.
  const err = e as Error;
  console.error("Migrasi database gagal:", (err.cause as Error)?.message ?? err.message);
}
