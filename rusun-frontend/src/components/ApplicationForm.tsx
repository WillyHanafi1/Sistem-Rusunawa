"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, CheckCircle, User, Phone, Mail, 
  MapPin, ClipboardCheck, ArrowRight, AlertCircle,
  Home, Briefcase
} from "lucide-react";
import api from "@/lib/api";

interface ApplicationFormProps {
  targetRusunawa: string;
  locationDisplayName: string;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ 
  targetRusunawa, 
  locationDisplayName 
}) => {
  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    noWa: "",
    email: "",
    is_address_cimahi: "" as "" | "true" | "false",
    is_job_cimahi: "" as "" | "true" | "false",
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ id: number; queueNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.is_address_cimahi || !formData.is_job_cimahi) {
      setError("Mohon jawab kedua pertanyaan verifikasi domisili & pekerjaan.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append("nik", formData.nik);
      payload.append("full_name", formData.nama);
      payload.append("phone_number", formData.noWa);
      payload.append("email", formData.email);
      payload.append("rusunawa_target", targetRusunawa);
      payload.append("is_address_cimahi", formData.is_address_cimahi);
      payload.append("is_job_cimahi", formData.is_job_cimahi);
      
      // Send minimalist data (backend now accepts optional docs)
      const res = await api.post("/applications", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const appId = res.data.id;
      const year = new Date().getFullYear();
      const formattedId = appId.toString().padStart(3, '0');
      
      setSuccessData({
        id: appId,
        queueNumber: `#${year}-${formattedId}`
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.response?.data?.detail || "Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 p-8 md:p-12 border border-blue-500/20 rounded-3xl shadow-2xl text-center space-y-8"
      >
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 dark:text-slate-400">Data Anda telah masuk ke dalam antrian sistem kami.</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ClipboardCheck className="w-24 h-24" rotate={15} />
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">Nomor Antrian Anda</p>
          <p className="text-5xl font-black text-blue-700 dark:text-blue-300 tracking-tighter">{successData.queueNumber}</p>
        </div>

        <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
          Petugas kami akan menghubungi Anda melalui WhatsApp <span className="font-bold text-slate-900 dark:text-white">{formData.noWa}</span> dalam 2-3 hari kerja untuk konfirmasi jadwal verifikasi dan wawancara.
        </div>

        <div className="pt-4">
          <button 
            onClick={() => window.location.href = "/"}
            className="text-blue-500 hover:text-blue-600 font-semibold flex items-center justify-center gap-2 mx-auto transition-all"
          >
            Kembali ke Beranda <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <section id="daftar" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">DAFTAR ANTRIAN</h2>
          <p className="text-sm md:text-base text-blue-600 dark:text-blue-400 mt-2 font-medium">Hanya butuh 1 menit untuk memulai hunian baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 md:p-12 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl space-y-8 relative overflow-hidden">
          {/* Progress hint for minimalist vibe */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-blue-500 w-1/3 transition-all duration-500" />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, gap: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group">
              <label className="md:w-1/4 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" /> Lokasi
              </label>
              <input 
                type="text" 
                value={locationDisplayName} 
                readOnly 
                className="md:w-3/4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 cursor-not-allowed outline-none font-medium" 
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group">
              <label className="md:w-1/4 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" /> NIK KTP
              </label>
              <input 
                required 
                type="text" 
                maxLength={16} 
                minLength={16} 
                placeholder="16 Digit NIK Sesuai KTP" 
                value={formData.nik} 
                onChange={e => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })} 
                className="md:w-3/4 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white" 
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group">
              <label className="md:w-1/4 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" /> Nama Lengkap
              </label>
              <input 
                required 
                type="text" 
                placeholder="Nama Lengkap Sesuai KTP" 
                value={formData.nama} 
                onChange={e => setFormData({ ...formData, nama: e.target.value })} 
                className="md:w-3/4 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white" 
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group">
              <label className="md:w-1/4 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" /> No. WhatsApp
              </label>
              <input 
                required 
                type="tel" 
                placeholder="0812XXXXXXXX" 
                value={formData.noWa} 
                onChange={e => setFormData({ ...formData, noWa: e.target.value.replace(/\D/g, '') })} 
                className="md:w-3/4 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white" 
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group">
              <label className="md:w-1/4 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" /> Email Aktif
              </label>
              <input 
                required 
                type="email" 
                placeholder="alamat.email@gmail.com" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                className="md:w-3/4 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white" 
              />
            </div>

            {/* Cimahi Priority Questions */}
            <div className="pt-4 space-y-6">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Verifikasi Domisili & Pekerjaan
              </h3>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 group">
                <label className="md:w-1/2 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 leading-relaxed">
                  <Home className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 shrink-0" />
                  Apakah alamat KTP/domisili Anda saat ini di Kota Cimahi?
                </label>
                <div className="md:w-1/2 flex gap-3">
                  {[
                    { label: "Di Dalam Cimahi", value: "true", priority: true },
                    { label: "Di Luar Cimahi", value: "false", priority: false }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, is_address_cimahi: opt.value as any })}
                      className={`flex-1 py-3 px-3 rounded-xl text-[13px] font-bold transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                        formData.is_address_cimahi === opt.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.05]"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500/50"
                      }`}
                    >
                      {opt.label}
                      {opt.priority && <span className="text-[9px] uppercase tracking-tighter opacity-80">(Prioritas)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 group">
                <label className="md:w-1/2 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 leading-relaxed">
                  <Briefcase className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 shrink-0" />
                  Apakah lokasi pekerjaan Anda saat ini berada di Kota Cimahi?
                </label>
                <div className="md:w-1/2 flex gap-3">
                  {[
                    { label: "Di Dalam Cimahi", value: "true", priority: true },
                    { label: "Di Luar Cimahi", value: "false", priority: false }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, is_job_cimahi: opt.value as any })}
                      className={`flex-1 py-3 px-3 rounded-xl text-[13px] font-bold transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                        formData.is_job_cimahi === opt.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.05]"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500/50"
                      }`}
                    >
                      {opt.label}
                      {opt.priority && <span className="text-[9px] uppercase tracking-tighter opacity-80">(Prioritas)</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Daftar Antrian Sekarang <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
          
          <p className="text-center text-xs text-slate-500 dark:text-slate-500 pt-4">
            Dengan mendaftar, Anda menyetujui bahwa data akan diproses sesuai ketentuan UPTD Rusunawa.
          </p>
        </form>
      </div>
    </section>
  );
};
