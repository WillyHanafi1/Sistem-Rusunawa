import sys, os
sys.stdout.reconfigure(encoding='utf-8')

from pypdf import PdfReader

for pdf_file in os.listdir('.'):
    if pdf_file.endswith('.pdf'):
        print(f"\n{'='*80}")
        print(f"FILE: {pdf_file}")
        print(f"{'='*80}")
        r = PdfReader(pdf_file)
        for i, page in enumerate(r.pages):
            text = page.extract_text()
            print(f"\n--- PAGE {i+1} ---")
            print(text)
