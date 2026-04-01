from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select, update
from typing import List, Optional
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.room import Room, RoomCreate, RoomRead, RoomUpdate, RusunawaSite, make_room_number
from pydantic import BaseModel, condecimal
from decimal import Decimal
from app.models.user import User

router = APIRouter(prefix="/rooms", tags=["Rooms"])


from datetime import date
from sqlalchemy import func

@router.get("/", response_model=List[RoomRead])
def list_rooms(
    rusunawa: Optional[RusunawaSite] = None,
    building: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    session: Session = Depends(get_session),
):
    query = select(Room)
    if rusunawa:
        query = query.where(Room.rusunawa == rusunawa)
    if building:
        query = query.where(Room.building == building)
    rooms = session.exec(
        query.order_by(Room.rusunawa, Room.building, Room.floor, Room.unit_number)
        .offset(skip).limit(limit)
    ).all()
    return rooms


class RoomExtendedRead(RoomRead):
    tenant_id: Optional[int] = None
    tenant_name: Optional[str] = None
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    parking_price: Decimal = Decimal("0")
    total_unpaid_bill: Decimal = Decimal("0")
    notes: Optional[str] = None
    renewal_count: int = 0


@router.get("/extended/all", response_model=List[RoomExtendedRead])
def get_extended_rooms(
    rusunawa: Optional[RusunawaSite] = None,
    building: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    from app.models.tenant import Tenant
    from app.models.invoice import Invoice, InvoiceStatus

    # Base query
    query = (
        select(Room, Tenant, User)
        .join(Tenant, (Tenant.room_id == Room.id) & (Tenant.is_active == True), isouter=True)
        .join(User, User.id == Tenant.user_id, isouter=True)
    )

    # Filter
    if rusunawa:
        query = query.where(Room.rusunawa == rusunawa)
    if building:
        query = query.where(Room.building == building)
    if search:
        search_filter = f"%{search}%"
        # Search by room number or tenant's full name
        query = query.where(
            (Room.room_number.ilike(search_filter)) | 
            (User.name.ilike(search_filter))
        )

    # Execute main join
    results = session.exec(
        query.order_by(Room.rusunawa, Room.building, Room.floor, Room.unit_number)
        .offset(skip).limit(limit)
    ).all()

    # Get unpaid invoices for all active tenants to avoid N+1 queries
    tenant_ids = [tenant.id for room, tenant, user in results if tenant]
    
    unpaid_totals = {}
    if tenant_ids:
        # Sum total_amount for unpaid/overdue invoices per tenant_id
        invoice_query = (
            select(Invoice.tenant_id, func.sum(Invoice.total_amount).label("total_unpaid"))
            .where(Invoice.tenant_id.in_(tenant_ids))
            .where((Invoice.status == InvoiceStatus.unpaid) | (Invoice.status == InvoiceStatus.overdue))
            .group_by(Invoice.tenant_id)
        )
        invoice_results = session.exec(invoice_query).all()
        for t_id, total in invoice_results:
            unpaid_totals[t_id] = total or Decimal("0")

    extended_rooms = []
    for room, tenant, user in results:
        data = room.model_dump()
        
        # Add basic computed fields
        data["floor_roman"] = getattr(room, "floor_roman", "")
        
        # Populate extended fields
        if tenant and user:
            data["tenant_id"] = tenant.id
            data["tenant_name"] = user.name
            data["contract_start"] = tenant.contract_start
            data["contract_end"] = tenant.contract_end
            data["notes"] = tenant.notes
            data["renewal_count"] = tenant.renewal_count
            
            # Parking: motor_count * 30,000
            data["parking_price"] = Decimal(str(tenant.motor_count * 30000))
            
            # Total Bills
            data["total_unpaid_bill"] = Decimal(str(unpaid_totals.get(tenant.id, 0)))
        else:
            data["tenant_name"] = None
            data["contract_start"] = None
            data["contract_end"] = None
            data["parking_price"] = Decimal("0")
            data["total_unpaid_bill"] = Decimal("0")

        extended_rooms.append(RoomExtendedRead(**data))

    return extended_rooms


class TypeFloorPrice(BaseModel):
    room_type: int
    floor: int
    new_price: Decimal

class RoomBulkPriceUpdate(BaseModel):
    prices: list[TypeFloorPrice]


@router.patch("/bulk-price", response_model=dict)
def update_bulk_price(
    update_data: RoomBulkPriceUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """
    Update harga massal berdasarkan Tipe Kamar (21, 24, 27) dan Lantai.
    """
    total_affected = 0
    for mapping in update_data.prices:
        # Hanya update jika new_price valid (misal > 0, atau kita terima 0 sbg valid jika digratiskan)
        query = (
            update(Room)
            .where(Room.room_type == mapping.room_type)
            .where(Room.floor == mapping.floor)
            .values(price=mapping.new_price)
        )
        result = session.exec(query)
        total_affected += result.rowcount
        
    session.commit()
    
    return {
        "status": "success",
        "message": f"Berhasil memperbarui harga {total_affected} kamar.",
        "affected_rows": total_affected
    }


@router.get("/{room_id}", response_model=RoomRead)
def get_room(
    room_id: int,
    session: Session = Depends(get_session),
):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Kamar tidak ditemukan")
    return room


@router.post("/", response_model=RoomRead, status_code=201)
def create_room(
    room_in: RoomCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    room_number = make_room_number(
        room_in.rusunawa.value, room_in.building, room_in.floor, room_in.unit_number
    )
    existing = session.exec(select(Room).where(Room.room_number == room_number)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Kamar '{room_number}' sudah ada")

    room = Room(
        rusunawa=room_in.rusunawa,
        building=room_in.building,
        floor=room_in.floor,
        unit_number=room_in.unit_number,
        room_number=room_number,
        price=room_in.price,
        status=room_in.status,
        description=room_in.description,
    )
    session.add(room)
    session.commit()
    session.refresh(room)
    return room


@router.patch("/{room_id}", response_model=RoomRead)
def update_room(
    room_id: int,
    room_in: RoomUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Kamar tidak ditemukan")
    update_data = room_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)
    session.add(room)
    session.commit()
    session.refresh(room)
    return room


@router.delete("/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Kamar tidak ditemukan")
    session.delete(room)
    session.commit()
