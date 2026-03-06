from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.tenant import Tenant, TenantCreate, TenantRead, TenantUpdate
from app.models.room import Room, RoomStatus
from app.models.user import User, UserRole

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("/", response_model=List[TenantRead])
def list_tenants(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
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
