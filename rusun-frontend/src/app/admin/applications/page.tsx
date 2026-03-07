"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Search, Loader2, XCircle, FileText, Download, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
    id: number;
    nik: string;
    full_name: string;
    phone_number: string;
    email: string;
    rusunawa_target: string;
    family_members_count: number;
    status: "pending" | "approved" | "rejected" | "interview" | "contract_created";
    ktp_file_path: string | null;
    created_at: string;
}

const EMPTY_FORM = {
    nik: "",
    full_name: "",
    phone_number: "",
    email: "",
    rusunawa_target: "Cigugur Tengah",
    family_members_count: 1,
    ktp_file: null as File | null
};

export default function ApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Action State
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Form / Modal State
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/applications/");
            setApps(data);
        } catch (error) {
            console.error("Failed fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleUpdateStatus = async (appId: number, status: "approved" | "rejected" | "interview") => {
        if (!confirm(`Apakah Anda yakin ingin mengubah status pengajuan ini menjadi ${status.toUpperCase()}?`)) return;

        try {
            setActionLoading(appId);
            await api.patch(`/applications/${appId}`, { status });
            fetchApplications();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal mengubah status pengajuan.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (appId: number) => {
        if (!confirm("Yakin hapus pengajuan ini selamanya? Data tidak bisa dikembalikan.")) return;
        try {
            setActionLoading(appId);
            await api.delete(`/applications/${appId}`);
            fetchApplications();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menghapus pengajuan.");
        } finally {
            setActionLoading(null);
        }
    };

    const openCreate = () => {
        setForm({ ...EMPTY_FORM });
        setEditingId(null);
        setModalMode("create");
    };

    const openEdit = (app: Application) => {
        setForm({
            nik: app.nik,
            full_name: app.full_name,
            phone_number: app.phone_number,
            email: app.email,
            rusunawa_target: app.rusunawa_target,
            family_members_count: app.family_members_count,
            ktp_file: null
        });
        setEditingId(app.id);
        setModalMode("edit");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (modalMode === "create") {
                if (!form.ktp_file) {
                    alert("KTP wajib diunggah untuk pengajuan baru.");
                    setFormLoading(false);
                    return;
                }
                const payload = new FormData();
                payload.append("nik", form.nik);
                payload.append("full_name", form.full_name);
                payload.append("phone_number", form.phone_number);
                payload.append("email", form.email);
                payload.append("rusunawa_target", form.rusunawa_target);
                payload.append("family_members_count", form.family_members_count.toString());
                payload.append("ktp_file", form.ktp_file);

                await api.post("/applications/", payload, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Pengajuan berhasil ditambahkan.");
            } else if (modalMode === "edit" && editingId) {
                // For edit, we use PATCH. 
                // Currently API only supports updating status & notes directly, 
                // BUT we need to update user data. We should check if the backend allows this,
                // or we just send the updated fields.
                // Assuming `/applications/{id}` via PATCH handles generic fields via ApplicationUpdate (if backend supports it).
                
                // Let's verify backend: Backend accepts ApplicationUpdate. In 'app/models/application.py':
                // ApplicationUpdate contains status and notes. IT DOES NOT CONTAIN nik, full_name, etc.
                // Oh! The backend doesn't support updating applicant data yet.
                // We must update the API in the backend first to allow editing applicant details.
                
                // I will add the frontend request here, and fix the backend immediately after.
                
                const updatePayload: any = {
                    nik: form.nik,
                    full_name: form.full_name,
                    phone_number: form.phone_number,
                    email: form.email,
                    rusunawa_target: form.rusunawa_target,
                    family_members_count: form.family_members_count,
                };
                
                // Handle file upload gracefully if selected during edit (if we add backend support later)
                // For now, let's just patch the text data.
                await api.patch(`/applications/${editingId}`, updatePayload);
                alert("Pengajuan berhasil diperbarui.");
            }

            setModalMode(null);
            fetchApplications();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Terjadi kesalahan saat menyimpan data.");
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Menunggu</span>;
            case "approved":
                return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">Disetujui</span>;
            case "rejected":
                return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200">Ditolak</span>;
            case "interview":
                return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">Wawancara</span>;
            case "contract_created":
                return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Kontrak Dibuat</span>;
            default:
                return null;
        }
    };

    const handleDownloadKtp = async (filePath: string) => {
        try {
            const safePath = filePath.replace(/\\/g, '/');
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${safePath}`;
            window.open(url, '_blank');
        } catch(e) {
            console.error(e);
        }
    }

    const filteredApps = apps.filter(app =>
        app.full_name.toLowerCase().includes(search.toLowerCase()) ||
        app.nik.includes(search)
    );

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Data Pengajuan
                    </h1>
                    <p className="text-slate-500 mt-1">Kelola data pendaftaran sewa rusunawa dari website.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-95">
                        <Plus className="w-4 h-4" /> Tambah Pengajuan
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari NIK atau Nama Pendaftar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto text-sm">
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2 border border-yellow-100 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        {apps.filter(x => x.status === "pending").length} Pending
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Memuat data pengajuan...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        <p>Tidak ada data pengajuan yang ditemukan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Tgl Daftar</th>
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">NIK</th>
                                    <th className="px-6 py-4">No. WA</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4 text-center">Berkas</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                    <th className="px-6 py-4 text-center min-w-[150px]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence>
                                    {filteredApps.map(app => (
                                        <motion.tr
                                            key={app.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {format(new Date(app.created_at), "dd MMM yyyy", { locale: id })}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {format(new Date(app.created_at), "HH:mm")} WIB
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {app.full_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-mono text-xs">{app.nik}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs">{app.phone_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs">{app.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-blue-600 dark:text-blue-400">{app.rusunawa_target}</div>
                                                <div className="text-xs text-slate-500">{app.family_members_count} Anggota Keluarga</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {app.ktp_file_path ? (
                                                    <button onClick={() => handleDownloadKtp(app.ktp_file_path!)} className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors group" title="Unduh KTP">
                                                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                                    </button>
                                                ): (
                                                    <span className="text-xs text-slate-400 italic">Tidak ada</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    {app.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(app.id, "interview")}
                                                                disabled={actionLoading === app.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                                                                title="Panggil Wawancara"
                                                            >
                                                                {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                Wawancara
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(app.id, "rejected")}
                                                                disabled={actionLoading === app.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                                                                title="Tolak Pengajuan"
                                                            >
                                                                {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {/* Edit & Delete Action Buttons (Tersedia bagi semua status, atau bisa dibatasi if needed) */}
                                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 ml-1">
                                                        <button 
                                                            onClick={() => openEdit(app)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all" 
                                                            title="Edit Pengajuan"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(app.id)}
                                                            disabled={actionLoading === app.id}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50" 
                                                            title="Hapus Selamanya"
                                                        >
                                                            {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {getStatusBadge(app.status)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form: Create / Edit Application */}
            {modalMode && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl my-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl text-slate-900 dark:text-white font-bold">
                                {modalMode === 'edit' ? "✏️ Edit Pengajuan" : "📝 Tambah Pengajuan Baru"}
                            </h2>
                            <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">NIK KTP <span className="text-red-500">*</span></label>
                                    <input required type="text" maxLength={16} minLength={16} placeholder="16 Digit NIK" 
                                        value={form.nik} onChange={e => setForm({...form, nik: e.target.value.replace(/\D/g, '')})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input required type="text" placeholder="Sesuai KTP" 
                                        value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp <span className="text-red-500">*</span></label>
                                    <input required type="tel" placeholder="08xxxxxxxxxx" 
                                        value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value.replace(/\D/g, '')})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Aktif <span className="text-red-500">*</span></label>
                                    <input required type="email" placeholder="email@gmail.com" 
                                        value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lokasi Target <span className="text-red-500">*</span></label>
                                    <select 
                                        value={form.rusunawa_target} onChange={e => setForm({...form, rusunawa_target: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    >
                                        <option value="Cigugur Tengah">Cigugur Tengah</option>
                                        <option value="Cibeureum">Cibeureum</option>
                                        <option value="Leuwigajah">Leuwigajah</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah Anggota Keluarga <span className="text-red-500">*</span></label>
                                    <input required type="number" min={1} max={10} placeholder="Total" 
                                        value={form.family_members_count} onChange={e => setForm({...form, family_members_count: Number(e.target.value)})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                                    />
                                </div>
                            </div>
                            
                            {modalMode === 'create' && (
                                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unggah KTP / Pasfoto <span className="text-red-500">*</span></label>
                                    <input required type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setForm({...form, ktp_file: e.target.files[0]});
                                        }
                                    }} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    <p className="text-xs text-slate-500 mt-1">Hanya file gambar JPG/PNG, ukuran maksimal 2MB.</p>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setModalMode(null)} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 hover:dark:bg-slate-700 rounded-xl text-sm font-bold transition-all">
                                    Batal
                                </button>
                                <button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20">
                                    {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Data"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
