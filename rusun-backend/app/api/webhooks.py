"""
Webhook endpoint untuk notifikasi pembayaran Midtrans.
Ketika pembayaran berhasil/gagal, Midtrans akan POST ke /webhooks/midtrans.

Setup:
  Daftarkan URL ini di Midtrans Dashboard:
  Settings → Configuration → Payment Notification URL
  Contoh: https://yourdomain.com/api/webhooks/midtrans

Testing lokal:
  1. jalankan: ngrok http 8100
  2. copy URL ngrok ke Payment Notification URL di Midtrans Sandbox Dashboard
"""
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import get_session
from app.models.invoice import Invoice, InvoiceStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def _verify_midtrans_signature(
    order_id: str,
    status_code: str,
    gross_amount: str,
    signature_key: str,
) -> bool:
    """
    Verifikasi signature dari Midtrans untuk memastikan request asli dari Midtrans.
    Formula resmi: SHA512(order_id + status_code + gross_amount + server_key)
    Ref: https://docs.midtrans.com/docs/verifying-payment-status
    """
    raw = f"{order_id}{status_code}{gross_amount}{settings.MIDTRANS_SERVER_KEY}"
    expected = hashlib.sha512(raw.encode()).hexdigest()
    return expected == signature_key


@router.post("/midtrans", status_code=200)
async def midtrans_webhook(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Menerima notifikasi pembayaran dari Midtrans.
    Selalu return 200 agar Midtrans tidak melakukan retry berulang.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Midtrans webhook received for order_id: {payload.get('order_id')}")

    # --- Ambil field wajib dari payload ---
    order_id: str = payload.get("order_id", "")
    status_code: str = payload.get("status_code", "")
    gross_amount: str = payload.get("gross_amount", "")
    signature_key: str = payload.get("signature_key", "")
    transaction_status: str = payload.get("transaction_status", "")
    fraud_status: str = payload.get("fraud_status", "")

    if not all([order_id, status_code, gross_amount, signature_key]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    # --- Verifikasi signature, tolak jika tidak valid ---
    if not _verify_midtrans_signature(order_id, status_code, gross_amount, signature_key):
        logger.warning(f"Invalid Midtrans signature for order_id: {order_id}")
        raise HTTPException(status_code=403, detail="Invalid signature")

    # --- Cari invoice dari midtrans_order_id (field yang kita pakai untuk simpan order_id Midtrans) ---
    invoice = session.exec(
        select(Invoice).where(Invoice.midtrans_order_id == order_id)
    ).first()

    # Fallback: parse invoice_id dari format "INV-{id}-{timestamp}"
    if not invoice:
        try:
            invoice_id = int(order_id.split("-")[1])
            invoice = session.get(Invoice, invoice_id)
        except (IndexError, ValueError):
            pass

    if not invoice:
        logger.warning(f"Invoice not found for order_id: {order_id}")
        return {"status": "ok", "message": "Invoice not found, ignored"}

    # --- Jangan proses ulang jika sudah paid ---
    if invoice.status == InvoiceStatus.paid:
        return {"status": "ok", "message": "Already paid"}

    # --- Update status berdasarkan transaction_status Midtrans ---
    # Referensi lengkap: https://docs.midtrans.com/docs/handling-notifications
    if transaction_status == "capture":
        # Khusus kartu kredit — hanya update jika tidak fraud
        if fraud_status == "accept":
            invoice.status = InvoiceStatus.paid
            invoice.paid_at = datetime.now(timezone.utc)

    elif transaction_status == "settlement":
        # QRIS, transfer bank, e-wallet, dll → langsung paid
        invoice.status = InvoiceStatus.paid
        invoice.paid_at = datetime.now(timezone.utc)

    elif transaction_status == "pending":
        # Transaksi dibuat tapi user belum bayar — tidak perlu update status
        logger.info(f"Payment pending for invoice {invoice.id}")

    elif transaction_status in ("deny", "expire", "cancel"):
        # Reset field payment agar user bisa generate ulang transaksi baru
        invoice.payment_id = None
        invoice.payment_url = None
        invoice.midtrans_order_id = None
        logger.info(f"Payment {transaction_status} for invoice {invoice.id}, payment fields reset")

    session.add(invoice)
    session.commit()

    logger.info(
        f"Invoice {invoice.id} updated → status={invoice.status}, "
        f"transaction_status={transaction_status}"
    )

    return {"status": "ok"}
