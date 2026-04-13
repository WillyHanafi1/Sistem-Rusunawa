"use client";
import React from "react";
import { Header } from "@/components/Header";
import { FloorPlan } from "@/components/FloorPlan";
import Image from "next/image";
import { Building2, MapPin, Layers, Users, ShieldCheck, ShowerHead, Car, Tag, ListTodo, Leaf, Wind } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ApplicationForm } from "@/components/ApplicationForm";

export default function LeuwigajahPage() {
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
            src="/images/buildings/leuwigajah.jpg"
            alt="Rusunawa Leuwigajah"
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
              Mulai Rp 355.000 / Bulan
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
              Rusunawa Leuwigajah
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-12 max-w-2xl mx-auto drop-shadow-sm">
              Hunian vertikal ramah lingkungan di area Leuwigajah, mengedepankan suasana tenang, hijau, asri dan perputaran udara hunian yang sangat baik.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Building2 className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Jumlah Gedung</p><p className="font-bold text-white">3 Twinblok</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Layers className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Tipe Hunian</p><p className="font-bold text-white">Unit Type 24</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Kapasitas</p><p className="font-bold text-white">297 Total Unit</p></div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3 shadow-xl hover:bg-slate-900/60 transition-all group">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><MapPin className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-400 mb-1">Lokasi</p><p className="font-bold text-white">Utara Leuwigajah</p></div>
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
                src="/images/buildings/leuwigajah.jpg"
                alt="Gedung Rusunawa Leuwigajah"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-8 left-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white text-2xl md:text-3xl font-bold shadow-sm">Jl. Kihapit Barat No. 13, Kec. Cimahi Selatan</h3>
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
          <FloorPlan locationName="Rusunawa Leuwigajah" />
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
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Tertib Keamanan</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Lingkungan selalu dipantau oleh warga & petugas keamanan.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Leaf className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Area Hijau Terbuka</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Taman asri dan area resapan hijau untuk kesejukan udara.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <ShowerHead className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Sanitasi Bersih</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Sistem pengelolaan sampah terpadu yang ramah lingkungan.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Car className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Lahan Parkir</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Parkir kendaraan khusus dan terpisah dari pemukiman utama.</p>
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
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">Type 24</p>
                <p>Lantai I : Rp. 400.000</p>
                <p>Lantai II : Rp. 400.000</p>
                <p>Lantai III : Rp. 385.000</p>
                <p>Lantai IV : Rp. 370.000</p>
                <p>Lantai V : Rp. 355.000</p>
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
                  <p className="font-bold text-slate-900 dark:text-white mb-2">Type 24</p>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.9046557699594!2d107.52032627573918!3d-6.902004867547016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e508ecee3f79%3A0xcad208d842656c49!2sRusunawa%20Leuwigajah%2C%20rusunawa%20leuwigajah%20A%20IV%20No.16%2C%20Leuwigajah%2C%20Kec.%20Cimahi%20Sel.%2C%20Kota%20Cimahi%2C%20Jawa%20Barat%2040532!5e0!3m2!1sen!2sid!4v1776089486094!5m2!1sen!2sid"
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
        targetRusunawa="Leuwigajah" 
        locationDisplayName="Rusunawa Leuwigajah" 
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
