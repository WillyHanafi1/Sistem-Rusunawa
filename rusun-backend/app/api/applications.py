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
    unique_id = uuid.uuid4().hex[:8]
    unique_filename = f"ktp_{nik}_{unique_id}.{extension}"
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


from pydantic import BaseModel
from datetime import date
from docxtpl import DocxTemplate
from app.models.room import Room, RoomStatus

class InterviewDecision(BaseModel):
    room_id: int
    contract_start: date
    contract_end: date
    deposit_amount: float
    motor_count: int = 0
    status: ApplicationStatus = ApplicationStatus.contract_created
    notes: Optional[str] = None

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
    
    room = session.get(Room, decision.room_id)
    if not room or room.status != RoomStatus.kosong:
        raise HTTPException(status_code=400, detail="Kamar tidak ditemukan atau tidak kosong")

    # Amankan status baru
    application.status = decision.status
    if decision.notes:
        application.notes = decision.notes

    if decision.status == ApplicationStatus.contract_created:
        # Cek User
        existing_user = session.exec(select(User).where(User.email == application.email)).first()
        if not existing_user:
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
            motor_count=decision.motor_count
        )
        session.add(new_tenant)
        
        # Update Kamar
        room.status = RoomStatus.isi
        session.add(room)

        # Generate Dokumen DOCX
        template_path = os.path.join(UPLOAD_DIR, "template_kontrak.docx")
        if os.path.exists(template_path):
            doc = DocxTemplate(template_path)
            context = {
                "nama_penyewa": application.full_name,
                "nik": application.nik,
                "nomor_kamar": room.room_number,
                "harga_sewa": f"Rp {room.price:,.2f}",
                "deposit": f"Rp {decision.deposit_amount:,.2f}",
                "tanggal_mulai": decision.contract_start.strftime("%d-%m-%Y"),
                "tanggal_selesai": decision.contract_end.strftime("%d-%m-%Y"),
                "tanggal_cetak": datetime.now().strftime("%d-%m-%Y")
            }
            doc.render(context)
            contract_id = uuid.uuid4().hex[:6]
            contract_filename = f"kontrak_{application.nik}_{contract_id}.docx"
            contract_path = os.path.join(UPLOAD_DIR, contract_filename)
            doc.save(contract_path)
            # Simpan path kontrak (butuh field baru di Tenant atau Application, bisa disimpan di notes sementara jika tidak ada field khusus)
            new_tenant.notes = f"Kontrak path: {contract_path}"
    
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
