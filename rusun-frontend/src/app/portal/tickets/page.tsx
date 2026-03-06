"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { logout, getUserName } from "@/lib/auth";
import { Building2, LogOut, MessageSquare, Loader2, Send, Plus, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";


interface Ticket {
    id: number;
    category: string;
    description: string;
    status: string;
    created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const CATEGORIES = ["Lampu/Listrik", "Air/Plumbing", "Atap/Bangunan", "Lainnya"];

export default function TenantTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>("Penghuni");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState("");

    const fetchTickets = async () => {
        try {
            const res = await api.get("/tickets/");
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userName = getUserName();
        if (userName) setName(userName);
        fetchTickets();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/tickets/", { category, description });
            setIsModalOpen(false);
            setDescription("");
            fetchTickets();
        } catch (err) {
            alert("Gagal mengirim keluhan");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 transition-colors duration-300">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-6 py-4 flex items-center justify-between transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <Link href="/portal" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-semibold text-sm">Rusunawa</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Portal Penghuni</p>
                        </div>
                    </Link>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    <span className="hidden sm:inline text-slate-700 dark:text-slate-300 text-sm font-medium">Halo, {name}</span>
                    <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 text-sm transition-colors">
                        <LogOut className="w-4 h-4" /> Keluar
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Keluhan Saya</h1>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Buat Keluhan
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-8">
                        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm dark:shadow-none transition-colors duration-300">
                        <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Belum ada keluhan yang diajukan</p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2"
                        >
                            Ajukan keluhan pertama Anda
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 rounded-2xl p-5 transition-all shadow-sm dark:shadow-none duration-300">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-blue-400 px-2 py-0.5 bg-blue-400/10 rounded-md">
                                                {ticket.category}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] border font-bold uppercase tracking-wider ${STATUS_BADGE[ticket.status]}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{ticket.description}</p>
                                        <p className="text-slate-500 dark:text-slate-500 text-[10px] mt-4">
                                            Diajukan pada: {new Date(ticket.created_at).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-300">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Buat Keluhan Baru</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">Kategori</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">Deskripsi Masalah</label>
                                <textarea 
                                    required
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Jelaskan detail masalah yang Anda alami..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Kirim Keluhan</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
