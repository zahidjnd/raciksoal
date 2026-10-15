// Login guru (Better Auth). Hanya dipakai di server.
// Butuh di .env: BETTER_AUTH_SECRET (kunci rahasia acak), BETTER_AUTH_URL (alamat web), ADMIN_USERNAME.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "@/db";
import { akunLogin, pengguna, sesi, verifikasi } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: pengguna, session: sesi, account: akunLogin, verification: verifikasi },
  }),
  // Tidak ada pendaftaran bebas: akun guru dibuat admin (langkah 5b).
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 hari tetap masuk
    updateAge: 60 * 60 * 24, // masa berlaku diperpanjang sekali sehari selama dipakai
  },
  plugins: [username(), admin(), nextCookies()], // nextCookies harus terakhir (menyimpan cookie dari server action)
});

export type Pengguna = { id: string; nama: string; username: string; peran: "admin" | "guru" };
