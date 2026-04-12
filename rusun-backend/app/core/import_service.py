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
import concurrent.futures
import pandas as pd

logger = logging.getLogger(__name__)

def parse_date_safe(val, default_date: date) -> date:
    if pd.isna(val) or str(val).strip() == "" or str(val).strip().lower() == "nan":
        return default_date
    try:
        # Gunakan errors='coerce' agar jika parse gagal, kembalikan NaT (Not a Time)
        parsed = pd.to_datetime(val, errors='coerce')
        if pd.isna(parsed):
            return default_date
        return parsed.date()
    except Exception:
        return default_date

async def process_tenant_import(file_content: bytes, session: Session, filename: str = None) -> Dict[str, Any]:
    """
    Process Excel file and import tenants.
    Expected columns: nama, nik, email, rusunawa, gedung, lantai, unit, tgl_mulai, tgl_selesai, jumlah_motor
    """
    try:
        if filename and filename.endswith('.csv'):
            # Coba deteksi separator (koma vs titik koma)
            # Default ke koma, tapi jika gagal coba sep=';'
            try:
                df = pd.read_csv(BytesIO(file_content))
                # Jika cuma 1 kolom terdeteksi tapi harusnya banyak, mungkin sep salah
                if len(df.columns) < 5:
                    df = pd.read_csv(BytesIO(file_content), sep=';')
            except:
                df = pd.read_csv(BytesIO(file_content), sep=';')
        else:
            df = pd.read_excel(BytesIO(file_content))
    except Exception as e:
        return {"success": False, "error": f"Gagal membaca file: {str(e)}"}

    required_cols = ["nama", "rusunawa", "gedung", "lantai", "unit"]
    for col in required_cols:
        if col not in df.columns:
            return {"success": False, "error": f"Kolom tidak ditemukan: {col}"}

    import uuid
    # Pastikan kolom ada meskipun Excel tidak menyediakannya
    if 'email' not in df.columns:
        df['email'] = ""
    if 'nik' not in df.columns:
        df['nik'] = ""

    # Pre-processing: Auto generate NIK dan Email dummy jika kosong
    for index, row in df.iterrows():
        email_val = str(row.get('email', '')).strip()
        nik_val = str(row.get('nik', '')).strip()
        
        if email_val in ("", "nan", "None", "-"):
            ged = str(row.get('gedung', '')).strip()
            lan = str(row.get('lantai', '')).strip()
            unt = str(row.get('unit', '')).strip()
            # Contoh: dummy_a_1_1_349122@rusunawa.com
            uuid_email = str(uuid.uuid4().int)[:6]
            new_email = f"dummy_{ged}_{lan}_{unt}_{uuid_email}@rusunawa.com".lower().replace(" ", "")
            df.at[index, 'email'] = new_email
            
        if nik_val in ("", "nan", "None", "-"):
            ged = str(row.get('gedung', '')).strip()
            lan = str(row.get('lantai', '')).strip()
            unt = str(row.get('unit', '')).strip()
            # Format: 99 + Gedung + Lantai + Unit + Random UUID (Max 16 chars)
            uuid_nik = str(uuid.uuid4().int)[:10]
            new_nik = f"99{ged[:1].upper()}{lan[:1]}{unt.zfill(2)}{uuid_nik}"[:16]
            df.at[index, 'nik'] = new_nik

    results = []
    success_count = 0
    error_count = 0

    try:
        # BULK READ 1: Ambil semua kamar ke memori (O(1) query)
        all_rooms = session.exec(select(Room)).all()
        room_dict = {r.room_number: r for r in all_rooms}

        # BULK READ 2: Ambil existing users berdasarkan email di Excel (O(1) query)
        emails_in_excel = df['email'].astype(str).str.strip().tolist()
        existing_users = session.exec(select(User).where(User.email.in_(emails_in_excel))).all()
        user_dict = {u.email: u for u in existing_users}

        # 1. Analisis User Baru & Siapkan Password Hashing (Parallel)
        users_to_create = {}
        niks_to_hash = set()
        for _, row in df.iterrows():
            email = str(row['email']).strip()
            nik = str(row['nik']).strip()
            if email not in user_dict:
                niks_to_hash.add(nik)
        
        # Parallel Hashing (Membuat proses bcrypt yang memakan 300ms/user jadi concurrent)
        hashed_passwords = {}
        if niks_to_hash:
            logger.info(f"Hashing {len(niks_to_hash)} passwords in parallel...")
            with concurrent.futures.ThreadPoolExecutor() as executor:
                hash_list = list(executor.map(hash_password, niks_to_hash))
            hashed_passwords = dict(zip(niks_to_hash, hash_list))

        new_tenants_data = []
        updated_rooms = []
        
        # 2. Validasi Memory (Tidak menyentuh DB di dalam loop)
        for index, row in df.iterrows():
            try:
                # Cek jika baris kosong (semua na)
                if pd.isna(row.get('nama')) and pd.isna(row.get('lantai')):
                    continue

                nama = str(row.get('nama', '')).strip()
                if not nama or nama == 'nan':
                    continue

                nik = str(row.get('nik', '-')).strip()
                email = str(row.get('email', '-')).strip()
                rusunawa = str(row.get('rusunawa', '')).strip()
                gedung = str(row.get('gedung', '')).strip()

                raw_lantai = row.get('lantai')
                raw_unit = row.get('unit')

                if pd.isna(raw_lantai) or pd.isna(raw_unit):
                    logger.warning(f"Baris dilewati karena lantai/unit kosong: {row.to_dict()}")
                    continue

                try:
                    lantai = int(float(raw_lantai))
                    unit = int(float(raw_unit))
                except (ValueError, TypeError):
                    logger.warning(f"Baris dilewati karena format lantai/unit tidak valid: {row.to_dict()}")
                    continue
                
                tgl_mulai = parse_date_safe(row.get('tgl_mulai'), datetime.now().date())
                
                # Default selesai adalah 1 tahun dari hari ini
                default_selesai = datetime.now()
                try:
                    default_selesai = default_selesai.replace(year=default_selesai.year + 1).date()
                except ValueError: # Leap year case fallback
                    default_selesai = default_selesai.replace(year=default_selesai.year + 1, day=28).date()
                    
                tgl_selesai = parse_date_safe(row.get('tgl_selesai'), default_selesai)
                
                # Logic baru: Handle jumlah_motor sebagai nominal (30000, 60000)
                motor_val = row.get('jumlah_motor', 0)
                if pd.isna(motor_val) or motor_val == '':
                    motor_val = 0
                elif isinstance(motor_val, str):
                    # Bersihkan karakter non-digit (seperti titik atau koma)
                    # Tapi biarkan jika isinya cuma "1", "2" dsb
                    clean_val = "".join(filter(str.isdigit, motor_val))
                    motor_val = int(clean_val) if clean_val else 0
                
                # Jika input berupa nominal (>= 30000), konversi ke jumlah unit motor
                from app.models.invoice import MOTOR_RATE
                rate = int(MOTOR_RATE) # 30000
                if motor_val >= rate:
                    motor_count = int(motor_val // rate)
                else:
                    motor_count = int(motor_val)

                # Batasi maksimal 4 motor (sesuai constraint DB)
                motor_count = min(max(motor_count, 0), 4)

                room_number = make_room_number(rusunawa, gedung, lantai, unit)
                room = room_dict.get(room_number)
                
                if not room:
                    raise Exception(f"Kamar '{room_number}' tidak ditemukan di database")
                if room.status != RoomStatus.kosong:
                    raise Exception(f"Kamar '{room_number}' sudah terisi atau rusak")

                # Assign user
                user = user_dict.get(email)
                if not user:
                    if email not in users_to_create:
                        users_to_create[email] = User(
                            email=email,
                            name=nama,
                            phone=None,
                            role=UserRole.penghuni,
                            password_hash=hashed_passwords[nik],
                            is_active=True
                        )
                    user = users_to_create[email]

                # Update status room di memory (mencegah validasi ganda jika Excel memasukkan 2 orang ke 1 kamar)
                room.status = RoomStatus.isi
                updated_rooms.append(room)

                # Simpan metadata untuk pembuatan tenant setelah ID User digenerate
                new_tenants_data.append({
                    "user_ref": user, 
                    "room_id": room.id,
                    "contract_start": tgl_mulai,
                    "contract_end": tgl_selesai,
                    "motor_count": motor_count,
                    "nama": nama,
                    "nik": nik,
                    "index": index
                })

                success_count += 1
                
            except Exception as e:
                error_count += 1
                results.append({"row": index + 2, "status": "error", "msg": str(e)})

        # Jika ada SATU SAJA baris error, batalkan semua logika bulk
        if error_count > 0:
            raise ValueError({
                "error": "Terdapat kesalahan pada beberapa data. Import dibatalkan.",
                "details": results
            })

        # 3. Eksekusi COMMIT MASSAL ke Database (Hitungan Detik!)
        # Insert semua user baru sekaligus
        new_user_objects = list(users_to_create.values())
        if new_user_objects:
            session.add_all(new_user_objects)
            session.flush() # Mendapatkan semua ID user sekaligus
            
        # Buat Object Tenants
        tenant_objects = []
        for t_data in new_tenants_data:
            tenant = Tenant(
                user_id=t_data["user_ref"].id,
                room_id=t_data["room_id"],
                contract_start=t_data["contract_start"],
                contract_end=t_data["contract_end"],
                motor_count=t_data["motor_count"],
                nik=t_data["nik"],
                is_active=True
            )
            tenant_objects.append(tenant)
            results.append({"row": t_data["index"] + 2, "status": "success", "msg": f"Berhasil mengimport {t_data['nama']}"})
        
        session.add_all(tenant_objects)
        session.add_all(updated_rooms)
        session.commit()

        return {
            "success": True,
            "message": f"Berhasil mengimport {success_count} penghuni dalam waktu singkat.",
            "details": results
        }

    except ValueError as ve:
        session.rollback()
        return {
            "success": False,
            "error": ve.args[0]["error"],
            "details": ve.args[0]["details"]
        }
    except Exception as e:
        session.rollback()
        logger.error(f"Import error: {str(e)}")
        return {"success": False, "error": f"Internal Server Error: {str(e)}"}

async def bg_process_tenant_import(file_content: bytes, filename: str):
    """
    Background worker for tenant import. 
    Handles its own session to ensure it can run after the main request context is closed.
    """
    from app.core.db import engine
    from sqlmodel import Session
    
    logger.info(f"Starting background tenant import for file: {filename}")
    
    with Session(engine) as session:
        try:
            result = await process_tenant_import(file_content, session, filename)
            if result["success"]:
                logger.info(f"Background import SUCCESS: {result['message']}")
            else:
                logger.error(f"Background import FAILED: {result.get('error')}")
                if "details" in result:
                    logger.error(f"Error details: {result['details']}")
        except Exception as e:
            logger.error(f"CRITICAL error in background import: {str(e)}")
