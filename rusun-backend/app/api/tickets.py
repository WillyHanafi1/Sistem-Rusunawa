from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.ticket import Ticket, TicketCreate, TicketRead, TicketUpdate, TicketStatus
from app.models.tenant import Tenant
from app.models.user import User, UserRole

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.get("/", response_model=List[TicketRead])
def list_tickets(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.penghuni:
        # Tenants: only see their own tickets
        tenants = session.exec(select(Tenant).where(Tenant.user_id == current_user.id)).all()
        tenant_ids = [t.id for t in tenants]
        query = select(Ticket).where(Ticket.tenant_id.in_(tenant_ids))
    else:
        # Admin: see all tickets
        query = select(Ticket)
    
    tickets = session.exec(query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)).all()
    return tickets

@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(
    ticket_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Keluhan tidak ditemukan")
    
    if current_user.role == UserRole.penghuni:
        tenant = session.get(Tenant, ticket.tenant_id)
        if not tenant or tenant.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    
    return ticket

@router.post("/", response_model=TicketRead, status_code=201)
def create_ticket(
    ticket_in: TicketCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.penghuni:
        raise HTTPException(status_code=403, detail="Hanya penghuni yang bisa membuat keluhan")
    
    # Get active tenant record for the user
    tenant = session.exec(
        select(Tenant).where(Tenant.user_id == current_user.id, Tenant.is_active == True)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=400, detail="Penghuni tidak aktif atau tidak ditemukan")

    ticket = Ticket(
        tenant_id=tenant.id,
        room_id=tenant.room_id,
        category=ticket_in.category,
        description=ticket_in.description,
        status=TicketStatus.pending,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Keluhan tidak ditemukan")
    
    # Only Admin can update status or other fields
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    update_data = ticket_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Keluhan tidak ditemukan")
    session.delete(ticket)
    session.commit()
