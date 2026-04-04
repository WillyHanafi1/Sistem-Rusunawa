from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from decimal import Decimal
import math
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.invoice import Invoice, InvoiceCreate, InvoiceRead, InvoiceUpdate, InvoiceStatus, DocumentType, MOTOR_RATE, InvoiceMassGenerate, InvoiceReadWithRoom, InvoiceBulkPay
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User, UserRole
from app.core.config import settings
from app.core.document_service import DocumentService
import midtransclient
import calendar
import os
from datetime import datetime, date

router = APIRouter(prefix="/invoices", tags=["Invoices"])


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
            Invoice,
            Room.room_number,
            Room.rusunawa,
            Room.building,
            Room.floor,
            Room.unit_number,
            User.name.label("tenant_name"),
            Tenant.contract_start,
            Tenant.contract_end,
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
    
    # Sort by building, floor, unit for better organization
    query = query.order_by(Room.building, Room.floor, Room.unit_number)
    
    # Increase limit for admin multi-month views (especially the payment matrix)
    limit = min(max(limit, 1), 5000)
    skip = max(skip, 0)
    
    results = session.exec(query.offset(skip).limit(limit)).all()
    
    # Map results to InvoiceReadWithRoom
    output = []
    for row in results:
        inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, c_start, c_end = row
        # Convert Invoice ORM to dict and add extra fields
        inv_dict = inv_obj.model_dump()
        inv_dict.update({
            "room_number": r_num,
            "rusunawa": r_ru,
            "building": r_bu,
            "floor": r_fl,
            "unit_number": r_un,
            "tenant_name": t_name,
            "contract_start": c_start,
            "contract_end": c_end
        })
        output.append(InvoiceReadWithRoom(**inv_dict))
        
    return output

@router.patch("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Update metadata invoice (nomor surat, status, dll)."""
    db_invoice = session.get(Invoice, invoice_id)
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")

    obj_data = invoice_update.model_dump(exclude_unset=True)
    for key, value in obj_data.items():
        setattr(db_invoice, key, value)

    # Update document_status_updated_at if document_type changed
    if "document_type" in obj_data:
        db_invoice.document_status_updated_at = datetime.now(timezone.utc)

    session.add(db_invoice)
    session.commit()
    session.refresh(db_invoice)
    return db_invoice


@router.get("/{invoice_id}/print")
def print_invoice(
    invoice_id: int,
    doc_type: Optional[DocumentType] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Fetch invoice with detailed info
    query = (
        select(
            Invoice,
            Room.room_number,
            Room.rusunawa,
            Room.building,
            Room.floor,
            Room.unit_number,
            User.name.label("tenant_name"),
            Tenant.nik,
        )
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .join(Room, Tenant.room_id == Room.id)
        .join(User, Tenant.user_id == User.id)
        .where(Invoice.id == invoice_id)
    )
    result = session.exec(query).first()
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    inv_obj, r_num, r_ru, r_bu, r_fl, r_un, t_name, t_nik = result
    
    # Use current document_type if not specified
    if not doc_type:
        doc_type = inv_obj.document_type

    # Format data for template
    def fmt(val: Decimal):
        if val is None: return "0"
        return f"{val:,.0f}".replace(",", ".")

    # Month mapping in Indonesian
    months_id = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
        7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
    }

    context = {
        "nama_penyewa": t_name,
        "nik": t_nik,
        "nomor_surat": getattr(inv_obj, f"{doc_type.value}_number", "-") or "-",
        "tanggal_surat": (getattr(inv_obj, f"{doc_type.value}_date", None) or date.today()).strftime("%d-%m-%Y"),
        "unit": r_num,
        "gedung": r_bu,
        "lantai": str(r_fl),
        "rusunawa": r_ru,
        "total_tagihan": fmt(inv_obj.total_amount),
        "denda": fmt(inv_obj.penalty_amount),
        "bulan_tagihan": months_id.get(inv_obj.period_month, str(inv_obj.period_month)),
        "tahun_tagihan": str(inv_obj.period_year),
        "total_bayar": fmt(inv_obj.total_amount + inv_obj.penalty_amount)
    }

    try:
        file_path = DocumentService.generate_invoice_document(context, doc_type.value, invoice_id)
        full_path = os.path.abspath(file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=500, detail="Generated file not found")
            
        return FileResponse(
            full_path, 
            media_type="application/pdf", 
            filename=f"{doc_type.value}_{invoice_id}.pdf"
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")


def internal_mass_generate_invoices(
    session: Session,
    period_month: int,
    period_year: int,
    due_date: date,
    other_charge: Decimal = Decimal("0"),
    start_skrd_no: Optional[int] = None,
    notes: str = "Otomatisasi bulanan",
) -> Dict[str, Any]:
    """Logika inti pembuatan invoice massal."""
    # 1. Ambil semua penghuni aktif, urutkan agar penomoran rapi
    # Kita urutkan berdasarkan Site (id), Building, Floor, Unit supaya numbering sekuensial konsisten per gedung
    query = (
        select(Tenant)
        .join(Room, Tenant.room_id == Room.id)
        .where(Tenant.is_active == True)
        .order_by(Room.rusunawa, Room.building, Room.floor, Room.unit_number)
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
            skrd_date=due_date, # Default tanggal SKRD sama dengan batas bayar
        )
        new_invoices.append(inv)

    # 5. Bulk insert jika ada yang baru
    count_generated = len(new_invoices)
    if count_generated > 0:
        session.add_all(new_invoices)
        session.commit()

    return {
        "success": True, 
        "generated": count_generated, 
        "total_active": len(active_tenants),
        "message": f"Berhasil generate {count_generated} tagihan. {len(billed_tenant_ids) + (len(active_tenants) - count_generated - len(billed_tenant_ids))} tagihan sudah ada/di-skip."
    }

@router.post("/mass-generate", status_code=201)
def mass_generate_invoices(
    mass_in: InvoiceMassGenerate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """Generate tagihan bulanan untuk SEMUA penghuni aktif yang belum punya invoice di bulan/tahun tsb."""
    try:
        return internal_mass_generate_invoices(
            session=session,
            period_month=mass_in.period_month,
            period_year=mass_in.period_year,
            due_date=mass_in.due_date,
            other_charge=Decimal(str(mass_in.other_charge or 0)),
            start_skrd_no=mass_in.start_skrd_no,
            notes=mass_in.notes or "Generate Massal"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")

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
