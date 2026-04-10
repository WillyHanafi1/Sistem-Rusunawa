from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from sqlalchemy import case
from typing import List, Optional, Dict, Any
from decimal import Decimal
import math
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.invoice import Invoice, InvoiceCreate, InvoiceRead, InvoiceUpdate, InvoiceStatus, DocumentType, MOTOR_RATE, InvoiceMassGenerate, InvoiceTeguranMassGenerate, InvoiceReadWithRoom, InvoiceBulkPay
from app.models.tenant import Tenant
from app.models.room import Room, ROMAN, ROMAN_TO_INT, RusunawaSite
from app.models.user import User, UserRole
from app.core.config import settings
from app.core.document_service import DocumentService
import midtransclient
import calendar
import os
from pypdf import PdfWriter
import secrets
from datetime import datetime, date, timezone, timedelta

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# In-memory storage for preview tokens (One-time use)
# Storage format: {token: {"type": "single|bulk", "data": {...}, "expires_at": datetime}}
_preview_tokens: Dict[str, Any] = {}

# In-memory storage for async bulk print jobs
# Format: {job_id: {"status": "processing"|"completed"|"failed", "total": int, "processed": int, "file_path": str, "error": str}}
_bulk_print_jobs: Dict[str, Any] = {}

def _cleanup_expired_tokens():
    """Removes expired tokens from the in-memory dictionary."""
    now = datetime.now(timezone.utc)
    expired = [k for k, v in _preview_tokens.items() if now > v["expires_at"]]
    for k in expired:
        _preview_tokens.pop(k, None)

def fmt_decimal(val: Decimal):
    """Helper to format currency in Indonesian format."""
    if val is None: return "0"
    return f"{val:,.0f}".replace(",", ".")

def get_room_code(room: Room) -> str:
    """
    Generates an 8-digit code: [Rusun][Gedung][Lantai][Unit]
    - Rusun: 01=Cigugur, 02=Cibeureum, 03=Leuwigajah
    - Gedung: A=01, B=02, ...
    - Lantai: 01, 02, ...
    - Unit: 01, 02, ...
    """
    site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
    site_key = room.rusunawa.value if hasattr(room.rusunawa, 'value') else str(room.rusunawa)
    rusun_code = site_codes.get(site_key, "00")
    
    # Building: A=01, B=02, etc. (Handle case-insensitive)
    b_char = room.building.upper()
    if ord('A') <= ord(b_char) <= ord('Z'):
        gedung_code = f"{ord(b_char) - ord('A') + 1:02d}"
    else:
        gedung_code = "00"
        
    lantai_code = f"{room.floor:02d}"
    unit_code = f"{room.unit_number:02d}"
    
    return f"{rusun_code}{gedung_code}{lantai_code}{unit_code}"

def terbilang(n):
    """Helper to convert number to Indonesian words."""
    def penyebut(nilai):
        nilai = abs(int(nilai))
        huruf = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"]
        temp = ""
        if nilai < 12:
            temp = " " + huruf[nilai]
        elif nilai < 20:
            temp = penyebut(nilai - 10) + " belas"
        elif nilai < 100:
            temp = penyebut(nilai // 10) + " puluh" + penyebut(nilai % 10)
        elif nilai < 200:
            temp = " seratus" + penyebut(nilai - 100)
        elif nilai < 1000:
            temp = penyebut(nilai // 100) + " ratus" + penyebut(nilai % 100)
        elif nilai < 2000:
            temp = " seribu" + penyebut(nilai - 1000)
        elif nilai < 1000000:
            temp = penyebut(nilai // 1000) + " ribu" + penyebut(nilai % 1000)
        elif nilai < 1000000000:
            temp = penyebut(nilai // 1000000) + " juta" + penyebut(nilai % 1000000)
        elif nilai < 1000000000000:
            temp = penyebut(nilai // 1000000000) + " milyar" + penyebut(nilai % 1000000000)
        elif nilai < 1000000000000000:
            temp = penyebut(nilai // 1000000000000) + " trilyun" + penyebut(nilai % 1000000000000)
        return temp

    if n == 0:
        return "Nol"
    hasil = penyebut(n).strip()
    return (hasil[0].upper() + hasil[1:] + " Rupiah").replace("  ", " ")


@router.get("", response_model=List[InvoiceReadWithRoom])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[InvoiceStatus] = None,
    document_type: Optional[DocumentType] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(
            Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
            User.name.label("tenant_name"), Tenant.contract_start, Tenant.contract_end,
        )
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .join(User, Tenant.user_id == User.id)
    )

    if current_user.role == UserRole.penghuni:
        query = query.where(Tenant.user_id == current_user.id)
    
    if tenant_id is not None:
        query = query.where(Invoice.tenant_id == tenant_id)
    if month is not None:
        query = query.where(Invoice.period_month == month)
    if year is not None:
        query = query.where(Invoice.period_year == year)
    if status is not None:
        query = query.where(Invoice.status == status)
    if document_type is not None:
        query = query.where(Invoice.document_type == document_type)
    
    query = query.order_by(Room.building, Room.floor, Room.unit_number)
    limit = min(max(limit, 1), 5000)
    skip = max(skip, 0)
    
    results = session.exec(query.offset(skip).limit(limit)).all()
    
    output = []
    for row in results:
        inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, c_start, c_end = row
        inv_dict = inv_obj.model_dump()
        inv_dict.update({
            "room_number": r_num, "rusunawa": r_ru, "building": r_bu,
            "floor": r_fl, "unit_number": r_un, "tenant_name": t_name,
            "contract_start": c_start, "contract_end": c_end
        })
        output.append(InvoiceReadWithRoom(**inv_dict))
    return output

@router.get("/print-bulk")
def print_bulk_invoices(
    month: int,
    year: int,
    doc_type: Optional[DocumentType] = None,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Cetak massal invoice untuk periode tertentu."""
    query = (
        select(
            Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
            User.name.label("tenant_name"), Tenant.nik,
        )
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .join(User, Tenant.user_id == User.id)
        .where(Invoice.period_month == month)
        .where(Invoice.period_year == year)
    )
    if doc_type:
        query = query.where(Invoice.document_type == doc_type)
    
    query = query.order_by(Room.building, Room.floor, Room.unit_number)
    results = session.exec(query).all()
    if not results:
        raise HTTPException(status_code=404, detail="Tidak ada tagihan yang ditemukan untuk periode ini")
    
    return _get_bulk_invoice_pdf_response(results, month, year, doc_type)

@router.get("/bulk-token")
def get_bulk_print_token(
    month: int,
    year: int,
    doc_type: Optional[DocumentType] = None,
    building: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """Generates a one-time use token for BULK PDF preview."""
    token = secrets.token_urlsafe(32)
    _preview_tokens[token] = {
        "type": "bulk",
        "params": {"month": month, "year": year, "doc_type": doc_type, "building": building},
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    return {"token": token}

@router.get("/preview/{token}")
def preview_by_token(token: str, session: Session = Depends(get_session)):
    """Public endpoint that serves PDF based on a valid one-time token."""
    _cleanup_expired_tokens()
    
    token_data = _preview_tokens.get(token)
    if not token_data:
        raise HTTPException(status_code=410, detail="Token kadaluarsa atau tidak valid")
    
    if datetime.now(timezone.utc) > token_data["expires_at"]:
        _preview_tokens.pop(token, None)
        raise HTTPException(status_code=410, detail="Token sudah kadaluarsa")

    # Do NOT pop the token immediately! Native browser PDF viewers 
    # often make multiple byte-range or chunk requests.
    # We rely on `_cleanup_expired_tokens` to remove it after TTL (60s / 5m).
    # _preview_tokens.pop(token)

    if token_data["type"] == "single":
        invoice_id = token_data["invoice_id"]
        doc_type = token_data["doc_type"]
        query = (
            select(
                Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
                User.name.label("tenant_name"), Tenant.nik,
            )
            .join(Tenant, Invoice.tenant_id == Tenant.id)
            .join(Room, Tenant.room_id == Room.id)
            .join(User, Tenant.user_id == User.id)
            .where(Invoice.id == invoice_id)
        )
        result = session.exec(query).first()
        if not result:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return _get_single_invoice_pdf(result, invoice_id, session, doc_type)
        
    elif token_data["type"] == "bulk":
        p = token_data["params"]
        return _get_bulk_invoice_pdf(session, p["month"], p["year"], p["doc_type"], p["building"])
    
    raise HTTPException(status_code=400, detail="Invalid token type")

@router.get("/{invoice_id}/print")
def print_invoice(
    invoice_id: int,
    doc_type: Optional[DocumentType] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(
            Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
            User.name.label("tenant_name"), Tenant.nik,
        )
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .join(User, Tenant.user_id == User.id)
        .where(Invoice.id == invoice_id)
    )
    result = session.exec(query).first()
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _get_single_invoice_pdf(result, invoice_id, session, doc_type)

@router.get("/{invoice_id}/token")
def get_print_token(
    invoice_id: int,
    doc_type: Optional[DocumentType] = None,
    current_user: User = Depends(require_admin),
):
    """Generates a one-time use token for PDF preview that expires in 60 seconds."""
    token = secrets.token_urlsafe(32)
    _preview_tokens[token] = {
        "type": "single",
        "invoice_id": invoice_id,
        "doc_type": doc_type,
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=60)
    }
    return {"token": token}


# Helpers
def _prepare_invoice_context(result: Any, session: Session, doc_type: Optional[DocumentType] = None) -> Dict[str, Any]:
    """Helper to prepare the data dictionary (context) used by docxtpl."""
    inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, t_nik = result
    
    if not doc_type:
        doc_type = inv_obj.document_type

    months_id = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
        7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
    }

    # Pembuatan ID Penghuni (8 digit kode kamar)
    room_obj = session.get(Room, inv_obj.tenant.room_id) if hasattr(inv_obj, 'tenant') and inv_obj.tenant else None
    if not room_obj:
        room_obj = session.exec(select(Room).join(Tenant, Tenant.room_id == Room.id).where(Tenant.id == inv_obj.tenant_id)).first()
    
    id_penghuni_code = get_room_code(room_obj) if room_obj else t_nik
    
    display_penalty = inv_obj.penalty_amount or Decimal(0)
    display_total = inv_obj.total_amount or Decimal(0)
    
    # Dynamic calculation for preview/non-persisted penalty
    if doc_type in (DocumentType.strd, DocumentType.teguran1, DocumentType.teguran2, DocumentType.teguran3):
        if display_penalty == Decimal(0):
            display_penalty = (inv_obj.base_rent + inv_obj.parking_charge) * Decimal(str(settings.PENALTY_RATE))
            display_penalty = display_penalty.quantize(Decimal("0.01"))
            display_total = inv_obj.base_rent + inv_obj.parking_charge + inv_obj.water_charge + inv_obj.electricity_charge + inv_obj.other_charge + display_penalty

    def fmt_date(d: Optional[date]):
        if not d: d = date.today()
        return d.strftime("%d %B %Y").replace("January", "Januari").replace("February", "Februari").replace("March", "Maret").replace("April", "April").replace("May", "Mei").replace("June", "Juni").replace("July", "Juli").replace("August", "Agustus").replace("September", "September").replace("October", "Oktober").replace("November", "November").replace("December", "Desember")

    context = {
        # Identitas Dasar
        "nama_penyewa": t_name,
        "nama": t_name,
        "nik": t_nik,
        "id_penghuni": id_penghuni_code,
        "id_kamar": id_penghuni_code,
        "alamat_hunian": f"{r_bu.split(' - ')[-1]} {ROMAN.get(r_fl, str(r_fl))} {r_un}",
        
        # Lokasi & Unit
        "unit": r_num,
        "room_number": r_num,
        "gedung": r_bu,
        "building": r_bu,
        "lantai": str(r_fl),
        "floor": str(r_fl),
        "floor_roman": ROMAN.get(r_fl, str(r_fl)),
        "rusunawa": (r_ru.value if hasattr(r_ru, 'value') else str(r_ru)),
        "location_name": (r_ru.value if hasattr(r_ru, 'value') else str(r_ru)),
        "info_rekening": "0083 0732 92001/ Bendahara Penerimaan Disperkim Kota Cimahi",
        
        # Data Surat
        "nomor_surat": getattr(inv_obj, f"{doc_type.value}_number", "-") or "-",
        "invoice_number": getattr(inv_obj, f"{doc_type.value}_number", "-") or "-",
        "tanggal_surat": fmt_date(getattr(inv_obj, f"{doc_type.value}_date", None)),
        "tanggal_ttd": fmt_date(getattr(inv_obj, f"{doc_type.value}_date", None)),
        
        # Periode
        "bulan_tagihan": months_id.get(inv_obj.period_month, str(inv_obj.period_month)),
        "billing_month": months_id.get(inv_obj.period_month, str(inv_obj.period_month)),
        "tahun_tagihan": str(inv_obj.period_year),
        "year": str(inv_obj.period_year),
        "tenggat_bayar": fmt_date(inv_obj.due_date),
        
        # Rincian Biaya
        "sewa_price": fmt_decimal(inv_obj.base_rent),
        "parking_price": fmt_decimal(inv_obj.parking_charge),
        "water_price": fmt_decimal(inv_obj.water_charge),
        "electricity_price": fmt_decimal(inv_obj.electricity_charge),
        "other_price": fmt_decimal(inv_obj.other_charge),
        "additional_price": fmt_decimal(inv_obj.water_charge + inv_obj.electricity_charge + inv_obj.parking_charge + inv_obj.other_charge),
        "penalty_price": fmt_decimal(display_penalty),
        "total_tagihan": fmt_decimal(display_total),
        "denda": fmt_decimal(display_penalty),
        "total_bayar": fmt_decimal(display_total),
        "total_price": fmt_decimal(display_total),
        "total_price_words": f"#{terbilang(int(display_total))}#"
    }
    return context

def pre_generate_invoices_task(invoice_ids: List[int]):
    """Background task to pre-generate PDF documents for a list of invoices."""
    from app.core.db import engine
    with Session(engine) as session:
        for inv_id in invoice_ids:
            try:
                statement = select(
                    Invoice, Room.number, Room.rusunawa, Room.building, Room.floor, Room.unit_number, Tenant.name, Tenant.nik
                ).join(Tenant, Invoice.tenant_id == Tenant.id).join(Room, Tenant.room_id == Room.id).where(Invoice.id == inv_id)
                
                result = session.exec(statement).first()
                if not result: continue
                
                inv_obj = result[0]
                doc_type = inv_obj.document_type
                
                context = _prepare_invoice_context(result, session, doc_type)
                # Note: DocumentService uses a thread lock internally
                DocumentService.generate_invoice_document(context, doc_type.value, inv_id)
            except Exception as e:
                print(f"[BG PDF] Error ID {inv_id}: {str(e)}")

def _get_single_invoice_pdf(result: Any, invoice_id: int, session: Session, doc_type: Optional[DocumentType] = None) -> Response:
    inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, t_nik = result
    
    if not doc_type:
        doc_type = inv_obj.document_type

    context = _prepare_invoice_context(result, session, doc_type)


    try:
        file_path = DocumentService.generate_invoice_document(context, doc_type.value, invoice_id)
        full_path = os.path.abspath(file_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=500, detail="Generated file not found")
        if not full_path.lower().endswith(".pdf"):
            raise HTTPException(status_code=500, detail="Konversi PDF gagal.")
        
        with open(full_path, "rb") as f:
            pdf_content = f.read()
        return Response(
            content=pdf_content, media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{doc_type.value}_{invoice_id}.pdf"',
                "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store",
            }
        )
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Gagal memproses dokumen: {str(e)}")

def _get_bulk_invoice_pdf(
    session: Session, month: int, year: int, doc_type: Optional[DocumentType] = None, building: Optional[str] = None
) -> Response:
    query = (
        select(
            Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
            User.name.label("tenant_name"), Tenant.nik,
        )
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .join(User, Tenant.user_id == User.id)
        .where(Invoice.period_month == month)
        .where(Invoice.period_year == year)
    )
    if building: query = query.where(Room.building == building)
    if doc_type: query = query.where(Invoice.document_type == doc_type)
    query = query.order_by(Room.building, Room.floor, Room.unit_number)
    results = session.exec(query).all()
    if not results:
        raise HTTPException(status_code=404, detail="Tidak ada data untuk dicetak")
    return _get_bulk_invoice_pdf_response(results, month, year, doc_type)

def _get_bulk_invoice_pdf_response(results: Any, month: int, year: int, doc_type: Optional[DocumentType]) -> Response:
    merger = PdfWriter()
    temp_files_to_merge = 0
    months_id = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
        7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
    }

    try:
        for row in results:
            inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, t_nik = row
            actual_doc_type = doc_type or inv_obj.document_type
            
            # Reconstruct room object for code generation
            class TempRoom: pass
            tr = TempRoom()
            tr.rusunawa = r_ru
            tr.building = r_bu
            tr.floor = r_fl
            tr.unit_number = r_un
            
            id_penghuni_code = get_room_code(tr) # type: ignore

            display_penalty = inv_obj.penalty_amount or Decimal(0)
            display_total = inv_obj.total_amount or Decimal(0)
            
            # Jika user meminta preview STRD/Teguran tapi di DB denda belum diupdate (masih 0)
            if actual_doc_type in (DocumentType.strd, DocumentType.teguran1, DocumentType.teguran2, DocumentType.teguran3):
                if display_penalty == Decimal(0):
                    display_penalty = (inv_obj.base_rent + inv_obj.parking_charge) * Decimal(str(settings.PENALTY_RATE))
                    display_penalty = display_penalty.quantize(Decimal("0.01"))
                    display_total = inv_obj.base_rent + inv_obj.parking_charge + inv_obj.water_charge + inv_obj.electricity_charge + inv_obj.other_charge + display_penalty

            context = {
                # Identitas Dasar
                "nama_penyewa": t_name,
                "nama": t_name,
                "nik": t_nik,
                "id_penghuni": id_penghuni_code,
                "id_kamar": id_penghuni_code,
                "alamat_hunian": f"{r_bu.split(' - ')[-1]} {ROMAN.get(r_fl, str(r_fl))} {r_un}",

                # Lokasi & Unit
                "unit": r_num,
                "room_number": r_num,
                "gedung": r_bu,
                "building": r_bu,
                "lantai": str(r_fl),
                "floor": str(r_fl),
                "floor_roman": ROMAN.get(r_fl, str(r_fl)),
                "rusunawa": (r_ru.value if hasattr(r_ru, 'value') else str(r_ru)),
                "location_name": (r_ru.value if hasattr(r_ru, 'value') else str(r_ru)),
                "info_rekening": "0083 0732 92001/ Bendahara Penerimaan Disperkim Kota Cimahi",

                # Data Surat
                "nomor_surat": getattr(inv_obj, f"{actual_doc_type.value}_number", "-") or "-",
                "invoice_number": getattr(inv_obj, f"{actual_doc_type.value}_number", "-") or "-",
                "tanggal_surat": (getattr(inv_obj, f"{actual_doc_type.value}_date", None) or date.today()).strftime("%d %B %Y").replace("January", "Januari").replace("February", "Februari").replace("March", "Maret").replace("April", "April").replace("May", "Mei").replace("June", "Juni").replace("July", "Juli").replace("August", "Agustus").replace("September", "September").replace("October", "Oktober").replace("November", "November").replace("December", "Desember"),

                # Periode
                "bulan_tagihan": months_id.get(inv_obj.period_month, str(inv_obj.period_month)),
                "billing_month": months_id.get(inv_obj.period_month, str(inv_obj.period_month)),
                "tahun_tagihan": str(inv_obj.period_year),
                "year": str(inv_obj.period_year),
                "tenggat_bayar": (inv_obj.due_date or date.today()).strftime("%d %B %Y").replace("January", "Januari").replace("February", "Februari").replace("March", "Maret").replace("April", "April").replace("May", "Mei").replace("June", "Juni").replace("July", "Juli").replace("August", "Agustus").replace("September", "September").replace("October", "Oktober").replace("November", "November").replace("December", "Desember"),

                # Rincian Biaya
                "sewa_price": fmt_decimal(inv_obj.base_rent),
                "parking_price": fmt_decimal(inv_obj.parking_charge),
                "water_price": fmt_decimal(inv_obj.water_charge),
                "electricity_price": fmt_decimal(inv_obj.electricity_charge),
                "other_price": fmt_decimal(inv_obj.other_charge),
                "additional_price": fmt_decimal(inv_obj.water_charge + inv_obj.electricity_charge + inv_obj.parking_charge + inv_obj.other_charge),
                "penalty_price": fmt_decimal(display_penalty),
                "total_tagihan": fmt_decimal(display_total),
                "denda": fmt_decimal(display_penalty),
                "total_bayar": fmt_decimal(display_total),
                "total_price": fmt_decimal(display_total),
                "total_price_words": f"#{terbilang(int(display_total))}#"
            }
            file_path = DocumentService.generate_invoice_document(context, actual_doc_type.value, inv_obj.id)
            full_path = os.path.abspath(file_path)
            if full_path.endswith(".pdf"):
                merger.append(full_path)
                temp_files_to_merge += 1
        
        if temp_files_to_merge == 0:
             raise HTTPException(status_code=500, detail="Gagal men-generate PDF untuk digabungkan.")

        output_filename = f"BULK_{doc_type.value if doc_type else 'INVOICES'}_{month}_{year}.pdf"
        output_dir = os.path.join("uploads", "bulk")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        with open(output_path, "wb") as f:
            merger.write(f)
        
        with open(output_path, "rb") as f:
            pdf_content = f.read()
        return Response(
            content=pdf_content, media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{output_filename}"',
                "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal cetak massal: {str(e)}")
    finally:
        merger.close()

def _process_bulk_pdf_background(
    job_id: str, month: int, year: int, doc_type: Optional[DocumentType], building: Optional[str]
):
    """Background worker that builds the bulk PDF without blocking the HTTP request."""
    from app.core.db import engine
    
    with Session(engine) as session:
        query = (
            select(
                Invoice, Room.room_number, Room.rusunawa, Room.building, Room.floor, Room.unit_number,
                User.name.label("tenant_name"), Tenant.nik,
            )
            .join(Tenant, Invoice.tenant_id == Tenant.id)
            .join(Room, Tenant.room_id == Room.id)
            .join(User, Tenant.user_id == User.id)
            .where(Invoice.period_month == month)
            .where(Invoice.period_year == year)
        )
        if building: query = query.where(Room.building == building)
        if doc_type: query = query.where(Invoice.document_type == doc_type)
        query = query.order_by(Room.building, Room.floor, Room.unit_number)
        results = session.exec(query).all()
        
        if not results:
            _bulk_print_jobs[job_id]["status"] = "failed"
            _bulk_print_jobs[job_id]["error"] = "Tidak ada data untuk dicetak"
            return
            
        _bulk_print_jobs[job_id]["total"] = len(results)
    
        merger = PdfWriter()
        temp_files_to_merge = 0
        try:
            for i, row in enumerate(results):
                # Update progress
                _bulk_print_jobs[job_id]["processed"] = i
                
                inv_obj = row[0] # The first item in the Tuple is the Invoice object
                actual_doc_type = doc_type or inv_obj.document_type
                
                context = _prepare_invoice_context(row, session, actual_doc_type)

                file_path = DocumentService.generate_invoice_document(context, actual_doc_type.value, inv_obj.id)
                full_path = os.path.abspath(file_path)
                if full_path.endswith(".pdf"):
                    merger.append(full_path)
                    temp_files_to_merge += 1
            
            if temp_files_to_merge == 0:
                 _bulk_print_jobs[job_id]["status"] = "failed"
                 _bulk_print_jobs[job_id]["error"] = "Gagal men-generate PDF untuk digabungkan."
                 return

            output_filename = f"BULK_{doc_type.value if doc_type else 'INVOICES'}_{month}_{year}_{job_id[:6]}.pdf"
            output_dir = os.path.join("uploads", "bulk")
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, output_filename)
            
            with open(output_path, "wb") as f:
                merger.write(f)
                
            _bulk_print_jobs[job_id]["status"] = "completed"
            _bulk_print_jobs[job_id]["processed"] = temp_files_to_merge
            _bulk_print_jobs[job_id]["file_path"] = output_path
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            _bulk_print_jobs[job_id]["status"] = "failed"
            _bulk_print_jobs[job_id]["error"] = str(e)
        finally:
            merger.close()

@router.get("/print-bulk/async")
def start_bulk_print_async(
    background_tasks: BackgroundTasks,
    month: int,
    year: int,
    doc_type: Optional[DocumentType] = None,
    building: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """Mulai task cetak massal secara asynchronous dan kembalikan job_id."""
    job_id = secrets.token_hex(16)
    _bulk_print_jobs[job_id] = {
        "status": "processing",
        "total": 0,
        "processed": 0,
        "file_path": None,
        "error": None
    }
    background_tasks.add_task(_process_bulk_pdf_background, job_id, month, year, doc_type, building)
    return {"job_id": job_id, "message": "Proses cetak massal dimulai di background"}

@router.get("/print-bulk/status/{job_id}")
def check_bulk_print_status(job_id: str):
    """Cek progress task cetak massal."""
    job = _bulk_print_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID tidak ditemukan")
    return job

@router.get("/print-bulk/download/{job_id}")
def download_bulk_print_result(job_id: str):
    """Download hasil cetak massal yang sudah completed."""
    job = _bulk_print_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID tidak ditemukan")
    if job["status"] != "completed" or not job["file_path"]:
        raise HTTPException(status_code=400, detail="Job belum selesai atau gagal")
        
    full_path = os.path.abspath(job["file_path"])
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File hasil cetak tidak ditemukan")
        
    filename = os.path.basename(full_path)
    return FileResponse(
        path=full_path, 
        filename=filename, 
        media_type="application/pdf",
        content_disposition_type="attachment"
    )

def internal_mass_generate_invoices(
    session: Session,
    period_month: int,
    period_year: int,
    due_date: date,
    sign_date: Optional[date] = None,
    other_charge: Decimal = Decimal("0"),
    start_skrd_no: Optional[int] = None,
    notes: str = "Otomatisasi bulanan",
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Logika inti pembuatan invoice massal."""
    # 1. Ambil semua penghuni aktif, urutkan agar penomoran rapi
    # Kita urutkan berdasarkan Site (id), Building, Floor, Unit supaya numbering sekuensial konsisten per gedung
    query = (
        select(Tenant)
        .join(Room, Tenant.room_id == Room.id)
        .where(Tenant.is_active == True)
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
    active_tenants = session.exec(query).all()
    print(f"[Mass Generate] Period: {period_month}/{period_year}, Found {len(active_tenants)} active tenants.")
    if not active_tenants:
        return {"success": True, "generated": 0, "message": "Tidak ada penghuni aktif"}

    # 2. Cari tagihan yang sudah ada untuk periode ini
    existing_invoices = session.exec(
        select(Invoice).where(
            Invoice.period_month == period_month,
            Invoice.period_year == period_year
        )
    ).all()
    
    # Kumpulan tenant_id yang sudah ditagih
    billed_tenant_ids = {inv.tenant_id for inv in existing_invoices}

    # 3. Ambil data kamar untuk base_rent
    rooms = session.exec(select(Room)).all()
    room_dict = {r.id: r for r in rooms}

    # 4. Filter tenant yang belum ditagih dan siapkan object Invoice baru
    new_invoices = []
    
    for tenant in active_tenants:
        if tenant.id in billed_tenant_ids:
            print(f"  - Skipping Tenant ID {tenant.id}: Already billed for {period_month}/{period_year}")
            continue
            
        # 3. Check Overlap Kontrak
        _, last_day = calendar.monthrange(period_year, period_month)
        start_of_period = date(period_year, period_month, 1)
        end_of_period = date(period_year, period_month, last_day)
        
        # Jika kontrak mulai SETELAH periode ini berakhir -> SKIP
        # Kita tidak melakukan skip jika contract_end < start_of_period karena admin ingin 
        # tetap menagih penghuni yang masih aktif meskipun masa kontrak formalnya habis.
        if tenant.contract_start > end_of_period:
            print(f"  - Skipping Tenant ID {tenant.id}: Contract starts at {tenant.contract_start}, which is after period {period_month}/{period_year}")
            continue

        room = room_dict.get(tenant.room_id)
        if not room:
            continue

        base_rent = room.price
        parking_charge = MOTOR_RATE * Decimal(str(tenant.motor_count or 0))
        # Default water/electricity to 0 in mass generate
        water_charge = Decimal("0")
        electricity_charge = Decimal("0")
        
        total = Decimal(str(base_rent)) + parking_charge + water_charge + electricity_charge + other_charge
        
        # 4a. Logic Penomoran SKRD
        skrd_number = None
        if start_skrd_no is not None:
            # Mapping Site Code
            site_codes = {
                "Cigugur Tengah": "01",
                "Cibeureum": "02",
                "Leuwigajah": "03"
            }
            # Cermat: Cibeureum A/B/C/D semua kodenya 02? 
            # Per user request: 02 = Cibeureum.
            site_key = room.rusunawa.value if hasattr(room.rusunawa, 'value') else str(room.rusunawa)
            code = site_codes.get(site_key, "00")
            
            # Map Month to Roman
            romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
            month_rom = romans[period_month - 1] if 1 <= period_month <= 12 else str(period_month)
            
            # current_no = start_skrd_no + index_in_batch
            # Kita hitung index dari total yang SUDAH digenerate di loop ini
            current_idx = len(new_invoices)
            seq_no = start_skrd_no + current_idx
            
            skrd_number = f"974/SKRD/{code}.{seq_no}/UPTD.RSN/{month_rom}/{period_year}"

        # 4b. Tentukan jenis dokumen: Selalu SKRD saat pembuatan awal (sesuai request user)
        doc_type = DocumentType.skrd

        # Tanggal surat SKRD: dari user input, fallback ke due_date
        effective_skrd_date = sign_date or due_date

        inv = Invoice(
            tenant_id=tenant.id,
            period_month=period_month,
            period_year=period_year,
            due_date=due_date,
            base_rent=base_rent,
            water_charge=water_charge,
            electricity_charge=electricity_charge,
            parking_charge=parking_charge,
            other_charge=other_charge,
            total_amount=total,
            notes=notes,
            status=InvoiceStatus.unpaid,
            document_type=doc_type,
            skrd_number=skrd_number,
            skrd_date=effective_skrd_date,
        )
        
        # Attach preview data if it's a dry run
        if dry_run:
            from app.models.user import User
            user = session.exec(select(User).where(User.id == tenant.user_id)).first()
            tenant_name = user.name if user else "Unknown"
            room_label = f"{room.building.split(' - ')[-1]} {ROMAN.get(room.floor, str(room.floor))} {room.unit_number}"
            rusunawa_name = room.rusunawa.value if hasattr(room.rusunawa, 'value') else str(room.rusunawa)
            
            inv._preview = {
                "tenant_name": tenant_name,
                "room_label": room_label,
                "rusunawa": rusunawa_name,
                "base_rent": float(base_rent),
                "parking_charge": float(parking_charge),
                "penalty_amount": 0.0,
                "total_amount": float(total)
            }

        new_invoices.append(inv)

    if dry_run:
        return {
            "success": True,
            "generated": len(new_invoices),
            "total_active": len(active_tenants),
            "message": f"Ditemukan {len(new_invoices)} penghuni yang akan di-generate tagihan.",
            "dry_run": True,
            "preview_data": [i._preview for i in new_invoices]
        }

    # 5. Bulk insert jika ada yang baru

    count_generated = len(new_invoices)
    invoice_ids = []
    if count_generated > 0:
        session.add_all(new_invoices)
        session.commit()
        # Refresh to get IDs
        invoice_ids = [inv.id for inv in new_invoices]

    return {
        "success": True, 
        "generated": count_generated, 
        "invoice_ids": invoice_ids,
        "total_active": len(active_tenants),
        "message": f"Berhasil generate {count_generated} tagihan. {len(billed_tenant_ids) + (len(active_tenants) - count_generated - len(billed_tenant_ids))} tagihan sudah ada/di-skip."
    }




@router.post("/mass-generate", status_code=201)
def mass_generate_invoices(
    mass_in: InvoiceMassGenerate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:

    """Generate tagihan bulanan untuk SEMUA penghuni aktif yang belum punya invoice di bulan/tahun tsb."""
    try:
        result = internal_mass_generate_invoices(
            session=session,
            period_month=mass_in.period_month,
            period_year=mass_in.period_year,
            due_date=mass_in.due_date,
            sign_date=mass_in.sign_date,
            other_charge=Decimal(str(mass_in.other_charge or 0)),
            start_skrd_no=mass_in.start_skrd_no,
            notes=mass_in.notes or "Generate Massal",
            dry_run=mass_in.dry_run
        )
        
        # Trigger background PDF generation for new invoices
        if result.get("invoice_ids"):
            background_tasks.add_task(pre_generate_invoices_task, result["invoice_ids"])
            
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")


def internal_mass_generate_teguran(
    session: Session,
    doc_type: DocumentType,
    period_month: int,
    period_year: int,
    sign_date: date,
    deadline_date: Optional[date],  # Now ignored/computed internally
    start_no: int,
    building: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Mengubah tagihan belum lunas menjadi status Teguran (T1/T2/T3) secara massal."""
    # 1. Mapping tipe dokumen ke kode singkatan (T1, T2, T3)
    type_map = {
        DocumentType.teguran1: "T1",
        DocumentType.teguran2: "T2",
        DocumentType.teguran3: "T3"
    }
    short_type = type_map.get(doc_type)
    if not short_type:
        raise ValueError("doc_type harus teguran1, teguran2, atau teguran3")

    # 2. Ambil invoice + data kamar sekaligus (Eager Loading)
    query = select(Invoice, Room).join(Tenant, Invoice.tenant_id == Tenant.id).join(Room, Tenant.room_id == Room.id).where(
        Invoice.period_month == period_month,
        Invoice.period_year == period_year,
        Invoice.status.in_([InvoiceStatus.unpaid, InvoiceStatus.overdue])
    ).order_by(
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
    
    # Filter gedung jika ada
    if building:
        query = query.where(Room.building == building)

    results = session.exec(query).all()
    
    if not results:
        return {"success": True, "updated": 0, "message": "Tidak ada tagihan menunggak yang ditemukan untuk periode ini."}

    # 3. Proses update
    count_updated = 0
    current_seq = start_no
    
    # Otomatisasi tenggat: 7 hari setelah tanggal tanda tangan
    effective_deadline = sign_date + timedelta(days=7)
    
    site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
    
    # Map Romawi lengkap untuk bulan (I - XII)
    MONTH_ROMAN = {
        1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 
        7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII"
    }
    month_roman = MONTH_ROMAN.get(sign_date.month, "I")
    year_str = str(sign_date.year)

    for inv, room in results:
        site_key = room.rusunawa.value if hasattr(room.rusunawa, 'value') else str(room.rusunawa)
        rusun_code = site_codes.get(site_key, "00")
        
        # Format nomor: 974/TX/SITE.SEQ/UPTD.RSN/ROMAN/YEAR
        doc_no = f"974/{short_type}/{rusun_code}.{current_seq}/UPTD.RSN/{month_roman}/{year_str}"
        
        # Update field sesuai tipe teguran
        if doc_type == DocumentType.teguran1:
            inv.teguran1_number = doc_no
            inv.teguran1_date = sign_date
        elif doc_type == DocumentType.teguran2:
            inv.teguran2_number = doc_no
            inv.teguran2_date = sign_date
        elif doc_type == DocumentType.teguran3:
            inv.teguran3_number = doc_no
            inv.teguran3_date = sign_date
            
        inv.document_type = doc_type
        inv.due_date = effective_deadline # Update tenggat bayar di surat teguran
        if notes:
            inv.notes = notes

        # Pastikan denda terhitung
        _recalculate_penalty(inv, session)
        
        session.add(inv)
        count_updated += 1
        current_seq += 1

    session.commit()
    invoice_ids = [inv.id for inv, room in results]
    
    return {
        "success": True,
        "updated": count_updated,
        "invoice_ids": invoice_ids,
        "message": f"Berhasil memproses {count_updated} surat {doc_type}."
    }



@router.post("/mass-generate-teguran", status_code=201)
def mass_generate_teguran_endpoint(
    req: InvoiceTeguranMassGenerate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:

    """Trigger manual untuk generate Surat Teguran 1, 2, atau 3 secara massal."""
    try:
        result = internal_mass_generate_teguran(
            session=session,
            doc_type=req.doc_type,
            period_month=req.period_month,
            period_year=req.period_year,
            sign_date=req.sign_date,
            deadline_date=req.deadline_date,
            start_no=req.start_no,
            building=req.building,
            notes=req.notes
        )
        
        # Trigger background PDF generation
        if result.get("invoice_ids"):
            background_tasks.add_task(pre_generate_invoices_task, result["invoice_ids"])
            
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal generate teguran massal: {str(e)}")

@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    if current_user.role == UserRole.penghuni:
        tenant = session.get(Tenant, invoice.tenant_id)
        if not tenant or tenant.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    elif current_user.role not in [UserRole.admin, UserRole.sadmin]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return invoice


@router.post("/generate", response_model=InvoiceRead, status_code=201)
def generate_invoice(
    invoice_in: InvoiceCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Generate tagihan bulanan. Harga sewa diambil otomatis dari data kamar."""
    tenant = session.get(Tenant, invoice_in.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    if not tenant.is_active:
        raise HTTPException(status_code=400, detail="Penghuni sudah tidak aktif")

    # Cek apakah sudah ada invoice untuk periode yang sama
    existing = session.exec(
        select(Invoice).where(
            Invoice.tenant_id == invoice_in.tenant_id,
            Invoice.period_month == invoice_in.period_month,
            Invoice.period_year == invoice_in.period_year,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Invoice untuk periode ini sudah ada")

    room = session.get(Room, tenant.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Data kamar tidak ditemukan")

    base_rent = room.price
    # Auto-kalkulasi parkir motor: jumlah motor penghuni × Rp30.000
    parking_charge = MOTOR_RATE * Decimal(tenant.motor_count)
    total = (
        base_rent
        + parking_charge
        + invoice_in.water_charge
        + invoice_in.electricity_charge
        + invoice_in.other_charge
    )

    invoice = Invoice(
        tenant_id=invoice_in.tenant_id,
        period_month=invoice_in.period_month,
        period_year=invoice_in.period_year,
        base_rent=base_rent,
        water_charge=invoice_in.water_charge,
        electricity_charge=invoice_in.electricity_charge,
        parking_charge=parking_charge,
        other_charge=invoice_in.other_charge,
        total_amount=total,
        notes=invoice_in.notes,
        status=InvoiceStatus.unpaid,
        document_type=DocumentType.skrd,
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@router.patch("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: int,
    invoice_in: InvoiceUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    
    # HIGH-02: Explicit field whitelist — prevent status/amount manipulation
    ALLOWED_UPDATE_FIELDS = {
        "water_charge", "electricity_charge", "other_charge", 
        "notes", "due_date", "parking_charge"
    }
    update_data = invoice_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key in ALLOWED_UPDATE_FIELDS:
            setattr(invoice, key, value)
    
    # Recalculate total if charges changed
    if any(k in update_data for k in ["water_charge", "electricity_charge", "other_charge", "parking_charge"]):
        invoice.total_amount = (
            invoice.base_rent +
            invoice.water_charge +
            invoice.electricity_charge +
            invoice.parking_charge +
            invoice.other_charge +
            (invoice.penalty_amount or 0)
        )
    
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice

def _recalculate_penalty(invoice: Invoice, session: Session) -> bool:
    """Helper: Menghitung ulang dan menyimpan denda jika tagihan jatuh tempo.
    Return True jika ada perubahan total_amount."""
    if invoice.status == InvoiceStatus.paid:
        return False

    base_total = (
        (invoice.base_rent or Decimal(0))
        + (invoice.water_charge or Decimal(0))
        + (invoice.electricity_charge or Decimal(0))
        + (invoice.parking_charge or Decimal(0))
        + (invoice.other_charge or Decimal(0))
    )

    if invoice.due_date and invoice.due_date < date.today():
        dynamic_penalty = base_total * Decimal("0.02")
        db_penalty = invoice.penalty_amount or Decimal(0)
        
        # Selalu setel denda di angka 2% flat untuk menormalkan data legacy
        # Jika berbeda dari DB, kita paksa simpan nilai 2% tersebut
        if dynamic_penalty != db_penalty:
            invoice.penalty_amount = dynamic_penalty
            invoice.total_amount = base_total + dynamic_penalty
            session.add(invoice)
            session.commit()
            session.refresh(invoice)
            return True
            
    return False

@router.post("/{invoice_id}/pay", response_model=InvoiceRead)
def pay_invoice_midtrans(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generate Midtrans payment link/token on demand saat user klik 'Bayar'.
    """
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
        
    if current_user.role == UserRole.penghuni:
        tenant = session.get(Tenant, invoice.tenant_id)
        if not tenant or tenant.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Tagihan sudah lunas")

    # Update penalty dynamically before paying
    amount_changed = _recalculate_penalty(invoice, session)

    # Force generate ulang link Midtrans jika nominal berubah karena denda
    if amount_changed:
        invoice.payment_url = None
        invoice.payment_id = None
        session.add(invoice)
        session.commit()

    # Jika sudah punya payment_url dan status unpaid, cek apakah total_amount berubah.
    # Namun jika kita update setiap hari, maka transaction yg belum dibayar bisa kedaluwarsa.
    # Untuk simplifikasi, anggap saja kalau butuh update token, token lama tetap dipakai selama masih valid. 
    # Idealnya jika nominal berubah, paksa generate ulang link. Namun di sini biarkan dulu.

    # Jika sudah punya payment_url dan status unpaid, kembalikan saja URL lama agar tidak generate ulang di Midtrans
    if invoice.payment_url and invoice.payment_id:
        return invoice


    tenant = session.get(Tenant, invoice.tenant_id)
    user = session.get(User, tenant.user_id) if tenant else None

    snap = midtransclient.Snap(
        is_production=settings.MIDTRANS_IS_PRODUCTION,
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY
    )

    # Tambahkan timestamp di order_id supaya unik untuk setiap percobaan generate
    order_id = f"INV-{invoice.id}-{int(datetime.utcnow().timestamp())}"
    
    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": int(invoice.total_amount)
        },
        "customer_details": {
            "first_name": user.name if user else "Penghuni",
            "email": user.email if user else "penghuni@rusunawa.local",
            "phone": user.phone if user else ""
        }
    }

    try:
        # Panggil API Midtrans untuk mendapatkan Snap Token & URL Iframe
        transaction = snap.create_transaction(param)
        
        # Simpan kembali Response Midtrans ke Database Anda
        invoice.payment_url = transaction['redirect_url']
        invoice.payment_id = transaction['token']
        # Simpan order_id asli kita mempermudah debugging webhook Midtrans
        invoice.midtrans_order_id = order_id
        
        session.add(invoice)
        session.commit()
        session.refresh(invoice)
        
        return invoice
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal generate pembayaran Midtrans: {str(e)}")
@router.post("/bulk-pay")
def bulk_pay_invoices(
    req: InvoiceBulkPay,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """Menandai beberapa tagihan sebagai lunas sekaligus."""
    if not req.invoice_ids:
        raise HTTPException(status_code=400, detail="Pilih minimal satu tagihan")
        
    invoices = session.exec(
        select(Invoice).where(Invoice.id.in_(req.invoice_ids))
    ).all()
    
    count = 0
    for inv in invoices:
        if inv.status != InvoiceStatus.paid:
            _recalculate_penalty(inv, session)
            inv.status = InvoiceStatus.paid
            inv.paid_at = req.paid_at
            session.add(inv)
            count += 1

            
    session.commit()
    return {"success": True, "updated_count": count}
