"use client";

import { useState, useEffect } from "react";
import { 
    FileText, 
    Search, 
    Filter, 
    Download, 
    Eye, 
    ShieldCheck,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    Calendar,
    ArrowUpDown
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

// Helper functions defined locally to avoid missing module errors
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
};

export default function DepositInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [rusunFilter, setRusunFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        totalAmount: 0
    });

    const rusunawas = ["all", "Cigugur Tengah", "Cibeureum", "Leuwigajah"];

    useEffect(() => {
        fetchInvoices();
    }, [rusunFilter, statusFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params: any = {
                document_type: "jaminan",
                year: new Date().getFullYear(),
                limit: 9999
            };
            if (statusFilter !== "all") params.status = statusFilter;

            const response = await api.get("/invoices", { params });
            let data = response.data;

            // Manual filter for Rusunawa if needed (if backend doesn't support it directly in this endpoint)
            if (rusunFilter !== "all") {
                data = data.filter((inv: any) => inv.tenant?.room?.rusunawa === rusunFilter);
            }

            setInvoices(data);
            
            // Calculate stats
            setStats({
                total: data.length,
                paid: data.filter((i: any) => i.status === "paid").length,
                unpaid: data.filter((i: any) => i.status === "unpaid").length,
                totalAmount: data.reduce((acc: number, curr: any) => acc + curr.total_amount, 0)
            });
        } catch (error) {
            console.error("Failed to fetch deposit invoices:", error);
            toast.error("Gagal mengambil data invoice jaminan");
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const searchLower = search.toLowerCase();
        return (
            inv.jaminan_number?.toLowerCase().includes(searchLower) ||
            inv.tenant?.name?.toLowerCase().includes(searchLower) ||
            inv.tenant?.room?.room_number?.toLowerCase().includes(searchLower)
        );
    });

    const handleDownload = async (invoiceId: number, number: string) => {
        try {
            const response = await api.get(`/api/invoices/${invoiceId}/document`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Gagal mengunduh dokumen");
        }
    };


    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        Invoices Uang Jaminan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola dan pantau pembayaran jaminan (Security Deposit) penghuni baru.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchInvoices}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
                    >
                        <ArrowUpDown className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Invoice</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Terbayar</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">{stats.paid}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Belum Bayar</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">{stats.unpaid}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Nilai Jaminan</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-500">{formatCurrency(stats.totalAmount)}</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input 
                        placeholder="Cari Nama, Unit, atau No. JKRD..." 
                        className="w-full pl-10 h-10 px-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        className="h-10 px-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={rusunFilter}
                        onChange={(e) => setRusunFilter(e.target.value)}
                    >
                        {rusunawas.map(r => (
                            <option key={r} value={r}>{r === 'all' ? 'Semua Rusunawa' : r}</option>
                        ))}
                    </select>
                    <select 
                        className="h-10 px-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="unpaid">Belum Bayar</option>
                        <option value="paid">Terbayar</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                            <tr>
                                <th className="px-6 py-4">No. JKRD</th>
                                <th className="px-6 py-4">Penghuni / Unit</th>
                                <th className="px-6 py-4">Bulan/Tahun</th>
                                <th className="px-6 py-4 text-right">Total Tagihan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 tracking-tight">{inv.jaminan_number}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 dark:text-white">{inv.tenant?.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                                    <Building2 className="w-3 h-3" /> {inv.tenant?.room?.rusunawa} - {inv.tenant?.room?.room_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {inv.period_month}/{inv.period_year}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(inv.total_amount)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {inv.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3" /> Terbayar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                                    <Clock className="w-3 h-3" /> Belum Bayar
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Detail">
                                                    <Eye className="w-4.5 h-4.5" />
                                                </button>
                                                <button 
                                                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    onClick={() => handleDownload(inv.id, inv.jaminan_number)}
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada data invoice jaminan yang ditemukan.</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Gunakan filter atau pencarian lain untuk mencari data.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
