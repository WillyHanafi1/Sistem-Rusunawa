"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { logout, getUserName, isLoggedIn } from "@/lib/auth";
import { initiatePayment } from "@/lib/payment";
import { Building2, LogOut, FileText, Loader2, ExternalLink, CreditCard, Banknote, ClipboardList, Info, AlertTriangle, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import PaymentFallbackModal from "@/components/PaymentFallbackModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";


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
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>("Penghuni");
    const [mounted, setMounted] = useState(false);
    const [payingId, setPayingId] = useState<number | null>(null);
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({
        bank_name: "",
        bank_account_number: "",
        bank_account_holder: "",
        checkout_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0] // Default 30 days from now
    });
    const [submittingCheckout, setSubmittingCheckout] = useState(false);
    const [existingCheckout, setExistingCheckout] = useState<any>(null);

    const loadInvoices = () => {
        setLoading(true);
        api.get("/invoices/")
            .then(res => setInvoices(res.data))
            .catch(err => {
                console.error("Gagal mengambil tagihan:", err);
                if (err.response?.status === 401) {
                    logout();
                }
            })
            .finally(() => setLoading(false));
    };

    const loadCheckoutStatus = async () => {
        try {
            const res = await api.get("/checkouts/my-request");
            if (res.data) setExistingCheckout(res.data);
        } catch (err) {
            // Ignore error if not found
        }
    };

    useEffect(() => {
        setMounted(true);
        
        // Pengecekan autentikasi - gunakan router.replace agar tidak bentrok dengan middleware
        if (!isLoggedIn()) {
            router.replace("/login");
            return;
        }

        const userName = getUserName();
        if (userName) setName(userName);

        loadInvoices();
        loadCheckoutStatus();
    }, [router]);

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingCheckout(true);
        try {
            await api.post("/checkouts/", checkoutForm);
            toast.success("Permintaan checkout berhasil diajukan");
            setShowCheckoutModal(false);
            loadCheckoutStatus();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Gagal mengajukan checkout");
        } finally {
            setSubmittingCheckout(false);
        }
    };

    const handlePay = async (invoiceId: number) => {
        setPayingId(invoiceId);
        try {
            await initiatePayment(
                invoiceId, 
                {
                    onSuccess: function () {
                        loadInvoices();
                        setPayingId(null);
                    },
                    onPending: function () {
                        loadInvoices();
                        setPayingId(null);
                    },
                    onError: function () {
                        alert("Pembayaran gagal. Silakan coba lagi.");
                        setPayingId(null);
                    },
                    onClose: function () {
                        setPayingId(null);
                    }
                },
                { setFallbackUrl }
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Gagal memulai pembayaran.";
            alert(msg);
            setPayingId(null);
        }
    };

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
                                            {STATUS_LABEL[inv.status] || (inv.status === 'cancelled' ? 'Dibatalkan' : inv.status)}
                                        </span>
                                        {(inv.status === "unpaid" || inv.status === "overdue") && (
                                            <div>
                                                <button 
                                                    onClick={() => handlePay(inv.id)}
                                                    disabled={payingId === inv.id}
                                                    className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                                                        payingId === inv.id ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
                                                    }`}
                                                >
                                                    {payingId === inv.id ? (
                                                        <><Loader2 className="w-3 h-3 animate-spin"/> Membuka...</>
                                                    ) : (
                                                        <><ExternalLink className="w-3 h-3" /> Bayar Sekarang</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Checkout Section */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <h2 className="text-slate-900 dark:text-white font-semibold">Rencana Pindah (Checkout)</h2>
                    </div>

                    {existingCheckout ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-blue-900 dark:text-blue-300 font-bold">Permintaan Sedang Diproses</h3>
                                    <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">Anda telah mengajukan checkout untuk tanggal <span className="font-bold">{new Date(existingCheckout.checkout_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>.</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                            existingCheckout.status === 'requested' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                            existingCheckout.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                            Status: {existingCheckout.status === 'requested' ? 'Menunggu' : existingCheckout.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-bold">Ajukan Pengembalian Unit</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ingin berhenti menyewa? Beritahu kami rencana kepindahan Anda untuk proses refund uang jaminan.</p>
                            </div>
                            <button 
                                onClick={() => setShowCheckoutModal(true)}
                                className="whitespace-nowrap bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
                            >
                                Mulai Checkout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckoutModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Form Pengajuan Keluar</h2>
                                <button onClick={() => setShowCheckoutModal(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex gap-3">
                                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">Uang jaminan (deposit) akan dikembalikan ke rekening yang Anda tulis di bawah. Pastikan data benar.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rencana Tanggal Keluar</label>
                                    <input required type="date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={checkoutForm.checkout_date} 
                                        onChange={e => setCheckoutForm({...checkoutForm, checkout_date: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Bank</label>
                                    <input required type="text" placeholder="Contoh: BCA, Mandiri, BNI" 
                                        value={checkoutForm.bank_name} 
                                        onChange={e => setCheckoutForm({...checkoutForm, bank_name: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">No. Rekening</label>
                                        <input required type="text" placeholder="Nomor rekening aktif" 
                                            value={checkoutForm.bank_account_number} 
                                            onChange={e => setCheckoutForm({...checkoutForm, bank_account_number: e.target.value.replace(/\D/g, '')})} 
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Pemilik</label>
                                        <input required type="text" placeholder="Sesuai buku tabungan" 
                                            value={checkoutForm.bank_account_holder} 
                                            onChange={e => setCheckoutForm({...checkoutForm, bank_account_holder: e.target.value})} 
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowCheckoutModal(false)} className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Batal</button>
                                    <button type="submit" disabled={submittingCheckout} className="flex-[2] px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                        {submittingCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                                        Kirim Pengajuan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fallback payment modal (when Snap.js not loaded) */}
            {fallbackUrl && (
                <PaymentFallbackModal
                    url={fallbackUrl}
                    onClose={() => { setFallbackUrl(null); setPayingId(null); }}
                />
            )}
        </div>
    );
}
