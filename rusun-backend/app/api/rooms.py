from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.room import Room, RoomCreate, RoomRead, RoomUpdate, RusunawaSite, make_room_number
from app.models.user import User

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/", response_model=List[RoomRead])
def list_rooms(
    rusunawa: Optional[RusunawaSite] = None,
    building: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
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


@router.get("/{room_id}", response_model=RoomRead)
def get_room(
    room_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
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
