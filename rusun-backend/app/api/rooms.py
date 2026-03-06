from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.room import Room, RoomCreate, RoomRead, RoomUpdate
from app.models.user import User, UserRole

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/", response_model=List[RoomRead])
def list_rooms(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    rooms = session.exec(select(Room).offset(skip).limit(limit)).all()
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
    existing = session.exec(select(Room).where(Room.room_number == room_in.room_number)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nomor kamar sudah ada")
    room = Room(**room_in.model_dump())
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
