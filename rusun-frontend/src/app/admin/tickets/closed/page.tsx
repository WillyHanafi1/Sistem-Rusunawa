"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { 
    MessageSquare, Loader2, CheckCircle2, History,
    Search, User, MapPin, Calendar
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

export default function ClosedTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get("/tickets/?status=resolved&limit=999");
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
                        <History className="w-5 h-5 text-emerald-500" /> Riwayat Selesai
                    </h2>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Cari Penghuni atau Masalah..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-10 text-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Memuat data riwayat...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Belum Ada Riwayat</h3>
                            <p className="text-sm text-slate-500 mt-1">Sistem belum mencatat adanya keluhan yang telah diselesaikan.</p>
                        </div>
                    ) : (
                        filtered.map(ticket => {
                            const isSelected = selectedTicket?.id === ticket.id;
                            
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 block ${
                                        isSelected 
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" 
                                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${CAT_COLORS[ticket.category] || CAT_COLORS["Lainnya"]}`}>
                                            {ticket.category}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Selesai
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{ticket.tenant_name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Gd. {ticket.building} - Unit {ticket.unit_number}
                                    </p>
                                    <div className={`mt-3 text-xs line-clamp-2 ${isSelected ? "text-emerald-800 dark:text-emerald-200" : "text-slate-600 dark:text-slate-400"}`}>
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
                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                                        <Calendar className="w-3.5 h-3.5" /> 
                                        {new Date(selectedTicket.created_at).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                                    Arsip Tiket #{selectedTicket.id}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Masalah ini telah dikonfirmasi selesai dan ditutup.
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1 font-medium text-xs">
                                            <User className="w-4 h-4" /> Pelapor / Penghuni
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
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Deskripsi Masalah (Selesai)</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic opacity-80">
                                        "{selectedTicket.description}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-6 p-8 text-center">
                        <div className="w-24 h-24 bg-slate-200/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                            <History className="w-12 h-12 text-slate-400 dark:text-slate-500 opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {tickets.length === 0 ? "Ruang Arsip Kosong" : "Area Detail Tiket"}
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                {tickets.length === 0 
                                    ? "Meskipun saat ini belum ada tiket keluhan yang telah diselesaikan, semua arsip penanganan mendatang akan tersimpan rapi di sini." 
                                    : "Silakan pilih salah satu tiket dari daftar arsip di sebelah kiri untuk melihat riwayat rincian masalah."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
