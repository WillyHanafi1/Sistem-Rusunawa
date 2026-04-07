from app.core.db import create_db_and_tables
from app.models.user import User
from app.models.application import Application
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.invoice import Invoice
from app.models.staff import Staff
from app.models.family_member import FamilyMember

if __name__ == "__main__":
    print("Initializing database tables...")
    create_db_and_tables()
    print("Database tables initialized successfully.")
