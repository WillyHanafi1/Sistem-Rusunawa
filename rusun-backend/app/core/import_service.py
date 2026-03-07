import pandas as pd
from io import BytesIO
from sqlmodel import Session, select
from typing import List, Dict, Any
from app.models.user import User, UserRole, UserCreate
from app.models.tenant import Tenant
from app.models.room import Room, RoomStatus, make_room_number
from app.core.security import hash_password
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

async def process_tenant_import(file_content: bytes, session: Session) -> Dict[str, Any]:
    """
    Process Excel file and import tenants.
    Expected columns: nama, nik, email, rusunawa, gedung, lantai, unit, tgl_mulai, tgl_selesai, jumlah_motor
    """
    try:
        df = pd.read_excel(BytesIO(file_content))
    except Exception as e:
        return {"success": False, "error": f"Gagal membaca file Excel: {str(e)}"}

    required_cols = ["nama", "nik", "email", "rusunawa", "gedung", "lantai", "unit"]
    for col in required_cols:
        if col not in df.columns:
            return {"success": False, "error": f"Kolom tidak ditemukan: {col}"}

    results = []
    success_count = 0
    error_count = 0

    # Start transaction (handled by session)
    try:
        for index, row in df.iterrows():
            try:
                # 1. Validasi Data Dasar
                nama = str(row['nama']).strip()
                nik = str(row['nik']).strip()
                email = str(row['email']).strip()
                rusunawa = str(row['rusunawa']).strip()
                gedung = str(row['gedung']).strip()
                lantai = int(row['lantai'])
                unit = int(row['unit'])
                
                # Optional fields with defaults
                tgl_mulai = pd.to_datetime(row.get('tgl_mulai', datetime.now())).date()
                tgl_selesai = pd.to_datetime(row.get('tgl_selesai', datetime.now().replace(year=datetime.now().year + 1))).date()
                motor_count = int(row.get('jumlah_motor', 0))

                # 2. Cari atau Buat User
                user = session.exec(select(User).where(User.email == email)).first()
                if not user:
                    # Buat user baru dengan password default (NIK)
                    user = User(
                        email=email,
                        name=nama,
                        phone=None,
                        role=UserRole.penghuni,
                        password_hash=hash_password(nik),
                        is_active=True
                    )
                    session.add(user)
                    session.flush() # Get ID
                
                # 3. Cari Kamar
                # Format room_number: "Cigugur Tengah - A IV 12"
                room_number = make_room_number(rusunawa, gedung, lantai, unit)
                room = session.exec(select(Room).where(Room.room_number == room_number)).first()
                
                if not room:
                    raise Exception(f"Kamar '{room_number}' tidak ditemukan di database")
                
                if room.status != RoomStatus.kosong:
                    raise Exception(f"Kamar '{room_number}' sudah terisi atau rusak")

                # 4. Buat Tenant
                tenant = Tenant(
                    user_id=user.id,
                    room_id=room.id,
                    contract_start=tgl_mulai,
                    contract_end=tgl_selesai,
                    motor_count=motor_count,
                    is_active=True
                )
                session.add(tenant)

                # 5. Update Kamar
                room.status = RoomStatus.isi
                session.add(room)

                success_count += 1
                results.append({"row": index + 2, "status": "success", "msg": f"Berhasil mengimport {nama}"})

            except Exception as e:
                error_count += 1
                results.append({"row": index + 2, "status": "error", "msg": str(e)})

        if error_count > 0:
            # Jika ada error, kita lempar exception agar di-rollback oleh FastAPI/session manager
            raise ValueError({
                "error": "Terdapat kesalahan pada beberapa data. Import dibatalkan.",
                "details": results
            })

        session.commit()
        return {
            "success": True,
            "message": f"Berhasil mengimport {success_count} penghuni.",
            "details": results
        }

    except ValueError as ve:
        session.rollback()
        # Custom Error passed from row validation
        return {
            "success": False,
            "error": ve.args[0]["error"],
            "details": ve.args[0]["details"]
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Import error: {str(e)}")
        return {"success": False, "error": f"Internal Server Error: {str(e)}"}
