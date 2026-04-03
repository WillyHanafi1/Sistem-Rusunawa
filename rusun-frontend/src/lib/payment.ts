import api from "./api";

export interface PaymentCallbacks {
    onSuccess?: (result: unknown) => void;
    onPending?: (result: unknown) => void;
    onError?: (result: unknown) => void;
    onClose?: () => void;
}

export interface FallbackState {
    setFallbackUrl: (url: string) => void;
}

export async function initiatePayment(
    invoiceId: number, 
    callbacks: PaymentCallbacks,
    fallback: FallbackState
): Promise<void> {
    const res = await api.post(`/invoices/${invoiceId}/pay`);
    const data = res.data;
    
    // Panggil Midtrans Snap Pop-up
    if (data.payment_id && window.snap) {
        window.snap.pay(data.payment_id, {
            onSuccess: callbacks.onSuccess,
            onPending: callbacks.onPending,
            onError: callbacks.onError,
            onClose: callbacks.onClose
        });
    } else if (data.payment_url) {
        fallback.setFallbackUrl(data.payment_url);
    } else {
        throw new Error("Sistem pembayaran belum siap. Silakan muat ulang halaman atau hubungi admin.");
    }
}
