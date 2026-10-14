// Dijalankan sekali saat server menyala. Migrasi dipisah ke file sendiri supaya
// tidak ikut disiapkan untuk mode "edge" (yang tidak punya akses file/database).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
