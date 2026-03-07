import os
from docxtpl import DocxTemplate
from datetime import datetime
import uuid

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
            "pengajuan": "template_pengajuan.docx",
            "ba_wawancara": "template_ba_wawancara.docx",
            "sip": "template_sip.docx",
            "kontrak": "template_kontrak.docx"
        }

        # Prepare context (data padding etc)
        context = {
            **data,
            "tanggal_cetak": datetime.now().strftime("%d-%m-%Y"),
            "tahun": datetime.now().year
        }

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
                
                # 2. Convert to PDF if possible
                if HAS_PDF_CONVERTER:
                    try:
                        # docx2pdf convert(input, output)
                        pdf_path = docx_path.replace(".docx", ".pdf")
                        convert(docx_path, pdf_path)
                        # Store PDF path if successful
                        generated_docs[doc_type] = pdf_path.replace("\\", "/") # Normalize for web access
                    except Exception as e:
                        print(f"Error converting {doc_type} to PDF: {e}")
                        generated_docs[doc_type] = docx_path.replace("\\", "/")
                else:
                    generated_docs[doc_type] = docx_path.replace("\\", "/")

            except Exception as e:
                print(f"Error generating {doc_type}: {e}")

        return generated_docs
