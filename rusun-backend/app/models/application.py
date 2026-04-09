from sqlmodel import SQLModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime, date
from app.models.room import RusunawaSite

class ApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    interview = "interview"
    contract_created = "contract_created"

class ApplicationBase(SQLModel):
    nik: str = Field(index=True, max_length=16, min_length=1)
    full_name: str
    phone_number: str
    email: str
    rusunawa_target: RusunawaSite
    family_members_count: int = Field(default=1, ge=1)
    status: ApplicationStatus = ApplicationStatus.pending
    ktp_file_path: Optional[str] = None
    kk_file_path: Optional[str] = None
    marriage_cert_file_path: Optional[str] = None
    sku_file_path: Optional[str] = None
    skck_file_path: Optional[str] = None
    health_cert_file_path: Optional[str] = None
    photo_file_path: Optional[str] = None
    other_file_path: Optional[str] = None
    has_signed_statement: bool = Field(default=False)
    is_documents_verified: bool = Field(default=False)
    notes: Optional[str] = None
    
    # Profile / Bio Data (Added for Interview)
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None # e.g., Kawin, Belum Kawin, Cerai
    occupation: Optional[str] = None
    previous_address: Optional[str] = None
    
    # Document Metadata
    sk_number: Optional[str] = None
    sk_date: Optional[date] = None
    ps_number: Optional[str] = None
    ps_date: Optional[date] = None
    sip_number: Optional[str] = None
    sip_date: Optional[date] = None
    entry_time: Optional[str] = None # e.g. "10:00"
    
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
    has_signed_statement: bool = False
    notes: Optional[str] = None
    
    # New Bio Fields
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    previous_address: Optional[str] = None

class ApplicationRead(ApplicationBase):
    id: int

class ApplicationUpdate(SQLModel):
    nik: Optional[str] = Field(default=None, max_length=16, min_length=1)
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    rusunawa_target: Optional[RusunawaSite] = None
    family_members_count: Optional[int] = Field(default=None, ge=1)
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    
    # Bio Updates
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    previous_address: Optional[str] = None
    
    # Doc Updates
    is_documents_verified: Optional[bool] = None
    has_signed_statement: Optional[bool] = None
    ktp_file_path: Optional[str] = None
    kk_file_path: Optional[str] = None
    marriage_cert_file_path: Optional[str] = None
    sku_file_path: Optional[str] = None
    skck_file_path: Optional[str] = None
    health_cert_file_path: Optional[str] = None
    photo_file_path: Optional[str] = None
    
    sk_number: Optional[str] = None
    sk_date: Optional[date] = None
    ps_number: Optional[str] = None
    ps_date: Optional[date] = None
    sip_number: Optional[str] = None
    sip_date: Optional[date] = None
    entry_time: Optional[str] = None
