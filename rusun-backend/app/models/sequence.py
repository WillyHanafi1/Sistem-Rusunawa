from sqlmodel import SQLModel, Field
from typing import Optional

class SystemSequence(SQLModel, table=True):
    __tablename__ = "system_sequences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True, description="Kunci sirkulasi, misal: 'teguran_seq'")
    year: int = Field(index=True)
    last_value: int = Field(default=0)
