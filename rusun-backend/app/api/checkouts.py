from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.checkout import Checkout, CheckoutCreate, CheckoutRead, CheckoutUpdate, CheckoutStatus
from app.models.tenant import Tenant
from app.models.room import Room, RoomStatus
from app.models.user import User

router = APIRouter(prefix="/checkouts", tags=["Checkouts"])

@router.post("/", response_model=CheckoutRead)
def request_checkout(
    req: CheckoutCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify the tenant exists and belongs to this user
    tenant = session.get(Tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")
    if tenant.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if not tenant.is_active:
        raise HTTPException(status_code=400, detail="Penghuni sudah tidak aktif")

    # Save bank info to tenant for record
    tenant.bank_name = req.bank_name
    tenant.bank_account_number = req.bank_account_number
    tenant.bank_account_holder = req.bank_account_holder
    session.add(tenant)

    # Create checkout request
    checkout = Checkout(
        tenant_id=tenant.id,
        status=CheckoutStatus.requested,
        final_refund_amount=tenant.deposit_amount # Default to full deposit, admin can adjust during inspection if needed
    )
    session.add(checkout)
    session.commit()
    session.refresh(checkout)
    return checkout

@router.get("/", response_model=List[CheckoutRead])
def list_checkouts(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    return session.exec(select(Checkout).offset(skip).limit(limit)).all()

@router.post("/{checkout_id}/approve", response_model=CheckoutRead)
def approve_checkout(
    checkout_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    checkout = session.get(Checkout, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Data checkout tidak ditemukan")
    
    tenant = session.get(Tenant, checkout.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Data penghuni tidak ditemukan")

    # Deactive tenant
    tenant.is_active = False
    session.add(tenant)

    # Free room
    room = session.get(Room, tenant.room_id)
    if room:
        room.status = RoomStatus.kosong
        session.add(room)

    # Update checkout status
    checkout.status = CheckoutStatus.approved
    checkout.processed_at = datetime.utcnow()
    session.add(checkout)

    session.commit()
    session.refresh(checkout)
    return checkout

@router.post("/{checkout_id}/reject", response_model=CheckoutRead)
def reject_checkout(
    checkout_id: int,
    notes: Optional[str] = None,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    checkout = session.get(Checkout, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Data checkout tidak ditemukan")

    checkout.status = CheckoutStatus.rejected
    checkout.inspection_notes = notes
    checkout.processed_at = datetime.utcnow()
    session.add(checkout)
    session.commit()
    session.refresh(checkout)
    return checkout
