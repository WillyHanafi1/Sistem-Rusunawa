import fitz  # PyMuPDF
import os

def check_pdf_pymupdf(pdf_path):
    if not os.path.exists(pdf_path):
        return f"Error: File {pdf_path} not found"
    
    doc = fitz.open(pdf_path)
    print(f"Num pages: {doc.page_count}")
    for i in range(min(5, doc.page_count)):
        page = doc.load_page(i)
        text = page.get_text()
        print(f"Page {i+1} text length: {len(text)}")
        if len(text) > 0:
            print(f"First 100 chars of page {i+1}: {text[:100]}")
    doc.close()

if __name__ == "__main__":
    pdf_path = r"D:\ProjectAI\Sistem-Rusunawa\local_data\Perwal No 36 Tahun 2017.pdf"
    check_pdf_pymupdf(pdf_path)
