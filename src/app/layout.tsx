import type { Metadata } from "next";
import { Amiri, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Font Arab (aturan 7). Diunduh saat build, lalu disajikan dari server sendiri.
const amiri = Amiri({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-arab" });
// Font Latin (DESIGN.md): buatan desainer Indonesia, jelas di layar kecil.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-latin" });
// Font judul & sapaan (DESIGN.md): serif gratis, padanan suasana judul claude.ai.
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-judul" });

// Jangan simpan halaman di cache hosting, supaya setelah deploy tidak tampil versi lama.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Racik Soal",
  description: "Pembuatan soal berbasis AI untuk guru madrasah",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${amiri.variable} ${jakarta.variable} ${serif.variable}`}>
      <body className="antialiased">
        {children}
        {/* Wajib menurut ketentuan pemakaian teks Tanzil (langkah 9). */}
        <footer className="py-4 text-center text-xs text-pudar">
          Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a>
        </footer>
      </body>
    </html>
  );
}
