"use client";

import React, { useEffect, useState } from "react";
import api, { handleDownload } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Search, Loader2, XCircle, FileText, Download, Plus, Pencil, Trash2, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePreview } from "@/components/FilePreview";

interface Application {
    id: number;
    nik: string;
    full_name: string;
    phone_number: string;
    email: string;
    rusunawa_target: string;
    family_members_count: number;
    marital_status: string | null;
    status: "pending" | "approved" | "rejected" | "interview" | "contract_created";
    ktp_file_path: string | null;
    kk_file_path: string | null;
    marriage_cert_file_path: string | null;
    is_documents_verified: boolean;
    sku_file_path: string | null;
    skck_file_path: string | null;
    health_cert_file_path: string | null;
    photo_file_path: string | null;
    has_signed_statement: boolean;
    created_at: string;
}

const EMPTY_FORM = {
    nik: "",
    full_name: "",
    phone_number: "",
    email: "",
    rusunawa_target: "Cigugur Tengah",
    family_members_count: 1,
    marital_status: "Belum Kawin",
    ktp_file: null as File | null,
    kk_file: null as File | null,
    marriage_cert_file: null as File | null,
    sku_file: null as File | null,
    skck_file: null as File | null,
    health_cert_file: null as File | null,
    photo_file: null as File | null
};

const SITE_ORDER: Record<string, number> = {
    "Cigugur Tengah": 1,
    "Cibeureum": 2,
    "Leuwigajah": 3
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

    // Document Preview
    const [viewingDocsApp, setViewingDocsApp] = useState<Application | null>(null);
    const [verifying, setVerifying] = useState(false);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/applications");
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
            marital_status: app.marital_status || "Belum Kawin",
            ktp_file: null,
            kk_file: null,
            marriage_cert_file: null,
            sku_file: null,
            skck_file: null,
            health_cert_file: null,
            photo_file: null
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
                payload.append("marital_status", form.marital_status);
                payload.append("ktp_file", form.ktp_file);
                if (form.kk_file) payload.append("kk_file", form.kk_file);
                if (form.marriage_cert_file) payload.append("marriage_cert_file", form.marriage_cert_file);
                if (form.sku_file) payload.append("sku_file", form.sku_file);
                if (form.photo_file) payload.append("photo_file", form.photo_file);
                if (form.skck_file) payload.append("skck_file", form.skck_file);
                if (form.health_cert_file) payload.append("health_cert_file", form.health_cert_file);
                // Admin manually creating also signs the statement by default if it's an admin bypass, 
                // or we can add a toggle. For now, we follow backend requirement if needed.
                payload.append("has_signed_statement", "true");

                await api.post("/applications", payload, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Pengajuan berhasil ditambahkan.");
            } else if (modalMode === "edit" && editingId) {
                const updatePayload: any = {
                    nik: form.nik,
                    full_name: form.full_name,
                    phone_number: form.phone_number,
                    email: form.email,
                    rusunawa_target: form.rusunawa_target,
                    family_members_count: form.family_members_count,
                    marital_status: form.marital_status
                };
                
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

    const handleDownloadFile = async (filePath: string) => {
        const safePath = filePath.replace(/\\/g, '/');
        await handleDownload(`/api/${safePath}`, undefined, true);
    }

    const handleVerifyAll = async (appId: number) => {
        try {
            setVerifying(true);
            await api.patch(`/applications/${appId}/verify-all`);
            setViewingDocsApp(null);
            fetchApplications();
            alert("Semua dokumen berhasil diverifikasi.");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal memverifikasi dokumen.");
        } finally {
            setVerifying(false);
        }
    };

    const filteredApps = React.useMemo(() => {
        return apps
            .filter(app =>
                app.full_name.toLowerCase().includes(search.toLowerCase()) ||
                app.nik.includes(search)
            )
            .sort((a, b) => {
                const priorityA = SITE_ORDER[a.rusunawa_target] || 99;
                const priorityB = SITE_ORDER[b.rusunawa_target] || 99;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                // Secondary sort: Newest first
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [apps, search]);

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
                                                <div className="flex flex-col items-center gap-2">
                                                    <button 
                                                        onClick={() => setViewingDocsApp(app)} 
                                                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors group relative ${app.is_documents_verified ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`} 
                                                        title="Lihat Berkas"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {app.is_documents_verified && (
                                                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                            </div>
                                                        )}
                                                    </button>
                                                    <span className={`text-[10px] font-bold uppercase ${app.is_documents_verified ? 'text-green-600' : 'text-slate-400'}`}>
                                                        {app.is_documents_verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </div>
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
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Pernikahan</label>
                                    <select 
                                        value={form.marital_status} onChange={e => setForm({...form, marital_status: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    >
                                        <option value="Belum Kawin">Belum Kawin</option>
                                        <option value="Kawin">Kawin</option>
                                        <option value="Cerai Hidup">Cerai Hidup</option>
                                        <option value="Cerai Mati">Cerai Mati</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Unggah Berkas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">File KTP {modalMode === 'create' && <span className="text-red-500">*</span>}</label>
                                        <input required={modalMode === 'create'} type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, ktp_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">File Kartu Keluarga</label>
                                        <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, kk_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                    {form.marital_status === "Kawin" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">File Surat Nikah</label>
                                            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setForm({...form, marriage_cert_file: e.target.files[0]});
                                                }
                                            }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">File SKU / Slip Gaji</label>
                                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, sku_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Pasfoto 3x4</label>
                                        <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, photo_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">SKCK</label>
                                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, skck_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Surat Ket. Sehat</label>
                                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setForm({...form, health_cert_file: e.target.files[0]});
                                            }
                                        }} className="w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Berdasarkan Perwal 36/2017: KTP, KK, SKU, dan Pasfoto wajib dilampirkan (Administrasi Utama).</p>
                            </div>

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

            {/* Document Verification Modal */}
            {viewingDocsApp && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl my-auto overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                            <div>
                                <h2 className="text-xl text-slate-900 dark:text-white font-bold">Preview Dokumen</h2>
                                <p className="text-sm text-slate-500">{viewingDocsApp.full_name} ({viewingDocsApp.nik})</p>
                            </div>
                            <button onClick={() => setViewingDocsApp(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 bg-white dark:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* KTP */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
                                        KTP / Identitas
                                    </h3>
                                    {viewingDocsApp.ktp_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.ktp_file_path!} 
                                                alt="KTP" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.ktp_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">Belum diunggah</div>
                                    )}
                                </div>

                                {/* KK */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</div>
                                        Kartu Keluarga (KK)
                                    </h3>
                                    {viewingDocsApp.kk_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.kk_file_path!} 
                                                alt="KK" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.kk_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">Belum diunggah</div>
                                    )}
                                </div>

                                {/* Surat Nikah */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</div>
                                        Surat Nikah (Opsional)
                                    </h3>
                                    {viewingDocsApp.marriage_cert_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.marriage_cert_file_path!} 
                                                alt="Surat Nikah" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.marriage_cert_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">
                                            {viewingDocsApp.marital_status === "Kawin" ? "Wajib diunggah" : "Tidak diperlukan"}
                                        </div>
                                    )}
                                </div>

                                {/* SKU */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">4</div>
                                        SKU / Slip Gaji
                                    </h3>
                                    {viewingDocsApp.sku_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.sku_file_path!} 
                                                alt="SKU" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.sku_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">Belum diunggah</div>
                                    )}
                                </div>

                                {/* SKCK */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">5</div>
                                        SKCK
                                    </h3>
                                    {viewingDocsApp.skck_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.skck_file_path!} 
                                                alt="SKCK" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.skck_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">Belum diunggah</div>
                                    )}
                                </div>

                                {/* Health Cert */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">6</div>
                                        Surat Keterangan Sehat
                                    </h3>
                                    {viewingDocsApp.health_cert_file_path ? (
                                        <div className="aspect-[3/2] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <FilePreview 
                                                path={viewingDocsApp.health_cert_file_path!} 
                                                alt="Surat Sehat" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.health_cert_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic">Belum diunggah</div>
                                    )}
                                </div>

                                {/* Photo */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">7</div>
                                        Pasfoto 3x4
                                    </h3>
                                    {viewingDocsApp.photo_file_path ? (
                                        <div className="aspect-[3/4] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 relative group max-w-[150px] mx-auto">
                                            <FilePreview 
                                                path={viewingDocsApp.photo_file_path!} 
                                                alt="Pasfoto" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                                <button onClick={() => handleDownloadFile(viewingDocsApp.photo_file_path!)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto"><Download className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs italic max-w-[150px] mx-auto">Belum diunggah</div>
                                    )}
                                </div>

                                {/* Digital Statement */}
                                <div className="space-y-3 md:col-span-2">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">8</div>
                                        Surat Pernyataan Digital
                                    </h3>
                                    <div className={`p-4 rounded-2xl border-2 ${viewingDocsApp.has_signed_statement ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-start gap-3`}>
                                        <ShieldCheck className={`w-5 h-5 mt-0.5 ${viewingDocsApp.has_signed_statement ? 'text-green-600' : 'text-red-600'}`} />
                                        <div>
                                            <p className="text-sm font-bold">{viewingDocsApp.has_signed_statement ? 'Telah Disetujui' : 'Belum Disetujui'}</p>
                                            <p className="text-xs opacity-70 leading-relaxed mt-1">Pemohon telah menyetujui pernyataan tidak memiliki rumah dan bersedia mematuhi Perwal No. 36/2017 secara digital saat pendaftaran.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 gap-4">
                                <div className="text-center">
                                    <h4 className="text-blue-900 dark:text-blue-300 font-bold text-lg">Konfirmasi Verifikasi</h4>
                                    <p className="text-blue-700/70 dark:text-blue-400/70 text-sm">Dengan menekan tombol di bawah, Anda menyatakan bahwa semua dokumen fisik/digital di atas telah sesuai dengan aslinya.</p>
                                </div>
                                
                                {viewingDocsApp.is_documents_verified ? (
                                    <div className="flex items-center gap-2 text-green-600 font-bold px-6 py-3 bg-green-100 rounded-2xl border border-green-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                        DOKUMEN TELAH DIVERIFIKASI
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleVerifyAll(viewingDocsApp.id)}
                                        disabled={verifying}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                    >
                                        {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        VERIFIKASI SEMUA DOKUMEN SEKARANG
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
