"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Building2, ArrowRight, ShieldCheck, MapPin,
  Wallet, Leaf, Clock, Phone, Mail
} from "lucide-react";

export default function LandingPage() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  // Parallax effect for hero background
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: ShieldCheck, title: "Keamanan 24 Jam", desc: "Sistem keamanan terpadu dengan CCTV dan petugas jaga 24/7 untuk ketenangan Anda." },
    { icon: Wallet, title: "Harga Terjangkau", desc: "Sewa bulanan mulai dari Rp 320.000 dengan fasilitas lengkap & subsidi pemerintah." },
    { icon: MapPin, title: "Lokasi Strategis", desc: "Akses mudah ke pusat kota, pasar, stasiun, dan transportasi umum Cimahi." },
    { icon: Leaf, title: "Lingkungan Asri", desc: "Area terbuka hijau, sanitasi bersih, dan pengelolaan sampah yang teratur." },
  ];

  const locations = [
    {
      name: "Rusunawa Cigugur Tengah",
      price: "Rp 320.000",
      buildings: 4, floors: 4,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      mapUrl: "#"
    },
    {
      name: "Rusunawa Cibeureum",
      price: "Rp 340.000",
      buildings: 4, floors: 5,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      mapUrl: "#"
    },
    {
      name: "Rusunawa Leuwigajah",
      price: "Rp 355.000",
      buildings: 3, floors: 5,
      image: "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&q=80",
      mapUrl: "#"
    },
  ];

  return (
    <div className="bg-slate-950 min-h-screen text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Header / Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Rusunawa Cimahi</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#tentang" className="text-sm font-medium hover:text-white transition-colors">Tentang</a>
            <a href="#fasilitas" className="text-sm font-medium hover:text-white transition-colors">Fasilitas</a>
            <a href="#lokasi" className="text-sm font-medium hover:text-white transition-colors">Lokasi</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium hover:text-white transition-colors">
              Masuk Portal
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
              Daftar Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950 z-10" />
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070"
            alt="Background Rusunawa"
            className="w-full h-full object-cover object-center opacity-40"
          />
        </motion.div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              Pemkot Cimahi — Dinas Perumahan dan Kawasan Permukiman
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
              Hunian Nyaman, Terjangkau & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Strategis</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Akses hunian layak huni yang dikelola secara profesional dengan keamanan terjamin, lingkungan asri, dan fasilitas lengkap di pusat Kota Cimahi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#lokasi" className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-full font-semibold transition-transform hover:scale-105">
                Lihat Lokasi & Harga
              </a>
              <Link href="/login" className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/10 px-8 py-4 rounded-full font-semibold transition-all backdrop-blur-sm">
                Akses Portal Penghuni
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fasilitas" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mengapa Memilih Rusunawa Cimahi?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Kami berkomitmen memberikan fasilitas hunian vertikal terbaik untuk masyarakat berpenghasilan rendah dengan kualitas pengelolan modern.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 p-8 rounded-3xl transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="lokasi" className="py-24 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Daftar Rusunawa</h2>
              <p className="text-slate-400 max-w-xl">Pilih lokasi hunian yang paling sesuai dengan aktivitas dan kebutuhan Anda. Masing-masing lokasi dilengkapi area parkir luas dan fasilitas umum.</p>
            </div>
            <Link href="/login" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium">
              Lihat Ketersediaan Kamar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {locations.map((loc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                  <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 relative z-20 -mt-10">
                  <div className="bg-blue-600 inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4">
                    Mulai {loc.price} /bln
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{loc.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {loc.buildings} Gedung</span>
                    <span className="flex items-center gap-1.5"><ArrowRight className="w-4 h-4" /> {loc.floors} Lantai</span>
                  </div>
                  <a href={loc.mapUrl} className="block text-center w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium transition-colors">
                    Lihat di Peta
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Pre-footer */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Siap Menjadi Penghuni?</h2>
          <p className="text-lg text-slate-400 mb-10">Daftarkan diri Anda sekarang atau masuk ke portal untuk melihat informasi pendaftaran dan persyaratannya.</p>
          <Link href="/login" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 shadow-xl shadow-blue-500/25">
            Daftar Akun Sekarang
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold tracking-tight">Rusunawa Cimahi</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              Layanan pengelola rumah susun sewa sederhana tersistem. Hadir untuk kesejahteraan hunian masyarakat Cimahi.
            </p>
            <p className="text-slate-500 text-xs text-balance">
              © {new Date().getFullYear()} Pemerintah Kota Cimahi. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Tautan</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#tentang" className="hover:text-blue-400">Tentang Kami</a></li>
              <li><a href="#fasilitas" className="hover:text-blue-400">Fasilitas</a></li>
              <li><a href="#lokasi" className="hover:text-blue-400">Lokasi & Tarif</a></li>
              <li><Link href="/login" className="hover:text-blue-400">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Kontak</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-3"><Phone className="w-4 h-4" /> (022) 1234567</li>
              <li className="flex items-center gap-3"><Mail className="w-4 h-4" /> info@rusunawacimahi.go.id</li>
              <li className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /> Jl. Raden Demang Hardjakusumah, Kota Cimahi</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
