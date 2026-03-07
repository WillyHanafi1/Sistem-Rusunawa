"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import api from "@/lib/api";

interface ImportDetail {
    row: number;
    status: "success" | "error";
    msg: string;
}

interface ImportResponse {
    success: boolean;
    message?: string;
    error?: string;
    details?: ImportDetail[];
}

interface TenantImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function TenantImportModal({ onClose, onSuccess }: TenantImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResponse | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/tenants/import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
            if (res.data.success) {
                onSuccess(); // refresh table behind
                if (!res.data.details || res.data.details.length === 0) {
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }
            }
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                setResult({ success: false, error: detail });
            } else if (Array.isArray(detail)) {
                setResult({ success: false, error: detail.map((d: any) => `${d.loc?.join('.') || 'Data'}: ${d.msg}`).join(', ') });
            } else if (typeof detail === 'object' && detail !== null) {
                setResult(detail);
            } else {
                setResult({ success: false, error: err.message || "Gagal mengunggah file. Pastikan server berjalan." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Import Data Penghuni</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unggah file Excel untuk pendaftaran massal.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto">
                    {!result?.success && (
                        <div className="space-y-6">
                            {/* Template Notice */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-bold text-amber-900 dark:text-amber-300">Gunakan Format Template</p>
                                    <p className="text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                                        Pastikan kolom Excel sesuai: <code className="bg-amber-200/50 dark:bg-amber-500/20 px-1 rounded">nama, nik, email, rusunawa, gedung, lantai, unit</code>.
                                    </p>
                                </div>
                            </div>

                            {/* Dropzone */}
                            <label className={`relative group block cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 ${file ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-200 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50/20'}`}>
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} disabled={loading} />
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    {file ? (
                                        <>
                                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-blue-50 dark:ring-blue-500/5">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <p className="font-bold text-blue-600 dark:text-blue-400 text-lg mb-1">{file.name}</p>
                                            <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB — Klik untuk ganti file</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Pilih File Excel</p>
                                            <p className="text-slate-400 text-sm">Seret file ke sini atau klik untuk mencari</p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Result Message */}
                    {result && (
                        <div className={`mt-6 p-5 rounded-2xl border ${result.success ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 animate-shake'}`}>
                            <div className="flex gap-3">
                                {result.success ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <div>
                                    <p className={`font-bold ${result.success ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}>
                                        {result.success ? "Berhasil!" : "Gagal Import"}
                                    </p>
                                    <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700/80 dark:text-emerald-400/80' : 'text-red-700/80 dark:text-red-400/80'}`}>
                                        {result.message || result.error}
                                    </p>
                                </div>
                            </div>

                            {/* Details List */}
                            {result.details && result.details.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Detail Baris:</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {result.details.map((d, i) => (
                                            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs border ${d.status === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10 text-red-700 dark:text-red-400'}`}>
                                                <span className="font-bold shrink-0 opacity-60">Baris {d.row}:</span>
                                                <span className="leading-relaxed">{d.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 bg-slate-50/30 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        {result?.success ? "Tutup" : "Batal"}
                    </button>
                    {!result?.success && (
                        <button
                            disabled={!file || loading}
                            onClick={handleUpload}
                            className="flex-[2] py-3 px-6 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                                    Mulai Import Data
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
