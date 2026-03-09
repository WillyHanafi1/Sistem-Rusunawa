from sqlmodel import create_engine, SQLModel
from app.core.config import settings
# Import all models to ensure they are registered in metadata
from app.models.user import User
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.invoice import Invoice
from app.models.ticket import Ticket
from app.models.application import Application
from app.models.staff import Staff
from app.models.family_member import FamilyMember

engine = create_engine(settings.DATABASE_URL)

def reset_db():
    print(f"Connecting to {settings.DATABASE_URL}...")
    print("Dropping all tables to reset schema...")
    SQLModel.metadata.drop_all(engine)
    print("All tables dropped successfully.")

if __name__ == "__main__":
    reset_db()
