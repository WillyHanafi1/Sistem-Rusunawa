import docx
import os

def read_docx(path):
    try:
        doc = docx.Document(path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        return str(e)

template_dir = r"d:\ProjectAI\Sistem-Rusunawa\rusun-backend\app\templates"
files = os.listdir(template_dir)

for f in files:
    if f.endswith(".docx"):
        print(f"--- {f} ---")
        print(read_docx(os.path.join(template_dir, f)))
        print("\n")
