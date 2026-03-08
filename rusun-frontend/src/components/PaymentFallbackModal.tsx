"use client";

import { X } from "lucide-react";

interface Props {
    url: string;
    onClose: () => void;
}

/**
 * Fallback iframe modal for Midtrans payment page.
 * Used when window.snap is not available.
 */
export default function PaymentFallbackModal({ url, onClose }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-16 bg-white dark:bg-slate-900 rounded-2xl z-[70] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">Pembayaran</p>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition text-slate-500 dark:text-slate-400"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Iframe */}
                <iframe
                    src={url}
                    className="flex-1 w-full border-0"
                    title="Halaman Pembayaran Midtrans"
                />
            </div>
        </>
    );
}
