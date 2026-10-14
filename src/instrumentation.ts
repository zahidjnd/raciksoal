// Dijalankan sekali saat server menyala: terapkan migrasi database di folder drizzle/.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { db } = await import("@/db");
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrasi database selesai");
  } catch (e) {
    console.error("Migrasi database gagal:", (e as Error).message);
  }
}
