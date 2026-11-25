import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Amiri, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { KakiTanzil } from "./kaki-tanzil";
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
  description: "Pembuatan soal berbasis AI untuk guru MA Al-Fatah",
  // Bukti kepemilikan untuk Google Search Console (bukan rahasia).
  verification: { google: "snzqKTN6gve9u_QtD4_964TyvgT54P0g-hMufeoWFxE" },
};

/** Warna bilah status HP = warna bilah atas aplikasi (krem-tua), ikut mode gelap. TombolTema mengganti nilainya langsung. */
export async function generateViewport(): Promise<Viewport> {
  const gelap = (await cookies()).get("tema")?.value === "gelap";
  return { themeColor: gelap ? "#1f1e1d" : "#f4f3ee" };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Mode gelap dipasang dari server (cookie `tema`, diatur TombolTema), jadi tidak ada kedipan putih saat halaman dibuka.
  const gelap = (await cookies()).get("tema")?.value === "gelap";
  return (
    <html lang="id" data-tema={gelap ? "gelap" : undefined} className={`${amiri.variable} ${jakarta.variable} ${serif.variable}`}>
      <body className="antialiased">
        {children}
        <KakiTanzil />
      </body>
    </html>
  );
}
