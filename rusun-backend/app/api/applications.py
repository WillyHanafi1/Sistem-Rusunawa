from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from app.core.config import settings
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.application import Application, ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationStatus
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.family_member import FamilyMember, FamilyMemberCreate
from app.core.security import hash_password
import os
import shutil
import logging
from datetime import datetime
import uuid
import re

logger = logging.getLogger(__name__)

# Base direktori untuk menyimpan file upload
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# HIGH-03: Maximum file size (5 MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationRead])
def list_applications(
    status: Optional[ApplicationStatus] = None,
    skip: int = 0,
    limit: int = 1000,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),  # Hanya admin yang bisa melihat daftar pengajuan
):
    query = select(Application)
    if status:
        query = query.where(Application.status == status)
    
    # Urutkan berdasarkan yang paling baru
    applications = session.exec(
        query.order_by(Application.created_at.desc()).offset(skip).limit(limit)
    ).all()
    return applications


@router.post("", response_model=ApplicationRead, status_code=201)
async def create_application(
    nik: str = Form(...),
    full_name: str = Form(...),
    phone_number: str = Form(...),
    email: str = Form(...),
    rusunawa_target: str = Form(...),
    family_members_count: int = Form(1),
    marital_status: Optional[str] = Form(None),
    ktp_file: UploadFile = File(...),
    kk_file: Optional[UploadFile] = File(None),
    marriage_cert_file: Optional[UploadFile] = File(None),
    sku_file: Optional[UploadFile] = File(None),
    skck_file: Optional[UploadFile] = File(None),
    health_cert_file: Optional[UploadFile] = File(None),
    photo_file: Optional[UploadFile] = File(None),
    has_signed_statement: bool = Form(False),
    session: Session = Depends(get_session),
):
    # Cek apakah NIK ini sudah pernah daftar tapi masih pending
    existing = session.exec(
        select(Application)
        .where(Application.nik == nik)
        .where(Application.status == ApplicationStatus.pending)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Pengajuan dengan NIK '{nik}' masih dalam status TUNDA dan sedang kami proses."
        )

    # Security: Validate NIK (Must be 16 digits)
    if not re.match(r"^\d{16}$", nik):
        raise HTTPException(status_code=400, detail="NIK tidak valid. Harus 16 digit angka.")

    # Helper to save files (Sanitized)
    def save_file(file: UploadFile, prefix: str):
        # 1. Validate File Extension (Strict whitelist)
        allowed_extensions = {"jpg", "jpeg", "png", "pdf"}
        filename = file.filename or ""
        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipe file '.{ext}' tidak diizinkan. Gunakan JPG, PNG, atau PDF."
            )

        # 2. HIGH-03: File Size Validation
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"Ukuran file melebihi batas maksimal {MAX_FILE_SIZE // (1024*1024)} MB."
            )
        file.file.seek(0) # Reset file pointer for saving
        
        # 3. Content Type Validation (Signature/Magic Bytes)
        header_bytes = content[:2048]
        
        # Simple signature checks
        is_pdf = header_bytes.startswith(b"%PDF")
        is_png = header_bytes.startswith(b"\x89PNG")
        is_jpg = header_bytes.startswith(b"\xff\xd8")
        
        if ext == "pdf" and not is_pdf:
            raise HTTPException(status_code=400, detail="File PDF tidak valid (Header mismatch)")
        if ext in ["jpg", "jpeg", "png"] and not (is_png or is_jpg):
            raise HTTPException(status_code=400, detail="File gambar tidak valid (Header mismatch)")

        # 3. Generate secure name (Ignore user-provided filename completely)
        u_id = uuid.uuid4().hex[:8]
        # Clean prefix and NIK just in case (though NIK is validated already)
        clean_prefix = re.sub(r'[^a-zA-Z0-9]', '', prefix)
        u_name = f"{clean_prefix}_{nik}_{u_id}.{ext}"
        
        # 4. Secure path join
        path = os.path.join(UPLOAD_DIR, u_name)
        
        with open(path, "wb") as buff:
            shutil.copyfileobj(file.file, buff)
        return path

    ktp_path = save_file(ktp_file, "ktp")
    kk_path = save_file(kk_file, "kk") if kk_file else None
    marriage_path = save_file(marriage_cert_file, "marriage") if marriage_cert_file else None
    sku_path = save_file(sku_file, "sku") if sku_file else None
    skck_path = save_file(skck_file, "skck") if skck_file else None
    health_path = save_file(health_cert_file, "health") if health_cert_file else None
    photo_path = save_file(photo_file, "photo") if photo_file else None

    application = Application(
        nik=nik,
        full_name=full_name,
        phone_number=phone_number,
        email=email,
        rusunawa_target=rusunawa_target,
        family_members_count=family_members_count,
        marital_status=marital_status,
        ktp_file_path=ktp_path,
        kk_file_path=kk_path,
        marriage_cert_file_path=marriage_path,
        sku_file_path=sku_path,
        skck_file_path=skck_path,
        health_cert_file_path=health_path,
        photo_file_path=photo_path,
        has_signed_statement=has_signed_statement,
        is_documents_verified=False
    )
    
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.patch("/{app_id}", response_model=ApplicationRead)
def update_application_status(
    app_id: int,
    app_in: ApplicationUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")
    
    update_data = app_in.model_dump(exclude_unset=True)
    old_status = application.status
    
    for key, value in update_data.items():
        setattr(application, key, value)
        
    # Auto-create User dan Tenant jika status disetujui (dan sebelumnya bukan approved)
    if application.status == ApplicationStatus.approved and old_status != ApplicationStatus.approved:
        # Cek apakah Email sudah jadi User
        existing_user = session.exec(select(User).where(User.email == application.email)).first()
        if not existing_user:
            # Security Fix: Use a random generated password instead of NIK
            # Buat user baru untuk login ke portal penghuni
            import secrets
            import string
            if settings.ENVIRONMENT == "development":
                temp_password = application.nik
                logger.info(f"[DEV] User account created for {application.email} (password = NIK)")
            else:
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))
                logger.info(f"User account created for {application.email}. Send password via secure channel.")
            
            # Buat akun User baru
            new_user = User(
                email=application.email,
                name=application.full_name,
                password_hash=hash_password(temp_password),
                phone=application.phone_number,
                role=UserRole.penghuni,
                is_active=True
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            
            # Buat entri Tenant awal tanpa kamar (Kamar harus di-assign dari menu Penghuni)
            new_tenant = Tenant(
                user_id=new_user.id,
                room_id=0, # Asumsi 0 atau None sesuai skema, kita sementara buat tanpa kamar atau nanti admin assign
                is_active=True,
                contract_start=datetime.now().date(),
                contract_end=datetime.now().date()
                # Field lain perlu dilengkapi manual oleh Admin nanti
            )
            try:
                session.add(new_tenant)
                session.commit()
            except Exception as e:
                session.rollback()
                # Biarkan lanjut

    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.patch("/{app_id}/verify-all", response_model=ApplicationRead)
def verify_all_documents(
    app_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")
    
    application.is_documents_verified = True
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


from pydantic import BaseModel
from datetime import date
from app.models.room import Room, RoomStatus
from app.core.document_service import DocumentService

class InterviewDecision(BaseModel):
    room_id: int
    contract_start: date
    contract_end: date
    deposit_amount: float
    motor_count: int = 0
    status: ApplicationStatus = ApplicationStatus.contract_created
    notes: Optional[str] = None
    
    # Bio Data
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    previous_address: Optional[str] = None
    
    # Family Members
    family_members: Optional[List[FamilyMemberCreate]] = []
    
    # Document Metadata
    sk_number: Optional[str] = None
    sk_date: Optional[date] = None
    ps_number: Optional[str] = None
    ps_date: Optional[date] = None
    sip_number: Optional[str] = None
    sip_date: Optional[date] = None
    entry_time: Optional[str] = None

@router.post("/{app_id}/interview", response_model=ApplicationRead)
def submit_interview(
    app_id: int,
    decision: InterviewDecision,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")
    
    # Validasi Verifikasi Dokumen
    if not application.is_documents_verified:
        raise HTTPException(
            status_code=400, 
            detail="Dokumen pendaftaran belum diverifikasi oleh Admin. Silakan verifikasi dokumen terlebih dahulu."
        )
    
    room = session.get(Room, decision.room_id)
    if not room or room.status != RoomStatus.kosong:
        raise HTTPException(status_code=400, detail="Kamar tidak ditemukan atau tidak kosong")

    from app.core.config import settings

    # Validasi Deposit 2x Sewa (Perwal)
    expected_deposit = room.price * settings.DEPOSIT_MULTIPLIER
    if decision.deposit_amount < expected_deposit:
        raise HTTPException(
            status_code=400, 
            detail=f"Uang jaminan sewa minimal {settings.DEPOSIT_MULTIPLIER} bulan sewa (Rp {expected_deposit:,.0f})"
        )

    # Validasi Durasi Kontrak 6-24 bulan (Perwal)
    months_diff = (decision.contract_end.year - decision.contract_start.year) * 12 + decision.contract_end.month - decision.contract_start.month
    if months_diff < settings.MIN_CONTRACT_MONTHS or months_diff > settings.MAX_CONTRACT_MONTHS:
        raise HTTPException(
            status_code=400, 
            detail=f"Durasi kontrak harus antara {settings.MIN_CONTRACT_MONTHS} hingga {settings.MAX_CONTRACT_MONTHS} bulan"
        )

    try:
        # Amankan status baru
        application.status = decision.status
        if decision.notes:
            application.notes = decision.notes

        if decision.status == ApplicationStatus.contract_created:
            # Update Application Bio & Doc Numbers
            application.place_of_birth = decision.place_of_birth
            application.date_of_birth = decision.date_of_birth
            application.religion = decision.religion
            application.marital_status = decision.marital_status
            application.occupation = decision.occupation
            application.previous_address = decision.previous_address
            
            application.sk_number = decision.sk_number
            application.sk_date = decision.sk_date
            application.ps_number = decision.ps_number
            application.ps_date = decision.ps_date
            application.sip_number = decision.sip_number
            application.sip_date = decision.sip_date
            application.entry_time = decision.entry_time
            
            session.add(application)
            
            # Save Family Members for Application
            if decision.family_members:
                for fm_in in decision.family_members:
                    fm = FamilyMember.model_validate(fm_in)
                    fm.application_id = application.id
                    session.add(fm)
            
            # Flush to ensure application changes are ready (though ID exists)
            session.flush()

            # Cek User
            existing_user = session.exec(select(User).where(User.email == application.email)).first()
            if not existing_user:
                import secrets
                import string
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))
                logger.info(f"User account created for {application.email}. Send password via secure channel.")

                new_user = User(
                    email=application.email,
                    name=application.full_name,
                    password_hash=hash_password(temp_password),
                    phone=application.phone_number,
                    role=UserRole.penghuni,
                    is_active=True
                )
                session.add(new_user)
                session.flush() # Get new_user.id
                user_id = new_user.id
            else:
                user_id = existing_user.id
                
            # Cek Tenant aktif
            active_tenant = session.exec(
                select(Tenant).where(Tenant.user_id == user_id).where(Tenant.is_active == True)
            ).first()
            if active_tenant:
                raise HTTPException(status_code=400, detail="User ini sudah menjadi penghuni aktif.")

            # Buat Tenant
            new_tenant = Tenant(
                user_id=user_id,
                room_id=room.id,
                is_active=True,
                contract_start=decision.contract_start,
                contract_end=decision.contract_end,
                deposit_amount=decision.deposit_amount,
                motor_count=decision.motor_count,
                # Bio Data to Tenant
                place_of_birth = decision.place_of_birth,
                date_of_birth = decision.date_of_birth,
                religion = decision.religion,
                marital_status = decision.marital_status,
                occupation = decision.occupation,
                previous_address = decision.previous_address
            )
            session.add(new_tenant)
            session.flush() # Get new_tenant.id
            
            # Link Family Members to Tenant
            if decision.family_members:
                for fm_in in decision.family_members:
                    fm_tenant = FamilyMember.model_validate(fm_in)
                    fm_tenant.tenant_id = new_tenant.id
                    session.add(fm_tenant)
            
            # Update Kamar
            room.status = RoomStatus.isi
            session.add(room)

            # Generate 4 Dokumen
            family_list = []
            if decision.family_members:
                for idx, fm in enumerate(decision.family_members, 1):
                    family_list.append({
                        "no": idx,
                        "nama": fm.name,
                        "umur": fm.age,
                        "lp": fm.gender,
                        "agama": fm.religion,
                        "status": fm.marital_status,
                        "hub": fm.relation,
                        "pekerjaan": fm.occupation
                    })

            # Indonesian Day/Month names
            DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
            MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
            now = datetime.now()
            
            doc_context = {
                "nama_penyewa": application.full_name,
                "nik": application.nik,
                "telepon": application.phone_number,
                "email": application.email,
                "rusunawa": application.rusunawa_target,
                "nomor_kamar": room.room_number,
                "lantai": room.floor,
                "gedung": room.building,
                "unit": room.unit_number,
                "harga_sewa": f"Rp {room.price:,.2f}",
                "deposit": f"Rp {decision.deposit_amount:,.2f}",
                "tanggal_mulai": decision.contract_start.strftime("%d-%m-%Y"),
                "tanggal_selesai": decision.contract_end.strftime("%d-%m-%Y"),
                "jumlah_motor": decision.motor_count,
                "tanggal_wawancara": now.strftime("%d-%m-%Y"),
                "hari": DAYS[now.weekday()],
                "tanggal_indo": f"{now.day} {MONTHS[now.month-1]} {now.year}",
                "bulan_indo": MONTHS[now.month-1],
                "tahun": now.year,
                
                # Bio Data
                "tempat_lahir": decision.place_of_birth,
                "tgl_lahir": decision.date_of_birth.strftime("%d-%m-%Y") if decision.date_of_birth else "",
                "agama": decision.religion,
                "status_kawin": decision.marital_status,
                "pekerjaan": decision.occupation,
                "alamat_asal": decision.previous_address,
                
                # Documents metadata
                "sk_nomor": decision.sk_number,
                "sk_tanggal": decision.sk_date.strftime("%d-%m-%Y") if decision.sk_date else "",
                "ps_nomor": decision.ps_number,
                "ps_tanggal": decision.ps_date.strftime("%d-%m-%Y") if decision.ps_date else "",
                "sip_nomor": decision.sip_number,
                "sip_tanggal": decision.sip_date.strftime("%d-%m-%Y") if decision.sip_date else "",
                "jam_masuk": decision.entry_time,
                
                # Family List
                "keluarga": family_list,
                "jumlah_keluarga": len(family_list)
            }
            
            bundle = DocumentService.generate_bundle(doc_context, application.nik)
            
            # Simpan informasi bundle di catatan tenant
            doc_links = "\n".join([f"{k.upper()}: {v}" for k, v in bundle.items()])
            new_tenant.notes = f"Dokumen Bundle:\n{doc_links}"
            application.notes = f"INTERVIEW_SUCCESS|{doc_links}"

        session.add(application)
        session.commit()
        session.refresh(application)
        return application

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat memproses wawancara: {str(e)}")

@router.delete("/{app_id}", status_code=204)
def delete_application(
    app_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")
    session.delete(application)
    session.commit()
