from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    penghuni = "penghuni"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.penghuni
    is_active: bool = True


class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int


class UserUpdate(SQLModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
