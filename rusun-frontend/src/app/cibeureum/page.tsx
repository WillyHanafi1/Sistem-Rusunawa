"use client";
import React from "react";
import { Header } from "@/components/Header";
import { FloorPlan } from "@/components/FloorPlan";
import Image from "next/image";
import { Building2, MapPin, Layers, Users, ShieldCheck, ShowerHead, Car, Tag, ListTodo, Leaf, Wind } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ApplicationForm } from "@/components/ApplicationForm";

export default function CibeureumPage() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 transition-colors duration-300 font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950 z-10" />
          <img
            src="/images/buildings/cibeureum.jpg"
            alt="Rusunawa Cibeureum"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 bg-blue-600/90 text-white rounded-full text-sm font-semibold mb-6 shadow-lg backdrop-blur-md">
              Mulai Rp 340.000 / Bulan
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
              Rusunawa Cibeureum
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-12 max-w-2xl mx-auto drop-shadow-sm">
              Hunian asri dan strategis di kawasan Cibeureum, sangat cocok untuk para pekerja yang memiliki mobilitas tinggi di sekitar perbatasan Cimahi dan Bandung.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Building2 className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Jumlah Gedung</p><p className="font-bold text-white">4 Twinblok</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Layers className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Tipe Hunian</p><p className="font-bold text-white">Type 24 & 27</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Kapasitas</p><p className="font-bold text-white">371 Total Unit</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><MapPin className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Lokasi</p><p className="font-bold text-white">Cibeureum Selatan</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase mb-2">GALERI UNIT</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="group relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 h-[520px] md:h-[780px]">
              <img
                src="/images/buildings/cibeureum.jpg"
                alt="Gedung Rusunawa Cibeureum"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-8 left-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white text-2xl md:text-3xl font-bold shadow-sm">Jl. Melong Nyelarang, Kel. Melong, Kec. Cimahi Selatan</h3>
                <p className="text-blue-400 text-sm md:text-base mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Lokasi Strategis & Nyaman
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floor Plan Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FloorPlan locationName="Rusunawa Cibeureum" />
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">FASILITAS UTAMA</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Keamanan Terpadu</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Pos penjagaan khusus dan sistem pengamanan lingkungan terkontrol.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Car className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Lahan Parkir Umum</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Akses parkir motor yang luas serta ruang komunal luar ruangan.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <ShowerHead className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Sistem Air Bersih</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Pasokan air bersih yang disalurkan secara terpusat untuk kelancaran.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Wind className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Sirkulasi Baik</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Sistem ventilasi berstandar untuk kenyamanan perputaran udara.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Syarat & Ketentuan Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">SYARAT & KETENTUAN</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Tarif Sewa */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6 text-white shadow-lg shadow-yellow-400/30">
                <Tag className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tarif Sewa / Bulan</h3>
              <div className="text-slate-700 dark:text-slate-300 space-y-3 font-medium">
                <div className="space-y-6">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-3">Type 24 (Gedung A, B, C)</p>
                    <div className="space-y-1">
                      <p>Lantai I & II : Rp. 400.000</p>
                      <p>Lantai III : Rp. 385.000</p>
                      <p>Lantai IV : Rp. 370.000</p>
                      <p>Lantai V : Rp. 355.000</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-3">Type 27 (Gedung D)</p>
                    <div className="space-y-1">
                      <p>Lantai I : Rp. 440.000</p>
                      <p>Lantai II : Rp. 425.000</p>
                      <p>Lantai III : Rp. 410.000</p>
                      <p>Lantai IV : Rp. 395.000</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-4 text-slate-500 italic">Ruang Usaha / Komersial : Rp. 15.000 / m²</p>
              </div>
            </div>

            {/* Kriteria MBR */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6 text-white shadow-lg shadow-yellow-400/30">
                <ListTodo className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Kriteria MBR Penghuni sebagai berikut:</h3>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-center space-y-6">
                <p>
                  Pekerja/buruh yang berpenghasilan perbulan dibawah atau sama dengan upah minimum regional; atau masyarakat berpenghasilan perbulan paling banyak; Bagi yang belum menikah maksimal pendapatan 7 (tujuh) Juta Rupiah / Bagi yang sudah menikah maksimal pendapatan 8 (delapan) Juta Rupiah serta tidak memiliki kendaraan roda 4 (empat) dan belum memiliki rumah.
                </p>
                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <p className="font-bold text-slate-900 dark:text-white mb-2">Type 24 / Type 27</p>
                  <p>
                    Diperuntukan bagi masyarakat yang sudah menikah dan mempunyai paling banyak 2 (dua) orang anak maksimal umur 12 (dua belas) tahun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase mb-2">LOKASI RUSUNAWA</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
          </div>
          <div className="w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-white/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.80984452967!2d107.55453407573941!3d-6.913325567663378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e5e941ea033b%3A0x918ef0529e8634e8!2sRusunawa%20Cibeureum!5e0!3m2!1sen!2sid!4v1776089520375!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <ApplicationForm 
        targetRusunawa="Cibeureum" 
        locationDisplayName="Rusunawa Cibeureum" 
      />

      {/* Footer minimalis */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800 text-center text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12 mb-2">
            <Image
              src="/images/logos/logo-rusun.png"
              alt="Logo Rusunawa"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
          <p>© {new Date().getFullYear()} Rusunawa Cimahi. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
