import pandas as pd
import re
from datetime import datetime
import os

# Configuration
CSV_PATH = "seeds/data/cibeureum_tenants.csv"
OUTPUT_PATH = "../Import_Penghuni_Cibeureum.xlsx"

ID_MONTHS = {
    'Januari': 'January', 'Februari': 'February', 'Maret': 'March',
    'April': 'April', 'Mei': 'May', 'Juni': 'June',
    'Juli': 'July', 'Agustus': 'August', 'September': 'September',
    'Oktober': 'October', 'November': 'November', 'Desember': 'December'
}

def clean_date_str(val):
    if pd.isna(val) or str(val).strip() in ["", "-", "0"]:
        return None
    s = str(val).strip().rstrip('.')
    if re.match(r'^[a-zA-Z]+\s+\d{4}$', s):
        s = f"01 {s}"
    for id_m, en_m in ID_MONTHS.items():
        if id_m in s:
            s = s.replace(id_m, en_m)
            break
    try:
        parsed = pd.to_datetime(s, dayfirst=True, errors='coerce')
        return parsed
    except:
        return None

def roman_to_int(r):
    romans = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5}
    return romans.get(r, 0)

def generate_excel():
    print(f"Reading {CSV_PATH}...")
    # Skip formal headers, start from data
    df_raw = pd.read_csv(CSV_PATH, sep=';', skiprows=2, header=None)
    
    import_data = []
    
    for _, row in df_raw.iterrows():
        if pd.isna(row[2]) or str(row[2]).strip() == "":
            continue
            
        name = str(row[2]).strip()
        nik_raw = str(row[3]).strip().replace("'", "")
        nik = nik_raw.ljust(16, '0')[:16]
        email = f"{nik_raw}@rusunawa.com"
        
        building = str(row[4]).strip()
        if building.endswith('.0'): building = building[:-2]
        
        lantai_roman = str(row[5]).strip()
        lantai = roman_to_int(lantai_roman)
        
        unit = str(row[6]).strip()
        if unit.endswith('.0'): unit = unit[:-2]
        
        tgl_str = str(row[7])
        tgl_mulai = clean_date_str(tgl_str)
        if tgl_mulai is None or pd.isna(tgl_mulai):
            tgl_mulai = pd.Timestamp(2024, 1, 1)
            
        try:
            tgl_selesai = tgl_mulai.replace(year=tgl_mulai.year + 1)
        except:
            tgl_selesai = tgl_mulai + pd.DateOffset(years=1)
            
        if pd.isna(tgl_selesai):
            tgl_selesai = tgl_mulai + pd.DateOffset(years=1)

        import_data.append({
            "nama": name,
            "nik": nik,
            "email": email,
            "rusunawa": "Cibeureum",
            "gedung": building,
            "lantai": lantai,
            "unit": unit,
            "tgl_mulai": tgl_mulai.strftime('%Y-%m-%d') if not pd.isna(tgl_mulai) else "2024-01-01",
            "tgl_selesai": tgl_selesai.strftime('%Y-%m-%d') if not pd.isna(tgl_selesai) else "2025-01-01",
            "jumlah_motor": 0
        })
        
    df_final = pd.DataFrame(import_data)
    df_final.to_excel(OUTPUT_PATH, index=False)
    print(f"Excel created successfully at {os.path.abspath(OUTPUT_PATH)}")

if __name__ == "__main__":
    generate_excel()
