"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Search, Loader2, XCircle, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
    id: number;
    nik: string;
    full_name: string;
    phone_number: string;
    email: string;
    rusunawa_target: string;
    family_members_count: number;
    status: "pending" | "approved" | "rejected";
    ktp_file_path: string | null;
    created_at: string;
}

export default function ApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Action State
    const [actionLoading, setActionLoading] = useState<number | null>(null);

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

    const handleUpdateStatus = async (appId: number, status: "approved" | "rejected") => {
        if (!confirm(`Apakah Anda yakin ingin mengubah status pengajuan ini menjadi ${status.toUpperCase()}?`)) return;

        try {
            setActionLoading(appId);
            await api.patch(`/applications/${appId}`, { status });
            // Refresh list
            fetchApplications();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal mengubah status pengajuan.");
        } finally {
            setActionLoading(null);
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
            default:
                return null;
        }
    };

    const handleDownloadKtp = async (filePath: string) => {
        try {
            // filePath dari DB formatnya: `uploads\ktp_nik_hash.jpg`
            // API melayani static files via `/api/uploads/...`
            // Karena Windows menggunakan backslash \, replace dengan / untuk URL.
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
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Data Pengajuan
                    </h1>
                    <p className="text-slate-500 mt-1">Kelola data pendaftaran sewa rusunawa dari website.</p>
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
                                    <th className="px-6 py-4">Pendaftar</th>
                                    <th className="px-6 py-4">Lokasi Target</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Berkas</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
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
                                            <td className="px-6 py-4 min-w-[250px]">
                                                <div className="font-bold text-slate-900 dark:text-white">{app.full_name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                                                    <p>NIK: <span className="font-mono">{app.nik}</span></p>
                                                    <p>WA: {app.phone_number}</p>
                                                    <p>Email: {app.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-blue-600 dark:text-blue-400">{app.rusunawa_target}</div>
                                                <div className="text-xs text-slate-500">{app.family_members_count} Anggota Keluarga</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(app.status)}
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
                                                {app.status === "pending" && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(app.id, "approved")}
                                                            disabled={actionLoading === app.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 hover:border-green-500 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-green-500/20 disabled:opacity-50"
                                                        >
                                                            {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            Terima
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(app.id, "rejected")}
                                                            disabled={actionLoading === app.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-red-500/20 disabled:opacity-50"
                                                        >
                                                            {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                            Tolak
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
