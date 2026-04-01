import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
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
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-300 selection:bg-blue-500/30">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <Toaster position="top-right" />
          {children}
        </ThemeProvider>
        
        {/* Midtrans Snap JS */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
