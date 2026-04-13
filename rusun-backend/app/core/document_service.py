import os
from docxtpl import DocxTemplate
from datetime import datetime
import uuid
from sqlmodel import Session, select
from app.core.db import engine
from app.models.staff import Staff
import threading
import time
from app.core.utils import terbilang

# Global lock to prevent concurrent MS Word COM calls which are not thread-safe on Windows
PDF_CONVERSION_LOCK = threading.Lock()

# Note: docx2pdf requirement depends on OS. 
# On Windows, it uses Microsoft Word. On Linux, it often requires LibreOffice.
try:
    from docx2pdf import convert
    HAS_PDF_CONVERTER = True
except ImportError:
    HAS_PDF_CONVERTER = False

class DocumentService:
    TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    OUTPUT_BASE_DIR = "uploads"

    @classmethod
    def _perform_pdf_conversion(cls, docx_path: str, pdf_path: str, output_dir: str) -> bool:
        """
        Internal helper with lock and retry logic for PDF conversion.
        Ensures thread-safety for COM calls on Windows and provides a fallback.
        """
        success = False
        max_retries = 3
        
        # Method A: Try docx2pdf (Requires MS Word on Windows)
        if HAS_PDF_CONVERTER:
            for attempt in range(max_retries):
                # Locking ensures only one thread talks to MS Word COM at a time
                with PDF_CONVERSION_LOCK:
                    try:
                        import pythoncom
                        pythoncom.CoInitialize()
                        try:
                            # docx2pdf.convert will perform the conversion
                            convert(docx_path, pdf_path)
                            if os.path.exists(pdf_path):
                                success = True
                                break
                        finally:
                            pythoncom.CoUninitialize()
                    except Exception as e:
                        print(f"docx2pdf attempt {attempt+1} failed: {e}")
                        # If Word application is busy or Quitting, a small wait can help
                        if attempt < max_retries - 1:
                            time.sleep(1.5) 
            
        if success:
            return True

        # Method B: Try LibreOffice (soffice) if Method A failed or was unavailable
        try:
            import subprocess
            soffice_cmd = "soffice" 
            if os.name == 'nt': # Windows
                potential_paths = [
                    r"C:\Program Files\LibreOffice\program\soffice.exe",
                    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
                    r"C:\Program Files\LibreOffice\program\soffice.com"
                ]
                for p in potential_paths:
                    if os.path.exists(p):
                        soffice_cmd = p
                        break
            
            # Subprocess call to LibreOffice in headless mode
            subprocess.run([
                soffice_cmd,
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                docx_path
            ], check=True, capture_output=True)
            
            if os.path.exists(pdf_path):
                return True
        except Exception as e:
            # Don't throw here, just log so we can fallback to DOCX
            if "soffice" not in str(e).lower():
                 print(f"LibreOffice conversion error: {e}")
        
        return False

    @classmethod
    def get_date_context(cls, date_obj: datetime = None) -> dict:
        """
        Generates Indonesian date context for templates.
        """
        if not date_obj:
            date_obj = datetime.now()
            
        months = [
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ]
        days = {
            "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
            "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu"
        }
        
        day_name = days.get(date_obj.strftime("%A"), "")
        month_name = months[date_obj.month]
        
        return {
            "tanggal_now_indo": f"{date_obj.day} {month_name} {date_obj.year}",
            "tanggal_terbilang": terbilang(date_obj.day),
            "hari_now": day_name,
            "bulan_now_indo": month_name,
            "tahun_now": date_obj.year,
            "tahun_terbilang": terbilang(date_obj.year),
            "tanggal_cetak": date_obj.strftime("%d-%m-%Y")
        }

    @classmethod
    def get_management_context(cls, rusun_site: str = None, active_staff: list = None) -> dict:
        """
        Fetches management staff for document context.
        If active_staff is provided, uses it instead of querying the DB (Performance optimization).
        """
        context = {}
        
        # PERF-01: Optimized to avoid N+1 queries during bulk generation
        if active_staff is None:
            with Session(engine) as session:
                active_staff = session.exec(select(Staff).where(Staff.is_active == True)).all()
        
        # 1. Kepala UPTD
        kepala = next((s for s in active_staff if "kepala" in s.role.lower()), None)
        if kepala:
            context.update({
                "nama_kepala_uptd": kepala.name,
                "nip_kepala_uptd": kepala.nip,
                "pangkat_kepala_uptd": kepala.pangkat,
                "nama_pejabat": kepala.name,
                "nip_pejabat": kepala.nip,
                "pangkat_pejabat": kepala.pangkat
            })
            
        # 2. Kasubag TU
        kasubag = next((s for s in active_staff if "kasubag" in s.role.lower()), None)
        if kasubag:
            context.update({
                "nama_kasubag_tu": kasubag.name,
                "nip_kasubag_tu": kasubag.nip,
                "pangkat_kasubag_tu": kasubag.pangkat
            })
            
        # 3. Bendahara
        bendahara = next((s for s in active_staff if "bendahara" in s.role.lower()), None)
        if bendahara:
            context.update({
                "nama_bendahara": bendahara.name,
                "nip_bendahara": bendahara.nip,
                "pangkat_bendahara": bendahara.pangkat,
                "bank_account_info": f"0083 0732 92001 / {bendahara.name}" # Fallback bank info
            })

        # 4. Koordinator (Filtered by site if possible, otherwise first one found)
        koordinator = None
        if rusun_site:
            # Handle Enum if passed
            site_name = rusun_site.value if hasattr(rusun_site, "value") else str(rusun_site)
            site_lower = site_name.lower()
            koordinator = next((s for s in active_staff if "koordinator" in s.role.lower() and site_lower in s.role.lower()), None)
        
        if not koordinator:
            koordinator = next((s for s in active_staff if "koordinator" in s.role.lower()), None)
            
        if koordinator:
            context.update({
                "nama_koordinator": koordinator.name,
                "nip_koordinator": koordinator.nip,
                "pangkat_koordinator": koordinator.pangkat,
                "nama_kordinator": koordinator.name,
                "nip_kordinator": koordinator.nip,
                "pangkat_kordinator": koordinator.pangkat
            })
                
        return context

    @classmethod
    def generate_bundle(cls, data: dict, nik: str) -> dict:
        """
        Generates 4 required documents for a tenant.
        Returns a dictionary of document types and their relative paths.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:6]
        
        # Output directory for this specific tenant bundle
        output_dir = os.path.join(cls.OUTPUT_BASE_DIR, "documents", nik, f"bundle_{timestamp}_{unique_id}")
        os.makedirs(output_dir, exist_ok=True)

        templates_mapping = {
            "ba_wawancara": "template_ba_wawancara.docx",
            "sip": "template_sip.docx",
            "kontrak": "template_kontrak.docx",
            "surat_jalan": "template_surat_jalan.docx",
            "checkout": "template_ba_checkout.docx"
        }

        # Determine pengajuan template based on occupation
        occupation = data.get("pekerjaan", "").lower()
        if "wiraswasta" in occupation:
            templates_mapping["pengajuan"] = "template_pengajuan_wiraswasta.docx"
        else:
            templates_mapping["pengajuan"] = "template_pengajuan_karyawan.docx"

        # Prepare context
        context = {
            **data,
            **cls.get_date_context(),
            **cls.get_management_context(rusun_site=data.get("rusunawa"))
        }

        generated_docs = {}

        for doc_type, template_name in templates_mapping.items():
            template_path = os.path.join(cls.TEMPLATES_DIR, template_name)
            
            if not os.path.exists(template_path):
                continue

            docx_filename = f"{doc_type}_{nik}_{unique_id}.docx"
            docx_path = os.path.join(output_dir, docx_filename)
            
            # 1. Fill Template
            try:
                doc = DocxTemplate(template_path)
                doc.render(context)
                doc.save(docx_path)
                
                # 2. Convert to PDF
                pdf_path = docx_path.replace(".docx", ".pdf")
                conv_success = cls._perform_pdf_conversion(docx_path, pdf_path, output_dir)
                
                if conv_success:
                    generated_docs[doc_type] = pdf_path.replace("\\", "/")
                else:
                    # Fallback to docx if both failed
                    generated_docs[doc_type] = docx_path.replace("\\", "/")
            except Exception as e:
                print(f"Error generating {doc_type}: {e}")

        return generated_docs

    @classmethod
    def generate_invoice_document(cls, context: dict, doc_type: str, invoice_id: int) -> str:
        """
        Generates a specific invoice document (SKRD, STRD, or Teguran).
        Returns the relative path to the generated file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:6]
        
        # Output directory for invoice documents
        output_dir = os.path.join(cls.OUTPUT_BASE_DIR, "invoices", str(invoice_id))
        os.makedirs(output_dir, exist_ok=True)

        template_name = f"template_{doc_type}.docx"
        template_path = os.path.join(cls.TEMPLATES_DIR, template_name)
        
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template not found: {template_name}")

        filename_prefix = f"{doc_type}_{invoice_id}_{unique_id}"
        docx_path = os.path.join(output_dir, f"{filename_prefix}.docx")
        
        # 1. Fill Template
        try:
            # Inject management and date context
            context.update(cls.get_date_context())
            # Passed-in mgmt_context allows for bulk-caching (Performance Optimization)
            if "nama_pejabat" not in context:
                context.update(cls.get_management_context(rusun_site=context.get("rusunawa")))

            doc = DocxTemplate(template_path)
            doc.render(context)
            doc.save(docx_path)
            
            # 2. Convert to PDF
            pdf_path = docx_path.replace(".docx", ".pdf")
            conv_success = cls._perform_pdf_conversion(docx_path, pdf_path, output_dir)
            
            if conv_success:
                return pdf_path.replace("\\", "/")

            # If failed, return the docx (invoices.py will handle the error)
            return docx_path.replace("\\", "/")

        except Exception as e:
            print(f"Error generating {doc_type}: {e}")
            raise e
