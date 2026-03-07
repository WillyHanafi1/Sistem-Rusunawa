"use client";

import { X, CheckCircle2, AlertCircle, Clock, Ban, CreditCard, Wallet, Droplets, Zap, Car, ReceiptText } from "lucide-react";

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
    parking_charge: number;
    other_charge?: number;
    total_amount: number;
    due_date: string;
    status: "paid" | "unpaid" | "overdue" | "cancelled";
    payment_url?: string | null;
    paid_at?: string | null;
    notes?: string | null;
}

interface Props {
    invoice: InvoiceDetail | null;
    tenantName?: string;
    roomNumber?: string;
    onClose: () => void;
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

const BreakdownRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
    <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
        <span className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-400">{icon}</span>
            {label}
        </span>
        <span className="font-bold text-slate-800 dark:text-slate-200">
            Rp {value.toLocaleString("id-ID")}
        </span>
    </div>
);

export default function InvoiceMonthDrawer({ invoice, tenantName, roomNumber, onClose }: Props) {
    if (!invoice) return null;

    const cfg = STATUS_CONFIG[invoice.status];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                <ReceiptText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Detail Tagihan</p>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {MONTHS_LONG[invoice.period_month - 1]} {invoice.period_year}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tenant & Room Info */}
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

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Status Banner */}
                    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                        <span className={cfg.text}>{cfg.icon}</span>
                        <div>
                            <p className={`font-bold text-sm ${cfg.text}`}>{cfg.label}</p>
                            {invoice.status === "paid" && invoice.paid_at && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                                    Dibayar: {new Date(invoice.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            )}
                            {(invoice.status === "unpaid" || invoice.status === "overdue") && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Jatuh Tempo: {new Date(invoice.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 px-5 py-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-4 pb-2">Rincian Tagihan</p>
                        <BreakdownRow icon={<Wallet className="w-4 h-4" />} label="Sewa Kamar" value={Number(invoice.base_rent)} />
                        <BreakdownRow icon={<Car className="w-4 h-4" />} label="Parkir Motor" value={Number(invoice.parking_charge)} />
                        {invoice.other_charge && Number(invoice.other_charge) > 0 && (
                            <BreakdownRow icon={<ReceiptText className="w-4 h-4" />} label="Lain-lain" value={Number(invoice.other_charge)} />
                        )}
                        <div className="flex items-center justify-between py-3.5 mt-1 border-t-2 border-slate-200 dark:border-white/10">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Total</span>
                            <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                                Rp {Number(invoice.total_amount).toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>

                    {/* Payment Section — Midtrans Placeholder */}
                    {(invoice.status === "unpaid" || invoice.status === "overdue") && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cara Pembayaran</p>

                            {invoice.payment_url ? (
                                <a
                                    href={invoice.payment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <CreditCard className="w-4.5 h-4.5" />
                                    Bayar Sekarang
                                </a>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2">
                                    <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                                    <p className="text-sm font-semibold text-slate-400">Payment Gateway</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Integrasi Midtrans (VA, QRIS, E-Wallet) <br />akan tersedia segera.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes (if any) */}
                    {invoice.notes && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Catatan</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 dark:border-white/5 shrink-0">
                    <p className="text-center text-xs text-slate-400">Invoice #{invoice.id} · Dibuat otomatis oleh Sistem Rusunawa</p>
                </div>
            </div>
        </>
    );
}
