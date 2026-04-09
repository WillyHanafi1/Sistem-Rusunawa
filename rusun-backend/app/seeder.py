"""
Seeder data lengkap 3 Rusunawa Cimahi.
Total: 860 kamar

Harga per lantai:
  Cigugur Tengah: Lt1=365rb, Lt2=350rb, Lt3=335rb, Lt4=320rb
  Cibeureum A/B/C: Lt1=400rb, Lt2=385rb, Lt3=370rb, Lt4=355rb, Lt5=340rb
  Cibeureum D (+40rb karena kamar lebih luas):
             Lt1=440rb, Lt2=425rb, Lt3=410rb, Lt4=395rb
  Leuwigajah: Lt1=400rb, Lt2=400rb, Lt3=385rb, Lt4=370rb, Lt5=355rb

Jalankan: python app/seeder.py
"""
from decimal import Decimal
from sqlmodel import Session, select
from app.core.db import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.room import Room, RusunawaSite, RoomStatus, make_room_number
from app.models.staff import Staff
from app.models.tenant import Tenant
from app.core.security import hash_password
import pandas as pd
import re
import os
from datetime import datetime

ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}

# Translation map for Indonesian months to English
ID_MONTHS = {
    'Januari': 'January', 'Februari': 'February', 'Maret': 'March',
    'April': 'April', 'Mei': 'May', 'Juni': 'June',
    'Juli': 'July', 'Agustus': 'August', 'September': 'September',
    'Oktober': 'October', 'November': 'November', 'Desember': 'December',
    'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
    'Mei': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Agu': 'Aug',
    'Sep': 'Sep', 'Okt': 'Oct', 'Nov': 'Nov', 'Des': 'Dec',
    'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
    'mei': 'May', 'jun': 'Jun', 'jul': 'Jul', 'agu': 'Aug',
    'sep': 'Sep', 'okt': 'Oct', 'nov': 'Nov', 'des': 'Dec'
}

def clean_date_str(val):
    if pd.isna(val) or str(val).strip() in ["", "-", "0"]:
        return None
    
    s = str(val).strip()
    s = s.rstrip('.')
    
    # Handle formats like "Januari 2018"
    if re.match(r'^[a-zA-Z]+\s+\d{4}$', s):
        # Add a default day
        s = f"01 {s}"

    # Replace Indonesian month names with English
    for id_m, en_m in ID_MONTHS.items():
        if id_m in s:
            s = s.replace(id_m, en_m)
            break
            
    try:
        # Try parsing various formats
        parsed = pd.to_datetime(s, dayfirst=True, errors='coerce')
        if pd.isna(parsed):
            return None
        return parsed.date()
    except:
        return None

# ─── Harga sewa per (rusunawa, gedung, lantai) ─────────────────────────────
# Format: (rusunawa_site, gedung, lantai) -> harga
# Gedung yang tidak terdaftar di sini menggunakan harga default site

PRICE_TABLE: dict[tuple, Decimal] = {
    # Cigugur Tengah (semua gedung sama)
    (RusunawaSite.cigugur_tengah, "*", 1): Decimal("365000"),
    (RusunawaSite.cigugur_tengah, "*", 2): Decimal("350000"),
    (RusunawaSite.cigugur_tengah, "*", 3): Decimal("335000"),
    (RusunawaSite.cigugur_tengah, "*", 4): Decimal("320000"),

    # Cibeureum Gedung A, B, C
    (RusunawaSite.cibeureum, "A", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "A", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "A", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "A", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "A", 5): Decimal("340000"),  # infer -15rb
    (RusunawaSite.cibeureum, "B", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "B", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "B", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "B", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "B", 5): Decimal("340000"),
    (RusunawaSite.cibeureum, "C", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "C", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "C", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "C", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "C", 5): Decimal("340000"),
    # Cibeureum Gedung D (+40rb lebih mahal karena kamar lebih luas)
    (RusunawaSite.cibeureum, "D", 1): Decimal("440000"),
    (RusunawaSite.cibeureum, "D", 2): Decimal("425000"),
    (RusunawaSite.cibeureum, "D", 3): Decimal("410000"),
    (RusunawaSite.cibeureum, "D", 4): Decimal("395000"),

    # Leuwigajah (semua gedung sama)
    (RusunawaSite.leuwigajah, "*", 1): Decimal("400000"),
    (RusunawaSite.leuwigajah, "*", 2): Decimal("400000"),
    (RusunawaSite.leuwigajah, "*", 3): Decimal("385000"),
    (RusunawaSite.leuwigajah, "*", 4): Decimal("370000"),
    (RusunawaSite.leuwigajah, "*", 5): Decimal("355000"),
}


"""
Seeder data lengkap 3 Rusunawa Cimahi.
Total: 860 kamar

Harga per lantai:
  Cigugur Tengah: Lt1=365rb, Lt2=350rb, Lt3=335rb, Lt4=320rb
  Cibeureum A/B/C: Lt1=400rb, Lt2=385rb, Lt3=370rb, Lt4=355rb, Lt5=340rb
  Cibeureum D (+40rb karena kamar lebih luas):
             Lt1=440rb, Lt2=425rb, Lt3=410rb, Lt4=395rb
  Leuwigajah: Lt1=400rb, Lt2=400rb, Lt3=385rb, Lt4=370rb, Lt5=355rb

Jalankan: python app/seeder.py
"""
from decimal import Decimal
from sqlmodel import Session, select
from app.core.db import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.room import Room, RusunawaSite, RoomStatus, make_room_number
from app.models.staff import Staff
from app.core.security import hash_password

ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}

# ─── Harga sewa per (rusunawa, gedung, lantai) ─────────────────────────────
# Format: (rusunawa_site, gedung, lantai) -> harga
# Gedung yang tidak terdaftar di sini menggunakan harga default site

PRICE_TABLE: dict[tuple, Decimal] = {
    # Cigugur Tengah (semua gedung sama)
    (RusunawaSite.cigugur_tengah, "*", 1): Decimal("365000"),
    (RusunawaSite.cigugur_tengah, "*", 2): Decimal("350000"),
    (RusunawaSite.cigugur_tengah, "*", 3): Decimal("335000"),
    (RusunawaSite.cigugur_tengah, "*", 4): Decimal("320000"),

    # Cibeureum Gedung A, B, C
    (RusunawaSite.cibeureum, "A", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "A", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "A", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "A", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "A", 5): Decimal("340000"),  # infer -15rb
    (RusunawaSite.cibeureum, "B", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "B", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "B", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "B", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "B", 5): Decimal("340000"),
    (RusunawaSite.cibeureum, "C", 1): Decimal("400000"),
    (RusunawaSite.cibeureum, "C", 2): Decimal("385000"),
    (RusunawaSite.cibeureum, "C", 3): Decimal("370000"),
    (RusunawaSite.cibeureum, "C", 4): Decimal("355000"),
    (RusunawaSite.cibeureum, "C", 5): Decimal("340000"),
    # Cibeureum Gedung D (+40rb lebih mahal karena kamar lebih luas)
    (RusunawaSite.cibeureum, "D", 1): Decimal("440000"),
    (RusunawaSite.cibeureum, "D", 2): Decimal("425000"),
    (RusunawaSite.cibeureum, "D", 3): Decimal("410000"),
    (RusunawaSite.cibeureum, "D", 4): Decimal("395000"),

    # Leuwigajah (semua gedung sama)
    (RusunawaSite.leuwigajah, "*", 1): Decimal("400000"),
    (RusunawaSite.leuwigajah, "*", 2): Decimal("400000"),
    (RusunawaSite.leuwigajah, "*", 3): Decimal("385000"),
    (RusunawaSite.leuwigajah, "*", 4): Decimal("370000"),
    (RusunawaSite.leuwigajah, "*", 5): Decimal("355000"),
}


def get_price(rusunawa: RusunawaSite, building: str, floor: int) -> Decimal:
    """Cari harga dari PRICE_TABLE. Coba spesifik dulu (rusunawa+gedung+lantai),
    lalu fallback ke wildcard gedung (rusunawa+*+lantai)."""
    specific = PRICE_TABLE.get((rusunawa, building, floor))
    if specific:
        return specific
    wildcard = PRICE_TABLE.get((rusunawa, "*", floor))
    if wildcard:
        return wildcard
    return Decimal("750000")  # fallback default


def get_room_type(rusunawa: RusunawaSite, building: str) -> int:
    """Tentukan luas tipe kamar (21, 24, 27) berdasarkan lokasi & gedung."""
    if rusunawa == RusunawaSite.cigugur_tengah:
        return 21
    if rusunawa == RusunawaSite.leuwigajah:
        return 24
    if rusunawa == RusunawaSite.cibeureum:
        if building in ["A", "B", "C"]:
            return 24
        if building == "D":
            return 27
    return 21


# ─── Struktur kamar per rusunawa ───────────────────────────────────────────
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


def generate_rooms() -> list[Room]:
    rooms = []
    for site, gedung_map in RUSUNAWA_DATA.items():
        for gedung, lantai_map in gedung_map.items():
            for lantai_int, jumlah_unit in lantai_map.items():
                price = get_price(site, gedung, lantai_int)
                room_type = get_room_type(site, gedung)
                for unit in range(1, jumlah_unit + 1):
                    room_number = make_room_number(site.value, gedung, lantai_int, unit)
                    rooms.append(Room(
                        rusunawa=site,
                        building=gedung,
                        floor=lantai_int,
                        unit_number=unit,
                        room_type=room_type,
                        room_number=room_number,
                        price=price,
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
            role=UserRole.sadmin,
            is_active=True,
            password_hash=hash_password("admin123!"),
        )
        session.add(admin)
        session.commit()
        print("[OK] Admin default dibuat:")
        print("   Email   : admin@rusunawa.com")
        print("   Password: admin123!")
    else:
        print("[INFO] Admin sudah ada.")


def seed_rooms(session: Session):
    existing_count = len(session.exec(select(Room)).all())
    if existing_count > 0:
        print(f"[INFO] Data kamar sudah ada ({existing_count} kamar). Seed dilewati.")
        return

    rooms = generate_rooms()
    session.add_all(rooms)
    session.commit()

    total = len(rooms)
    print(f"[OK] Berhasil membuat {total} kamar untuk 3 lokasi rusunawa.")
    for site in RusunawaSite:
        site_rooms = [r for r in rooms if r.rusunawa == site]
        count = len(site_rooms)
        prices = set(r.price for r in site_rooms)
        price_range = f"Rp{min(prices):,.0f} - Rp{max(prices):,.0f}"
        print(f"   {site.value}: {count} kamar ({price_range})")


def seed_staff(session: Session):
    from sqlmodel import delete
    # Hapus data lama agar sesuai dengan seeder terbaru jika dijalankan ulang
    session.exec(delete(Staff))
    session.commit()
    
    staff_data = [
        # Tier 1 - TOP LEADER
        Staff(
            name="KOKO, S.E., M.M.",
            role="Kepala UPTD Rusunawa Kota Cimahi",
            nip="19810323 200801 1 004",
            pangkat="Pembina",
            tier=1,
            image_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
            socials={}
        ),
        # Tier 2 - SUB-LEADER
        Staff(
            name="ANNISA SUNDANI",
            role="Bendahara",
            nip="19860102 201001 2 001",
            pangkat="Penata",
            tier=2,
            image_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
            socials={}
        ),
        Staff(
            name="KADARISMAN DIPUTRA, S.P.",
            role="Kasubag Tata Usaha",
            nip="19840919 201001 1 006",
            pangkat="Penata",
            tier=2,
            image_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
            socials={}
        ),
        Staff(
            name="ASEP SURYANA MASDUKI",
            role="Koordinator Lapangan",
            nip="19820410 200901 1 005",
            pangkat="Penata",
            tier=2,
            image_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
            socials={}
        ),
        # Tier 3 (Divisions)
        Staff(name="Keamanan 24/7", role="Divisi Keamanan", tier=3, socials={}),
        Staff(name="Kebersihan", role="Divisi Kebersihan", tier=3, socials={}),
        Staff(name="Teknisi", role="Divisi Teknisi", tier=3, socials={}),
        Staff(name="Administrasi", role="Divisi Administrasi", tier=3, socials={}),
    ]
    session.add_all(staff_data)
    session.commit()
    print(f"[OK] Berhasil seeding {len(staff_data)} data pengurus/staff.")


def seed_tenants(session: Session):
    """Seed tenants from CSV file in app/seeds/data/."""
    csv_path = "seeds/data/cibeureum_tenants.csv"
    if not os.path.exists(csv_path):
        # Check relative to app directory if needed, but usually run from backend root
        alt_path = "app/" + csv_path
        if os.path.exists(alt_path):
            csv_path = alt_path
        else:
            print(f"[INFO] Data tenants ({csv_path}) tidak ditemukan. Seeding tenants dilewati.")
            return

    print(f"[START] Memproses data tenants dari {csv_path}...")
    try:
        raw_df = pd.read_csv(csv_path, sep=';', skiprows=2, header=None)
    except Exception as e:
        print(f"[ERROR] Gagal membaca CSV tenants: {e}")
        return

    count = 0
    for index, row in raw_df.iterrows():
        if pd.isna(row[2]) or str(row[2]).strip() == "":
            continue # Skip empty rows
            
        name = str(row[2]).strip()
        id_penghuni = str(row[3]).strip().replace("'", "")
        
        # Data Cleaning
        def to_clean_str(val):
            if pd.isna(val): return ""
            s = str(val).strip()
            if s.endswith('.0'): return s[:-2]
            return s

        building = to_clean_str(row[4])
        floor_roman = to_clean_str(row[5])
        unit = to_clean_str(row[6])
        tgl_str = str(row[7])
        
        contract_start = clean_date_str(tgl_str)
        if not contract_start:
            contract_start = datetime(2024, 1, 1).date()
        
        contract_end = contract_start.replace(year=contract_start.year + 2)
        
        # Find Room
        room_number = f"Cibeureum - {building} {floor_roman} {unit}"
        room = session.exec(select(Room).where(Room.room_number == room_number)).first()
        
        if not room:
            # print(f"   [!] Kamar {room_number} tidak ditemukan. Dilewati.")
            continue
            
        # Create/Update User
        email = f"{id_penghuni}@rusunawa.com"
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            user = User(
                email=email,
                name=name,
                role=UserRole.penghuni,
                password_hash=hash_password("password123"),
                is_active=True
            )
            session.add(user)
            session.flush()
        else:
            user.name = name
            session.add(user)
        
        # Create/Update Tenant
        tenant = session.exec(select(Tenant).where(Tenant.user_id == user.id)).first()
        if not tenant:
            tenant = Tenant(
                user_id=user.id,
                room_id=room.id,
                contract_start=contract_start,
                contract_end=contract_end,
                nik=id_penghuni.ljust(16, '0')[:16],
                is_active=True
            )
        else:
            tenant.room_id = room.id
            tenant.contract_start = contract_start
            tenant.contract_end = contract_end
        
        session.add(tenant)
        room.status = RoomStatus.isi
        session.add(room)
        count += 1

    session.commit()
    print(f"[OK] Berhasil seeding {count} data tenants Cibeureum.")


def seed():
    create_db_and_tables()
    with Session(engine) as session:
        print("[START] Memulai proses seeding database...")
        seed_admin(session)
        seed_rooms(session)
        seed_staff(session)
        seed_tenants(session) 
        print("[SUCCESS] Seeding database selesai!")


if __name__ == "__main__":
    seed()
