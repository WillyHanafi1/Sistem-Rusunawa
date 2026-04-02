from sqlmodel import Session, select
from app.core.db import engine
from app.models.user import User, UserRole
from app.core.security import hash_password

def reset_admin():
    with Session(engine) as session:
        admin = session.exec(select(User).where(User.email == "admin@rusunawa.com")).first()
        if admin:
            admin.password_hash = hash_password("admin123!")
            session.add(admin)
            session.commit()
            print(f"[OK] Admin {admin.email} password reset to 'admin123!'")
        else:
            print("[ERROR] Admin user not found. Creating a new one...")
            admin = User(
                email="admin@rusunawa.com",
                name="Super Admin",
                role=UserRole.sadmin,
                password_hash=hash_password("admin123!"),
                is_active=True
            )
            session.add(admin)
            session.commit()
            print(f"[OK] New admin user created.")

if __name__ == "__main__":
    reset_admin()
