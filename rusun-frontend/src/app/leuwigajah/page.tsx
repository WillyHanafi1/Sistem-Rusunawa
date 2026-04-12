"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
import { FloorPlan } from "@/components/FloorPlan";
import Image from "next/image";
import {
  ArrowLeft, Building2, MapPin, Layers, Users,
  ShieldCheck, ShowerHead, Car, Tag, ListTodo, Leaf, Loader2
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import api from "@/lib/api";

export default function LeuwigajahPage() {
  const [formData, setFormData] = useState({
    lokasi: "Rusunawa Leuwigajah",
    nik: "", nama: "", noWa: "", email: "", jmlKeluarga: 1,
    marital_status: "Belum Kawin",
    place_of_birth: "",
    date_of_birth: "",
    religion: "Islam",
    occupation: "",
    previous_address: "",
    family_members: [] as { name: string; age: string; relation: string; gender: string }[],
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
      payload.append("rusunawa_target", "Leuwigajah");
      payload.append("family_members_count", formData.jmlKeluarga.toString());
      payload.append("marital_status", formData.marital_status);
      payload.append("place_of_birth", formData.place_of_birth);
      payload.append("date_of_birth", formData.date_of_birth);
      payload.append("religion", formData.religion);
      payload.append("occupation", formData.occupation);
      payload.append("previous_address", formData.previous_address);
      
      // Serialize family members as JSON
      if (formData.family_members.length > 0) {
        payload.append("family_members", JSON.stringify(formData.family_members));
      }

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
        place_of_birth: "", date_of_birth: "", occupation: "", previous_address: "",
        family_members: [],
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
                <p>Lantai I (Difabel) : Rp. 520.000</p>
                <p>Lantai I (Non Difabel) : Rp. 570.000</p>
                <p>Lantai II : Rp. 500.000</p>
                <p>Lantai III : Rp. 460.000</p>
                <p>Lantai IV : Rp. 420.000</p>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.6784824513!2d107.5258925!3d-6.9290074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e594d21051df%3A0xab7b90f42df0141e!2sRusunawa%20Leuwigajah!5e0!3m2!1sid!2sid!4v1709715111111!5m2!1sid!2sid"
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

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status Perkawinan <span className="text-red-500">*</span></label>
              <select required value={formData.marital_status} onChange={e => setFormData({ ...formData, marital_status: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white">
                {["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tempat, Tgl Lahir <span className="text-red-500">*</span></label>
              <div className="md:w-3/4 flex gap-3">
                <input required type="text" placeholder="Tempat" value={formData.place_of_birth} onChange={e => setFormData({ ...formData, place_of_birth: e.target.value })} className="w-1/2 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
                <input required type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-1/2 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Agama <span className="text-red-500">*</span></label>
              <select required value={formData.religion} onChange={e => setFormData({ ...formData, religion: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white">
                {["Islam", "Kristen", "Katolik", "Hindu", "Budha", "Konghucu"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Pekerjaan <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="Pekerjaan saat ini" value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Menetap <span className="text-red-500">*</span></label>
              <textarea required placeholder="Alamat lengkap tempat tinggal saat ini" value={formData.previous_address} onChange={e => setFormData({ ...formData, previous_address: e.target.value })} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white h-24" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <label className="md:w-1/4 text-sm font-semibold text-slate-700 dark:text-slate-300">Jml Anggota Keluarga <span className="text-red-500">*</span></label>
              <input required type="number" min={1} max={10} placeholder="Termasuk Kepala Keluarga" value={formData.jmlKeluarga} onChange={e => {
                const val = Number(e.target.value);
                setFormData({ 
                  ...formData, 
                  jmlKeluarga: val,
                  family_members: Array.from({ length: Math.max(0, val - 1) }, (_, i) => formData.family_members[i] || { name: "", age: "", relation: "", gender: "Laki-laki" })
                });
              }} className="md:w-3/4 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white" />
            </div>

            {formData.family_members.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Data Anggota Keluarga</h4>
                {formData.family_members.map((member, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="text" placeholder="Nama Anggota" value={member.name} onChange={e => {
                        const newMembers = [...formData.family_members];
                        newMembers[idx].name = e.target.value;
                        setFormData({ ...formData, family_members: newMembers });
                      }} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                      <input required type="number" placeholder="Usia" value={member.age} onChange={e => {
                        const newMembers = [...formData.family_members];
                        newMembers[idx].age = e.target.value;
                        setFormData({ ...formData, family_members: newMembers });
                      }} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                      <input required type="text" placeholder="Hubungan (Istri/Anak/dll)" value={member.relation} onChange={e => {
                        const newMembers = [...formData.family_members];
                        newMembers[idx].relation = e.target.value;
                        setFormData({ ...formData, family_members: newMembers });
                      }} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                      <select required value={member.gender} onChange={e => {
                        const newMembers = [...formData.family_members];
                        newMembers[idx].gender = e.target.value;
                        setFormData({ ...formData, family_members: newMembers });
                      }} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
      <footer className="py-12 bg-slate-900 border-t border-slate-800 text-center text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12 mb-2">
            <Image
              src="/images/logos/logo-rusun.png"
              alt="Logo Rusunawa"
              fill
              className="object-contain"
            />
          </div>
          <p>© {new Date().getFullYear()} Rusunawa Cimahi. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
