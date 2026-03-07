"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Plus, Pencil, Loader2, X, Filter, Building2, Home, User, Calendar, CreditCard } from "lucide-react";

interface Invoice {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
    water_charge: number;
    electricity_charge: number;
    parking_charge: number;
    other_charge: number;
    total_amount: number;
    due_date: string;
    status: string;
    payment_url?: string;
    paid_at?: string | null;
    // Enriched fields from backend
    room_number: string;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    tenant_name: string;
    contract_start: string;
    contract_end: string;
}

interface Tenant { id: number; user_id: number; room_id: number; }

const STATUS_BADGE: Record<string, string> = {
    unpaid: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    paid: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    overdue: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    cancelled: "bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30",
};

const STATUS_LABEL: Record<string, string> = {
    unpaid: "Belum Lunas", paid: "Lunas", overdue: "Jatuh Tempo", cancelled: "Dibatalkan"
};

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
const toRoman = (n: number) => ROMAN[n] || String(n);

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [modalTab, setModalTab] = useState<"individu" | "massal">("individu");
    
    // Filters
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(now.getFullYear());

    const [form, setForm] = useState({
        tenant_id: 0,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        water_charge: 0,
        electricity_charge: 0,
        other_charge: 0,
        due_date: "",
        notes: "",
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
        setSaving(true); setError(""); setSuccessMsg("");
        try {
            if (modalTab === "individu") {
                await api.post("/invoices/generate", { ...form, tenant_id: Number(form.tenant_id) });
                setModal(false);
                fetchAll();
            } else {
                const res = await api.post("/invoices/mass-generate", {
                    period_month: form.period_month,
                    period_year: form.period_year,
                    other_charge: form.other_charge,
                    due_date: form.due_date,
                    notes: form.notes
                });
                setModal(false);
                alert(res.data.message);
                fetchAll();
            }
        } catch (e: any) {
            setError(e.response?.data?.detail || "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    // --- Table Definition ---
    const columnHelper = createColumnHelper<Invoice>();
    const columns = [
        columnHelper.accessor('rusunawa', {
            header: 'Rusunawa',
            cell: info => <span className="font-medium text-slate-900 dark:text-white">{info.getValue()}</span>,
        }),
        columnHelper.accessor('building', {
            header: 'Gd',
            cell: info => <span className="text-slate-600 dark:text-slate-400">{info.getValue()}</span>,
        }),
        columnHelper.accessor('floor', {
            header: 'Lt',
            cell: info => <span className="text-slate-600 dark:text-slate-400">{toRoman(info.getValue())}</span>,
        }),
        columnHelper.accessor('unit_number', {
            header: 'Unit',
            cell: info => <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{info.getValue()}</span>,
        }),
        columnHelper.accessor('tenant_name', {
            header: 'Nama',
            cell: info => <span className="text-slate-900 dark:text-white font-medium">{info.getValue()}</span>,
        }),
        columnHelper.accessor('contract_start', {
            header: 'Masa Kontrak',
            cell: info => (
                <div className="text-[10px] leading-tight text-slate-500">
                    <div className="whitespace-nowrap">{info.row.original.contract_start}</div>
                    <div className="whitespace-nowrap">s/d {info.row.original.contract_end}</div>
                </div>
            ),
        }),
        columnHelper.accessor('base_rent', {
            header: 'Sewa Dasar',
            cell: info => <span className="text-slate-600 dark:text-slate-300">Rp {Number(info.getValue()).toLocaleString("id-ID")}</span>,
        }),
        columnHelper.accessor('parking_charge', {
            header: 'Parkir Motor',
            cell: info => <span className="text-slate-600 dark:text-slate-300">Rp {Number(info.getValue()).toLocaleString("id-ID")}</span>,
        }),
        columnHelper.accessor('total_amount', {
            header: 'Total Bayar',
            cell: info => <span className="text-slate-900 dark:text-white font-bold">Rp {Number(info.getValue()).toLocaleString("id-ID")}</span>,
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold uppercase tracking-wider ${STATUS_BADGE[info.getValue()]}`}>
                    {STATUS_LABEL[info.getValue()]}
                </span>
            ),
        }),
        columnHelper.accessor('paid_at', {
            header: 'Tanggal Bayar',
            cell: info => {
                const date = info.getValue();
                if (!date) return <span className="text-slate-400 italic text-[10px]">Belum Bayar</span>;
                return <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">{new Date(date).toLocaleDateString("id-ID")}</span>;
            },
        }),
    ];

    const table = useReactTable({
        data: invoices,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const totalSum = invoices.reduce((acc: number, inv: Invoice) => acc + Number(inv.total_amount), 0);

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Tagihan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Monitoring dan generate invoice penghuni
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Filters */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-1.5 rounded-xl">
                        <div className="flex items-center gap-2 px-3 text-slate-400">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <select 
                            value={filterMonth} 
                            onChange={e => setFilterMonth(Number(e.target.value))}
                            className="bg-transparent text-sm font-medium focus:outline-none pr-2"
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <input 
                            type="number" 
                            value={filterYear} 
                            onChange={e => setFilterYear(Number(e.target.value))}
                            className="w-16 bg-transparent text-sm font-medium focus:outline-none px-2"
                        />
                    </div>

                    <button onClick={() => setModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <Plus className="w-4 h-4" /> Generate Tagihan
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Memuat data tagihan...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 uppercase">
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors group">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-3.5 text-sm transition-all">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {invoices.length > 0 && (
                                    <tr className="bg-slate-50 dark:bg-slate-800/30 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                                        <td colSpan={6} className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">TOTAL SELURUH TAGIHAN:</td>
                                        <td className="px-6 py-4 text-blue-600 dark:text-blue-400" colSpan={4}>
                                            Rp {totalSum.toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {invoices.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-semibold">Tidak ada tagihan</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Belum ada tagihan untuk periode {MONTHS[filterMonth - 1]} {filterYear}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Generate */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generate Tagihan</h2>
                                    <p className="text-slate-500 text-xs mt-1">Buat invoice bulanan penghuni</p>
                                </div>
                                <button onClick={() => setModal(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                                <button
                                    onClick={() => setModalTab("individu")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modalTab === "individu" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Individu
                                </button>
                                <button
                                    onClick={() => setModalTab("massal")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${modalTab === "massal" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Massal (Semua)
                                </button>
                            </div>

                            <div className="space-y-4">
                                {modalTab === "individu" && (
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Penghuni</label>
                                        <select value={form.tenant_id} onChange={e => setForm((f: any) => ({ ...f, tenant_id: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                            <option value={0}>-- Pilih Penghuni --</option>
                                            {tenants.map((t: any) => <option key={t.id} value={t.id}>Penghuni #{t.id}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Bulan</label>
                                        <select value={form.period_month} onChange={e => setForm((f: any) => ({ ...f, period_month: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center font-bold">
                                            {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Tahun</label>
                                        <input type="number" value={form.period_year} onChange={e => setForm((f: any) => ({ ...f, period_year: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center font-bold" />
                                    </div>
                                </div>
                                
                                {modalTab === "individu" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Air (Rp)", field: "water_charge" },
                                            { label: "Listrik (Rp)", field: "electricity_charge" },
                                        ].map(({ label, field }) => (
                                            <div key={field}>
                                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">{label}</label>
                                                <input type="number" value={(form as any)[field]} onChange={e => setForm((f: any) => ({ ...f, [field]: Number(e.target.value) }))}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Lain-lain (Rp)</label>
                                        <input type="number" value={form.other_charge} onChange={e => setForm((f: any) => ({ ...f, other_charge: Number(e.target.value) }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1">Jatuh Tempo</label>
                                        <input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" />
                                    </div>
                                </div>
                                
                                {error && <p className="text-red-400 text-xs bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20 font-medium">{error}</p>}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex gap-3">
                            <button onClick={() => setModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-xs font-bold transition-all">Batal</button>
                            <button onClick={handleGenerate} disabled={saving || (!form.tenant_id && modalTab === "individu") || !form.due_date}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sedang Proses...</> : (modalTab === "massal" ? "Generate Unit Aktif" : "Cetak Tagihan")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
