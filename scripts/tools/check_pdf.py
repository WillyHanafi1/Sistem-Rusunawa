import pypdf
import os

def check_pdf(pdf_path):
    if not os.path.exists(pdf_path):
        return f"Error: File {pdf_path} not found"
    
    reader = pypdf.PdfReader(pdf_path)
    print(f"Num pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f"Page {i+1} text length: {len(text)}")
        if len(text) > 0:
            print(f"First 100 chars of page {i+1}: {text[:100]}")

if __name__ == "__main__":
    pdf_path = r"D:\ProjectAI\Sistem-Rusunawa\local_data\Perwal No 36 Tahun 2017.pdf"
    check_pdf(pdf_path)
