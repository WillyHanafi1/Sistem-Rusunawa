from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from app.models.room import RusunawaSite

class ApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ApplicationBase(SQLModel):
    nik: str = Field(index=True, max_length=16, min_length=16)
    full_name: str
    phone_number: str
    email: str
    rusunawa_target: RusunawaSite
    family_members_count: int = Field(default=1, ge=1)
    status: ApplicationStatus = ApplicationStatus.pending
    ktp_file_path: Optional[str] = None
    other_file_path: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Application(ApplicationBase, table=True):
    __tablename__ = "applications"
    id: Optional[int] = Field(default=None, primary_key=True)

class ApplicationCreate(SQLModel):
    nik: str
    full_name: str
    phone_number: str
    email: str
    rusunawa_target: RusunawaSite
    family_members_count: int = 1
    notes: Optional[str] = None

class ApplicationRead(ApplicationBase):
    id: int

class ApplicationUpdate(SQLModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
