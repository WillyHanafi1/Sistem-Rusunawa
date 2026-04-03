"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    Plus, Loader2, X, Filter, Calendar, CreditCard, CheckCircle2, AlertTriangle, TrendingUp, Search
} from "lucide-react";

interface Invoice {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
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
    teguran1_number?: string | null;
    teguran1_date?: string | null;
    teguran2_number?: string | null;
    teguran2_date?: string | null;
    teguran3_number?: string | null;
    teguran3_date?: string | null;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

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
    const [saving, setSaving] = useState(false);
    const [modalTab, setModalTab] = useState<"individu" | "massal">("individu");

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
                api.get(`/invoices/?month=${filterMonth}&year=${filterYear}&limit=9999`), 
                api.get("/tenants/")
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

    const handleGenerate = async () => {
        setSaving(true);
        try {
            if (modalTab === "individu") {
                await api.post("/invoices/generate", { ...form, tenant_id: Number(form.tenant_id) });
                setModalGen(false);
            } else {
                const payload = {
                    ...form,
                    start_skrd_no: form.start_skrd_no ? Number(form.start_skrd_no) : null
                };
                const res = await api.post("/invoices/mass-generate", payload);
                alert(res.data.message);
                setModalGen(false);
            }
            fetchAll();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!modalPay) return;
        setSaving(true);
        try {
            // Kita simulasikan memanggil midtrans / mencatat lunas manual di backend
            // Jika backend belum punya endpoint pay manual khusus, kita update pakai PATCH
            await api.patch(`/invoices/${modalPay.id}`, { status: "paid", paid_at: new Date().toISOString() });
            setModalPay(null);
            fetchAll();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Gagal mencatat pembayaran");
        } finally {
            setSaving(false);
        }
    }

    const filtered = useMemo(() => {
        let res = invoices;
        if (activeTab === "belum_lunas") res = res.filter(i => i.status === "unpaid" || i.status === "overdue");
        if (activeTab === "lunas") res = res.filter(i => i.status === "paid");
        
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(i => 
                i.tenant_name.toLowerCase().includes(lower) || 
                String(i.unit_number).includes(lower)
            );
        }
        return res;
    }, [invoices, activeTab, searchTerm]);

    // KPI Progress
    const progress = useMemo(() => {
        const total = invoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0);
        const collected = invoices.filter(i => i.status === "paid").reduce((acc, inv) => acc + Number(inv.total_amount), 0);
        const percent = total === 0 ? 0 : Math.round((collected / total) * 100);
        return { total, collected, percent };
    }, [invoices]);

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tagihan Sewa</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Kelola tagihan bulanan dan penerimaan kas
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-1.5 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 px-3 text-slate-400"><Calendar className="w-4 h-4" /></div>
                        <select 
                            value={filterMonth} 
                            onChange={e => setFilterMonth(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold focus:outline-none pr-2 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <input 
                            type="number" 
                            value={filterYear} 
                            onChange={e => setFilterYear(Number(e.target.value))}
                            className="w-16 bg-transparent text-sm font-bold focus:outline-none px-2 text-slate-700 dark:text-slate-200"
                        />
                    </div>

                    <button onClick={() => setModalGen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                        <Plus className="w-4 h-4" /> Generate Tagihan
                    </button>
                </div>
            </div>

            {/* Progress Bar Kas */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl shadow-slate-900/20 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="w-64 h-64 text-white" />
                </div>
                
                <div className="relative z-10">
                    <h3 className="text-slate-300 text-sm font-bold tracking-wider uppercase mb-1">Kolektabilitas {MONTHS[filterMonth - 1]} {filterYear}</h3>
                    <div className="flex items-end gap-3 mb-6">
                        <h2 className="text-4xl md:text-5xl font-black text-white">Rp {progress.collected.toLocaleString("id-ID")}</h2>
                        <span className="text-slate-400 font-medium pb-2">/ Rp {progress.total.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="h-3 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${progress.percent}%` }}
                        >
                            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-full">
                                <div className="w-full h-full bg-white/20 -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                        <span>Penerimaan Kas</span>
                        <span className="text-emerald-400">{progress.percent}% Masuk</span>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto">
                    {[
                        { id: "belum_lunas", label: "Belum Lunas", count: invoices.filter(i => i.status === "unpaid" || i.status === "overdue").length },
                        { id: "lunas", label: "Lunas", count: invoices.filter(i => i.status === "paid").length },
                        { id: "semua", label: "Semua", count: invoices.length }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={`flex-1 md:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === t.id ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                            {t.label} <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === t.id ? "bg-blue-100 dark:bg-blue-500/20" : "bg-slate-200 dark:bg-slate-700"}`}>{t.count}</span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Cari Penghuni / Unit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white font-medium shadow-sm"
                    />
                </div>
            </div>

            {/* Data Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Memuat data tagihan...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl py-20 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg">Tidak ada data</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tidak ditemukan tagihan dengan filter tersebut.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 uppercase">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Unit & Penghuni</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">No. SKRD</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Sewa Pokok</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Total Tagihan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filtered.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{row.tenant_name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gd. {row.building} - Unit <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{row.unit_number}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Priority: show the current document's number based on status column logic or model field */}
                                            {row.skrd_number || row.teguran1_number || row.teguran2_number || row.teguran3_number ? (
                                                <div className="flex flex-col gap-1">
                                                    {row.skrd_number && (
                                                        <div className="text-[10px] font-mono text-slate-400">SKRD: {row.skrd_number}</div>
                                                    )}
                                                    {row.teguran1_number && (
                                                        <div className="text-[10px] font-mono text-blue-500 font-bold">T1: {row.teguran1_number}</div>
                                                    )}
                                                    {row.teguran2_number && (
                                                        <div className="text-[10px] font-mono text-amber-600 font-bold">T2: {row.teguran2_number}</div>
                                                    )}
                                                    {row.teguran3_number && (
                                                        <div className="text-[10px] font-mono text-red-600 font-bold">T3: {row.teguran3_number}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">Belum ada No.</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-slate-600 dark:text-slate-400">Rp {Number(row.base_rent).toLocaleString("id-ID")}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 dark:text-white">Rp {Number(row.total_amount).toLocaleString("id-ID")}</div>
                                            {(row.status === "unpaid" || row.status === "overdue") && (
                                                <div className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Jatuh Tempo: {new Date(row.due_date).toLocaleDateString('id-ID')}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.status === "paid" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${row.status === "overdue" ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20" : "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20"}`}>
                                                    {row.status === "overdue" ? "Jatuh Tempo" : "Belum Bayar"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {row.status !== "paid" && (
                                                <button onClick={() => setModalPay(row)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:-translate-y-0.5">
                                                    Set Lunas
                                                </button>
                                            )}
                                            {row.status === "paid" && (
                                                <span className="text-xs text-slate-400 font-medium italic">Telah dibayar</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Quick Pay (Slide over imitation in center) */}
            {modalPay && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-20"><CheckCircle2 className="w-24 h-24" /></div>
                            <h2 className="text-xl font-bold relative z-10">Konfirmasi Pembayaran</h2>
                            <p className="text-emerald-100 text-xs mt-1 relative z-10">Pencatatan pelunasan manual</p>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-white/5 mb-6 text-center">
                                <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Total Tagihan</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">Rp {Number(modalPay.total_amount).toLocaleString("id-ID")}</div>
                                <div className="text-[10px] mt-2 font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 inline-block px-2 py-0.5 rounded">
                                    {modalPay.tenant_name} • Unit {modalPay.unit_number}
                                </div>
                            </div>
                            <button onClick={handleConfirmPayment} disabled={saving}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : "Konfirmasi Lunas"}
                            </button>
                            <button onClick={() => setModalPay(null)} className="w-full mt-2 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-bold transition-colors">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Generate is kept similar, avoiding bloat here for brevity but fully functioning based on states added */}
            {modalGen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generate Tagihan</h2>
                                    <p className="text-slate-500 text-xs mt-1">Buat invoice bulanan penghuni</p>
                                </div>
                                <button onClick={() => setModalGen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                                <button onClick={() => setModalTab("individu")} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modalTab === "individu" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}>Individu</button>
                                <button onClick={() => setModalTab("massal")} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modalTab === "massal" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}>Massal (Semua)</button>
                            </div>

                            <div className="space-y-4">
                                {modalTab === "individu" && (
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5 ml-1">Penghuni</label>
                                        <select value={form.tenant_id} onChange={e => setForm((f: any) => ({ ...f, tenant_id: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                            <option value={0}>-- Pilih Penghuni --</option>
                                            {tenants.map((t: any) => <option key={t.id} value={t.id}>Penghuni #{t.id}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5 ml-1">Jatuh Tempo</label>
                                        <input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-[11px] focus:outline-none font-bold" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Lain-lain (Rp)</label>
                                        <input type="number" value={form.other_charge} onChange={e => setForm((f: any) => ({ ...f, other_charge: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" />
                                    </div>
                                    {modalTab === "massal" && (
                                        <div className="col-span-2">
                                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                            <label className="block text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Penomoran SKRD Otomatis</label>
                                            <input 
                                                type="number" 
                                                placeholder="Contoh: 2363 (Kosongkan jika tidak ingin menomori)"
                                                value={form.start_skrd_no} 
                                                onChange={e => setForm((f: any) => ({ ...f, start_skrd_no: e.target.value }))}
                                                className="w-full bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl px-4 py-3 text-sm text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold placeholder:italic placeholder:font-normal" 
                                            />
                                            <p className="text-[10px] text-slate-400 mt-2 px-1">Nomor akan di-generate berurutan: 974/SKRD/[KODE].[NO]/UPTD.RSN/[BULAN]/[TAHUN]</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex gap-3">
                            <button onClick={handleGenerate} disabled={saving || (!form.due_date)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Diproses</> : "Generate Tagihan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
