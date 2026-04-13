import logging
import secrets
import os
from datetime import datetime, date
from typing import List, Optional, Dict, Any

from sqlmodel import Session, select
from fastapi import HTTPException

from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.models.room import Room, RoomStatus, RusunawaSite
from app.models.tenant import Tenant
from app.models.family_member import FamilyMember
from app.models.invoice import Invoice, DocumentType, InvoiceStatus
from app.core.document_service import DocumentService
from app.core.security import hash_password
from app.core.utils import terbilang, format_rupiah_terbilang
from app.api.tasks import get_next_sequence_value, format_document_number

logger = logging.getLogger(__name__)

ROMAN = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 
    6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X"
}

DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

from dateutil.relativedelta import relativedelta
from app.core.config import settings

class ApplicationService:
    @staticmethod
    def process_interview_result(session: Session, application: Application, decision: Any) -> Application:
        """
        Processes the result of an interview, updating application status,
        creating user/tenant records, and generating necessary documents.
        """
        # 1. Update Application Basic Data
        application.status = decision.status
        if decision.notes:
            application.notes = decision.notes

        # Handle Rejection
        if decision.status == ApplicationStatus.rejected:
            application.notes = f"REJECTED: {decision.notes}"
            return application

        # 2. Automation & Fallback Logic
        if not decision.contract_start:
            decision.contract_start = date.today()
        if not decision.contract_end:
            decision.contract_end = decision.contract_start + relativedelta(years=2)
        
        # Room is needed for both deposit calculation and tenant creation
        room = session.get(Room, decision.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Kamar tidak ditemukan")

        if decision.deposit_amount is None or decision.deposit_amount == 0:
            decision.deposit_amount = room.price * settings.DEPOSIT_MULTIPLIER

        # 3. Validation & Guards for Approval
        ApplicationService._validate_interview_eligibility(session, application, decision, room)

        # 3. Update Policy Data
        application.place_of_birth = decision.place_of_birth or application.place_of_birth
        application.date_of_birth = decision.date_of_birth or application.date_of_birth
        application.religion = decision.religion or application.religion
        application.marital_status = decision.marital_status or application.marital_status
        application.occupation = decision.occupation or application.occupation
        application.previous_address = decision.previous_address or application.previous_address
        
        # Save document numbers for reference
        application.sk_number = decision.sk_number
        application.sk_date = decision.sk_date
        application.ps_number = decision.ps_number
        application.ps_date = decision.ps_date
        application.sip_number = decision.sip_number
        application.sip_date = decision.sip_date
        application.ba_number = decision.ba_number
        application.ba_date = decision.ba_date

        # 4. Handle Family Members
        if decision.family_members:
            # Clear existing if any (atomic update)
            existing_fms = session.exec(select(FamilyMember).where(FamilyMember.application_id == application.id)).all()
            for fm in existing_fms:
                session.delete(fm)
            
            for fm_in in decision.family_members:
                fm_obj = FamilyMember.model_validate(fm_in)
                fm_obj.application_id = application.id
                session.add(fm_obj)

        # 5. Onboarding Entities (User, Tenant, Room)
        user_id = ApplicationService._ensure_user_account(session, application)
        new_tenant = ApplicationService._create_tenant_profile(session, application, decision, user_id, room)
        
        # Update Room status
        room.status = RoomStatus.isi
        session.add(room)

        # 6. Document Generation
        bundle = ApplicationService._generate_legal_documents(session, application, decision, room)
        ApplicationService._link_bundle_to_tenant(new_tenant, bundle)

        # 7. Initial Invoices
        ApplicationService._generate_initial_billing(session, application, decision, new_tenant, room)

        # Status Flag in Notes
        doc_links = "\n".join([f"{k.upper()}: {v}" for k, v in bundle.items()])
        application.notes = f"INTERVIEW_SUCCESS|{doc_links}|INVOICES_CREATED"
        
        return application

    @staticmethod
    def _validate_interview_eligibility(session: Session, application: Application, decision: Any, room: Room):
        """Perform strict checks before allowing interview approval."""
        if not application.is_documents_verified:
             raise HTTPException(status_code=400, detail="Dokumen harus diverifikasi terlebih dahulu sebelum disetujui")

        if room.status != RoomStatus.kosong:
            raise HTTPException(status_code=400, detail=f"Kamar {room.room_number} tidak tersedia (Status: {room.status})")

        # Policy checks
        expected_deposit = room.price * settings.DEPOSIT_MULTIPLIER
        if decision.deposit_amount < expected_deposit:
            raise HTTPException(status_code=400, detail=f"Uang jaminan minimal {settings.DEPOSIT_MULTIPLIER}x harga sewa (Min: Rp {expected_deposit:,.0f})")

        if decision.contract_start and decision.contract_end:
            months = (decision.contract_end.year - decision.contract_start.year) * 12 + decision.contract_end.month - decision.contract_start.month
            if months < settings.MIN_CONTRACT_MONTHS or months > settings.MAX_CONTRACT_MONTHS:
                 raise HTTPException(status_code=400, detail=f"Durasi kontrak harus antara {settings.MIN_CONTRACT_MONTHS} hingga {settings.MAX_CONTRACT_MONTHS} bulan")

    @staticmethod
    def _ensure_user_account(session: Session, application: Application) -> int:
        """Creates a tenant user account if it doesn't exist."""
        existing_user = session.exec(select(User).where(User.email == application.email)).first()
        if existing_user:
            return existing_user.id

        # Generate secure random password
        raw_password = secrets.token_urlsafe(12)
        new_user = User(
            email=application.email,
            name=application.full_name,
            password_hash=hash_password(raw_password),
            phone=application.phone_number,
            role=UserRole.penghuni,
            is_active=True
        )
        session.add(new_user)
        session.flush()
        logger.info(f"User account created for tenant {application.nik}")
        return new_user.id

    @staticmethod
    def _create_tenant_profile(session: Session, application: Application, decision: Any, user_id: int, room: Room) -> Tenant:
        """Creates the Tenant record and assigns the room."""
        # Clean up existing tenant if somehow dual-processing happened
        existing_tenant = session.exec(select(Tenant).where(Tenant.application_id == application.id)).first()
        if existing_tenant:
             raise HTTPException(status_code=400, detail="User ini sudah terdaftar sebagai Tenant aktif untuk pengajuan ini.")

        new_tenant = Tenant(
            user_id=user_id,
            room_id=room.id,
            nik=application.nik,
            is_active=True,
            contract_start=decision.contract_start,
            application_id=application.id,
            contract_end=decision.contract_end,
            deposit_amount=decision.deposit_amount,
            motor_count=decision.motor_count,
            # Bio Data
            place_of_birth=decision.place_of_birth,
            date_of_birth=decision.date_of_birth,
            religion=decision.religion,
            marital_status=decision.marital_status,
            occupation=decision.occupation,
            previous_address=decision.previous_address
        )
        session.add(new_tenant)
        session.flush()

        # Link Family Members to Tenant Table (redundancy for direct lookup)
        if decision.family_members:
            for fm_in in decision.family_members:
                fm_tenant = FamilyMember.model_validate(fm_in)
                fm_tenant.tenant_id = new_tenant.id
                session.add(fm_tenant)
        
        return new_tenant

    @staticmethod
    def _generate_legal_documents(session: Session, application: Application, decision: Any, room: Room) -> Dict[str, str]:
        """Prepares context and generates the PDF bundle."""
        now = datetime.now()
        
        def fmt_indo(d: date):
            if not d: return "-"
            return f"{d.day} {MONTHS[d.month-1]} {d.year}"

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

        doc_context = {
            "jabatan_kordinator": f"Kordinator Rusun {application.rusunawa_target.value}",
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
            
            "rusunawa": application.rusunawa_target.value,
            "nama_rusunawa": application.rusunawa_target.value,
            "nomor_kamar": room.room_number,
            "lantai": room.floor,
            "gedung": room.building,
            "unit": room.unit_number,
            "lokasi_lengkap": f"{room.building} {ROMAN.get(room.floor, room.floor)} {room.unit_number} Rusunawa {application.rusunawa_target.value}",
            
            "sk_number": decision.sk_number,
            "sk_date_indo": fmt_indo(decision.sk_date),
            "hari_sk": DAYS[decision.sk_date.weekday()] if decision.sk_date else "-",
            "tanggal_sk": decision.sk_date.day if decision.sk_date else "-",
            "bulan_sk_indo": MONTHS[decision.sk_date.month - 1] if decision.sk_date else "-",
            "tahun_sk": decision.sk_date.year if decision.sk_date else "-",
            
            "sip_number": decision.sip_number,
            "sip_date_indo": fmt_indo(decision.sip_date),
            
            "ba_number": decision.ba_number,
            "ba_date_indo": fmt_indo(decision.ba_date) if decision.ba_date else fmt_indo(decision.sip_date),
            "hari_ba": DAYS[decision.ba_date.weekday()] if decision.ba_date else DAYS[decision.sip_date.weekday()] if decision.sip_date else DAYS[now.weekday()],
            "tanggal_ba": (decision.ba_date.day if decision.ba_date else decision.sip_date.day if decision.sip_date else now.day),
            "bulan_ba_indo": MONTHS[(decision.ba_date.month - 1) if decision.ba_date else (decision.sip_date.month - 1) if decision.sip_date else (now.month - 1)],
            "tahun_ba": (decision.ba_date.year if decision.ba_date else decision.sip_date.year if decision.sip_date else now.year),
            
            "lantai_romawi": ROMAN.get(room.floor, str(room.floor)),
            "nama_penyewa_kapital": application.full_name.upper(),
            "permohonan_number": application.id,
            "permohonan_date_indo": fmt_indo(application.created_at.date()),
            
            "harga_sewa": f"Rp {room.price:,.0f}".replace(",", "."),
            "harga_sewa_terbilang": format_rupiah_terbilang(room.price),
            "deposit": f"Rp {decision.deposit_amount:,.0f}".replace(",", "."),
            "deposit_terbilang": format_rupiah_terbilang(decision.deposit_amount),
            
            "tanggal_mulai": decision.contract_start.strftime("%d-%m-%Y"),
            "tanggal_mulai_indo": fmt_indo(decision.contract_start),
            "tanggal_selesai": decision.contract_end.strftime("%d-%m-%Y"),
            "tanggal_selesai_indo": fmt_indo(decision.contract_end),
            "entry_time": decision.entry_time,
            "hari_masuk": DAYS[decision.contract_start.weekday()],
            "tanggal_now_indo": fmt_indo(decision.sip_date) if decision.sip_date else fmt_indo(now.date()),
            "keluarga": family_list,
            "hasil_verifikasi": "Lolos",
            
            # Legacy Aliases
            "sk_nomor": decision.sk_number,
            "ps_nomor": decision.ps_number,
            "sip_nomor": decision.sip_number,
            "room_number": room.room_number,
        }
        
        return DocumentService.generate_bundle(doc_context, application.nik)

    @staticmethod
    def _link_bundle_to_tenant(tenant: Tenant, bundle: Dict[str, str]):
        """Maps bundle keys to tenant database columns."""
        BUNDLE_MAP = {
            "ba_wawancara": "ba_wawancara_path",
            "pengajuan": "permohonan_doc_path",
            "sip": "sip_doc_path",
            "kontrak": "pk_doc_path",
            "surat_jalan": "sp_doc_path",
            "bast": "bast_doc_path",
        }
        for key, col in BUNDLE_MAP.items():
            if key in bundle:
                setattr(tenant, col, bundle[key])

    @staticmethod
    def _generate_initial_billing(session: Session, application: Application, decision: Any, tenant: Tenant, room: Room):
        """Creates the first SKRD (rent) and JKRD (guarantee) invoices."""
        now = datetime.now()
        site_codes = {"Cigugur Tengah": "01", "Cibeureum": "02", "Leuwigajah": "03"}
        rusun_name = application.rusunawa_target.value
        code = site_codes.get(rusun_name, "00")

        # 1. Invoice Sewa (SKRD)
        existing_skrd = session.exec(
            select(Invoice)
            .where(Invoice.tenant_id == tenant.id)
            .where(Invoice.document_type == DocumentType.skrd)
            .where(Invoice.period_month == decision.contract_start.month)
            .where(Invoice.period_year == decision.contract_start.year)
        ).first()

        if not existing_skrd:
            next_skrd_seq = get_next_sequence_value(session, "skrd_seq", decision.contract_start.year)
            skrd_no = format_document_number(code, "SKRD", next_skrd_seq, decision.contract_start.month, decision.contract_start.year)
            
            rent_inv = Invoice(
                tenant_id=tenant.id,
                document_type=DocumentType.skrd,
                status=InvoiceStatus.unpaid,
                period_month=decision.contract_start.month,
                period_year=decision.contract_start.year,
                base_rent=room.price,
                total_amount=room.price,
                due_date=decision.contract_start,
                skrd_number=skrd_no,
                skrd_date=now.date(),
                notes=f"Tagihan Sewa Pertama - Bulan {decision.contract_start.month}/{decision.contract_start.year}"
            )
            session.add(rent_inv)

        # 2. Invoice Jaminan (JKRD)
        existing_jkrd = session.exec(select(Invoice).where(Invoice.tenant_id == tenant.id).where(Invoice.document_type == DocumentType.jaminan)).first()
        if not existing_jkrd:
            next_jkrd_seq = get_next_sequence_value(session, "jkrd_seq", now.year)
            jkrd_no = format_document_number(code, "JKRD", next_jkrd_seq, now.month, now.year)
            
            dep_inv = Invoice(
                tenant_id=tenant.id,
                document_type=DocumentType.jaminan,
                status=InvoiceStatus.unpaid,
                period_month=decision.contract_start.month,
                period_year=decision.contract_start.year,
                base_rent=decision.deposit_amount,
                total_amount=decision.deposit_amount,
                due_date=now.date(),
                jaminan_number=jkrd_no,
                jaminan_date=now.date(),
                notes=f"Tagihan Uang Jaminan (Security Deposit)"
            )
            session.add(dep_inv)
