import os
from docxtpl import DocxTemplate
from datetime import datetime
import uuid
from sqlmodel import Session, select
from app.core.db import engine
from app.models.staff import Staff

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
            
            if kepala:
                context["nama_kepala_uptd"] = kepala.name
                context["nip_kepala_uptd"] = kepala.nip
            if bendahara:
                context["nama_bendahara"] = bendahara.name
                context["nip_bendahara"] = bendahara.nip

        generated_docs = {}

        for doc_type, template_name in templates_mapping.items():
            template_path = os.path.join(cls.TEMPLATES_DIR, template_name)
            
            if not os.path.exists(template_path):
                # If template doesn't exist, skip or create a placeholder if needed
                # For now, we assume templates are provided by the user.
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
                
                # Method A: Try docx2pdf (Requires MS Word on Windows)
                conv_success = False
                if HAS_PDF_CONVERTER:
                    try:
                        import pythoncom
                        pythoncom.CoInitialize()
                        convert(docx_path, pdf_path)
                        if os.path.exists(pdf_path):
                            generated_docs[doc_type] = pdf_path.replace("\\", "/")
                            conv_success = True
                    except Exception as e:
                        print(f"docx2pdf failed for {doc_type}: {e}")
                    finally:
                        try:
                            pythoncom.CoUninitialize()
                        except:
                            pass

                # Method B: Try LibreOffice (soffice) if Method A failed
                if not conv_success:
                    try:
                        import subprocess
                        soffice_cmd = "soffice" 
                        if os.name == 'nt': # Windows
                            potential_paths = [
                                r"C:\Program Files\LibreOffice\program\soffice.exe",
                                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
                            ]
                            for p in potential_paths:
                                if os.path.exists(p):
                                    soffice_cmd = p
                                    break
                        
                        subprocess.run([
                            soffice_cmd,
                            '--headless',
                            '--convert-to', 'pdf',
                            '--outdir', output_dir,
                            docx_path
                        ], check=True, capture_output=True)
                        
                        if os.path.exists(pdf_path):
                            generated_docs[doc_type] = pdf_path.replace("\\", "/")
                            conv_success = True
                    except Exception as e:
                        print(f"LibreOffice failed for {doc_type}: {e}")

                # Fallback to docx if both failed
                if not conv_success:
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
                        context["nip_kepala_uptd"] = kepala.nip
                    if bendahara:
                        context["nama_bendahara"] = bendahara.name
                        context["nip_bendahara"] = bendahara.nip

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
            
            # Method A: Try docx2pdf (Requires MS Word on Windows)
            if HAS_PDF_CONVERTER:
                try:
                    import pythoncom
                    pythoncom.CoInitialize()
                    convert(docx_path, pdf_path)
                    if os.path.exists(pdf_path):
                        return pdf_path.replace("\\", "/")
                except Exception as e:
                    print(f"docx2pdf failed: {e}")
                finally:
                    try:
                        pythoncom.CoUninitialize()
                    except:
                        pass

            # Method B: Try LibreOffice (soffice) - The server-side standard
            try:
                import subprocess
                # For Windows, soffice might be in Program Files
                # For Linux, it's usually just 'soffice'
                soffice_cmd = "soffice" 
                if os.name == 'nt': # Windows
                    potential_paths = [
                        r"C:\Program Files\LibreOffice\program\soffice.exe",
                        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
                    ]
                    for p in potential_paths:
                        if os.path.exists(p):
                            soffice_cmd = p
                            break
                
                subprocess.run([
                    soffice_cmd,
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', output_dir,
                    docx_path
                ], check=True, capture_output=True)
                
                if os.path.exists(pdf_path):
                    return pdf_path.replace("\\", "/")
            except Exception as e:
                print(f"LibreOffice conversion failed: {e}")

            # If both failed, return the docx (invoices.py will handle the error)
            return docx_path.replace("\\", "/")

        except Exception as e:
            print(f"Error generating {doc_type}: {e}")
            raise e
