from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.db import get_session
from app.models.staff import Staff, StaffRead, StaffCreate, StaffUpdate, StaffPublicRead
from app.core.security import require_super_admin, get_current_user
from app.models.user import User

router = APIRouter(prefix="/management", tags=["Management"])

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
