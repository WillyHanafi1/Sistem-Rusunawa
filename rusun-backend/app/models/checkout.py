from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CheckoutStatus(str, Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"

class CheckoutBase(SQLModel):
    tenant_id: int = Field(foreign_key="tenants.id")
    status: CheckoutStatus = CheckoutStatus.requested
    inspection_notes: Optional[str] = None
    final_refund_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

class Checkout(CheckoutBase, table=True):
    __tablename__ = "checkouts"
    id: Optional[int] = Field(default=None, primary_key=True)

class CheckoutCreate(SQLModel):
    tenant_id: int
    bank_name: str
    bank_account_number: str
    bank_account_holder: str

class CheckoutRead(CheckoutBase):
    id: int

class CheckoutUpdate(SQLModel):
    status: Optional[CheckoutStatus] = None
    inspection_notes: Optional[str] = None
    final_refund_amount: Optional[float] = None
