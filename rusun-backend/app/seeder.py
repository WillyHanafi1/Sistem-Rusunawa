"""
Seed data awal: buat user admin default saat pertama kali running.
Jalankan dengan: python app/seeder.py
"""
from sqlmodel import Session, select
from app.core.db import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.core.security import hash_password


def seed():
    create_db_and_tables()
    with Session(engine) as session:
        # Cek apakah admin sudah ada
        existing_admin = session.exec(
            select(User).where(User.email == "admin@rusunawa.com")
        ).first()

        if not existing_admin:
            admin = User(
                email="admin@rusunawa.com",
                name="Super Admin",
                phone="08123456789",
                role=UserRole.admin,
                is_active=True,
                password_hash=hash_password("admin123!"),
            )
            session.add(admin)
            session.commit()
            print("✅ Admin default berhasil dibuat:")
            print("   Email   : admin@rusunawa.com")
            print("   Password: admin123!")
        else:
            print("ℹ️  Admin sudah ada, seed dilewati.")


if __name__ == "__main__":
    seed()
