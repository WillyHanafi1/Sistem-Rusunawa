"use client";

import { useState } from "react";
import api, { handleDownload, previewPdf } from "@/lib/api";
import { X, CheckCircle2, AlertCircle, Clock, Ban, CreditCard, Wallet, Car, ReceiptText, Printer, FileText, AlertTriangle, Banknote, Loader2, Droplets, Zap, Pencil, Save } from "lucide-react";
import { initiatePayment } from "@/lib/payment";
import PaymentFallbackModal from "@/components/PaymentFallbackModal";

const MONTHS_LONG = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export interface InvoiceDetail {
    id: number;
    tenant_id: number;
    period_month: number;
    period_year: number;
    base_rent: number;
    water_charge: number;
    electricity_charge: number;
    parking_charge: number;
    other_charge?: number;
    penalty_amount: number;
    total_amount: number;
    due_date: string;
    status: "paid" | "unpaid" | "overdue" | "cancelled";
    document_type?: string;
    skrd_number?: string | null;
    skrd_date?: string | null;
    strd_number?: string | null;
    strd_date?: string | null;
    teguran1_number?: string | null;
    teguran1_date?: string | null;
    teguran2_number?: string | null;
    teguran2_date?: string | null;
    teguran3_number?: string | null;
    teguran3_date?: string | null;
    payment_url?: string | null;
    payment_id?: string | null;
    paid_at?: string | null;
    notes?: string | null;
}

interface Props {
    invoice: InvoiceDetail | null;
    tenantName?: string;
    roomNumber?: string;
    onClose: () => void;
    onPaymentSuccess?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    paid: {
        label: "Lunas",
        icon: <CheckCircle2 className="w-4 h-4" />,
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-500/30",
    },
    unpaid: {
        label: "Belum Dibayar",
        icon: <Clock className="w-4 h-4" />,
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-500/30",
    },
    overdue: {
        label: "Jatuh Tempo / Telat",
        icon: <AlertCircle className="w-4 h-4" />,
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-500/30",
    },
    cancelled: {
        label: "Dibatalkan",
        icon: <Ban className="w-4 h-4" />,
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-500",
        border: "border-slate-200 dark:border-slate-700",
    },
};

const BreakdownRow = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) => (
    <div className={`flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 ${highlight ? "bg-red-50/50 dark:bg-red-500/5 -mx-5 px-5 rounded-lg" : ""}`}>
        <span className={`flex items-center gap-2.5 font-medium ${highlight ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
            <span className={highlight ? "text-red-500" : "text-slate-400"}>{icon}</span>
            {label}
        </span>
        <span className={`font-bold ${highlight ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
            Rp {value.toLocaleString("id-ID")}
        </span>
    </div>
);

// Document type config for print buttons
const DOC_TYPES = [
    { key: "skrd", label: "SKRD", icon: <FileText className="w-3.5 h-3.5" />, numberField: "skrd_number", dateField: "skrd_date" },
    { key: "jaminan", label: "JKRD", icon: <FileText className="w-3.5 h-3.5" />, numberField: "skrd_number", dateField: "skrd_date" },
    { key: "strd", label: "STRD", icon: <ReceiptText className="w-3.5 h-3.5" />, numberField: "strd_number", dateField: "strd_date" },
    { key: "teguran1", label: "Teguran 1", icon: <AlertTriangle className="w-3.5 h-3.5" />, numberField: "teguran1_number", dateField: "teguran1_date" },
    { key: "teguran2", label: "Teguran 2", icon: <AlertTriangle className="w-3.5 h-3.5" />, numberField: "teguran2_number", dateField: "teguran2_date" },
    { key: "teguran3", label: "Teguran 3", icon: <AlertTriangle className="w-3.5 h-3.5" />, numberField: "teguran3_number", dateField: "teguran3_date" },
] as const;

export default function InvoiceMonthDrawer({ invoice: initialInvoice, tenantName, roomNumber, onClose, onPaymentSuccess }: Props) {
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(initialInvoice);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [confirmManualPay, setConfirmManualPay] = useState(false);
    
    // Manual Edit States
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    
    if (!invoice) return null;

    const cfg = STATUS_CONFIG[invoice.status];
    const isUnpaidOrOverdue = invoice.status === "unpaid" || invoice.status === "overdue";
    const isWarningDoc = invoice.document_type && invoice.document_type !== "skrd";

    const baseRent = Number(invoice.base_rent || 0);
    const parkingCharge = Number(invoice.parking_charge || 0);
    const waterCharge = Number(invoice.water_charge || 0);
    const electricityCharge = Number(invoice.electricity_charge || 0);
    const otherCharge = Number(invoice.other_charge || 0);

    const baseTotal = baseRent + parkingCharge + waterCharge + electricityCharge + otherCharge;
    const dbPenalty = Number(invoice.penalty_amount || 0);

    // Hitung denda secara live jika belum lunas & sudah lewat jatuh tempo
    const daysOverdueFrontend = isUnpaidOrOverdue && invoice.due_date
        ? Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Tampilkan denda 2% jika lewat jatuh tempo SKRD (dinamis atau status DB)
    const dynamicPenalty = (invoice.status === "overdue" || daysOverdueFrontend > 0) && isUnpaidOrOverdue
        ? baseTotal * 0.02
        : dbPenalty;

    const finalTotalAmount = baseTotal + dynamicPenalty;

    const handlePay = async () => {
        setIsLoadingPayment(true);
        try {
            await initiatePayment(
                invoice.id, 
                {
                    onSuccess: () => { if (onPaymentSuccess) onPaymentSuccess(); onClose(); },
                    onPending: () => { if (onPaymentSuccess) onPaymentSuccess(); onClose(); },
                    onError: () => { alert("Pembayaran gagal."); setIsLoadingPayment(false); },
                    onClose: () => setIsLoadingPayment(false)
                },
                { setFallbackUrl }
            );
        } catch (error) {
            alert("Gagal memulai pembayaran.");
            setIsLoadingPayment(false);
        }
    };

    const handleManualPay = async () => {
        setIsMarkingPaid(true);
        try {
            await api.post("/invoices/bulk-pay", {
                invoice_ids: [invoice.id],
                paid_at: new Date().toISOString(),
            });
            if (onPaymentSuccess) onPaymentSuccess();
            onClose();
        } catch (error) {
            alert("Gagal mencatat pembayaran.");
        } finally {
            setIsMarkingPaid(false);
            setConfirmManualPay(false);
        }
    };


    const handlePrint = async (docType: string) => {
        setIsPrinting(true);
        try {
            await previewPdf(`/invoices/${invoice.id}/print?doc_type=${docType}`);
        } catch (error: any) {
            alert(error.message || "Gagal membuka dokumen. Silakan coba lagi.");
        } finally {
            setIsPrinting(false);
        }
    };

    const handleSaveManualNumber = async (field: string) => {
        setIsSaving(true);
        try {
            const resp = await api.patch(`/invoices/${invoice.id}`, {
                [field]: editValue
            });
            setInvoice(resp.data);
            setEditingKey(null);
            if (onPaymentSuccess) onPaymentSuccess(); // Refresh parent list
        } catch (error) {
            alert("Gagal menyimpan nomor surat.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

                <div className="p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                <ReceiptText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    {invoice.document_type === "jaminan" ? "Deposit Keamanan" : "Tagihan Bulanan"}
                                </p>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {invoice.document_type === "jaminan" 
                                        ? "Uang Jaminan" 
                                        : `${MONTHS_LONG[invoice.period_month - 1]} ${invoice.period_year}`}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {invoice.document_type === "jaminan" && (
                                <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 mr-2">
                                    JKRD
                                </span>
                            )}
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {tenantName && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                {tenantName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{tenantName ?? "—"}</p>
                            <p className="text-xs text-slate-400">{roomNumber}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                        <span className={cfg.text}>{cfg.icon}</span>
                        <div className="flex-1">
                            <p className={`font-bold text-sm ${cfg.text}`}>{cfg.label}</p>
                            {invoice.status === "paid" && invoice.paid_at && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                                    Dibayar: {new Date(invoice.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            )}
                            {isUnpaidOrOverdue && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Jatuh Tempo: {new Date(invoice.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                    {daysOverdueFrontend > 0 && <span className="text-red-500 font-bold ml-1.5">({daysOverdueFrontend} hari lewat)</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 px-5 py-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-4 pb-2">Rincian Tagihan</p>
                        <BreakdownRow icon={<Wallet className="w-4 h-4" />} label={invoice.document_type === "jaminan" ? "Uang Jaminan" : "Sewa Kamar"} value={Number(invoice.base_rent)} />
                        <BreakdownRow icon={<Car className="w-4 h-4" />} label="Parkir Motor" value={Number(invoice.parking_charge)} />
                        {Number(invoice.water_charge || 0) > 0 && (
                            <BreakdownRow icon={<Droplets className="w-4 h-4" />} label="Air Bersih" value={Number(invoice.water_charge)} />
                        )}
                        {Number(invoice.electricity_charge || 0) > 0 && (
                            <BreakdownRow icon={<Zap className="w-4 h-4" />} label="Listrik" value={Number(invoice.electricity_charge)} />
                        )}
                        {invoice.other_charge && Number(invoice.other_charge) > 0 && (
                            <BreakdownRow icon={<ReceiptText className="w-4 h-4" />} label="Lain-lain" value={Number(invoice.other_charge)} />
                        )}
                        {dynamicPenalty > 0 && (
                            <BreakdownRow icon={<AlertTriangle className="w-4 h-4" />} label="Denda (2%/bln)" value={dynamicPenalty} highlight />
                        )}
                        <div className="flex items-center justify-between py-3.5 mt-1 border-t-2 border-slate-200 dark:border-white/10">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Total</span>
                            <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                                Rp {finalTotalAmount.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 px-5 py-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dokumen Penagihan</p>
                        <div className="space-y-2">
                            {DOC_TYPES.map(doc => {
                                // Logic: Only show JKRD (jaminan) for 'jaminan' type.
                                // Only show SKRD, STRD, Teguran for 'skrd' type (or others).
                                const isJaminanInvoice = invoice.document_type === "jaminan";
                                const isJaminanButton = doc.key === "jaminan";
                                
                                if (isJaminanInvoice && !isJaminanButton) return null;
                                if (!isJaminanInvoice && isJaminanButton) return null;

                                const number = (invoice as any)[doc.numberField] as string | null | undefined;
                                const hasDocument = !!number;
                                const isEditing = editingKey === doc.key;
                                
                                const isSkrd = doc.key === "skrd";
                                const isJaminan = doc.key === "jaminan";
                                const isStrd = doc.key === "strd";
                                const isTeguran1 = doc.key === "teguran1";
                                const isTeguran2 = doc.key === "teguran2";
                                const isTeguran3 = doc.key === "teguran3";
                                
                                // logic to show which docs are applicable
                                if (isJaminan && invoice.document_type !== "jaminan") return null;
                                if (isSkrd && invoice.document_type === "jaminan") return null;
                                // Invoices with jaminan type usually don't have STRD/Teguran
                                if ((isStrd || isTeguran1 || isTeguran2 || isTeguran3) && invoice.document_type === "jaminan") return null;

                                const today = new Date();
                                const dueDate = new Date(invoice.due_date);
                                const timeDiff = today.getTime() - dueDate.getTime();
                                const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));
                                
                                let canPrint = isSkrd || isJaminan;
                                if (isStrd) canPrint = isUnpaidOrOverdue;
                                if (isTeguran1) canPrint = isUnpaidOrOverdue;
                                if (isTeguran2) canPrint = isUnpaidOrOverdue && (!!invoice.teguran1_number || daysOverdue >= 14);
                                if (isTeguran3) canPrint = isUnpaidOrOverdue && (!!invoice.teguran2_number || daysOverdue >= 21);

                                return (
                                    <div key={doc.key} className="flex flex-col py-1 transition-colors">
                                        <div className="flex items-center justify-between px-3 h-10 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-colors group">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center ${hasDocument ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                                                    {hasDocument ? <CheckCircle2 className="w-3.5 h-3.5" /> : doc.icon}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className={`text-xs font-bold block ${hasDocument ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                                                        {doc.label}
                                                    </span>
                                                    {!isEditing && (
                                                        <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[150px]">
                                                            {number || "Belum ada nomor"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {/* Edit Button */}
                                                {!isEditing && (
                                                    <button 
                                                        onClick={() => { setEditingKey(doc.key); setEditValue(number || ""); }}
                                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                        title="Edit Nomor Manual"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                )}
                                                
                                                {canPrint && !isEditing ? (
                                                    <button
                                                        onClick={() => handlePrint(doc.key)}
                                                        disabled={isPrinting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-all opacity-80 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isPrinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                                        {isPrinting ? "Memproses..." : "Cetak"}
                                                    </button>
                                                ) : (!canPrint && !isEditing && isUnpaidOrOverdue && !isSkrd && !hasDocument && (
                                                    <span className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 rounded">
                                                        <Clock className="w-2.5 h-2.5" /> Belum Waktunya
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Inline Editor */}
                                        {isEditing && (
                                            <div className="px-3 mt-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <input 
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder={`Masukkan nomor ${doc.label}...`}
                                                    autoFocus
                                                    className="flex-1 text-[11px] py-1.5 px-2.5 rounded-lg border border-blue-300 dark:border-blue-500/50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                />
                                                <button 
                                                    onClick={() => handleSaveManualNumber(doc.numberField)}
                                                    disabled={isSaving}
                                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-slate-300 transition-colors"
                                                >
                                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                </button>
                                                <button 
                                                    onClick={() => setEditingKey(null)}
                                                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {isUnpaidOrOverdue && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pembayaran</p>
                            <button
                                onClick={handlePay}
                                disabled={isLoadingPayment}
                                className={`flex items-center justify-center gap-2 w-full text-white py-3.5 px-5 rounded-2xl font-bold text-sm transition-all shadow-lg ${isLoadingPayment ? "bg-slate-400 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"}`}
                            >
                                {isLoadingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Membuka Pembayaran...</> : <><CreditCard className="w-4 h-4" /> Bayar Online (Midtrans)</>}
                            </button>

                            {!confirmManualPay ? (
                                <button
                                    onClick={() => setConfirmManualPay(true)}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl font-bold text-sm transition-all border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5"
                                >
                                    <Banknote className="w-4 h-4" /> Catat Bayar Manual (Kasir/Transfer)
                                </button>
                            ) : (
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border-2 border-amber-300 dark:border-amber-500/30 rounded-2xl space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div className="text-xs text-amber-800 dark:text-amber-300">
                                            <p className="font-bold mb-1">Konfirmasi Pembayaran Manual</p>
                                            <p>Tagihan <strong>{MONTHS_LONG[invoice.period_month - 1]} {invoice.period_year}</strong> sebesar <strong>Rp {finalTotalAmount.toLocaleString("id-ID")}</strong> akan ditandai LUNAS.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfirmManualPay(false)} className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all hover:bg-slate-50">Batal</button>
                                        <button onClick={handleManualPay} disabled={isMarkingPaid} className="flex-[2] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5">
                                            {isMarkingPaid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Ya, Tandai Lunas
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {invoice.notes && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Catatan</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-white/5 shrink-0">
                    <p className="text-center text-xs text-slate-400">Invoice #{invoice.id} · Dibuat otomatis oleh Sistem Rusunawa</p>
                </div>
            </div>

            {fallbackUrl && <PaymentFallbackModal url={fallbackUrl} onClose={() => { setFallbackUrl(null); setIsLoadingPayment(false); }} />}
        </>
    );
}
