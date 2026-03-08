import Cookies from "js-cookie";

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
    const token = Cookies.get("access_token");
    if (!token) {
        throw new Error("Sesi habis, silakan login ulang.");
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal membuat tagihan pembayaran.");
    }

    const data = await res.json();
    
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
