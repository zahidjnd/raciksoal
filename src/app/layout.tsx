import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import "./globals.css";

// Font Arab (aturan 7). Diunduh saat build, lalu disajikan dari server sendiri.
const amiri = Amiri({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-arab" });

// Jangan simpan halaman di cache hosting, supaya setelah deploy tidak tampil versi lama.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Racik Soal",
  description: "Pembuatan soal berbasis AI untuk guru madrasah",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={amiri.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
