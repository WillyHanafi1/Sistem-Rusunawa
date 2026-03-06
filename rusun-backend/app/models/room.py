from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint
from typing import Optional
from enum import Enum
from decimal import Decimal

# Konversi angka ke angka romawi (lantai I-V)
ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}
ROMAN_TO_INT = {v: k for k, v in ROMAN.items()}


class RusunawaSite(str, Enum):
    cigugur_tengah = "Cigugur Tengah"
    cibeureum = "Cibeureum"
    leuwigajah = "Leuwigajah"


class RoomStatus(str, Enum):
    kosong = "kosong"
    isi = "isi"
    rusak = "rusak"


class RoomBase(SQLModel):
    rusunawa: RusunawaSite
    building: str = Field(index=True)       # A, B, C, D
    floor: int                               # 1, 2, 3, 4 (disimpan int, tampil romawi)
    unit_number: int                         # 1 s.d. 12
    # Display: "Cigugur Tengah - A IV 12" — di-generate otomatis via seeder/API
    room_number: str = Field(unique=True, index=True)
    price: Decimal = Field(default=750000, max_digits=12, decimal_places=2)
    status: RoomStatus = RoomStatus.kosong
    description: Optional[str] = None


class Room(RoomBase, table=True):
    __tablename__ = "rooms"
    __table_args__ = (
        # Satu kombinasi rusunawa+gedung+lantai+unit hanya boleh ada sekali
        UniqueConstraint("rusunawa", "building", "floor", "unit_number", name="uq_room_location"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)


def make_room_number(rusunawa: str, building: str, floor: int, unit: int) -> str:
    """Buat room_number standar: 'Cigugur Tengah - A IV 12'"""
    return f"{rusunawa} - {building} {ROMAN.get(floor, str(floor))} {unit}"


class RoomCreate(SQLModel):
    rusunawa: RusunawaSite
    building: str
    floor: int
    unit_number: int
    price: Decimal = Decimal("750000")
    status: RoomStatus = RoomStatus.kosong
    description: Optional[str] = None


class RoomRead(RoomBase):
    id: int
    floor_roman: str = ""  # computed field untuk display

    def model_post_init(self, __context) -> None:
        object.__setattr__(self, "floor_roman", ROMAN.get(self.floor, str(self.floor)))


class RoomUpdate(SQLModel):
    price: Optional[Decimal] = None
    status: Optional[RoomStatus] = None
    description: Optional[str] = None

