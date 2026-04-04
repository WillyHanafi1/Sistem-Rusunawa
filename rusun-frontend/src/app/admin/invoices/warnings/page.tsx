"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    AlertTriangle, Loader2, Download, Search, CheckCircle2, XCircle, Bell, UserX, Info, Clock
} from "lucide-react";

interface Invoice {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    total_amount: number;
    status: string;
    document_type?: string;
    room_number: string;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    tenant_name: string;
}

const DOCUMENT_BADGE: Record<string, string> = {
    teguran1: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    teguran2: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    teguran3: "bg-red-500/10 text-red-600 border-red-500/30",
    strd: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const DOCUMENT_LABEL: Record<string, string> = {
    teguran1: "Surat Teguran 1 (SP1)",
    teguran2: "Surat Teguran 2 (SP2)",
    teguran3: "Surat Teguran 3 (Evakuasi)",
    strd: "STRD (Denda Belum SP)",
};

const MONTHS: Record<number, string> = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "Mei", 6: "Jun", 
    7: "Jul", 8: "Agu", 9: "Sep", 10: "Okt", 11: "Nov", 12: "Des"
};

export default function WarningsPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchOverdue = async () => {
        setLoading(true);
        try {
            // Fetch both unpaid (which might be late) and overdue
            const [unpaidRes, overdueRes] = await Promise.all([
                api.get("/invoices?status=unpaid&limit=9999"),
                api.get("/invoices?status=overdue&limit=9999"),
            ]);
            
            // Combine and filter those that have document_type strd/teguran
            const combined = [...unpaidRes.data, ...overdueRes.data];
            
            // Remove duplicates by ID (if any)
            const map = new Map();
            combined.forEach(inv => map.set(inv.id, inv));
            
            const unique = Array.from(map.values()) as Invoice[];
            
            // Filter only those in warning tracks (strd, teguran1, teguran2, teguran3)
            // or simply overdue
            const warningsList = unique.filter(i => 
                i.status === 'overdue' || 
                (i.document_type && ['strd', 'teguran1', 'teguran2', 'teguran3'].includes(i.document_type))
            );
            
            setInvoices(warningsList);
        } catch (err) {
            console.error("Failed to load warnings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverdue();
    }, []);

    const handleProcessOverdue = async () => {
        if (!confirm("Proses denda 2% dan naikkan status teguran untuk semua tagihan yang lewat dari tanggal 20 bulan ini?")) return;
        setProcessing(true);
        try {
            const res = await api.post("/tasks/process-overdue");
            alert(res.data.message);
            fetchOverdue();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Gagal memproses denda");
        } finally {
            setProcessing(false);
        }
    };

    const filtered = useMemo(() => {
        if (!searchTerm) return invoices;
        const low = searchTerm.toLowerCase();
        return invoices.filter(inv => 
            inv.tenant_name?.toLowerCase().includes(low) || 
            String(inv.unit_number).includes(low)
        );
    }, [searchTerm, invoices]);

    // KPI Counters
    const kpi = useMemo(() => {
        return {
            sp1: invoices.filter(i => i.document_type === 'teguran1').length,
            sp2: invoices.filter(i => i.document_type === 'teguran2').length,
            sp3: invoices.filter(i => i.document_type === 'teguran3').length,
            strd: invoices.filter(i => i.document_type === 'strd' || (i.status === 'overdue' && !['teguran1','teguran2','teguran3'].includes(i.document_type!))).length,
        };
    }, [invoices]);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pusat Peringatan (SP)</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Kelola penunggak, denda, dan surat peringatan
                    </p>
                </div>
                <button 
                    onClick={handleProcessOverdue}
                    disabled={processing}
                    className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-slate-200/50 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    {processing ? "Memproses..." : "Evaluasi Teguran Otomatis"}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Jatuh Tempo (STRD)</h3>
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{kpi.strd}</div>
                    <p className="text-xs text-slate-400 mt-1">Denda berjalan, belum SP</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Teguran 1 (SP1)</h3>
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{kpi.sp1}</div>
                    <p className="text-xs text-slate-400 mt-1">Tunggakan {'>'} 2 Bulan</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Teguran 2 (SP2)</h3>
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{kpi.sp2}</div>
                    <p className="text-xs text-slate-400 mt-1">Tunggakan {'>'} 3 Bulan</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm border-l-4 border-l-red-600 bg-red-50/30 dark:bg-red-900/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Penyegelan (SP3)</h3>
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 flex items-center justify-center"><UserX className="w-4 h-4" /></div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{kpi.sp3}</div>
                    <p className="text-xs text-red-500 mt-1">Siap Eksekusi Evakuasi/Segel</p>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-100 dark:border-white/10">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Cari Penghuni / Unit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white font-medium"
                        />
                    </div>
                    
                    <button className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                        <Download className="w-4 h-4" /> Export Laporan Penunggak
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 uppercase">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Unit & Penghuni</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Periode Menunggak</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Total Hutang</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Level Peringatan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                        <p className="text-sm text-slate-400 mt-4 font-medium">Memuat data penunggak...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-slate-900 dark:text-white font-bold mb-1">Tidak Ada Teguran</h3>
                                        <p className="text-sm text-slate-500">Semua luar biasa, tidak ada penghuni yang masuk kriteria peringatan saat ini.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((inv) => {
                                    const docType = inv.document_type || 'strd';
                                    const isCritical = docType === 'teguran3';
                                    
                                    return (
                                        <tr key={inv.id} className={`group transition-colors ${isCritical ? 'bg-red-50/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{inv.tenant_name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                    Gd. {inv.building} - Unit <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-bold">{inv.unit_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">{MONTHS[inv.period_month]}</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.period_year}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-900 dark:text-white">Rp {Number(inv.total_amount).toLocaleString("id-ID")}</div>
                                                <div className="text-[10px] text-red-500 font-bold uppercase mt-0.5 animate-pulse flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Termasuk Denda 2%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${DOCUMENT_BADGE[docType] || DOCUMENT_BADGE['strd']}`}>
                                                    {isCritical && <AlertTriangle className="w-3 h-3" />}
                                                    {DOCUMENT_LABEL[docType] || DOCUMENT_LABEL['strd']}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                                                    Cetak Surat
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
