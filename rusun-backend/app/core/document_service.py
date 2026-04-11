import os
from docxtpl import DocxTemplate
from datetime import datetime
import uuid
from sqlmodel import Session, select
from app.core.db import engine
from app.models.staff import Staff
import threading
import time

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

        # Prepare context (data padding etc)
        context = {
            **data,
            "tanggal_cetak": datetime.now().strftime("%d-%m-%Y"),
            "tahun": datetime.now().year
        }

        # Inject Management Data (Kepala UPTD, Bendahara, etc)
        with Session(engine) as session:
            management_staff = session.exec(select(Staff).where(Staff.is_active == True)).all()
            
            # Find specific roles for document tags
            kepala = next((s for s in management_staff if "kepala" in s.role.lower()), None)
            bendahara = next((s for s in management_staff if "bendahara" in s.role.lower()), None)
            kasubag = next((s for s in management_staff if "kasubag" in s.role.lower()), None)
            
            if kepala:
                context["nama_kepala_uptd"] = kepala.name
                context["nama_pejabat"] = kepala.name # Alias
                context["nip_kepala_uptd"] = kepala.nip
                context["nip_pejabat"] = kepala.nip # Alias
                context["pangkat_kepala_uptd"] = kepala.pangkat
                context["pangkat_pejabat"] = kepala.pangkat # Alias
                context["manager_name"] = kepala.name
                context["manager_nip"] = kepala.nip
                context["manager_role"] = kepala.role
                context["manager_pangkat"] = kepala.pangkat
            if bendahara:
                context["nama_bendahara"] = bendahara.name
                context["nip_bendahara"] = bendahara.nip
                context["bendahara_name"] = bendahara.name
                context["bendahara_nip"] = bendahara.nip
                context["bendahara_pangkat"] = bendahara.pangkat
            if kasubag:
                context["nama_kasubag_tu"] = kasubag.name
                context["nip_kasubag_tu"] = kasubag.nip
                context["pangkat_kasubag_tu"] = kasubag.pangkat

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
            # Inject management data if missing
            if "nama_kepala_uptd" not in context:
                with Session(engine) as session:
                    management_staff = session.exec(select(Staff).where(Staff.is_active == True)).all()
                    kepala = next((s for s in management_staff if "kepala" in s.role.lower()), None)
                    bendahara = next((s for s in management_staff if "bendahara" in s.role.lower()), None)
                    if kepala:
                        context["nama_kepala_uptd"] = kepala.name
                        context["nama_pejabat"] = kepala.name # Alias
                        context["nip_kepala_uptd"] = kepala.nip
                        context["nip_pejabat"] = kepala.nip # Alias
                        context["pangkat_kepala_uptd"] = kepala.pangkat
                        context["pangkat_pejabat"] = kepala.pangkat # Alias for SKRD
                        context["manager_name"] = kepala.name
                        context["manager_nip"] = kepala.nip
                        context["manager_role"] = kepala.role
                    if bendahara:
                        context["nama_bendahara"] = bendahara.name
                        context["nip_bendahara"] = bendahara.nip
                        context["bendahara_name"] = bendahara.name
                        context["bendahara_nip"] = bendahara.nip
                        context["bendahara_pangkat"] = bendahara.pangkat
                        # Default bank account info based on template example if not provided
                        if "bank_account_info" not in context:
                            context["bank_account_info"] = f"0083 0732 92001 / {bendahara.name}"

            # Add general context
            context.update({
                "tanggal_cetak": datetime.now().strftime("%d-%m-%Y"),
                "tahun": datetime.now().year
            })

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
