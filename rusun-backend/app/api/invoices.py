from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from decimal import Decimal
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.invoice import Invoice, InvoiceCreate, InvoiceRead, InvoiceUpdate, InvoiceStatus, MOTOR_RATE, InvoiceMassGenerate, InvoiceReadWithRoom
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User, UserRole

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/", response_model=List[InvoiceReadWithRoom])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
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


@router.post("/mass-generate", status_code=201)
def mass_generate_invoices(
    mass_in: InvoiceMassGenerate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Dict[str, Any]:
    """Generate tagihan bulanan untuk SEMUA penghuni aktif yang belum punya invoice di bulan/tahun tsb."""
    # 1. Ambil semua penghuni aktif
    active_tenants = session.exec(select(Tenant).where(Tenant.is_active == True)).all()
    if not active_tenants:
        return {"success": True, "generated": 0, "message": "Tidak ada penghuni aktif"}

    tenant_ids = [t.id for t in active_tenants]

    # 2. Cari tagihan yang sudah ada untuk periode ini
    existing_invoices = session.exec(
        select(Invoice).where(
            Invoice.period_month == mass_in.period_month,
            Invoice.period_year == mass_in.period_year,
            Invoice.tenant_id.in_(tenant_ids)
        )
    ).all()
    
    # Kumpulan tenant_id yang sudah ditagih
    billed_tenant_ids = {inv.tenant_id for inv in existing_invoices}

    # 3. Ambil data kamar untuk base_rent (O(1) dictionary lookup)
    room_ids = [t.room_id for t in active_tenants]
    rooms = session.exec(select(Room).where(Room.id.in_(room_ids))).all()
    room_dict = {r.id: r for r in rooms}

    # 4. Filter tenant yang belum ditagih dan siapkan object Invoice baru
    new_invoices = []
    
    for tenant in active_tenants:
        if tenant.id in billed_tenant_ids:
            continue
            
        room = room_dict.get(tenant.room_id)
        if not room:
            continue # Abaikan jika data kamar hilang (anomali)

        base_rent = room.price
        parking_charge = MOTOR_RATE * Decimal(tenant.motor_count)
        # Default water/electricity to 0 in mass generate
        water_charge = Decimal("0")
        electricity_charge = Decimal("0")
        total = base_rent + parking_charge + water_charge + electricity_charge + mass_in.other_charge

        inv = Invoice(
            tenant_id=tenant.id,
            period_month=mass_in.period_month,
            period_year=mass_in.period_year,
            base_rent=base_rent,
            water_charge=water_charge,
            electricity_charge=electricity_charge,
            parking_charge=parking_charge,
            other_charge=mass_in.other_charge,
            total_amount=total,
            due_date=mass_in.due_date,
            notes=mass_in.notes,
            status=InvoiceStatus.unpaid,
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
        due_date=invoice_in.due_date,
        notes=invoice_in.notes,
        status=InvoiceStatus.unpaid,
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
