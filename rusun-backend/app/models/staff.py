from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict

class StaffBase(SQLModel):
    name: str
    role: str
    nip: Optional[str] = None
    tier: int = Field(default=3, description="1: Top Leader, 2: Sub Leader, 3: Operational Staff")
    image_url: Optional[str] = None
    socials: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))
    is_active: bool = Field(default=True)

class Staff(StaffBase, table=True):
    __tablename__ = "staff"
    id: Optional[int] = Field(default=None, primary_key=True)

class StaffCreate(StaffBase):
    pass

class StaffRead(StaffBase):
    id: int

class StaffPublicRead(SQLModel):
    id: int
    name: str
    role: str
    tier: int
    image_url: Optional[str] = None
    socials: Optional[Dict[str, str]] = None

class StaffUpdate(SQLModel):
    name: Optional[str] = None
    role: Optional[str] = None
    nip: Optional[str] = None
    tier: Optional[int] = None
    image_url: Optional[str] = None
    socials: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None
