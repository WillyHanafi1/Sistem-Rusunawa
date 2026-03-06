"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { logout, getUserName } from "@/lib/auth";
import { Building2, LogOut, FileText, Loader2, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


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
    const [name, setName] = useState<string>("Penghuni");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userName = getUserName();
        if (userName) setName(userName);

        api.get("/invoices/").then(res => setInvoices(res.data)).finally(() => setLoading(false));
    }, []);

    const unpaid = invoices.filter(i => i.status === "unpaid");
    const totalUnpaid = unpaid.reduce((sum, i) => sum + Number(i.total_amount), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 transition-colors duration-300">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-6 py-4 flex items-center justify-between transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-slate-900 dark:text-white font-semibold text-sm">Rusunawa</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Portal Penghuni</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    <span className="hidden sm:inline text-slate-700 dark:text-slate-300 text-sm font-medium">Halo, {mounted ? name : "Penghuni"}</span>
                    <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 text-sm transition-colors">
                        <LogOut className="w-4 h-4" /> Keluar
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {/* Summary card */}
                {unpaid.length > 0 && (
                    <div className="bg-white dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 shadow-sm dark:shadow-none rounded-2xl p-6 mb-6 transition-colors duration-300">
                        <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-1">⚠️ Tagihan Belum Lunas</p>
                        <p className="text-slate-900 dark:text-white text-2xl font-bold">Rp {totalUnpaid.toLocaleString("id-ID")}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{unpaid.length} tagihan menunggu pembayaran</p>
                    </div>
                )}

                {/* Invoice list */}
                <div className="mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <h2 className="text-slate-900 dark:text-white font-semibold">Riwayat Tagihan</h2>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm dark:shadow-none transition-colors duration-300">
                        <p className="text-slate-500 dark:text-slate-400">Belum ada tagihan untuk akunmu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 rounded-2xl p-5 shadow-sm dark:shadow-none transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-medium">{MONTHS[inv.period_month - 1]} {inv.period_year}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Jatuh tempo: {inv.due_date}</p>
                                        <p className="text-slate-900 dark:text-white font-bold text-lg mt-2">Rp {Number(inv.total_amount).toLocaleString("id-ID")}</p>
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
