from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, date, timezone, timedelta
from typing import Dict, Any, List
from decimal import Decimal

from app.core.db import get_session
from app.core.security import require_admin
from app.models.invoice import Invoice, InvoiceStatus, DocumentType
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/tasks", tags=["Automation Tasks"])

@router.post("/process-overdue", status_code=200)
def handle_overdue_processing(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Otomatisasi pemrosesan denda dan surat teguran.
    1. Tgl 21: SKRD -> STRD (Denda 2%)
    2. H+7 STRD: STRD -> Teguran 1
    3. H+14 STRD: Teguran 1 -> Teguran 2
    4. H+21 STRD: Teguran 2 -> Teguran 3
    """
    now = datetime.now(timezone.utc)
    today_day = now.day
    
    # 1. Ambil semua invoice yang belum lunas
    statement = select(Invoice).where(Invoice.status == InvoiceStatus.unpaid)
    unpaid_invoices = session.exec(statement).all()
    
    processed_count = 0
    updated_invoices = []
    
    for inv in unpaid_invoices:
        changed = False
        
        # LOGIKA 1: SKRD -> STRD (Hanya di tanggal 21 ke atas)
        if inv.document_type == DocumentType.skrd and today_day >= settings.STRD_DAY:
            # Hitung denda 2% dari (Sewa + Parkir)
            penalty = (inv.base_rent + inv.parking_charge) * Decimal(str(settings.PENALTY_RATE))
            inv.penalty_amount = penalty.quantize(Decimal("0.01"))
            
            # Update Total: SKRD sebelumnya menjadi tidak berlaku (direplace STRD)
            inv.total_amount = (
                inv.base_rent + 
                inv.parking_charge + 
                inv.water_charge + 
                inv.electricity_charge + 
                inv.other_charge + 
                inv.penalty_amount
            )
            
            inv.document_type = DocumentType.strd
            inv.document_status_updated_at = now
            changed = True
            
        # LOGIKA 2: Transisi Teguran (Interval 7 hari)
        elif inv.document_status_updated_at:
            # Pastikan tz-aware untuk perbandingan
            if inv.document_status_updated_at.tzinfo is None:
                last_update = inv.document_status_updated_at.date()
            else:
                last_update = inv.document_status_updated_at.date()
                
            today = now.date()
            days_passed = (today - last_update).days
            
            if days_passed >= settings.WARNING_INTERVAL_DAYS:
                if inv.document_type == DocumentType.strd:
                    inv.document_type = DocumentType.teguran1
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran1:
                    inv.document_type = DocumentType.teguran2
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran2:
                    inv.document_type = DocumentType.teguran3
                    inv.document_status_updated_at = now
                    changed = True
        
        if changed:
            session.add(inv)
            updated_invoices.append(inv)
            processed_count += 1
            
    if processed_count > 0:
        session.commit()
        
    return {
        "success": True,
        "processed": processed_count,
        "message": f"Berhasil memproses {processed_count} dokumen penagihan."
    }
