"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { logout, getUserName } from "@/lib/auth";
import { Building2, LogOut, FileText, Loader2, ExternalLink } from "lucide-react";

interface Invoice {
    id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
    total_amount: number;
    due_date: string;
    status: string;
    payment_url?: string;
}

const STATUS_BADGE: Record<string, string> = {
    unpaid: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};
const STATUS_LABEL: Record<string, string> = { unpaid: "Belum Lunas", paid: "Lunas", overdue: "Jatuh Tempo" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function PortalPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const name = typeof window !== "undefined" ? getUserName() : "Penghuni";

    useEffect(() => {
        api.get("/invoices/").then(res => setInvoices(res.data)).finally(() => setLoading(false));
    }, []);

    const unpaid = invoices.filter(i => i.status === "unpaid");
    const totalUnpaid = unpaid.reduce((sum, i) => sum + Number(i.total_amount), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Rusunawa</p>
                        <p className="text-slate-500 text-xs">Portal Penghuni</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-300 text-sm">Halo, {name}</span>
                    <button onClick={logout} className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition-colors">
                        <LogOut className="w-4 h-4" /> Keluar
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {/* Summary card */}
                {unpaid.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6">
                        <p className="text-amber-400 text-sm font-medium mb-1">⚠️ Tagihan Belum Lunas</p>
                        <p className="text-white text-2xl font-bold">Rp {totalUnpaid.toLocaleString("id-ID")}</p>
                        <p className="text-slate-400 text-sm mt-1">{unpaid.length} tagihan menunggu pembayaran</p>
                    </div>
                )}

                {/* Invoice list */}
                <div className="mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <h2 className="text-white font-semibold">Riwayat Tagihan</h2>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <p className="text-slate-400">Belum ada tagihan untuk akunmu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{MONTHS[inv.period_month - 1]} {inv.period_year}</p>
                                        <p className="text-slate-400 text-sm mt-0.5">Jatuh tempo: {inv.due_date}</p>
                                        <p className="text-white font-bold text-lg mt-2">Rp {Number(inv.total_amount).toLocaleString("id-ID")}</p>
                                    </div>
                                    <div className="text-right space-y-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs border font-medium ${STATUS_BADGE[inv.status] || ""}`}>
                                            {STATUS_LABEL[inv.status] || inv.status}
                                        </span>
                                        {inv.status === "unpaid" && inv.payment_url && (
                                            <div>
                                                <a href={inv.payment_url} target="_blank"
                                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
                                                    <ExternalLink className="w-3 h-3" /> Bayar Sekarang
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
