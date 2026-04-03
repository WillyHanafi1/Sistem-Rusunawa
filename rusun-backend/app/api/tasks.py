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
from app.api.invoices import internal_mass_generate_invoices
from app.models.sequence import SystemSequence
from app.models.room import Room
from app.models.tenant import Tenant

router = APIRouter(prefix="/tasks", tags=["Automation Tasks"])

def get_next_sequence_value(session: Session, key: str, year: int) -> int:
    """Mengambil nomor urut berikutnya dari database."""
    seq = session.exec(
        select(SystemSequence).where(
            SystemSequence.key == key,
            SystemSequence.year == year
        )
    ).first()
    
    if not seq:
        seq = SystemSequence(key=key, year=year, last_value=1)
        session.add(seq)
        return 1
    
    seq.last_value += 1
    session.add(seq)
    return seq.last_value

def format_teguran_number(code: str, type_label: str, seq_no: int, month: int, year: int) -> str:
    """Format: 974/[T1/T2/T3]/[CODE].[NO]/UPTD.RSN/[MONTH_ROMAN]/[YEAR]"""
    romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
    month_rom = romans[month - 1] if 1 <= month <= 12 else str(month)
    return f"974/{type_label}/{code}.{seq_no}/UPTD.RSN/{month_rom}/{year}"

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
                # Ambil data kamar untuk Site Code
                room_stmt = select(Room).join(Tenant, Tenant.room_id == Room.id).where(Tenant.id == inv.tenant_id)
                room = session.exec(room_stmt).first()
                site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
                site_key = room.rusunawa.value if room and hasattr(room.rusunawa, 'value') else str(room.rusunawa)
                code = site_codes.get(site_key, "00")
                
                # Shared sequence pool for all teguran types
                next_seq = get_next_sequence_value(session, "teguran_seq", now.year)
                
                if inv.document_type == DocumentType.strd:
                    inv.document_type = DocumentType.teguran1
                    inv.teguran1_number = format_teguran_number(code, "T1", next_seq, now.month, now.year)
                    inv.teguran1_date = now.date()
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran1:
                    inv.document_type = DocumentType.teguran2
                    inv.teguran2_number = format_teguran_number(code, "T2", next_seq, now.month, now.year)
                    inv.teguran2_date = now.date()
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran2:
                    inv.document_type = DocumentType.teguran3
                    inv.teguran3_number = format_teguran_number(code, "T3", next_seq, now.month, now.year)
                    inv.teguran3_date = now.date()
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

@router.post("/process-monthly", status_code=200)
def handle_monthly_generation(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Otomatisasi pembuatan SKRD setiap tanggal 01.
    """
    now = datetime.now(timezone.utc)
    if now.day != 1:
        return {
            "success": True,
            "processed": 0,
            "message": f"Hari ini tanggal {now.day}, bukan tanggal 01. Skip otomatisasi."
        }
    
    # Panggil fungsi internal mass generate
    result = internal_mass_generate_invoices(
        session=session,
        period_month=now.month,
        period_year=now.year,
        notes="Otomatisasi Sistem (Tanggal 01)"
    )
    
    print(f"[{now}] Automated monthly generation: {result['message']}")
    return result
