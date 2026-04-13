from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Request, status
from sqlmodel import Session, select
from typing import List, Optional
from app.core.config import settings
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.api.auth import limiter
from app.models.application import Application, ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationStatus
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.invoice import Invoice, InvoiceStatus, DocumentType, MOTOR_RATE
from app.models.room import Room, RoomStatus, RusunawaSite
from app.models.family_member import FamilyMember, FamilyMemberCreate
from app.services.application_service import ApplicationService
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

from app.core.utils import format_rupiah_terbilang
from datetime import datetime, date

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
    limit: int = 200,  # Adjusted from default for better admin experience
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """
    List applications with optional status filtering.
    """
    query = select(Application)
    if status:
        query = query.where(Application.status == status)
    
    # Urutkan berdasarkan yang paling baru
    applications = session.exec(
        query.order_by(Application.created_at.desc()).offset(skip).limit(limit)
    ).all()
    return applications


@router.post("/", response_model=ApplicationRead)
@limiter.limit("5/minute")
async def create_application(
    request: Request,
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
    ktp_file: Optional[UploadFile] = File(None),
    kk_file: Optional[UploadFile] = File(None),
    marriage_cert_file: Optional[UploadFile] = File(None),
    sku_file: Optional[UploadFile] = File(None),
    skck_file: Optional[UploadFile] = File(None),
    health_cert_file: Optional[UploadFile] = File(None),
    photo_file: Optional[UploadFile] = File(None),
    has_signed_statement: bool = Form(False),
    is_address_cimahi: bool = Form(False),
    is_job_cimahi: bool = Form(False),
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
        raise HTTPException(status_code=400, detail="NIK tidak valid. Harus tepat 16 digit angka.")

    # Helper to save files (Sanitized)
    def save_file(file: UploadFile, prefix: str):
        if not file or not file.filename:
            return None
            
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
    kk_path = save_file(kk_file, "kk")
    marriage_path = save_file(marriage_cert_file, "marriage")
    sku_path = save_file(sku_file, "sku")
    skck_path = save_file(skck_file, "skck")
    health_path = save_file(health_cert_file, "health")
    photo_path = save_file(photo_file, "photo")


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
        is_address_cimahi=is_address_cimahi,
        is_job_cimahi=is_job_cimahi,
        is_documents_verified=False
    )
    
    try:
        session.add(application)
        session.commit()
        session.refresh(application)
    except Exception as e:
        session.rollback()
        # Handle unique constraint violation
        if "uq_application_nik_active" in str(e).lower() or "unique" in str(e).lower():
            logger.warning(f"Registration attempt failed due to unique NIK: {nik}")
            raise HTTPException(
                status_code=400, 
                detail=f"Pengajuan dengan NIK '{nik}' sudah terdaftar dan masih aktif."
            )
        logger.error(f"Error creating application: {e}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan pendaftaran.")
    
    # Process family members if provided
    if family_members:
        try:
            family_list = json.loads(family_members)
            if not isinstance(family_list, list):
                raise ValueError("Format data keluarga harus berupa list")

            for fm in family_list:
                if not isinstance(fm, dict): continue
                
                # Basic validation for required fields
                name = fm.get("name")
                if not name: continue # Skip invalid entry
                
                family_member = FamilyMember(
                    name=name,
                    age=int(fm.get("age") or 0),
                    gender=fm.get("gender") or "-",
                    relation=fm.get("relation") or "Lainnya",
                    application_id=application.id
                )
                session.add(family_member)
            session.commit()
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Invalid family_members JSON: {e}")
        except Exception as e:
            logger.error(f"Error parsing/saving family members: {e}")
            session.rollback()
    
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
            # AUTH-01: Enforce secure random password for all environments.
            # Never use NIK as password, even in development.
            import secrets
            import string
            temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(12))
            logger.info(f"User account created for App ID: {application.id}. Password generated securely.")
            
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
                room_id=0,
                nik=application.nik,
                is_active=True,
                contract_start=datetime.now().date(),
                contract_end=datetime.now().date(),
                application_id=application.id,
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

    # Guard: Prevent re-processing
    if application.status == ApplicationStatus.contract_created:
        raise HTTPException(status_code=400, detail="Pengajuan ini sudah memproses kontrak (SIPA).")

    try:
        # Delegate business logic to Service Layer
        application = ApplicationService.process_interview_result(session, application, decision)
        
        session.add(application)
        session.commit()
        session.refresh(application)
        return application

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        logger.exception(f"Error processing interview for App ID {app_id}")
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
    if not re.match(r"^\d{16}$", payload.nik):
        raise HTTPException(status_code=400, detail="NIK tidak valid. Harus tepat 16 digit angka.")
    
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
    
    logger.info(f"[DirectOnboarding] Application created for App ID: {application.id}")
    
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
