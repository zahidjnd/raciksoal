// Dijalankan sekali saat server menyala: terapkan migrasi database di folder drizzle/.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { db } = await import("@/db");
    // Catatan migrasi di schema public: user database cPanel belum tentu boleh membuat schema baru.
    await migrate(db, { migrationsFolder: "drizzle", migrationsSchema: "public" });
    console.log("Migrasi database selesai");
  } catch (e) {
    // Drizzle membungkus error asli PostgreSQL di `cause`; tampilkan supaya penyebabnya jelas.
    const err = e as Error;
    console.error("Migrasi database gagal:", (err.cause as Error)?.message ?? err.message);
  }
}
