from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from decimal import Decimal
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.invoice import Invoice, InvoiceCreate, InvoiceRead, InvoiceUpdate, InvoiceStatus, MOTOR_RATE
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User, UserRole

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/", response_model=List[InvoiceRead])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    year: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.penghuni:
        tenants = session.exec(select(Tenant).where(Tenant.user_id == current_user.id)).all()
        tenant_ids = [t.id for t in tenants]
        invoices = session.exec(
            select(Invoice).where(Invoice.tenant_id.in_(tenant_ids))
        ).all()
    else:
        query = select(Invoice)
        if tenant_id is not None:
            query = query.where(Invoice.tenant_id == tenant_id)
        if year is not None:
            query = query.where(Invoice.period_year == year)
        invoices = session.exec(query.offset(skip).limit(limit)).all()
    return invoices


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
        + invoice_in.other_charge
    )

    invoice = Invoice(
        tenant_id=invoice_in.tenant_id,
        period_month=invoice_in.period_month,
        period_year=invoice_in.period_year,
        base_rent=base_rent,
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
