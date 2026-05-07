import sys
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

pdf_path = "Lampiran I  Pre-Requisite Checklist Layanan bjb Virtual Account ONLINE v.1.0.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}\n")
    
    for i, page in enumerate(pdf.pages):
        print(f"{'='*80}")
        print(f"PAGE {i+1} (size: {page.width}x{page.height})")
        print(f"{'='*80}")
        
        # Extract text
        text = page.extract_text()
        if text and text.strip():
            print("\n[TEXT CONTENT]")
            print(text)
        else:
            print("\n[TEXT CONTENT] — (empty or image-based)")
        
        # Extract tables
        tables = page.extract_tables()
        if tables:
            for t_idx, table in enumerate(tables):
                print(f"\n[TABLE {t_idx+1}] ({len(table)} rows)")
                for row_idx, row in enumerate(table):
                    print(f"  Row {row_idx}: {row}")
        else:
            print("[TABLES] — No tables detected")
        
        # Check for images
        images = page.images
        if images:
            print(f"\n[IMAGES] — {len(images)} image(s) found on this page")
        
        print()
