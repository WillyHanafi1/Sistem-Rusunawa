from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from decimal import Decimal


class RoomStatus(str, Enum):
    kosong = "kosong"
    isi = "isi"
    rusak = "rusak"


class RoomType(str, Enum):
    studio = "studio"
    tipe_2 = "tipe_2"
    tipe_3 = "tipe_3"


class RoomBase(SQLModel):
    room_number: str = Field(unique=True, index=True)
    floor: int
    building: str = "A"
    room_type: RoomType = RoomType.studio
    price: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    status: RoomStatus = RoomStatus.kosong
    description: Optional[str] = None


class Room(RoomBase, table=True):
    __tablename__ = "rooms"
    id: Optional[int] = Field(default=None, primary_key=True)


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int


class RoomUpdate(SQLModel):
    room_number: Optional[str] = None
    floor: Optional[int] = None
    building: Optional[str] = None
    room_type: Optional[RoomType] = None
    price: Optional[Decimal] = None
    status: Optional[RoomStatus] = None
    description: Optional[str] = None
