"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Building2, ArrowRight, ShieldCheck, MapPin,
  Wallet, Leaf, Clock, Phone, Mail, Layers, Users, Wrench, Heart, FileText,
  Shield, Trash2, Headphones, Twitter, Facebook, Instagram
} from "lucide-react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle"; // Adjust path if needed
import api from "@/lib/api";

interface Staff {
  id: number;
  name: string;
  role: string;
  nip?: string;
  tier: number;
  image_url?: string;
  socials?: { [key: string]: string };
}

export default function LandingPage() {
  const { scrollY } = useScroll();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const res = await api.get("/management/public");
        setStaff(res.data);
      } catch (error) {
        console.error("Failed to fetch staff:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, []);

  // Parallax effect for hero background
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
      typeInfo: "Unit Type 21",
      twinblok: "4 Twinblok",
      totalUnit: "192 Total Unit",
      image: "/images/buildings/cigugur.jpg",
      mapUrl: "/cigugur-tengah"
    },
    {
      name: "Rusunawa Cibeureum",
      price: "Rp 340.000",
      typeInfo: "Unit Type 24 dan Type 27",
      twinblok: "4 Twinblok",
      totalUnit: "371 Total Unit",
      image: "/images/buildings/cibeureum.jpg",
      mapUrl: "/cibeureum"
    },
    {
      name: "Rusunawa Leuwigajah",
      price: "Rp 355.000",
      typeInfo: "Unit Type 24",
      twinblok: "3 Twinblok",
      totalUnit: "297 Unit",
      image: "/images/buildings/leuwigajah.jpg",
      mapUrl: "/leuwigajah"
    },
  ];

  const topLeader = staff.find(s => s.tier === 1);
  const subLeaders = staff.filter(s => s.tier === 2);
  const operationalDivisions = staff.filter(s => s.tier === 3);

  const getIconForSubLeader = (role: string) => {
    if (role.toLowerCase().includes("tata usaha")) return ShieldCheck;
    if (role.toLowerCase().includes("bendahara")) return Wallet;
    return Layers;
  };

  const getIconForOps = (name: string) => {
    if (name.toLowerCase().includes("keamanan")) return Shield;
    if (name.toLowerCase().includes("kebersihan")) return Trash2;
    if (name.toLowerCase().includes("teknisi")) return Wrench;
    return Headphones;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-300 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950 z-10" />
          <img
            src="/images/landing/hero-home.jpg"
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
              Pemkot Cimahi — Pengelola UPTD Rusunawa Kota Cimahi
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Mengapa Memilih Rusunawa Cimahi?</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Kami berkomitmen memberikan fasilitas hunian vertikal terbaik untuk masyarakat berpenghasilan rendah dengan kualitas pengelolan modern.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl dark:hover:bg-white/10 p-8 rounded-3xl transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feat.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="lokasi" className="py-24 bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Daftar Rusunawa</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl">Pilih lokasi hunian yang paling sesuai dengan aktivitas dan kebutuhan Anda. Masing-masing lokasi dilengkapi area parkir luas dan fasilitas umum.</p>
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all dark:hover:shadow-blue-500/10"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                  <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 relative z-20 -mt-10">
                  <div className="bg-blue-600 inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4">
                    Mulai {loc.price} /bln
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{loc.name}</h3>
                  <div className="flex flex-col gap-2.5 text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> {loc.twinblok}</span>
                    <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> {loc.typeInfo}</span>
                    <span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> {loc.totalUnit}</span>
                  </div>
                  <Link href={loc.mapUrl} className="block text-center w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white font-medium transition-colors">
                    Daftar Rusunawa
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Profil Section (Center-Balanced Pyramid) */}
      <section id="pengurus" className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">PROFIL</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base font-medium italic">
              Pengelola UPTD Rusunawa Kota Cimahi
            </p>
          </div>

          {/* Tier 1: Top Leader (Center) */}
          <div className="flex justify-center mb-20">
            {topLeader && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex flex-col items-center text-center max-w-md group"
              >
                <div className="relative w-48 h-48 md:w-56 md:h-56 mb-8 rounded-full p-2 border-2 border-slate-200 dark:border-white/10 group-hover:border-blue-500/50 transition-colors duration-500">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900">
                    <Image
                      src={topLeader.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80"}
                      alt={topLeader.name}
                      fill
                      sizes="(max-width: 768px) 192px, 224px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{topLeader.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">{topLeader.role}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-mono mb-4">{topLeader.nip}</p>

                {/* Socials */}
                <div className="flex gap-4 mb-4">
                  {['twitter', 'facebook', 'instagram'].map((platform) => {
                    const Icon = platform === 'twitter' ? Twitter : platform === 'facebook' ? Facebook : Instagram;
                    const url = topLeader.socials?.[platform];
                    return url && (
                      <a key={platform} href={url} className="w-9 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all scale-90 hover:scale-110 shadow-lg">
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {!topLeader && !loading && (
              <p className="text-slate-400 italic">Data pimpinan belum tersedia.</p>
            )}
            {loading && (
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            )}
          </div>

          {/* Tier 2: Sub Leaders (Balanced 3-col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-x-24 max-w-6xl mx-auto mb-24">
            {subLeaders.map((leader, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + (i * 0.2), duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative w-44 h-44 md:w-52 md:h-52 mb-8 rounded-full p-2 border-2 border-slate-200 dark:border-white/10 group-hover:border-blue-500/50 transition-colors duration-500">
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900">
                    <Image
                      src={leader.image_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"}
                      alt={leader.name}
                      fill
                      sizes="(max-width: 768px) 176px, 208px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{leader.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed px-4">{leader.role}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-mono mb-4">{leader.nip}</p>

                {/* Socials */}
                <div className="flex gap-4">
                  {['twitter', 'facebook', 'instagram'].map((platform) => {
                    const Icon = platform === 'twitter' ? Twitter : platform === 'facebook' ? Facebook : Instagram;
                    const url = leader.socials?.[platform];
                    return url && (
                      <a key={platform} href={url} className="w-9 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all scale-90 hover:scale-110 shadow-lg">
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tier 3: Operational Divisions / Staff Grid (Scalable) */}
          <div className="mt-32 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tim Operasional & Unit Pelayanan</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Didukung oleh tenaga ahli yang siap melayani di berbagai bidang operasional Rusunawa.</p>
              </div>
              <div className="hidden md:block h-px flex-1 bg-slate-200 dark:bg-white/10 mx-8" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {operationalDivisions.map((division, i) => {
                const Icon = getIconForOps(division.name);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                    className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-3xl p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{division.name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{division.role}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom Banner Message (matching reference style) */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base tracking-wide max-w-3xl mx-auto">
              Berkomitmen Untuk Memberikan Pengelolaan dan Pelayanan Hunian Yang Prima, Harmonis dan Berkelanjutan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Pre-footer */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Siap Menjadi Penghuni?</h2>
          <p className="text-lg text-slate-400 mb-10">Pilih lokasi hunian yang Anda inginkan dan ajukan permohonan pendaftaran langsung secara online melalui sistem kami.</p>
          <Link href="/#lokasi" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 shadow-xl shadow-blue-500/25">
            Lihat Tipe Hunian
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-900 dark:text-white font-bold tracking-tight">Pengelola UPTD Rusunawa Kota Cimahi</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-6">
              Layanan pengelola rumah susun sewa sederhana tersistem. Hadir untuk kesejahteraan hunian masyarakat Cimahi.
            </p>
            <p className="text-slate-500 text-xs text-balance">
              © {new Date().getFullYear()} Pemerintah Kota Cimahi. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold mb-6">Tautan</h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#tentang" className="hover:text-blue-400">Tentang Kami</a></li>
              <li><a href="#fasilitas" className="hover:text-blue-400">Fasilitas</a></li>
              <li><a href="#lokasi" className="hover:text-blue-400">Lokasi & Tarif</a></li>
              <li><a href="#pengurus" className="hover:text-blue-400">Pengurus</a></li>
              <li><Link href="/login" className="hover:text-blue-400">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold mb-6">Kontak</h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
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
