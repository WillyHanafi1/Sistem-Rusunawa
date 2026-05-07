import sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

# Extract QRIS form
r = PdfReader('Formulir bjb QRIS_Final (1).pdf')
with open('qris_form_extracted.md', 'w', encoding='utf-8') as f:
    f.write(f"# Formulir bjb QRIS - Total {len(r.pages)} pages\n\n")
    for i, page in enumerate(r.pages):
        text = page.extract_text()
        f.write(f"## PAGE {i+1}\n\n```\n{text}\n```\n\n")

# Extract VA Checklist
r2 = PdfReader('Lampiran I  Pre-Requisite Checklist Layanan bjb Virtual Account ONLINE v.1.0.pdf')
with open('va_checklist_extracted.md', 'w', encoding='utf-8') as f:
    f.write(f"# Lampiran VA Checklist - Total {len(r2.pages)} pages\n\n")
    for i, page in enumerate(r2.pages):
        text = page.extract_text()
        f.write(f"## PAGE {i+1}\n\n```\n{text}\n```\n\n")

print("Done! Files saved.")
