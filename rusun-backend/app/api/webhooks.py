"""
Webhook endpoint untuk Xendit payment callback.
Ketika pembayaran berhasil, Xendit akan POST ke /webhooks/xendit
dengan payload berisi status invoice.
"""
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlmodel import Session, select
from datetime import datetime
from app.core.db import get_session
from app.core.config import settings
from app.models.invoice import Invoice, InvoiceStatus

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/xendit")
async def xendit_webhook(
    request: Request,
    x_callback_token: str = Header(..., alias="x-callback-token"),
    session: Session = Depends(get_session),
):
    """
    Webhook listener dari Xendit.
    Ketika penghuni berhasil bayar, Xendit akan kirim event ke endpoint ini
    dan status invoice otomatis berubah menjadi 'Lunas'.
    """
    # Verifikasi callback token
    if x_callback_token != settings.XENDIT_WEBHOOK_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized webhook")

    payload = await request.json()

    # Xendit invoice event
    event_type = payload.get("status", "")
    external_id = payload.get("external_id", "")  # kita set external_id = invoice_id saat generate

    if event_type == "PAID":
        # Cari invoice berdasarkan external_id
        invoice_id = external_id.replace("INV-", "")
        try:
            invoice_id = int(invoice_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="external_id tidak valid")

        invoice = session.get(Invoice, invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")

        invoice.status = InvoiceStatus.paid
        invoice.paid_at = datetime.utcnow()
        invoice.payment_id = payload.get("id", "")
        session.add(invoice)
        session.commit()

    return {"status": "ok"}
