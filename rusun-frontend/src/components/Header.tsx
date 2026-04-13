"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

const locations = [
  { name: "Rusunawa Cigugur Tengah", href: "/cigugur-tengah" },
  { name: "Rusunawa Cibeureum", href: "/cibeureum" },
  { name: "Rusunawa Leuwigajah", href: "/leuwigajah" },
];

/**
 * FEATURE_FLAGS
 * Set to true to show the 'Pengurus' (Staff) section and links.
 */
const SHOW_PENGURUS = false;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [lokasiOpen, setLokasiOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLokasiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setLokasiOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";

  const getNavLink = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-4 shadow-sm"
        : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="flex items-center gap-2">
            <div className="relative w-[52px] h-[52px] group-hover:scale-105 transition-transform">
              <Image
                src="/images/logos/logo-cimahi.png"
                alt="Logo Kota Cimahi"
                fill
                sizes="52px"
                className="object-contain"
              />
            </div>
            <div className="relative w-[52px] h-[52px] group-hover:scale-105 transition-transform">
              <Image
                src="/images/logos/logo-rusun.png"
                alt="Logo Rusunawa"
                fill
                sizes="52px"
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-base md:text-lg leading-tight tracking-tight transition-colors ${scrolled ? "text-slate-900 dark:text-white" : "text-white"}`}>
              UPTD Rusunawa
            </span>
            <span className={`font-medium text-[10px] md:text-xs tracking-wide transition-colors ${scrolled ? "text-slate-500 dark:text-slate-400" : "text-white/80"}`}>
              Kota Cimahi
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href={getNavLink("#tentang")}
            className={`text-sm font-medium transition-colors ${scrolled ? "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white" : "text-white/80 hover:text-white"
              }`}
          >
            Tentang
          </Link>
          <Link
            href={getNavLink("#fasilitas")}
            className={`text-sm font-medium transition-colors ${scrolled ? "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white" : "text-white/80 hover:text-white"
              }`}
          >
            Fasilitas
          </Link>

          {/* Dropdown Lokasi */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLokasiOpen(!lokasiOpen)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${scrolled ? "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white" : "text-white/80 hover:text-white"
                }`}
            >
              Lokasi <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${lokasiOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {lokasiOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pilih Lokasi Rusunawa</p>
                  </div>
                  {locations.map((loc) => (
                    <Link
                      key={loc.href}
                      href={loc.href}
                      className="flex items-center px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors"
                    >
                      {loc.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {SHOW_PENGURUS && (
            <Link
              href={getNavLink("#pengurus")}
              className={`text-sm font-medium transition-colors ${scrolled ? "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white" : "text-white/80 hover:text-white"
                }`}
            >
              Pengurus
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className={`hidden md:block text-sm font-medium transition-colors ${scrolled ? "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white" : "text-white/80 hover:text-white"
            }`}>
            Masuk Portal
          </Link>
          <Link
            href="/#lokasi"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group"
          >
            Daftar <span className="hidden sm:inline">Rusunawa</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  );
}
