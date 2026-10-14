import type { Bab } from "@/lib/soal";
import bab3 from "./qurdis11-bab3.json";

// Daftar bab yang datanya sudah terverifikasi. Bab baru: tambahkan file JSON lalu daftarkan di sini.
export const DAFTAR_BAB: Record<string, Bab> = { [bab3.id]: bab3 };
