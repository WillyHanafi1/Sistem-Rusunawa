from sqlmodel import Session, select
from app.core.db import engine
from app.models.user import User, UserRole

def upgrade_admin():
    with Session(engine) as session:
        admin = session.exec(select(User).where(User.email == "admin@rusunawa.com")).first()
        if admin:
            admin.role = UserRole.sadmin
            session.add(admin)
            session.commit()
            print(f"[OK] Admin {admin.email} upgraded to sadmin")
        else:
            print("[ERROR] Admin not found")

if __name__ == "__main__":
    upgrade_admin()
