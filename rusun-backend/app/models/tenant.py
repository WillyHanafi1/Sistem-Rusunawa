from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date


class TenantBase(SQLModel):
    user_id: int = Field(foreign_key="users.id")
    room_id: int = Field(foreign_key="rooms.id")
    contract_start: date
    contract_end: date
    deposit_amount: float = 0.0
    motor_count: int = Field(default=0, ge=0, le=4)  # 0-4 motor, @Rp30.000/motor
    notes: Optional[str] = None
    is_active: bool = True


class Tenant(TenantBase, table=True):
    __tablename__ = "tenants"
    id: Optional[int] = Field(default=None, primary_key=True)
    ktp_doc_path: Optional[str] = None
    kk_doc_path: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantRead(TenantBase):
    id: int


class TenantUpdate(SQLModel):
    contract_end: Optional[date] = None
    deposit_amount: Optional[float] = None
    motor_count: Optional[int] = Field(default=None, ge=0, le=4)
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    ktp_doc_path: Optional[str] = None
    kk_doc_path: Optional[str] = None

