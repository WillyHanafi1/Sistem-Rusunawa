"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    Plus, Loader2, X, Filter, Calendar, CreditCard, CheckCircle2, AlertTriangle, TrendingUp, Search,
    CheckSquare, Square, Printer, Eye, ChevronRight, DollarSign, Wallet, ArrowUpRight, Percent,
    FileText, User, Building2, MapPin, Hash, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
    parking_charge: number; // Added
    total_amount: number;
    due_date: string;
    status: string;
    paid_at?: string | null;
    room_number: string;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    tenant_name: string;
    payment_url?: string;
    skrd_number?: string | null;
    skrd_date?: string | null;
    document_type: string;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const SITE_ORDER: Record<string, number> = { "Cigugur Tengah": 1, "Cibeureum": 2, "Leuwigajah": 3 };

// --- Premium UI Components ---

const StatCard = ({ title, value, icon: Icon, color, sub, trend }: any) => (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 blur-[80px] -mr-8 -mt-8 opacity-20 bg-${color}-500 group-hover:opacity-40 transition-opacity`} />
        <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-500/10 rounded-2xl flex items-center justify-center text-${color}-600 dark:text-${color}-400 ring-4 ring-${color}-50/50 dark:ring-0`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full text-[10px] font-bold">
                        <ArrowUpRight className="w-3 h-3" /> {trend}
                    </div>
                )}
            </div>
            <div>
                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{title}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{value}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                    {sub}
                </div>
            </div>
        </div>
    </motion.div>
);

const Badge = ({ children, status, glow }: any) => {
    const variants: any = {
        lunas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/5",
        overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
        unpaid: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30",
        skrd: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
        strd: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition-all ${variants[status] || variants.unpaid} ${glow ? 'shadow-lg shadow-current/20' : ''}`}>
            {children}
        </span>
    );
};

export default function RentInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Tabs
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
    const [activeTab, setActiveTab] = useState<"semua" | "belum_lunas" | "lunas">("belum_lunas");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [modalGen, setModalGen] = useState(false);
    const [modalPay, setModalPay] = useState<Invoice | null>(null);
    const [modalBulkPay, setModalBulkPay] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalTab, setModalTab] = useState<"individu" | "massal">("individu");

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkPaidAt, setBulkPaidAt] = useState(new Date().toISOString().split('T')[0]);

    const [form, setForm] = useState({
        tenant_id: 0,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        water_charge: 0,
        electricity_charge: 0,
        other_charge: 0,
        due_date: "",
        notes: "",
        start_skrd_no: "",
    });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [inv, ten] = await Promise.all([
                api.get(`/invoices?month=${filterMonth}&year=${filterYear}&limit=9999`), 
                api.get("/tenants")
            ]);
            setInvoices(inv.data);
            setTenants(ten.data.filter((t: any) => t.is_active));
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [filterMonth, filterYear]);

    useEffect(() => {
        const monthStr = filterMonth.toString().padStart(2, '0');
        const defaultDue = `${filterYear}-${monthStr}-21`;
        setForm(f => ({ ...f, period_month: filterMonth, period_year: filterYear, due_date: defaultDue }));
    }, [filterMonth, filterYear]);

    useEffect(() => {
        if (form.period_month && form.period_year) {
            const m = form.period_month.toString().padStart(2, '0');
            const d = `${form.period_year}-${m}-21`;
            setForm(f => ({ ...f, due_date: d }));
        }
    }, [form.period_month, form.period_year]);

    const handleGenerate = async () => {
        setSaving(true);
        try {
            if (modalTab === "individu") {
                await api.post("/invoices/generate", { ...form, tenant_id: Number(form.tenant_id) });
            } else {
                const payload = { ...form, start_skrd_no: form.start_skrd_no ? Number(form.start_skrd_no) : null };
                const res = await api.post("/invoices/mass-generate", payload);
                alert(res.data.message);
            }
            setModalGen(false);
            fetchAll();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Terjadi kesalahan");
        } finally { setSaving(false); }
    };

    const handleConfirmPayment = async () => {
        if (!modalPay) return;
        setSaving(true);
        try {
            await api.patch(`/invoices/${modalPay.id}`, { status: "paid", paid_at: new Date().toISOString() });
            setModalPay(null);
            fetchAll();
        } catch (e: any) { alert(e.response?.data?.detail || "Gagal mencatat pembayaran"); }
        finally { setSaving(false); }
    }

    const handleBulkPay = async () => {
        if (selectedIds.length === 0) return;
        setSaving(true);
        try {
            await api.post("/invoices/bulk-pay", { invoice_ids: selectedIds, paid_at: bulkPaidAt });
            setModalBulkPay(false);
            setSelectedIds([]);
            fetchAll();
        } catch (e: any) { alert(e.response?.data?.detail || "Gagal mencatat pembayaran masal"); }
        finally { setSaving(false); }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(i => i.id));
        }
    }

    const filtered = useMemo(() => {
        let res = [...invoices];
        if (activeTab === "belum_lunas") res = res.filter(i => i.status === "unpaid" || i.status === "overdue");
        if (activeTab === "lunas") res = res.filter(i => i.status === "paid");
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(i => i.tenant_name.toLowerCase().includes(lower) || String(i.unit_number).includes(lower));
        }
        return res.sort((a, b) => {
            const priorityA = SITE_ORDER[a.rusunawa] || 99;
            const priorityB = SITE_ORDER[b.rusunawa] || 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            if (a.building !== b.building) return a.building.localeCompare(b.building);
            if (a.floor !== b.floor) return a.floor - b.floor;
            return a.unit_number - b.unit_number;
        });
    }, [invoices, activeTab, searchTerm]);

    const stats = useMemo(() => {
        const total = filtered.reduce((acc, inv) => acc + Number(inv.total_amount), 0);
        const collected = filtered.filter(i => i.status === "paid").reduce((acc, inv) => acc + Number(inv.total_amount), 0);
        return { total, collected, unpaid: total - collected, count: filtered.length };
    }, [filtered]);

    const progressPercent = stats.total === 0 ? 0 : Math.round((stats.collected / stats.total) * 100);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 pb-32 w-full">
            {/* Header section remains premium... */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Tagihan Sewa</h1>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-medium ml-13">Pengelolaan retribusi hunian terpadu.</p>
                </div>
                {/* Filters, buttons... */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl shadow-sm">
                        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-transparent text-xs font-black focus:outline-none px-3 text-slate-900 dark:text-slate-200 uppercase">
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                        <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="w-20 bg-transparent text-xs font-black focus:outline-none px-3 text-slate-900 dark:text-slate-200" />
                    </div>
                    <motion.button onClick={() => setModalGen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Invoice
                    </motion.button>
                </div>
            </header>

            {/* Dashboards... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard title="Target Retribusi" value={`Rp ${stats.total.toLocaleString("id-ID")}`} icon={Wallet} color="blue" sub={`${stats.count} Dokumen`} />
                <StatCard title="Kas Masuk" value={`Rp ${stats.collected.toLocaleString("id-ID")}`} icon={CheckCircle2} color="emerald" trend={`${progressPercent}%`} sub="Terealisasi" />
                <StatCard title="Piutang Tertunda" value={`Rp ${stats.unpaid.toLocaleString("id-ID")}`} icon={AlertTriangle} color="rose" sub="Segera Tagih" />
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="text-slate-900 dark:text-white font-black text-xl tabular-nums">{progressPercent}%</div>
                        <Percent className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-auto">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Search & Tabs... */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
                    {["semua", "lunas", "belum_lunas"].map((t: any) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === t ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg" : "text-slate-400"}`}>
                            {t.replace("_", " ")}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" placeholder="Cari penghuni atau unit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none" />
                </div>
            </div>

            {/* --- REFINED COMPACT TABLE (Excel Style) --- */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse text-nowrap">
                        <thead className="bg-slate-50 dark:bg-white/[0.02]">
                            <tr className="border-b border-slate-100 dark:border-white/5">
                                <th className="py-2 px-3 w-8 text-center text-nowrap border-r border-slate-100 dark:border-white/5">
                                    <button onClick={toggleSelectAll} className="w-4 h-4 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all bg-white">
                                        {selectedIds.length === filtered.length && filtered.length > 0 && <CheckSquare className="w-full h-full bg-blue-600 text-white p-0.5" />}
                                    </button>
                                </th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap border-r border-slate-100 dark:border-white/5">Nama</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap border-r border-slate-100 dark:border-white/5">Rusunawa</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap text-center border-r border-slate-100 dark:border-white/5">Gd</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap text-center border-r border-slate-100 dark:border-white/5">Lt</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap text-center border-r border-slate-100 dark:border-white/5">Unit</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-nowrap border-r border-slate-100 dark:border-white/5">Sewa Hunian</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-nowrap border-r border-slate-100 dark:border-white/5">Parkir</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-nowrap border-r border-slate-100 dark:border-white/5">Total</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap border-r border-slate-100 dark:border-white/5">Status Pembayaran</th>
                                <th className="py-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {filtered.map((row) => (
                                <tr key={row.id} className={`group hover:bg-blue-50/30 dark:hover:bg-white/[0.02] transition-colors ${selectedIds.includes(row.id) ? "bg-blue-50/50 dark:bg-blue-500/5 text-blue-600" : ""}`}>
                                    <td className="py-1 px-3 text-center border-r border-slate-50 dark:border-white/5">
                                        <button onClick={() => toggleSelect(row.id)} className={`w-4 h-4 rounded-md border-2 mx-auto flex items-center justify-center transition-all ${selectedIds.includes(row.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white dark:bg-slate-800'}`}>
                                            {selectedIds.includes(row.id) && <CheckSquare className="w-full h-full p-0.5" />}
                                        </button>
                                    </td>
                                    <td className="py-1 px-3 text-[11px] font-black uppercase text-slate-900 dark:text-white truncate max-w-[200px] border-r border-slate-50 dark:border-white/5">{row.tenant_name}</td>
                                    <td className="py-1 px-3 text-[10px] font-bold text-slate-400 uppercase border-r border-slate-50 dark:border-white/5">{row.rusunawa}</td>
                                    <td className="py-1 px-3 text-[11px] font-black text-slate-800 dark:text-slate-300 text-center border-r border-slate-50 dark:border-white/5">{row.building}</td>
                                    <td className="py-1 px-3 text-[11px] font-black text-slate-800 dark:text-slate-300 text-center border-r border-slate-50 dark:border-white/5">{row.floor}</td>
                                    <td className="py-1 px-3 text-[11px] font-black text-slate-900 dark:text-white tabular-nums text-center border-r border-slate-50 dark:border-white/5">{row.unit_number}</td>
                                    <td className="py-1 px-3 text-[11px] font-black text-slate-700 dark:text-slate-400 text-right tabular-nums border-r border-slate-50 dark:border-white/5">Rp {Number(row.base_rent).toLocaleString("id-ID")}</td>
                                    <td className="py-1 px-3 text-[11px] font-black text-slate-700 dark:text-slate-400 text-right tabular-nums border-r border-slate-50 dark:border-white/5">Rp {Number(row.parking_charge || 0).toLocaleString("id-ID")}</td>
                                    <td className="py-1 px-3 text-[12px] font-black text-slate-900 dark:text-white text-right tabular-nums border-r border-slate-50 dark:border-white/5">Rp {Number(row.total_amount).toLocaleString("id-ID")}</td>
                                    <td className="py-1 px-3 border-r border-slate-50 dark:border-white/5">
                                        {row.status === 'paid' ? (
                                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {new Date(row.paid_at!).toLocaleDateString('id-ID')}</span>
                                        ) : (
                                            <Badge status={row.status}>{row.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Lunas'}</Badge>
                                        )}
                                    </td>
                                    <td className="py-1 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                                            {row.status !== 'paid' && (
                                                <button onClick={() => setModalPay(row)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Lunas</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals and other bulk bars remain functional as defined perviously... */}
             <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div initial={{ y: 100, x: "-50%", opacity: 0 }} animate={{ y: 0, x: "-50%", opacity: 1 }} exit={{ y: 100, x: "-50%", opacity: 0 }} className="fixed bottom-12 left-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 w-fit">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><CheckSquare className="w-4 h-4" /></div>
                            <div className="flex flex-col"><span className="text-sm font-black">{selectedIds.length} <span className="text-[10px] opacity-60">Terpilih</span></span></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setModalBulkPay(true)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Set Lunas Terpilih</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Modals... */}
            <AnimatePresence>
                {modalPay && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
                        <div className="bg-white dark:bg-slate-950 border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-[200px] overflow-hidden p-6 text-center scale-90">
                            <h2 className="text-sm font-black uppercase tracking-widest mb-2">Confirm</h2>
                            <div className="text-xl font-black mb-6">Rp {Number(modalPay.total_amount).toLocaleString("id-ID")}</div>
                            <button onClick={handleConfirmPayment} className="w-full bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase">Yes</button>
                            <button onClick={() => setModalPay(null)} className="mt-3 text-slate-400 text-[10px] font-black uppercase">Cancel</button>
                        </div>
                    </div>
                )}
                {modalBulkPay && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[60] p-6 text-center">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-[250px] scale-90 text-center">
                            <h2 className="text-lg font-black uppercase mb-4">Lunas Masal</h2>
                            <input type="date" value={bulkPaidAt} onChange={(e) => setBulkPaidAt(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-xs font-black mb-6 outline-none" />
                            <button onClick={handleBulkPay} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">Set Lunas</button>
                            <button onClick={() => setModalBulkPay(false)} className="mt-3 text-slate-400 text-[10px] font-black uppercase">Cancel</button>
                        </div>
                    </div>
                )}
                {modalGen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-2xl font-black uppercase">Generate</h2>
                                <button onClick={() => setModalGen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-10">
                                <button onClick={() => setModalTab("individu")} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${modalTab === "individu" ? "bg-white dark:bg-slate-700 shadow-lg" : "text-slate-400"}`}>Single</button>
                                <button onClick={() => setModalTab("massal")} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${modalTab === "massal" ? "bg-white dark:bg-slate-700 shadow-lg" : "text-slate-400"}`}>Mass</button>
                            </div>
                            <div className="space-y-6">
                                {modalTab === "individu" && (
                                    <select value={form.tenant_id} onChange={e => setForm((f: any) => ({ ...f, tenant_id: Number(e.target.value) }))} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-xs font-bold outline-none">
                                        <option value={0}>Select Target...</option>
                                        {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name} (Unit {t.unit_number})</option>)}
                                    </select>
                                )}
                                <div className="grid grid-cols-2 gap-6">
                                    <input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-xs font-black outline-none" />
                                    <input type="number" placeholder="Lain-lain" value={form.other_charge} onChange={e => setForm((f: any) => ({ ...f, other_charge: Number(e.target.value) }))} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-xs font-black outline-none" />
                                    {modalTab === "massal" && <input type="text" placeholder="Start SKRD No (e.g. 2363)" value={form.start_skrd_no} onChange={e => setForm((f: any) => ({ ...f, start_skrd_no: e.target.value }))} className="col-span-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl px-6 py-5 text-sm font-black outline-none" />}
                                </div>
                                <button onClick={handleGenerate} className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30">Execute</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
