"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Loader2, X } from "lucide-react";

interface Invoice {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
    water_charge: number;
    electricity_charge: number;
    parking_charge: number;
    total_amount: number;
    due_date: string;
    status: string;
    payment_url?: string;
}

interface Tenant { id: number; user_id: number; room_id: number; }

const STATUS_BADGE: Record<string, string> = {
    unpaid: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    overdue: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const STATUS_LABEL: Record<string, string> = {
    unpaid: "Belum Lunas", paid: "Lunas", overdue: "Jatuh Tempo", cancelled: "Dibatalkan"
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const now = new Date();
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
            const [inv, ten] = await Promise.all([api.get("/invoices/"), api.get("/tenants/")]);
            setInvoices(inv.data);
            setTenants(ten.data.filter((t: any) => t.is_active));
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleGenerate = async () => {
        setSaving(true); setError("");
        try {
            await api.post("/invoices/generate", { ...form, tenant_id: Number(form.tenant_id) });
            setModal(false);
            fetchAll();
        } catch (e: any) {
            setError(e.response?.data?.detail || "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Tagihan</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{invoices.length} tagihan</p>
                </div>
                <button onClick={() => { setError(""); setModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <Plus className="w-4 h-4" /> Generate Tagihan
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
            ) : (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden transition-colors duration-300">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-transparent">
                                {["ID", "Tenant ID", "Periode", "Sewa Dasar", "Parkir Motor", "Total", "Jatuh Tempo", "Status", ""].map(h => (
                                    <th key={h} className="text-left px-6 py-3 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">#{inv.id}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-white">Penghuni #{inv.tenant_id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{MONTHS[inv.period_month - 1]} {inv.period_year}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Rp {Number(inv.base_rent).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Rp {Number(inv.parking_charge).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">Rp {Number(inv.total_amount).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{inv.due_date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${STATUS_BADGE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inv.payment_url && (
                                            <a href={inv.payment_url} target="_blank" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline">Link Bayar</a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-12">Belum ada tagihan</p>}
                </div>
            )}

            {/* Modal Generate */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-slate-900 dark:text-white font-semibold">Generate Tagihan</h2>
                            <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Penghuni</label>
                                <select value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                                    <option value={0}>-- Pilih Penghuni --</option>
                                    {tenants.map(t => <option key={t.id} value={t.id}>Penghuni #{t.id} (Kamar #{t.room_id})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Bulan</label>
                                    <select value={form.period_month} onChange={e => setForm(f => ({ ...f, period_month: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Tahun</label>
                                    <input type="number" value={form.period_year} onChange={e => setForm(f => ({ ...f, period_year: Number(e.target.value) }))}
                                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                            {[
                                { label: "Tagihan Air (Rp)", field: "water_charge" },
                                { label: "Tagihan Listrik (Rp)", field: "electricity_charge" },
                                { label: "Lain-lain (Rp)", field: "other_charge" },
                            ].map(({ label, field }) => (
                                <div key={field}>
                                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">{label}</label>
                                    <input type="number" value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Tanggal Jatuh Tempo</label>
                                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
                            </div>
                            {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm transition-all">Batal</button>
                            <button onClick={handleGenerate} disabled={saving || !form.tenant_id || !form.due_date}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generate...</> : "Generate Tagihan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
