"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
import { FloorPlan } from "@/components/FloorPlan";
import {
  ArrowLeft, Building2, MapPin, Layers, Users,
  ShieldCheck, ShowerHead, Car, Tag, ListTodo, Wind, Loader2
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import api from "@/lib/api";

export default function CibeureumPage() {
  const [formData, setFormData] = useState({
    lokasi: "Rusunawa Cibeureum",
    nik: "", nama: "", noWa: "", email: "", jmlKeluarga: 1,
    ktp_file: null as File | null,
    kk_file: null as File | null,
    sku_file: null as File | null,
    skck_file: null as File | null,
    health_cert_file: null as File | null,
    photo_file: null as File | null,
    has_signed_statement: false
  });
  const [loading, setLoading] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ktp_file || !formData.kk_file) {
      alert("Mohon lengkapi dokumen identitas wajib (KTP dan Kartu Keluarga).");
      return;
    }
    if (!formData.has_signed_statement) {
      alert("Anda harus menyetujui Surat Pernyataan untuk melanjutkan.");
      return;
    }
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("nik", formData.nik);
      payload.append("full_name", formData.nama);
      payload.append("phone_number", formData.noWa);
      payload.append("email", formData.email);
      payload.append("rusunawa_target", "Cibeureum");
      payload.append("family_members_count", formData.jmlKeluarga.toString());
      payload.append("ktp_file", formData.ktp_file);
      payload.append("kk_file", formData.kk_file);
      if (formData.sku_file) payload.append("sku_file", formData.sku_file);
      if (formData.skck_file) payload.append("skck_file", formData.skck_file);
      if (formData.health_cert_file) payload.append("health_cert_file", formData.health_cert_file);
      if (formData.photo_file) payload.append("photo_file", formData.photo_file);
      payload.append("has_signed_statement", formData.has_signed_statement.toString());

      await api.post("/applications", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Pendaftaran berhasil dikirim! Silakan tunggu petugas kami menghubungi Anda.");
      setFormData({
        ...formData, nik: "", nama: "", noWa: "", email: "", jmlKeluarga: 1,
        ktp_file: null, kk_file: null, sku_file: null, photo_file: null, has_signed_statement: false
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Terjadi kesalahan saat mengirim pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400"><Building2 className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">Jumlah Gedung</p><p className="font-bold text-slate-900 dark:text-white">4 Twinblok</p></div>
            </div>
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400"><Layers className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">Tipe Hunian</p><p className="font-bold text-slate-900 dark:text-white">Type 24 & 27</p></div>
            </div>
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400"><Users className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">Kapasitas</p><p className="font-bold text-slate-900 dark:text-white">371 Total Unit</p></div>
            </div>
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400"><MapPin className="w-6 h-6" /></div>
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">Lokasi</p><p className="font-bold text-slate-900 dark:text-white">Cibeureum Selatan</p></div>
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

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
            {/* Kiri: 1 Foto Besar */}
            <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 h-[300px] lg:h-[500px]">
              <img
                src="/images/buildings/cibeureum.jpg"
                alt="Gedung Rusunawa"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-6 left-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold rounded-full mb-3 inline-block shadow-lg">Tipe 24 & 27</span>
                <h3 className="text-white text-2xl font-bold shadow-sm">Ruang Keluarga & Dapur</h3>
                <p className="text-slate-200 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Nyaman dan sirkulasi udara baik</p>
              </div>
            </div>

            {/* Kanan: 2 Foto Sedang Susun Atas Bawah */}
            <div className="flex flex-col lg:grid lg:grid-rows-2 gap-4 lg:h-[500px]">
              {/* Foto Kanan Atas */}
              <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 h-[250px] lg:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2057&auto=format&fit=crop"
                  alt="Kamar Tidur"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-5 left-5">
                  <h3 className="text-white text-xl font-bold">Kamar Tidur Nyaman</h3>
                </div>
              </div>

              {/* Foto Kanan Bawah */}
              <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 h-[250px] lg:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1950&auto=format&fit=crop"
                  alt="Kamar Mandi"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-5 left-5">
                  <h3 className="text-white text-xl font-bold">Kamar Mandi & Area Cuci</h3>
                </div>
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
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">Type 24 & Type 27</p>
                <p>Lantai I (Difabel) : Rp. 500.000</p>
                <p>Lantai I (Non Difabel) : Rp. 550.000</p>
                <p>Lantai II : Rp. 480.000</p>
                <p>Lantai III : Rp. 440.000</p>
                <p>Lantai IV : Rp. 400.000</p>
                <p>Lantai V : Rp. 340.000</p>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.916173062024!2d107.5458034!3d-6.9006095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e5a7b8245b95%3A0x6a2cd8c160a0f828!2sRusunawa%20Cibeureum!5e0!3m2!1sid!2sid!4v1709715111111!5m2!1sid!2sid"
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

      {/* Form Pendaftaran Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">DAFTAR SEKARANG!</h2>
            <p className="text-sm md:text-base text-green-600 dark:text-green-400 mt-2 font-medium">Isilah Formulir Pendaftaran</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 md:p-12 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Lokasi</label>
              <input type="text" value={formData.lokasi} readOnly className="md:w-3/4 p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed outline-none" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">NIK KTP <span className="text-red-500">*</span></label>
              <input required type="text" maxLength={16} minLength={16} placeholder="16 Digit NIK" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="Sesuai KTP" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp <span className="text-red-500">*</span></label>
              <input required type="tel" placeholder="08xxxxxxxxxx" value={formData.noWa} onChange={e => setFormData({ ...formData, noWa: e.target.value.replace(/\D/g, '') })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email Aktif <span className="text-red-500">*</span></label>
              <input required type="email" placeholder="email@gmail.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Jml Anggota Keluarga <span className="text-red-500">*</span></label>
              <input required type="number" min={1} max={10} placeholder="Termasuk Kepala Keluarga" value={formData.jmlKeluarga} onChange={e => setFormData({ ...formData, jmlKeluarga: Number(e.target.value) })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Upload KTP <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-500">Max size 2MB (.jpg/.jpeg/.png)</span>
              </div>
              <input required type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, ktp_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Upload KK <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-500">Kartu Keluarga (Max 2MB)</span>
              </div>
              <input required type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, kk_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Upload SKU / Slip Gaji</label>
                <span className="text-xs text-slate-500 italic">Dapat menyusul (Max 2MB)</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, sku_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Upload SKCK</label>
                <span className="text-xs text-slate-500 italic">Dapat menyusul (Max 2MB)</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, skck_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Surat Keterangan Sehat</label>
                <span className="text-xs text-slate-500 italic">Dapat menyusul (Max 2MB)</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, health_cert_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-6 border-t border-slate-200 dark:border-white/5 pt-6">
              <div className="md:w-1/4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pasfoto 3x4</label>
                <span className="text-xs text-slate-500 italic">Dapat menyusul (Max 2MB)</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, photo_file: e.target.files[0] });
                }
              }} className="md:w-3/4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-950" />
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-white/5 pt-6 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl">
              <div className="flex items-start gap-3">
                <input
                  id="statement"
                  type="checkbox"
                  checked={formData.has_signed_statement}
                  onChange={e => setFormData({ ...formData, has_signed_statement: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="statement" className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  <strong>SURAT PERNYATAAN DIGITAL:</strong><br />
                  Saya menyatakan bahwa data yang saya masukkan adalah benar, saya belum memiliki rumah, dan bersedia mematuhi segala peraturan dan tata tertib penghunian Rusunawa sesuai Perwal No. 36 Tahun 2017.
                </label>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button disabled={loading} type="submit" className="px-16 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg shadow-yellow-400/30 transition-all hover:scale-105 uppercase tracking-wide flex items-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "KIRIM PENGAJUAN"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer minimalis */}
      <footer className="py-8 bg-slate-900 border-t border-slate-800 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Rusunawa Cimahi. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
