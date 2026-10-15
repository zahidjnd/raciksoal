import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Pintu masuk Better Auth (cek sesi, keluar, dll.).
export const { GET, POST } = toNextJsHandler(auth);
