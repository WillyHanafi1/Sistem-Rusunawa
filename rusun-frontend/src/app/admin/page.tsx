"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getUserName } from "@/lib/auth";
import { Building2, Users, FileText, AlertCircle, Loader2, TrendingUp } from "lucide-react";

interface Stats {
    total_rooms: number;
    active_tenants: number;
    unpaid_invoices: number;
    paid_this_month: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>("Admin");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userName = getUserName();
        if (userName) {
            setName(userName);
        }

        const fetchStats = async () => {
            try {
                const [rooms, tenants, invoices] = await Promise.all([
                    api.get("/rooms/"),
                    api.get("/tenants/"),
                    api.get("/invoices/"),
                ]);
                const now = new Date();
                setStats({
                    total_rooms: rooms.data.length,
                    active_tenants: tenants.data.filter((t: any) => t.is_active).length,
                    unpaid_invoices: invoices.data.filter((i: any) => i.status === "unpaid").length,
                    paid_this_month: invoices.data.filter(
                        (i: any) =>
                            i.status === "paid" &&
                            i.period_month === now.getMonth() + 1 &&
                            i.period_year === now.getFullYear()
                    ).length,
                });
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: "Total Kamar", value: stats?.total_rooms, icon: Building2, color: "blue" },
        { label: "Penghuni Aktif", value: stats?.active_tenants, icon: Users, color: "emerald" },
        { label: "Tagihan Belum Lunas", value: stats?.unpaid_invoices, icon: AlertCircle, color: "amber" },
        { label: "Lunas Bulan Ini", value: stats?.paid_this_month, icon: TrendingUp, color: "cyan" },
    ];

    const colorMap: Record<string, string> = {
        blue: "from-blue-500 to-blue-600 shadow-blue-500/20",
        emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
        amber: "from-amber-500 to-amber-600 shadow-amber-500/20",
        cyan: "from-cyan-500 to-cyan-600 shadow-cyan-500/20",
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat datang, {mounted ? name : "Admin"} 👋</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan kondisi rusunawa hari ini</p>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat data...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {cards.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                            <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg mb-4`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value ?? "-"}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick links */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                <h2 className="text-slate-900 dark:text-white font-semibold mb-4">Akses Cepat</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { href: "/admin/rooms", label: "Kelola Kamar", icon: Building2 },
                        { href: "/admin/tenants", label: "Kelola Penghuni", icon: Users },
                        { href: "/admin/invoices", label: "Kelola Tagihan", icon: FileText },
                    ].map(({ href, label, icon: Icon }) => (
                        <a key={href} href={href}
                            className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 hover:border-blue-300 dark:border-white/10 dark:hover:border-blue-500/30 rounded-xl transition-all group">
                            <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                            <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-sm font-medium transition-colors">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
