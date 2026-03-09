from sqlmodel import SQLModel, Field
from typing import Optional

class FamilyMemberBase(SQLModel):
    name: str
    age: int
    gender: str # e.g., Laki-laki, Perempuan
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    relation: str # e.g., Suami, Istri, Anak, Orang Tua
    occupation: Optional[str] = None
    application_id: Optional[int] = Field(default=None, foreign_key="applications.id")
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenants.id")

class FamilyMember(FamilyMemberBase, table=True):
    __tablename__ = "family_members"
    id: Optional[int] = Field(default=None, primary_key=True)

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMemberRead(FamilyMemberBase):
    id: int

class FamilyMemberUpdate(SQLModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    relation: Optional[str] = None
    occupation: Optional[str] = None
