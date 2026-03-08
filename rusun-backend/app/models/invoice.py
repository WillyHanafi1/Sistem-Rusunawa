from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime, timezone
from enum import Enum
from decimal import Decimal

MOTOR_RATE = Decimal("30000")  # Rp 30.000/motor/bulan


class InvoiceStatus(str, Enum):
    unpaid = "unpaid"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"


class InvoiceBase(SQLModel):
    tenant_id: int = Field(foreign_key="tenants.id")
    period_month: int  # 1-12
    period_year: int
    base_rent: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    water_charge: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    electricity_charge: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    parking_charge: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    other_charge: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    total_amount: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    due_date: date
    status: InvoiceStatus = InvoiceStatus.unpaid
    notes: Optional[str] = None


class Invoice(InvoiceBase, table=True):
    __tablename__ = "invoices"
    id: Optional[int] = Field(default=None, primary_key=True)
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    midtrans_order_id: Optional[str] = None  # renamed dari xendit_invoice_id
    paid_at: Optional[datetime] = None
    # ✅ timezone-aware, tidak deprecated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvoiceCreate(SQLModel):
    tenant_id: int
    period_month: int
    period_year: int
    water_charge: Decimal = Decimal("0")
    electricity_charge: Decimal = Decimal("0")
    other_charge: Decimal = Decimal("0")
    due_date: date
    notes: Optional[str] = None


class InvoiceMassGenerate(SQLModel):
    period_month: int
    period_year: int
    other_charge: Decimal = Decimal("0")
    due_date: date
    notes: Optional[str] = None


class InvoiceRead(InvoiceBase):
    id: int
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None        # ✅ wajib ada — dipakai frontend untuk window.snap.pay()
    midtrans_order_id: Optional[str] = None # ✅ berguna untuk debugging
    paid_at: Optional[datetime] = None
    created_at: datetime


class InvoiceUpdate(SQLModel):
    status: Optional[InvoiceStatus] = None
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    midtrans_order_id: Optional[str] = None


class InvoiceReadWithRoom(InvoiceRead):
    room_number: str
    rusunawa: str
    building: str
    floor: int
    unit_number: int
    tenant_name: str
    contract_start: date
    contract_end: date
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
