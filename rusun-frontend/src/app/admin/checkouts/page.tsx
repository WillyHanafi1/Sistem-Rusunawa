"use client";

import { useEffect, useState, useMemo } from "react";
import { 
    Search, Filter, CheckCircle2, XCircle, Clock, Info, 
    ArrowRight, Loader2, Banknote, User, Home, Calendar,
    MessageSquare, AlertCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

interface Checkout {
    id: string;
    tenant_id: string;
    checkout_date: string;
    status: "requested" | "approved" | "rejected";
    inspection_notes?: string;
    refund_amount: number;
    created_at: string;
    tenant_name?: string;
    room_number?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_holder?: string;
}

const SITE_ORDER: Record<string, number> = {
    "Cigugur Tengah": 1,
    "Cibeureum": 2,
    "Leuwigajah": 3
};

export default function CheckoutsPage() {
    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    
    // Action states
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
    const [notes, setNotes] = useState("");

    const fetchCheckouts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/checkouts");
            setCheckouts(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengambil data putus kontrak");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckouts();
    }, []);

    const handleAction = async (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        try {
            await api.patch(`/checkouts/${id}?status=${status}&notes=${encodeURIComponent(notes)}`);
            
            toast.success(status === "approved" ? "Putus kontrak disetujui" : "Putus kontrak ditolak");
            setSelectedCheckout(null);
            setNotes("");
            fetchCheckouts();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Gagal memproses";
            toast.error(errorMsg);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredCheckouts = useMemo(() => {
        return checkouts
            .filter(c => {
                const matchesSearch = (c.tenant_name?.toLowerCase().includes(search.toLowerCase()) || 
                                     c.room_number?.toLowerCase().includes(search.toLowerCase()));
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                // Extract site from room_number "Site - Building Floor Unit"
                const siteA = a.room_number?.split(" - ")[0] || "";
                const siteB = b.room_number?.split(" - ")[0] || "";
                
                const priorityA = SITE_ORDER[siteA] || 99;
                const priorityB = SITE_ORDER[siteB] || 99;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                // Secondary sort: Newest first
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [checkouts, search, statusFilter]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            approved: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-100 dark:border-green-500/20",
            rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20",
            requested: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
        };
        const labels = { approved: "Disetujui", rejected: "Ditolak", requested: "Menunggu" };
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${styles[status as keyof typeof styles]}`}>
                {getStatusIcon(status)}
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-blue-900/20">
                            <Banknote className="w-6 h-6 text-white" />
                        </div>
                        Pengembalian Unit / Putus Kontrak
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manajemen penghentian sewa penghuni dan pengembalian uang jaminan.</p>
                </div>
                
                <button onClick={fetchCheckouts} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </button>
            </div>

            {/* Stats Summary (Mini) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Menunggu</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{checkouts.filter(c => c.status === 'requested').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Disetujui</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{checkouts.filter(c => c.status === 'approved').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Refund</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            Rp {checkouts.filter(c => c.status === 'approved').reduce((acc, curr) => acc + curr.refund_amount, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Cari nama penghuni atau nomor unit..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 ml-2" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="requested">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <p className="text-slate-500 font-bold animate-pulse">Memuat data permintaan...</p>
                    </div>
                ) : filteredCheckouts.length === 0 ? (
                    <div className="px-6 py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto ring-8 ring-slate-100 dark:ring-slate-900/50">
                            <Info className="w-10 h-10 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900 dark:text-white">Tidak Ada Pengajuan</p>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">Belum ada penghuni yang mengajukan putus kontrak atau kriteria pencarian tidak cocok.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Penghuni & Unit</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Rekening Refund</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Jumlah Jaminan</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {filteredCheckouts.map((c) => (
                                        <motion.tr 
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={c.id} 
                                            className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100 dark:border-blue-500/20">
                                                        {c.room_number || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{c.tenant_name || 'Tidak diketahui'}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Checkout: {new Date(c.checkout_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {c.bank_name ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                            <Banknote className="w-3 h-3 text-slate-400" />
                                                            {c.bank_name} - {c.bank_account_number}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase truncate max-w-[150px]">a.n {c.bank_account_holder}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">Data bank belum diisi</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">Rp {c.refund_amount.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    {getStatusBadge(c.status)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {c.status === 'requested' ? (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedCheckout(c);
                                                            setNotes("");
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                                    >
                                                        Tinjau
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedCheckout(c)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all ml-auto"
                                                    >
                                                        <Info className="w-5 h-5" />
                                                    </button>
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

            {/* Review Modal */}
            <AnimatePresence>
                {selectedCheckout && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Tinjauan Putus Kontrak</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedCheckout.tenant_name} ({selectedCheckout.room_number})</p>
                                </div>
                                <button onClick={() => setSelectedCheckout(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rencana Keluar</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedCheckout.checkout_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Jaminan</p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Rp {selectedCheckout.refund_amount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Banknote className="w-5 h-5 text-blue-500" />
                                        <h3 className="font-bold text-sm uppercase tracking-wide">Data Pengiriman Refund</h3>
                                    </div>
                                    <div className="p-5 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                            <p className="text-slate-500 font-medium">Bank:</p>
                                            <p className="text-slate-900 dark:text-white font-bold">{selectedCheckout.bank_name || '-'}</p>
                                            <p className="text-slate-500 font-medium">Nomor Rekening:</p>
                                            <p className="text-slate-900 dark:text-white font-bold">{selectedCheckout.bank_account_number || '-'}</p>
                                            <p className="text-slate-500 font-medium">Nama Pemilik:</p>
                                            <p className="text-slate-900 dark:text-white font-bold">{selectedCheckout.bank_account_holder || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Catatan Inspeksi / Alasan (Admin)
                                    </label>
                                    {selectedCheckout.status === 'requested' ? (
                                        <textarea 
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white min-h-[100px]"
                                            placeholder="Tulis hasil inspekti unit (ex: Kamar bersih, kunci dikembalikan, dll)..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    ) : (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 italic">
                                            {selectedCheckout.inspection_notes || "Tidak ada catatan"}
                                        </div>
                                    )}
                                </div>

                                {selectedCheckout.status === 'requested' && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                            <strong>PENTING:</strong> Menyetujui putus kontrak akan otomatis menonaktifkan status hunian penghuni dan mengosongkan unit kamar di sistem. Pastikan dana jaminan sudah ditransfer manual.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedCheckout.status === 'requested' && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                    <button 
                                        disabled={!!processingId}
                                        onClick={() => handleAction(selectedCheckout.id, 'rejected')}
                                        className="flex-1 px-6 py-3.5 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Tolak Permintaan
                                    </button>
                                    <button 
                                        disabled={!!processingId}
                                        onClick={() => handleAction(selectedCheckout.id, 'approved')}
                                        className="flex-[2] px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Setujui & Selesaikan
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
