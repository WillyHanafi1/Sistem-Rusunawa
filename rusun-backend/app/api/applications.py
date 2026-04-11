from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from app.core.config import settings
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.application import Application, ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationStatus
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.invoice import Invoice, InvoiceStatus, DocumentType, MOTOR_RATE
from app.models.room import Room, RoomStatus, RusunawaSite
from app.models.family_member import FamilyMember, FamilyMemberCreate
from app.core.security import hash_password
import os
import shutil
import logging
from datetime import datetime
import uuid
import re
import json

# Setup logger
logger = logging.getLogger(__name__)

from app.core.utils import format_rupiah_terbilang, terbilang as terbilang_func
from datetime import datetime, date

# Segments mapping
ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}

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
    place_of_birth: Optional[str] = Form(None),
    date_of_birth: Optional[date] = Form(None),
    religion: Optional[str] = Form(None),
    occupation: Optional[str] = Form(None),
    previous_address: Optional[str] = Form(None),
    family_members: Optional[str] = Form(None), # JSON string
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
    if not re.match(r"^\d{10,16}$", nik):
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
        place_of_birth=place_of_birth,
        date_of_birth=date_of_birth,
        religion=religion,
        occupation=occupation,
        previous_address=previous_address,
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
    
    # Process family members if provided
    if family_members:
        try:
            family_list = json.loads(family_members)
            for fm in family_list:
                family_member = FamilyMember(
                    name=fm.get("name"),
                    age=int(fm.get("age", 0)),
                    gender=fm.get("gender", "-"),
                    relation=fm.get("relation"),
                    application_id=application.id
                )
                session.add(family_member)
            session.commit()
        except Exception as e:
            logging.error(f"Error parsing/saving family members: {str(e)}")
            # Don't fail the whole application if family member parsing fails,
            # but log it.
    
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
    room_id: Optional[int] = None
    contract_start: Optional[date] = None # Default: today
    contract_end: Optional[date] = None   # Default: 24 months from start
    deposit_amount: Optional[float] = None # Default: 2x room price
    motor_count: int = 0
    status: ApplicationStatus = ApplicationStatus.contract_created
    notes: Optional[str] = None
    
    # Bio Data (Fallback to application if None)
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
    ba_number: Optional[str] = None
    ba_date: Optional[date] = None
    entry_time: Optional[str] = None

@router.post("/{app_id}/interview", response_model=ApplicationRead)
def submit_interview(
    app_id: int,
    decision: InterviewDecision,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """
    Simpan hasil wawancara, alokasikan kamar, buat user login (jika baru), 
    buat data Tenant, dan terbitkan tagihan awal (SKRD & Jaminan).
    """
    logger.info(f"Processing interview for App ID: {app_id}")
    
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")

    # 0. GUARD: Cegah pemrosesan ulang
    if application.status == ApplicationStatus.contract_created:
        logger.warning(f"Attempted to re-submit interview for App ID: {app_id} which is already in status 'contract_created'")
        # Kembalikan aplikasi yang sudah ada daripada error 400 jika pemanggilnya butuh idempotensi,
        # tapi di sini kita berikan error 400 supaya Admin tahu ada aksi ganda.
        raise HTTPException(status_code=400, detail="Pengajuan ini sudah memproses kontrak (SIPA).")

    # 0. GUARD: Cek apakah Tenant sudah ada (Berbasis ID yang sama)
    existing_tenant = session.get(Tenant, app_id)
    if existing_tenant:
        # SMART LOGIC: Jika NIK berbeda, berarti ini adalah records "ghost/yatim" 
        # dari instalasi/import sebelumnya yang tertinggal di DB (terutama di SQLite).
        # Kita hapus record lama tersebut agar pendaftaran baru bisa masuk.
        if existing_tenant.nik != application.nik:
            logger.warning(f"Ghost Tenant record found at ID {app_id} (NIK: {existing_tenant.nik}) while processing NIK: {application.nik}. Deleting ghost record.")
            session.delete(existing_tenant)
            session.flush()
        else:
            logger.warning(f"Tenant already exists for App ID: {app_id} with matching NIK")
            raise HTTPException(status_code=400, detail="Penyewa untuk pengajuan ini sudah terdaftar.")

    # Jika ditolak, langsung update status dan selesai
    if decision.status == ApplicationStatus.rejected:
        application.status = ApplicationStatus.rejected
        if decision.notes:
            application.notes = decision.notes
        session.add(application)
        session.commit()
        session.refresh(application)
        return application

    # Validasi Verifikasi Dokumen (Hanya untuk approval)
    if not application.is_documents_verified:
        raise HTTPException(
            status_code=400, 
            detail="Dokumen pendaftaran belum diverifikasi oleh Admin. Silakan verifikasi dokumen terlebih dahulu."
        )
    
    if decision.room_id is None:
        raise HTTPException(
            status_code=400, 
            detail="Kamar harus dipilih untuk pengajuan yang akan disetujui."
        )

    room = session.get(Room, decision.room_id)
    if not room or room.status != RoomStatus.kosong:
        raise HTTPException(status_code=400, detail="Kamar tidak ditemukan atau tidak kosong")

    from app.core.config import settings

    # --- Automation & Fallback Logic ---
    # 1. Dates
    if not decision.contract_start:
        decision.contract_start = date.today()
    if not decision.contract_end:
        # Default 2 tahun (24 bulan)
        from dateutil.relativedelta import relativedelta
        decision.contract_end = decision.contract_start + relativedelta(years=2)

    # 2. Deposit
    if decision.deposit_amount is None or decision.deposit_amount == 0:
        decision.deposit_amount = room.price * settings.DEPOSIT_MULTIPLIER

    # 3. Bio Data Fallback (If not provided in interview, take from registration)
    if not decision.place_of_birth: decision.place_of_birth = application.place_of_birth
    if not decision.date_of_birth: decision.date_of_birth = application.date_of_birth
    if not decision.religion: decision.religion = application.religion
    if not decision.marital_status: decision.marital_status = application.marital_status
    if not decision.occupation: decision.occupation = application.occupation
    if not decision.previous_address: decision.previous_address = application.previous_address

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
            application.ba_number = decision.ba_number
            application.ba_date = decision.ba_date
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
                nik=application.nik,
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
                        "lp": fm.gender[0].upper() if fm.gender else "-",
                        "agama": fm.religion,
                        "status": fm.marital_status,
                        "hub": fm.relation,
                        "pekerjaan": fm.occupation
                    })

            # Indonesian Day/Month names
            DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
            MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
            now = datetime.now()
            
            # Indonesian Date Formatter Helper
            def fmt_indo(d: date):
                if not d: return "-"
                return f"{d.day} {MONTHS[d.month-1]} {d.year}"

            # Fallback context for pimpinan data if not in DB
            context = {}

            doc_context = {
                # Pihak Pertama (Management) - Akan di-fetch otomatis oleh DocumentService dari DB Staff
                # Kordinator (For BAST)
                "jabatan_kordinator": f"Kordinator Rusun {application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target}",
                
                # Pihak Kedua (Tenant)
                "nama_penyewa": application.full_name,
                "nik": application.nik,
                "telepon": application.phone_number,
                "email": application.email,
                "agama": decision.religion,
                "status_perkawinan": decision.marital_status,
                "pekerjaan": decision.occupation,
                "alamat_sebelumnya": decision.previous_address,
                "tempat_tgl_lahir_penyewa": f"{decision.place_of_birth}, {fmt_indo(decision.date_of_birth)}",
                "jumlah_keluarga": len(decision.family_members) if decision.family_members else 0,
                "jumlah_keluarga_terbilang": f"{len(decision.family_members)} ({terbilang_func(len(decision.family_members))})" if decision.family_members else "0 (Nol)",
                
                # Lokasi & Dokumen
                "rusunawa": application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target,
                "nama_rusunawa": application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target,
                "nomor_kamar": room.room_number,
                "lantai": room.floor,
                "gedung": room.building,
                "unit": room.unit_number,
                "lokasi_lengkap": f"{room.building} {ROMAN.get(room.floor, room.floor)} {room.unit_number} Rusunawa {application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target}",
                
                "ps_number": decision.ps_number,
                "sk_number": decision.sk_number,
                "sk_date_indo": fmt_indo(decision.sk_date),
                "hari_sk": DAYS[decision.sk_date.weekday()],
                "tanggal_sk": decision.sk_date.day,
                "tanggal_sk_terbilang": terbilang_func(decision.sk_date.day),
                "bulan_sk_indo": MONTHS[decision.sk_date.month - 1],
                "tahun_sk": decision.sk_date.year,
                "tahun_sk_terbilang": terbilang_func(decision.sk_date.year),
                "sip_number": decision.sip_number,
                "sip_date_indo": fmt_indo(decision.sip_date),
                
                "ba_number": decision.ba_number,
                "ba_date_indo": fmt_indo(decision.ba_date) if decision.ba_date else fmt_indo(decision.sip_date),
                "hari_ba": DAYS[decision.ba_date.weekday()] if decision.ba_date else DAYS[decision.sip_date.weekday()] if decision.sip_date else DAYS[now.weekday()],
                "tanggal_ba": (decision.ba_date.day if decision.ba_date else decision.sip_date.day if decision.sip_date else now.day),
                "tanggal_ba_terbilang": terbilang_func(decision.ba_date.day if decision.ba_date else decision.sip_date.day if decision.sip_date else now.day),
                "bulan_ba_indo": MONTHS[(decision.ba_date.month - 1) if decision.ba_date else (decision.sip_date.month - 1) if decision.sip_date else (now.month - 1)],
                "tahun_ba": (decision.ba_date.year if decision.ba_date else decision.sip_date.year if decision.sip_date else now.year),
                "tahun_ba_terbilang": terbilang_func(decision.ba_date.year if decision.ba_date else decision.sip_date.year if decision.sip_date else now.year),
                
                "lantai_romawi": ROMAN.get(room.floor, str(room.floor)),
                "nama_penyewa_kapital": application.full_name.upper(),
                
                "permohonan_number": application.id,
                "permohonan_date_indo": fmt_indo(application.created_at.date()),
                
                # Financials
                "harga_sewa": f"Rp {room.price:,.0f}".replace(",", "."),
                "harga_sewa_terbilang": format_rupiah_terbilang(room.price),
                "deposit": f"Rp {decision.deposit_amount:,.0f}".replace(",", "."),
                "deposit_terbilang": format_rupiah_terbilang(decision.deposit_amount),
                
                # Timestamps & Formatted Dates
                "tanggal_mulai": decision.contract_start.strftime("%d-%m-%Y"),
                "tanggal_mulai_indo": fmt_indo(decision.contract_start),
                "tanggal_selesai": decision.contract_end.strftime("%d-%m-%Y"),
                "tanggal_selesai_indo": fmt_indo(decision.contract_end),
                "entry_time": decision.entry_time,
                "hari_masuk": DAYS[decision.contract_start.weekday()],
                "tanggal_masuk_indo": fmt_indo(decision.contract_start),
                "tanggal_now_indo": fmt_indo(decision.sip_date) if decision.sip_date else fmt_indo(now.date()),
                "tanggal_terbilang": terbilang_func(decision.sip_date.day if decision.sip_date else now.day),
                "hari_now": DAYS[decision.sip_date.weekday()] if decision.sip_date else DAYS[now.weekday()],
                "bulan_now_indo": MONTHS[(decision.sip_date.month-1) if decision.sip_date else (now.month-1)],
                "tahun_now": decision.sip_date.year if decision.sip_date else now.year,
                "tahun_terbilang": terbilang_func(decision.sip_date.year if decision.sip_date else now.year),

                # Family List
                "keluarga": family_list,
                "hasil_verifikasi": "Lolos",
                
                # Legacy Support/Aliases
                "sk_nomor": decision.sk_number,
                "ps_nomor": decision.ps_number,
                "sip_nomor": decision.sip_number,
                "room_number": room.room_number,
                "nama_rusunawa": f"{application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target}",
            }
            
            bundle = DocumentService.generate_bundle(doc_context, application.nik)
            
            # Simpan path dokumen ke kolom dedicated di tenant
            BUNDLE_TO_COLUMN = {
                "ba_wawancara": "ba_wawancara_path",
                "pengajuan": "permohonan_doc_path",
                "sip": "sip_doc_path",
                "kontrak": "pk_doc_path",
                "surat_jalan": "sp_doc_path",
                "bast": "bast_doc_path",
            }
            for bundle_key, column_name in BUNDLE_TO_COLUMN.items():
                if bundle_key in bundle:
                    setattr(new_tenant, column_name, bundle[bundle_key])
            
            # Tetap simpan ringkasan di notes untuk referensi legacy
            doc_links = "\n".join([f"{k.upper()}: {v}" for k, v in bundle.items()])
            new_tenant.notes = f"Dokumen Bundle:\n{doc_links}"
            
            # --- OTOMATISASI INVOICE (BEST PRACTICE) ---
            # Cari kode site untuk penomoran
            site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
            rusun_name = application.rusunawa_target.value if hasattr(application.rusunawa_target, 'value') else application.rusunawa_target
            code = site_codes.get(rusun_name, "00")
            
            # Import helper here to avoid circular or dependency issues if needed, 
            # but we already imported Invoice above.
            from app.api.tasks import get_next_sequence_value, format_document_number
            
            # Check if invoice for this period already exists for this tenant
            existing_skrd = session.exec(
                select(Invoice)
                .where(Invoice.tenant_id == new_tenant.id)
                .where(Invoice.document_type == DocumentType.skrd)
                .where(Invoice.period_month == decision.contract_start.month)
                .where(Invoice.period_year == decision.contract_start.year)
            ).first()

            if not existing_skrd:
                # 1. Invoice Sewa (SKRD) - Bulan Pertama
                next_skrd_seq = get_next_sequence_value(session, "skrd_seq", decision.contract_start.year)
                skrd_no = format_document_number(code, "SKRD", next_skrd_seq, decision.contract_start.month, decision.contract_start.year)
                
                rent_invoice = Invoice(
                    tenant_id=new_tenant.id,
                    document_type=DocumentType.skrd,
                    status=InvoiceStatus.unpaid,
                    period_month=decision.contract_start.month,
                    period_year=decision.contract_start.year,
                    base_rent=room.price,
                    water_charge=0,
                    electricity_charge=0,
                    parking_charge=0,
                    other_charge=0,
                    penalty_amount=0,
                    total_amount=room.price,
                    due_date=decision.contract_start,
                    skrd_number=skrd_no,
                    skrd_date=now.date(),
                    notes=f"Tagihan Sewa Pertama - Bulan {decision.contract_start.month}/{decision.contract_start.year}"
                )
                session.add(rent_invoice)
            else:
                logger.info(f"SKRD already exists for tenant {new_tenant.id} period {decision.contract_start.month}/{decision.contract_start.year}")

            # 2. Invoice Jaminan (JKRD) - 2x Sewa
            existing_jkrd = session.exec(
                select(Invoice)
                .where(Invoice.tenant_id == new_tenant.id)
                .where(Invoice.document_type == DocumentType.jaminan)
            ).first()

            if not existing_jkrd:
                next_jkrd_seq = get_next_sequence_value(session, "jkrd_seq", now.year)
                jkrd_no = format_document_number(code, "JKRD", next_jkrd_seq, now.month, now.year)
                
                deposit_invoice = Invoice(
                    tenant_id=new_tenant.id,
                    document_type=DocumentType.jaminan,
                    status=InvoiceStatus.unpaid,
                    period_month=decision.contract_start.month,
                    period_year=decision.contract_start.year,
                    base_rent=decision.deposit_amount,
                    water_charge=0,
                    electricity_charge=0,
                    parking_charge=0,
                    other_charge=0,
                    penalty_amount=0,
                    total_amount=decision.deposit_amount,
                    due_date=now.date(),
                    jaminan_number=jkrd_no,
                    jaminan_date=now.date(),
                    notes=f"Tagihan Uang Jaminan (Security Deposit)"
                )
                session.add(deposit_invoice)
            
            application.notes = f"INTERVIEW_SUCCESS|{doc_links}|INVOICES_CREATED"

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

class DirectOnboardingRequest(BaseModel):
    """Admin fast-track: create application + interview in one step."""
    # Required registration fields
    nik: str
    full_name: str
    phone_number: str
    email: str
    rusunawa_target: str
    family_members_count: int = 1
    
    # Bio Data
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    religion: Optional[str] = "Islam"
    marital_status: Optional[str] = "Belum Kawin"
    occupation: Optional[str] = None
    previous_address: Optional[str] = None
    
    # Interview / Contract fields
    room_id: int
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    deposit_amount: Optional[float] = None
    motor_count: int = 0
    notes: Optional[str] = None
    
    # Family Members
    family_members: Optional[List[FamilyMemberCreate]] = []
    
    # Document Numbers
    sk_number: Optional[str] = None
    sk_date: Optional[date] = None
    ps_number: Optional[str] = None
    ps_date: Optional[date] = None
    sip_number: Optional[str] = None
    sip_date: Optional[date] = None
    ba_number: Optional[str] = None
    ba_date: Optional[date] = None
    entry_time: Optional[str] = None

@router.post("/direct-onboarding", response_model=ApplicationRead, status_code=201)
def direct_onboarding(
    payload: DirectOnboardingRequest,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """
    Admin fast-track: Buat Application + proses interview dalam satu langkah.
    Melewati upload dokumen dan verifikasi otomatis.
    """
    # Validate NIK
    if not re.match(r"^\d{10,16}$", payload.nik):
        raise HTTPException(status_code=400, detail="NIK tidak valid. Harus 10-16 digit angka.")
    
    # Check duplicate non-rejected application or existing tenant
    existing = session.exec(
        select(Application)
        .where(Application.nik == payload.nik)
        .where(Application.status != ApplicationStatus.rejected)
    ).first()
    if existing:
        status_msg = "sedang diproses" if existing.status != ApplicationStatus.contract_created else "sudah memiliki kontrak"
        raise HTTPException(
            status_code=400,
            detail=f"Pengajuan dengan NIK '{payload.nik}' {status_msg}."
        )
    
    # 1. Create Application with auto-verified status
    try:
        rusunawa_enum = RusunawaSite(payload.rusunawa_target)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Rusunawa target '{payload.rusunawa_target}' tidak valid.")
    
    application = Application(
        nik=payload.nik,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        email=payload.email,
        rusunawa_target=rusunawa_enum,
        family_members_count=payload.family_members_count,
        marital_status=payload.marital_status,
        place_of_birth=payload.place_of_birth,
        date_of_birth=payload.date_of_birth,
        religion=payload.religion,
        occupation=payload.occupation,
        previous_address=payload.previous_address,
        status=ApplicationStatus.interview,
        is_documents_verified=True,  # Auto-verified for admin direct input
        has_signed_statement=True,
    )
    session.add(application)
    session.flush()  # Get application.id
    
    logger.info(f"[DirectOnboarding] Application created for {payload.full_name} (NIK: {payload.nik}), ID: {application.id}")
    
    # 2. Build InterviewDecision and delegate to existing submit_interview logic
    decision = InterviewDecision(
        room_id=payload.room_id,
        contract_start=payload.contract_start,
        contract_end=payload.contract_end,
        deposit_amount=payload.deposit_amount,
        motor_count=payload.motor_count,
        notes=payload.notes,
        status=ApplicationStatus.contract_created,
        place_of_birth=payload.place_of_birth,
        date_of_birth=payload.date_of_birth,
        religion=payload.religion,
        marital_status=payload.marital_status,
        occupation=payload.occupation,
        previous_address=payload.previous_address,
        family_members=payload.family_members,
        sk_number=payload.sk_number,
        sk_date=payload.sk_date,
        ps_number=payload.ps_number,
        ps_date=payload.ps_date,
        sip_number=payload.sip_number,
        sip_date=payload.sip_date,
        ba_number=payload.ba_number,
        ba_date=payload.ba_date,
        entry_time=payload.entry_time,
    )
    
    # Reuse submit_interview logic (it handles user/tenant/room/invoice/document generation)
    return submit_interview(application.id, decision, session, _)


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
