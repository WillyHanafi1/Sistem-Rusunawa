import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rusunawa Cimahi | Hunian Terjangkau & Nyaman",
  description:
    "Sistem Informasi dan Portal Resmi Rusunawa Pemerintah Kota Cimahi. Temukan informasi lokasi, harga sewa, dan fasilitas terlengkap.",
  keywords: ["rusunawa cimahi", "rumah susun cimahi", "sewa rusun", "pemkot cimahi"],
  openGraph: {
    title: "Rusunawa Cimahi | Hunian Nyaman & Terjangkau",
    description: "Portal Resmi Rusunawa Pemerintah Kota Cimahi. Informasi lokasi, harga sewa, dan fasilitas terlengkap.",
    url: "https://rusunawa.cimahi.go.id",
    siteName: "Rusunawa Cimahi",
    locale: "id_ID",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
