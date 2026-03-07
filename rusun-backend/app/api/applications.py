from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from app.core.db import get_session
from app.core.security import require_admin, get_current_user
from app.models.application import Application, ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationStatus
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import hash_password
import os
import shutil
from datetime import datetime
import uuid

# Base direktori untuk menyimpan file upload
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("/", response_model=List[ApplicationRead])
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


@router.post("/", response_model=ApplicationRead, status_code=201)
async def create_application(
    nik: str = Form(...),
    full_name: str = Form(...),
    phone_number: str = Form(...),
    email: str = Form(...),
    rusunawa_target: str = Form(...),
    family_members_count: int = Form(1),
    ktp_file: UploadFile = File(...),
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

    # Validasi dan simpan file KTP
    extension = ktp_file.filename.split(".")[-1] if ktp_file.filename else "jpg"
    unique_filename = f"ktp_{nik}_{uuid.uuid4().hex[:8]}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(ktp_file.file, buffer)

    application = Application(
        nik=nik,
        full_name=full_name,
        phone_number=phone_number,
        email=email,
        rusunawa_target=rusunawa_target,
        family_members_count=family_members_count,
        ktp_file_path=file_path
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
            # Buat akun User baru (Email = pengajuan email, Password default = NIK)
            new_user = User(
                email=application.email,
                name=application.full_name,
                password_hash=hash_password(application.nik),
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
