from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from sqlmodel import Session, select
from sqlalchemy import case
from datetime import datetime, date, timezone, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal
from pydantic import BaseModel

from app.core.db import get_session
from app.core.security import require_admin
from app.models.invoice import Invoice, InvoiceStatus, DocumentType
from app.models.user import User
from app.core.config import settings
from app.api.invoices import internal_mass_generate_invoices

from app.models.sequence import SystemSequence
from app.models.room import Room, RusunawaSite
from app.models.tenant import Tenant

class MassEscalateRequest(BaseModel):
    target_doc_type: DocumentType
    dry_run: bool = True
    start_no: Optional[int] = None
    period_month: Optional[int] = None
    period_year: Optional[int] = None
    sign_date: Optional[date] = None  # Tanggal surat / tanda tangan dari user

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

def format_document_number(code: str, type_label: str, seq_no: int, month: int, year: int) -> str:
    """Format: 974/[TYPE]/[CODE].[NO]/UPTD.RSN/[MONTH_ROMAN]/[YEAR]"""
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
    statement = (
        select(Invoice)
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .where(Invoice.status == InvoiceStatus.unpaid)
        .order_by(
            case(
                {
                    RusunawaSite.cigugur_tengah: 1,
                    RusunawaSite.cibeureum: 2,
                    RusunawaSite.leuwigajah: 3
                },
                value=Room.rusunawa
            ),
            Room.building,
            Room.floor,
            Room.unit_number
        )
    )
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
                    inv.teguran1_number = format_document_number(code, "T1", next_seq, now.month, now.year)
                    inv.teguran1_date = now.date()
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran1:
                    inv.document_type = DocumentType.teguran2
                    inv.teguran2_number = format_document_number(code, "T2", next_seq, now.month, now.year)
                    inv.teguran2_date = now.date()
                    inv.document_status_updated_at = now
                    changed = True
                elif inv.document_type == DocumentType.teguran2:
                    inv.document_type = DocumentType.teguran3
                    inv.teguran3_number = format_document_number(code, "T3", next_seq, now.month, now.year)
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

@router.get("/check-prerequisites", status_code=200)
def check_prerequisites(
    period_month: int,
    period_year: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Cek status prasyarat dokumen untuk periode tertentu.
    Mengembalikan jumlah tagihan per tipe dokumen agar frontend
    bisa menampilkan status prasyarat (✅/❌) secara real-time.
    """
    from sqlalchemy import func

    # Hitung invoice per document_type untuk periode ini (hanya unpaid)
    counts_query = (
        select(Invoice.document_type, func.count(Invoice.id))
        .where(
            Invoice.period_month == period_month,
            Invoice.period_year == period_year,
        )
        .group_by(Invoice.document_type)
    )
    results = session.exec(counts_query).all()
    
    # Build counts dict
    counts = {dt.value: 0 for dt in DocumentType}
    for doc_type, count in results:
        counts[doc_type.value if hasattr(doc_type, 'value') else doc_type] = count

    # Total tagihan (semua status) di periode ini
    total = sum(counts.values())

    # Hitung juga yang masih unpaid per source type (eligible untuk eskalasi)
    unpaid_counts_query = (
        select(Invoice.document_type, func.count(Invoice.id))
        .where(
            Invoice.period_month == period_month,
            Invoice.period_year == period_year,
            Invoice.status == InvoiceStatus.unpaid,
        )
        .group_by(Invoice.document_type)
    )
    unpaid_results = session.exec(unpaid_counts_query).all()
    unpaid_counts = {}
    for doc_type, count in unpaid_results:
        key = doc_type.value if hasattr(doc_type, 'value') else doc_type
        unpaid_counts[key] = count

    return {
        "period_month": period_month,
        "period_year": period_year,
        "total_invoices": total,
        "counts": counts,          # Semua status: {"skrd": 10, "strd": 5, ...}
        "unpaid_counts": unpaid_counts,  # Hanya unpaid: {"skrd": 8, "strd": 3, ...}
        "prerequisites": {
            "skrd": True,                                                     # SKRD selalu bisa dibuat
            "strd": counts.get("skrd", 0) > 0 or counts.get("strd", 0) > 0,  # Butuh SKRD sudah ada
            "teguran1": counts.get("strd", 0) > 0 or counts.get("teguran1", 0) > 0,
            "teguran2": counts.get("teguran1", 0) > 0 or counts.get("teguran2", 0) > 0,
            "teguran3": counts.get("teguran2", 0) > 0 or counts.get("teguran3", 0) > 0,
        }
    }


@router.post("/mass-escalate", status_code=200)
def mass_escalate_documents(
    payload: MassEscalateRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:

    """
    Endpoint semi-manual untuk eskalasi dokumen penagihan secara massal.
    Admin menentukan kapan, nomor berapa, dan tanggal surat berapa.
    Sistem hanya memvalidasi prasyarat (SKRD ada sebelum STRD, dst.)
    dan mengeksekusi perubahan.
    """
    now = datetime.now(timezone.utc)
    target = payload.target_doc_type
    
    # Mapping: target -> source document type
    SOURCE_MAPPING: Dict[DocumentType, DocumentType] = {
        DocumentType.strd: DocumentType.skrd,
        DocumentType.teguran1: DocumentType.strd,
        DocumentType.teguran2: DocumentType.teguran1,
        DocumentType.teguran3: DocumentType.teguran2,
    }
    
    if target not in SOURCE_MAPPING:
        raise HTTPException(status_code=400, detail="Target dokumen tidak valid untuk eskalasi massal.")
    
    source_doc = SOURCE_MAPPING[target]
    
    # Validasi: periode harus ditentukan dalam mode semi-manual
    if not payload.period_month or not payload.period_year:
        raise HTTPException(status_code=400, detail="Bulan dan tahun periode harus ditentukan.")

    # Cari semua invoice unpaid dengan document_type = source, di periode yang ditentukan
    statement = (
        select(Invoice)
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .where(
            Invoice.status == InvoiceStatus.unpaid,
            Invoice.document_type == source_doc,
            Invoice.period_month == payload.period_month,
            Invoice.period_year == payload.period_year,
        )
        .order_by(
            case(
                {
                    RusunawaSite.cigugur_tengah: 1,
                    RusunawaSite.cibeureum: 2,
                    RusunawaSite.leuwigajah: 3
                },
                value=Room.rusunawa
            ),
            Room.building,
            Room.floor,
            Room.unit_number
        )
    )
    eligible_invoices = session.exec(statement).all()
    total_eligible = len(eligible_invoices)
    
    # Dry-run: hanya report jumlah yang eligible
    if payload.dry_run:
        source_label = source_doc.value.upper()
        target_label = target.value.upper()
        
        preview_data = []
        for inv in eligible_invoices:
            room_stmt = select(Room).join(Tenant, Tenant.room_id == Room.id).where(Tenant.id == inv.tenant_id)
            room = session.exec(room_stmt).first()
            user_stmt = select(User).join(Tenant, Tenant.user_id == User.id).where(Tenant.id == inv.tenant_id)
            user = session.exec(user_stmt).first()
            
            tenant_name = user.name if user else "Unknown"
            room_label = f"{room.building.split(' - ')[-1]} {app.models.room.ROMAN.get(room.floor, str(room.floor))} {room.unit_number}" if room else "Unknown"
            rusunawa_name = room.rusunawa.value if room and hasattr(room.rusunawa, 'value') else str(room.rusunawa) if room else "Unknown"
            
            # calculate expected penalty
            base_t = inv.base_rent + inv.parking_charge + inv.water_charge + inv.electricity_charge + inv.other_charge
            expected_penalty = inv.penalty_amount or Decimal(0)
            if target == DocumentType.strd and expected_penalty == Decimal(0):
                penalty_calc = (inv.base_rent + inv.parking_charge) * Decimal(str(settings.PENALTY_RATE))
                expected_penalty = penalty_calc.quantize(Decimal("0.01"))
            
            total_after = base_t + expected_penalty
            
            preview_data.append({
                "tenant_name": tenant_name,
                "room_label": room_label,
                "rusunawa": rusunawa_name,
                "base_rent": float(inv.base_rent),
                "parking_charge": float(inv.parking_charge),
                "penalty_amount": float(expected_penalty),
                "total_amount": float(total_after)
            })

        if total_eligible == 0:
            msg = f"Tidak ditemukan tagihan {source_label} yang belum lunas pada periode {payload.period_month}/{payload.period_year}. Pastikan {source_label} sudah di-generate terlebih dahulu."
        else:
            msg = f"Ditemukan {total_eligible} tagihan {source_label} pada periode {payload.period_month}/{payload.period_year} yang siap di-eskalasi menjadi {target_label}."
        
        return {
            "success": True,
            "processed": total_eligible,
            "message": msg,
            "dry_run": True,
            "preview_data": preview_data
        }
    
    # Validasi: nomor urut wajib untuk eksekusi
    if payload.start_no is None:
        raise HTTPException(status_code=400, detail="Nomor urut awal wajib diisi untuk eksekusi.")

    # Validasi: tanggal surat wajib untuk eksekusi
    if payload.sign_date is None:
        raise HTTPException(status_code=400, detail="Tanggal surat wajib diisi untuk eksekusi.")

    if total_eligible == 0:
        return {
            "success": True,
            "processed": 0,
            "message": f"Tidak ada tagihan {source_doc.value.upper()} yang dapat di-eskalasi.",
            "dry_run": False
        }
        
    # Eksekusi eskalasi
    processed_count = 0
    effective_sign_date = payload.sign_date
    
    for idx, inv in enumerate(eligible_invoices):
        # Cari kode site untuk penomoran
        room_stmt = select(Room).join(Tenant, Tenant.room_id == Room.id).where(Tenant.id == inv.tenant_id)
        room = session.exec(room_stmt).first()
        site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
        site_key = room.rusunawa.value if room and hasattr(room.rusunawa, 'value') else str(room.rusunawa)
        code = site_codes.get(site_key, "00")

        current_seq = payload.start_no + idx

        if target == DocumentType.strd:
            # SKRD -> STRD: hitung denda
            penalty = (inv.base_rent + inv.parking_charge) * Decimal(str(settings.PENALTY_RATE))
            inv.penalty_amount = penalty.quantize(Decimal("0.01"))
            inv.total_amount = (
                inv.base_rent + inv.parking_charge + inv.water_charge + 
                inv.electricity_charge + inv.other_charge + inv.penalty_amount
            )
            inv.document_type = DocumentType.strd
            inv.strd_number = format_document_number(code, "STRD", current_seq, effective_sign_date.month, effective_sign_date.year)
            inv.strd_date = effective_sign_date

        elif target == DocumentType.teguran1:
            inv.document_type = DocumentType.teguran1
            inv.teguran1_number = format_document_number(code, "T1", current_seq, effective_sign_date.month, effective_sign_date.year)
            inv.teguran1_date = effective_sign_date
                
        elif target == DocumentType.teguran2:
            inv.document_type = DocumentType.teguran2
            inv.teguran2_number = format_document_number(code, "T2", current_seq, effective_sign_date.month, effective_sign_date.year)
            inv.teguran2_date = effective_sign_date
                
        elif target == DocumentType.teguran3:
            inv.document_type = DocumentType.teguran3
            inv.teguran3_number = format_document_number(code, "T3", current_seq, effective_sign_date.month, effective_sign_date.year)
            inv.teguran3_date = effective_sign_date
                
        inv.document_status_updated_at = now
        session.add(inv)
        processed_count += 1
            
    if processed_count > 0:
        session.commit()
        
    return {
        "success": True,
        "processed": processed_count,
        "message": f"Berhasil men-generate {processed_count} dokumen {target.value.upper()} secara massal.",
        "dry_run": False
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
