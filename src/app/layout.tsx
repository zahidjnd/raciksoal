import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Racik Soal",
  description: "Pembuatan soal berbasis AI untuk guru madrasah",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
