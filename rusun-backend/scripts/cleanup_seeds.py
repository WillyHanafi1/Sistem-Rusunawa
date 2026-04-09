from sqlmodel import Session, select
from app.core.db import engine
from app.models.user import User
from app.models.tenant import Tenant
from app.models.room import Room, RoomStatus

def cleanup():
    with Session(engine) as session:
        # Find users created by the seeder
        statement = select(User).where(User.email.contains("@rusunawa.com"))
        users = session.exec(statement).all()
        
        user_ids = [u.id for u in users]
        print(f"Mengidentifikasi {len(user_ids)} pengguna untuk dihapus.")
        
        # Find tenants for these users
        statement = select(Tenant).where(Tenant.user_id.in_(user_ids))
        tenants = session.exec(statement).all()
        
        room_ids = [t.room_id for t in tenants]
        print(f"Mengidentifikasi {len(tenants)} data penghuni untuk dihapus.")
        
        # Delete tenants
        for tenant in tenants:
            session.delete(tenant)
        
        # Delete users
        for user in users:
            session.delete(user)
            
        # Reset room status
        statement = select(Room).where(Room.id.in_(room_ids))
        rooms = session.exec(statement).all()
        for room in rooms:
            room.status = RoomStatus.kosong
            session.add(room)
            
        session.commit()
        print(f"Cleanup selesai. {len(tenants)} penghuni dihapus, {len(rooms)} kamar dikembalikan ke status 'kosong'.")

if __name__ == "__main__":
    cleanup()
