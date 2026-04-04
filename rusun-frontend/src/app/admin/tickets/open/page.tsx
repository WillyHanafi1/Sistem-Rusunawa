"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    MessageSquare, Loader2, CheckCircle2, Clock, AlertTriangle, 
    Search, User, MapPin, Calendar, ArrowRight, Play
} from "lucide-react";

interface Ticket {
    id: number;
    tenant_id: number;
    room_id: number;
    category: string;
    description: string;
    status: string;
    created_at: string;
    tenant_name: string;
    unit_number: number;
    building: string;
}

const CAT_COLORS: Record<string, string> = {
    "Lampu/Listrik": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "Air/Plumbing": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "Atap/Bangunan": "bg-rose-500/10 text-rose-600 border-rose-500/20",
    "Lainnya": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export default function OpenTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [updatingParams, setUpdatingParams] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get("/tickets?status=active&limit=999");
            setTickets(res.data);
            if (res.data.length > 0 && !selectedTicket) {
                setSelectedTicket(res.data[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateStatus = async (ticketId: number, status: string) => {
        setUpdatingParams(true);
        try {
            await api.patch(`/tickets/${ticketId}`, { status });
            // Remove from list if resolved
            if (status === "resolved") {
                const newList = tickets.filter(t => t.id !== ticketId);
                setTickets(newList);
                setSelectedTicket(newList.length > 0 ? newList[0] : null);
            } else {
                // Update locally
                const newList = tickets.map(t => t.id === ticketId ? { ...t, status } : t);
                setTickets(newList);
                setSelectedTicket({ ...selectedTicket!, status });
            }
        } catch (e) {
            alert("Gagal memodifikasi status tiket");
        } finally {
            setUpdatingParams(false);
        }
    };

    const filtered = useMemo(() => {
        if (!searchTerm) return tickets;
        const low = searchTerm.toLowerCase();
        return tickets.filter(t => 
            t.tenant_name?.toLowerCase().includes(low) || 
            t.category.toLowerCase().includes(low) ||
            t.description.toLowerCase().includes(low)
        );
    }, [tickets, searchTerm]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Left Panel: Ticket List */}
            <div className="w-full md:w-1/3 lg:w-[400px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col h-full z-10">
                <div className="p-4 border-b border-slate-200 dark:border-white/5">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Keluhan Aktif
                    </h2>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Cari Penghuni atau Masalah..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-10 text-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Memuat keluhan...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Semua Terkendali!</h3>
                            <p className="text-sm text-slate-500 mt-1">Tidak ada laporan kerusakan atau masalah yang belum tertangani.</p>
                        </div>
                    ) : (
                        filtered.map(ticket => {
                            const isSelected = selectedTicket?.id === ticket.id;
                            const isProgress = ticket.status === "progress";
                            
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 block ${
                                        isSelected 
                                            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" 
                                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${CAT_COLORS[ticket.category] || CAT_COLORS["Lainnya"]}`}>
                                            {ticket.category}
                                        </span>
                                        {isProgress && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                PROGRESS
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{ticket.tenant_name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Gd. {ticket.building} - Unit {ticket.unit_number}
                                    </p>
                                    <div className={`mt-3 text-xs line-clamp-2 ${isSelected ? "text-blue-800 dark:text-blue-200" : "text-slate-600 dark:text-slate-400"}`}>
                                        "{ticket.description}"
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="hidden md:flex flex-1 flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 relative overflow-y-auto custom-scrollbar">
                {selectedTicket ? (
                    <div className="max-w-3xl mx-auto w-full p-8 md:p-12">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-white/10 overflow-hidden">
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/20 dark:to-slate-900">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CAT_COLORS[selectedTicket.category] || CAT_COLORS["Lainnya"]}`}>
                                        {selectedTicket.category}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> 
                                        {new Date(selectedTicket.created_at).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                                    Tiket #{selectedTicket.id}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Keluhan dilaporkan oleh penghuni. Segera tindak lanjuti jika perlu.
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1 font-medium text-xs">
                                            <User className="w-4 h-4" /> Pelapor
                                        </div>
                                        <div className="font-bold text-slate-900 dark:text-white">{selectedTicket.tenant_name}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1 font-medium text-xs">
                                            <MapPin className="w-4 h-4" /> Lokasi Ruangan
                                        </div>
                                        <div className="font-bold text-slate-900 dark:text-white">Gedung {selectedTicket.building} — Unit {selectedTicket.unit_number}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Deskripsi Masalah</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                {/* Action Center */}
                                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Pusat Aksi Opsional</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {selectedTicket.status === "pending" && (
                                            <button 
                                                onClick={() => updateStatus(selectedTicket.id, "progress")}
                                                disabled={updatingParams}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                            >
                                                {updatingParams ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                                Mulai Perbaiki (Progress)
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => updateStatus(selectedTicket.id, "resolved")}
                                            disabled={updatingParams}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                        >
                                            {updatingParams ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Tandai Selesai & Tutup Tiket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-6 p-8 text-center">
                        <div className="w-24 h-24 bg-slate-200/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-500 opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {tickets.length === 0 ? "Zona Bebas Keluhan!" : "Area Detail Tiket"}
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                {tickets.length === 0 
                                    ? "Luar biasa! Tidak ada laporan kerusakan atau keluhan penghuni yang belum tertangani saat ini." 
                                    : "Silakan pilih salah satu tiket keluhan dari daftar di sebelah kiri untuk melihat rincian spesifik dan melakukan tindakan perbaikan."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
