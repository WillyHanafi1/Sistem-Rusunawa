from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from decimal import Decimal
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.invoice import Invoice, InvoiceCreate, InvoiceRead, InvoiceUpdate, InvoiceStatus, DocumentType, MOTOR_RATE, InvoiceMassGenerate, InvoiceReadWithRoom
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User, UserRole
from app.core.config import settings
import midtransclient
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/", response_model=List[InvoiceReadWithRoom])
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



def internal_mass_generate_invoices(
    session: Session,
    period_month: int,
    period_year: int,
    other_charge: Decimal = Decimal("0"),
    notes: str = "Otomatisasi bulanan",
) -> Dict[str, Any]:
    """Logika inti pembuatan invoice massal."""
    # 1. Ambil semua penghuni aktif
    active_tenants = session.exec(select(Tenant).where(Tenant.is_active == True)).all()
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
        
        inv = Invoice(
            tenant_id=tenant.id,
            period_month=period_month,
            period_year=period_year,
            base_rent=base_rent,
            water_charge=water_charge,
            electricity_charge=electricity_charge,
            parking_charge=parking_charge,
            other_charge=other_charge,
            total_amount=total,
            notes=notes,
            status=InvoiceStatus.unpaid,
            document_type=DocumentType.skrd,
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
        "message": f"Berhasil generate {count_generated} tagihan. {len(billed_tenant_ids)} tagihan sudah ada/di-skip."
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
            other_charge=Decimal(str(mass_in.other_charge or 0)),
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
    update_data = invoice_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


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
