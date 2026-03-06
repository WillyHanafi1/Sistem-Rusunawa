"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageSquare, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Ticket {
    id: number;
    tenant_id: number;
    room_id: number;
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

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

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
        fetchTickets();
    }, []);

    const updateStatus = async (ticketId: number, newStatus: string) => {
        setUpdatingId(ticketId);
        try {
            await api.patch(`/tickets/${ticketId}`, { status: newStatus });
            fetchTickets();
        } catch (err) {
            alert("Gagal update status");
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-500" />
                    Manajemen Keluhan
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola laporan kerusakan dan masalah dari penghuni</p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat data keluhan...
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-12 text-center transition-colors duration-300">
                    <p className="text-slate-500 dark:text-slate-400">Belum ada keluhan yang masuk</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] border font-bold uppercase tracking-wider ${STATUS_BADGE[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                                            ID Penghuni: {ticket.tenant_id} • ID Kamar: {ticket.room_id}
                                        </span>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            [{ticket.category}]
                                        </span>
                                    </div>
                                    <p className="text-slate-900 dark:text-white text-sm font-medium leading-relaxed mb-4">{ticket.description}</p>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold">
                                        <span>Dilaporkan: {new Date(ticket.created_at).toLocaleString("id-ID")}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {ticket.status === "pending" && (
                                        <button 
                                            disabled={updatingId === ticket.id}
                                            onClick={() => updateStatus(ticket.id, "progress")}
                                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-600 dark:bg-blue-600/10 dark:hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            <Clock className="w-4 h-4" /> Tandai Dikerjakan
                                        </button>
                                    )}
                                    {ticket.status !== "resolved" && (
                                        <button 
                                            disabled={updatingId === ticket.id}
                                            onClick={() => updateStatus(ticket.id, "resolved")}
                                            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-600/10 dark:hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Tandai Selesai
                                        </button>
                                    )}
                                    {ticket.status === "resolved" && (
                                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 text-xs font-bold">
                                            <CheckCircle className="w-4 h-4" /> Masalah Selesai
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
