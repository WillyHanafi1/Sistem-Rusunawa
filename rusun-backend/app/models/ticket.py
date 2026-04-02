from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class TicketStatus(str, Enum):
    pending = "pending"
    progress = "progress"
    resolved = "resolved"

class TicketCategory(str, Enum):
    lampu = "Lampu/Listrik"
    air = "Air/Plumbing"
    atap = "Atap/Bangunan"
    lainnya = "Lainnya"

class TicketBase(SQLModel):
    tenant_id: int = Field(foreign_key="tenants.id")
    room_id: int = Field(foreign_key="rooms.id")
    category: TicketCategory = TicketCategory.lainnya
    description: str
    status: TicketStatus = TicketStatus.pending
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Ticket(TicketBase, table=True):
    __tablename__ = "tickets"
    id: Optional[int] = Field(default=None, primary_key=True)

class TicketCreate(SQLModel):
    category: TicketCategory = TicketCategory.lainnya
    description: str

class TicketRead(TicketBase):
    id: int

class TicketUpdate(SQLModel):
    category: Optional[TicketCategory] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TicketReadWithDetails(TicketRead):
    tenant_name: str
    unit_number: int
    building: str
