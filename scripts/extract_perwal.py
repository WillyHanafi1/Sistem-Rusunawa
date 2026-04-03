import pypdf
import os

def extract_text_from_pdf(pdf_path):
    if not os.path.exists(pdf_path):
        return f"Error: File {pdf_path} not found"
    
    reader = pypdf.PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n\n"
    
    return full_text

if __name__ == "__main__":
    pdf_path = r"D:\ProjectAI\Sistem-Rusunawa\local_data\Perwal No 36 Tahun 2017.pdf"
    text = extract_text_from_pdf(pdf_path)
    print(text)
