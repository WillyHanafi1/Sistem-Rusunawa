import sys
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber
import os

pdf_path = "Lampiran I  Pre-Requisite Checklist Layanan bjb Virtual Account ONLINE v.1.0.pdf"
output_dir = "va_checklist_pages"
os.makedirs(output_dir, exist_ok=True)

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        img = page.to_image(resolution=200)
        out_path = os.path.join(output_dir, f"page_{i+1}.png")
        img.save(out_path)
        print(f"Saved: {out_path}")

print(f"\nDone! {len(pdf.pages)} pages exported to {output_dir}/")
