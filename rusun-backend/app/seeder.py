"""
Seeder data lengkap 3 Rusunawa Cimahi:
- Cigugur Tengah : 192 kamar (A-D, Lt I-IV, 12 unit/lantai)
- Cibeureum      : 371 kamar (A-C: Lt I=3, Lt II-V=24; D: Lt I=14, Lt II-IV=20)
- Leuwigajah     : 297 kamar (A-C: Lt I=3, Lt II-V=24)
Total            : 860 kamar

Jalankan: python app/seeder.py
"""
from decimal import Decimal
from sqlmodel import Session, select
from app.core.db import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.room import Room, RusunawaSite, RoomStatus, make_room_number
from app.core.security import hash_password

ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}

# ─── Data kamar per rusunawa ──────────────────────────────────────────────────
# Format: { gedung: { lantai_int: jumlah_unit } }

CIGUGUR_TENGAH = {
    "A": {1: 12, 2: 12, 3: 12, 4: 12},
    "B": {1: 12, 2: 12, 3: 12, 4: 12},
    "C": {1: 12, 2: 12, 3: 12, 4: 12},
    "D": {1: 12, 2: 12, 3: 12, 4: 12},
}

CIBEUREUM = {
    "A": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
    "B": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
    "C": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
    "D": {1: 14, 2: 20, 3: 20, 4: 20},
}

LEUWIGAJAH = {
    "A": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
    "B": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
    "C": {1: 3,  2: 24, 3: 24, 4: 24, 5: 24},
}

RUSUNAWA_DATA = {
    RusunawaSite.cigugur_tengah: CIGUGUR_TENGAH,
    RusunawaSite.cibeureum: CIBEUREUM,
    RusunawaSite.leuwigajah: LEUWIGAJAH,
}

# Harga sewa default (bisa diubah per kamar via admin panel)
DEFAULT_PRICE = Decimal("750000")


def generate_rooms() -> list[Room]:
    rooms = []
    for site, gedung_map in RUSUNAWA_DATA.items():
        for gedung, lantai_map in gedung_map.items():
            for lantai_int, jumlah_unit in lantai_map.items():
                for unit in range(1, jumlah_unit + 1):
                    room_number = make_room_number(site.value, gedung, lantai_int, unit)
                    rooms.append(Room(
                        rusunawa=site,
                        building=gedung,
                        floor=lantai_int,
                        unit_number=unit,
                        room_number=room_number,
                        price=DEFAULT_PRICE,
                        status=RoomStatus.kosong,
                    ))
    return rooms


def seed_admin(session: Session):
    existing = session.exec(select(User).where(User.email == "admin@rusunawa.com")).first()
    if not existing:
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
        print("✅ Admin default dibuat:")
        print("   Email   : admin@rusunawa.com")
        print("   Password: admin123!")
    else:
        print("ℹ️  Admin sudah ada.")


def seed_rooms(session: Session):
    # Cek apakah sudah ada rooms
    existing_count = len(session.exec(select(Room)).all())
    if existing_count > 0:
        print(f"ℹ️  Data kamar sudah ada ({existing_count} kamar). Seed dilewati.")
        return

    rooms = generate_rooms()
    session.add_all(rooms)
    session.commit()

    total = len(rooms)
    print(f"\n✅ {total} kamar berhasil di-seed:")
    for site in RusunawaSite:
        count = sum(1 for r in rooms if r.rusunawa == site)
        print(f"   {site.value}: {count} kamar")


def seed():
    create_db_and_tables()
    with Session(engine) as session:
        seed_admin(session)
        seed_rooms(session)
    print("\n🏠 Seed selesai!")


if __name__ == "__main__":
    seed()
