from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.db import get_session
from app.models.staff import Staff, StaffRead, StaffCreate, StaffUpdate, StaffPublicRead
from app.core.security import require_super_admin, get_current_user
from app.models.user import User
from pydantic import BaseModel
from sqlalchemy import func
from datetime import date
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.invoice import Invoice, InvoiceStatus

router = APIRouter(prefix="/management", tags=["Management"])

class DashboardStats(BaseModel):
    total_rooms: int
    active_tenants: int
    unpaid_invoices: int
    paid_this_month: int

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    """
    Fetch global statistics for the admin dashboard.
    Calculated server-side for accuracy and performance.
    """
    # 1. Total Rooms
    total_rooms = session.exec(select(func.count()).select_from(Room)).one()

    # 2. Active Tenants
    active_tenants = session.exec(
        select(func.count()).select_from(Tenant).where(Tenant.is_active == True)
    ).one()

    # 3. Unpaid Invoices (Unpaid + Overdue)
    unpaid_invoices = session.exec(
        select(func.count()).select_from(Invoice)
        .where(Invoice.status.in_([InvoiceStatus.unpaid, InvoiceStatus.overdue]))
    ).one()

    # 4. Paid This Month
    today = date.today()
    paid_this_month = session.exec(
        select(func.count()).select_from(Invoice)
        .where(Invoice.status == InvoiceStatus.paid)
        .where(Invoice.period_month == today.month)
        .where(Invoice.period_year == today.year)
    ).one()

    return {
        "total_rooms": total_rooms,
        "active_tenants": active_tenants,
        "unpaid_invoices": unpaid_invoices,
        "paid_this_month": paid_this_month,
    }

@router.get("/public", response_model=List[StaffPublicRead])
def get_public_management_team(session: Session = Depends(get_session)):
    """Fetch active management team for public display (omits sensitive data like NIP)."""
    statement = select(Staff).where(Staff.is_active == True).order_by(Staff.tier, Staff.id)
    return session.exec(statement).all()

@router.get("", response_model=List[StaffRead])
def get_management_team(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),  # MED-03: Require authentication
):
    """Fetch all active management/staff members, sorted by tier."""
    statement = select(Staff).where(Staff.is_active == True).order_by(Staff.tier, Staff.id)
    results = session.exec(statement).all()
    return results


@router.post("", response_model=StaffRead)
def create_staff(
    *, session: Session = Depends(get_session), 
    staff_in: StaffCreate, 
    current_user: User = Depends(require_super_admin)
):
    """Add new staff member. (Super Admin Only)"""
    db_staff = Staff.model_validate(staff_in)
    session.add(db_staff)
    session.commit()
    session.refresh(db_staff)
    return db_staff


@router.put("/{staff_id}", response_model=StaffRead)
def update_staff(
    *, session: Session = Depends(get_session), 
    staff_id: int, 
    staff_in: StaffUpdate, 
    current_user: User = Depends(require_super_admin)
):
    """Update staff member details. (Super Admin Only)"""
    db_staff = session.get(Staff, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    staff_data = staff_in.model_dump(exclude_unset=True)
    for key, value in staff_data.items():
        setattr(db_staff, key, value)
    
    session.add(db_staff)
    session.commit()
    session.refresh(db_staff)
    return db_staff


@router.delete("/{staff_id}")
def delete_staff(
    *, session: Session = Depends(get_session), 
    staff_id: int, 
    current_user: User = Depends(require_super_admin)
):
    """Delete (or deactivate) staff member. (Super Admin Only)"""
    db_staff = session.get(Staff, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    session.delete(db_staff)
    session.commit()
    return {"status": "ok", "message": "Staff deleted successfully"}
