from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from app.core.config import settings

from app.core.db import get_session
from app.core.security import require_admin, require_super_admin, get_current_user
from app.models.tenant import Tenant, TenantCreate, TenantRead, TenantUpdate
from app.models.room import Room, RoomStatus
from app.models.user import User, UserRole
from app.models.invoice import Invoice, InvoiceRead
from app.models.ticket import Ticket, TicketRead
from app.core.import_service import process_tenant_import

router = APIRouter(prefix="/tenants", tags=["Tenants"])


class TenantHistory(BaseModel):
    invoices: List[InvoiceRead]
    tickets: List[TicketRead]


@router.get("/{tenant_id}/history", response_model=TenantHistory)
def get_tenant_history(
    tenant_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    
    if current_user.role == UserRole.penghuni and tenant.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    invoices = session.exec(
        select(Invoice).where(Invoice.tenant_id == tenant_id).order_by(Invoice.period_year.desc(), Invoice.period_month.desc())
    ).all()

    tickets = session.exec(
        select(Ticket).where(Ticket.tenant_id == tenant_id).order_by(Ticket.created_at.desc())
    ).all()

    return {
        "invoices": invoices,
        "tickets": tickets
    }


@router.post("/import", status_code=200)
async def import_tenants(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: User = Depends(require_super_admin),
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File harus berupa format Excel (.xlsx atau .xls)")
    
    content = await file.read()
    result = await process_tenant_import(content, session)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result)
        
    return result


@router.get("/", response_model=List[TenantRead])
def list_tenants(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # MED-02: Validate pagination bounds
    limit = min(max(limit, 1), 100)
    skip = max(skip, 0)
    
    if current_user.role == UserRole.penghuni:
        # Penghuni hanya bisa lihat data dirinya sendiri
        tenants = session.exec(
            select(Tenant).where(Tenant.user_id == current_user.id)
        ).all()
    else:
        tenants = session.exec(select(Tenant).offset(skip).limit(limit)).all()
    return tenants


@router.get("/{tenant_id}", response_model=TenantRead)
def get_tenant(
    tenant_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    if current_user.role == UserRole.penghuni and tenant.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return tenant


@router.post("/", response_model=TenantRead, status_code=201)
def create_tenant(
    tenant_in: TenantCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    # Validasi kamar
    room = session.get(Room, tenant_in.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Kamar tidak ditemukan")
    if room.status != RoomStatus.kosong:
        raise HTTPException(status_code=400, detail="Kamar tidak tersedia (status bukan 'kosong')")

    tenant = Tenant(**tenant_in.model_dump())
    session.add(tenant)

    # Update status kamar jadi 'isi'
    room.status = RoomStatus.isi
    session.add(room)
    session.commit()
    session.refresh(tenant)
    return tenant



@router.patch("/{tenant_id}", response_model=TenantRead)
def update_tenant(
    tenant_id: int,
    tenant_in: TenantUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    update_data = tenant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)

    # Jika is_active diubah menjadi False -> kamarnya kosong lagi
    if "is_active" in update_data and not update_data["is_active"]:
        room = session.get(Room, tenant.room_id)
        if room:
            room.status = RoomStatus.kosong
            session.add(room)

    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant


class RenewRequest(BaseModel):
    new_end_date: date
    notes: Optional[str] = None

@router.post("/{tenant_id}/renew", response_model=TenantRead)
def renew_contract(
    tenant_id: int,
    req: RenewRequest,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    if not tenant.is_active:
        raise HTTPException(status_code=400, detail="Tidak dapat memperpanjang kontrak penghuni yang tidak aktif")

    # Validasi bulan
    months_diff = (req.new_end_date.year - tenant.contract_end.year) * 12 + req.new_end_date.month - tenant.contract_end.month
    if months_diff <= 0:
        raise HTTPException(status_code=400, detail="Tanggal perpanjangan harus lebih lama dari tanggal habis kontrak saat ini")
    if months_diff > settings.MAX_RENEWAL_MONTHS:
        raise HTTPException(status_code=400, detail=f"Perpanjangan maksimal adalah {settings.MAX_RENEWAL_MONTHS} bulan")

    tenant.contract_end = req.new_end_date
    tenant.renewal_count += 1
    if req.notes:
        tenant.notes = f"{tenant.notes}\n[Perpanjangan {tenant.renewal_count}]: {req.notes}" if tenant.notes else f"[Perpanjangan {tenant.renewal_count}]: {req.notes}"

    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant
