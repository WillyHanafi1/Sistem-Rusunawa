"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    Search, User, MapPin, Calendar, Clock, 
    FileText, AlertTriangle, CheckCircle2, XCircle, 
    ChevronRight, Loader2, Info
} from "lucide-react";

interface Tenant {
    id: number;
    user_id: number;
    room_id: number;
    user?: { name: string; email: string; phone: string };
    room?: { rusunawa: string; building: string; floor: number; unit_number: string };
    contract_start: string;
    contract_end: string;
    is_active: boolean;
}

interface ItemBase {
    id: number;
    created_at: string;
}

interface Invoice extends ItemBase {
    period_month: number;
    period_year: number;
    base_rent: number;
    total_amount: number;
    status: string;
    paid_at?: string;
    document_type?: string;
}

interface Ticket extends ItemBase {
    category: string;
    title: string;
    description: string;
    status: string;
    resolved_at?: string;
}

interface TenantHistory {
    invoices: Invoice[];
    tickets: Ticket[];
}

const STATUS_BADGE: Record<string, string> = {
    unpaid: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    closed: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const STATUS_LABEL: Record<string, string> = {
    unpaid: "Belum Lunas", paid: "Lunas", overdue: "Jatuh Tempo", cancelled: "Dibatalkan",
    open: "Baru", in_progress: "Diproses", resolved: "Selesai", closed: "Ditutup"
};

const MONTHS: Record<number, string> = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "Mei", 6: "Jun", 
    7: "Jul", 8: "Agu", 9: "Sep", 10: "Okt", 11: "Nov", 12: "Des"
};

export default function TenantHistoryPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [historyData, setHistoryData] = useState<TenantHistory | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [tab, setTab] = useState<"invoices" | "tickets">("invoices");

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                // Assuming we have user/room preloads or we just show IDs if preloads aren't immediately available
                const res = await api.get("/tenants/?limit=500");
                setTenants(res.data);
            } catch (err) {
                console.error("Failed to load tenants", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    useEffect(() => {
        if (!selectedTenant) return;
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await api.get(`/tenants/${selectedTenant.id}/history`);
                setHistoryData(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [selectedTenant]);

    const filteredTenants = useMemo(() => {
        if (!searchTerm) return tenants;
        const lowerSearch = searchTerm.toLowerCase();
        return tenants.filter(t => 
            t.user?.name?.toLowerCase().includes(lowerSearch) ||
            t.room?.unit_number?.toLowerCase().includes(lowerSearch) ||
            String(t.id).includes(lowerSearch)
        );
    }, [tenants, searchTerm]);

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Riwayat Penghuni</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Lacak rekam jejak tagihan dan aduan penghuni</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Left Pane: Tenant List */}
                <div className="w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 dark:border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Cari nama / unit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">Tidak ada penghuni ditemukan</div>
                        ) : (
                            filteredTenants.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setSelectedTenant(t)}
                                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedTenant?.id === t.id ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'} border`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {t.user?.name || `Penghuni #${t.id}`}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" /> 
                                            {t.room ? `${t.room.building} - ${t.room.unit_number}` : `Kamar #${t.room_id}`}
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedTenant?.id === t.id ? 'text-blue-600 translate-x-1' : 'text-slate-300 group-hover:text-slate-400 dark:text-slate-600'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Pane: Details & Timeline */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col min-h-0">
                    {!selectedTenant ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Penghuni</h3>
                                <p className="text-sm mt-1 max-w-sm">Pilih penghuni dari panel di sebelah kiri untuk melihat rekam jejak, riwayat tagihan, dan histori aduan mereka.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Profile Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {selectedTenant.user?.name || `Penghuni #${selectedTenant.id}`}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedTenant.room ? `Gd. ${selectedTenant.room.building} - Unit ${selectedTenant.room.unit_number}` : `Kamar #${selectedTenant.room_id}`}</span>
                                                <span className="hidden md:inline text-slate-300">•</span>
                                                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(selectedTenant.contract_start).toLocaleDateString("id-ID")} - {new Date(selectedTenant.contract_end).toLocaleDateString("id-ID")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedTenant.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            {selectedTenant.is_active ? 'Status Aktif' : 'Tidak Aktif / Keluar'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-6 border-b border-slate-100 dark:border-white/10 gap-6 mt-2">
                                <button onClick={() => setTab("invoices")} className={`py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === "invoices" ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                    <FileText className="w-4 h-4" /> Riwayat Tagihan ({historyData?.invoices.length || 0})
                                </button>
                                <button onClick={() => setTab("tickets")} className={`py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === "tickets" ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                    <AlertTriangle className="w-4 h-4" /> Riwayat Aduan ({historyData?.tickets.length || 0})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-transparent">
                                {loadingHistory ? (
                                    <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                                ) : (
                                    <div className="max-w-3xl space-y-4 relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        
                                        {tab === "invoices" && (
                                            historyData?.invoices.length === 0 ? (
                                                <div className="text-center py-10 text-slate-500 italic">Belum ada riwayat tagihan.</div>
                                            ) : (
                                                historyData?.invoices.map((inv, idx) => (
                                                    <div key={inv.id} className="flex gap-4 relative z-10 group">
                                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${inv.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'} shadow-sm transition-transform group-hover:scale-105`}>
                                                            <span className="text-[10px] font-bold uppercase">{MONTHS[inv.period_month]}</span>
                                                            <span className="text-sm font-black leading-none mt-0.5">{inv.period_year}</span>
                                                        </div>
                                                        <div className="flex-1 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-slate-900 dark:text-white">Tagihan #{inv.id}</h4>
                                                                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${STATUS_BADGE[inv.status]}`}>
                                                                        {STATUS_LABEL[inv.status]}
                                                                    </span>
                                                                    {inv.document_type && inv.document_type !== 'skrd' && (
                                                                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border bg-red-500/10 text-red-600 border-red-500/20 animate-pulse">
                                                                            {inv.document_type}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" /> Ditagihkan: {new Date(inv.created_at).toLocaleDateString('id-ID')}</p>
                                                            </div>
                                                            <div className="text-left sm:text-right">
                                                                <div className="font-black text-slate-900 dark:text-white">Rp {Number(inv.total_amount).toLocaleString("id-ID")}</div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                    {inv.paid_at ? (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Lunas {new Date(inv.paid_at).toLocaleDateString("id-ID")}</span>
                                                                    ) : (
                                                                        <span className="text-amber-600 dark:text-amber-500 flex items-center sm:justify-end gap-1"><Info className="w-3 h-3" /> Menunggu Pembayaran</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        )}

                                        {tab === "tickets" && (
                                            historyData?.tickets.length === 0 ? (
                                                <div className="text-center py-10 text-slate-500 italic">Belum ada riwayat aduan.</div>
                                            ) : (
                                                historyData?.tickets.map((tckt) => (
                                                    <div key={tckt.id} className="flex gap-4 relative z-10 group">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${tckt.status === 'resolved' || tckt.status === 'closed' ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700' : 'bg-red-50 border-red-100 text-red-500 dark:bg-red-500/10 dark:border-red-500/20'} shadow-sm`}>
                                                            {tckt.status === 'resolved' || tckt.status === 'closed' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                                        </div>
                                                        <div className="flex-1 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{tckt.category}</span>
                                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${STATUS_BADGE[tckt.status]}`}>{STATUS_LABEL[tckt.status] || tckt.status}</span>
                                                            </div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{tckt.title}</h4>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">{tckt.description}</p>
                                                            
                                                            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-4">
                                                                <span>Dilaporkan: {new Date(tckt.created_at).toLocaleDateString("id-ID")}</span>
                                                                {tckt.resolved_at && <span>Diselesaikan: {new Date(tckt.resolved_at).toLocaleDateString("id-ID")}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
