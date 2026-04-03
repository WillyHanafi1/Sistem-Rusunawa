import pandas as pd
import os
from datetime import datetime
import re

# Translation map for Indonesian months to English
ID_MONTHS = {
    'Januari': 'January', 'Februari': 'February', 'Maret': 'March',
    'April': 'April', 'Mei': 'May', 'Juni': 'June',
    'Juli': 'July', 'Agustus': 'August', 'September': 'September',
    'Oktober': 'October', 'November': 'November', 'Desember': 'December',
    'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
    'Mei': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Agu': 'Aug',
    'Sep': 'Sep', 'Okt': 'Oct', 'Nov': 'Nov', 'Des': 'Dec'
}

def clean_date_str(val):
    if pd.isna(val) or str(val).strip() == "":
        return val
    
    s = str(val).strip()
    s = s.rstrip('.') # Remove trailing dots if any
    
    # Replace Indonesian month names with English
    for id_m, en_m in ID_MONTHS.items():
        if id_m in s:
            s = s.replace(id_m, en_m)
            break
            
    # Remove separators like '-', ' ', or '.' for uniform parsing if needed
    # But try pandas parsing first
    try:
        # Pandas is good at parsing diverse formats (e.g., "10 Mar 25", "03-Mei-2025")
        parsed = pd.to_datetime(s, dayfirst=True, errors='coerce')
        if pd.isna(parsed):
            return val
        return parsed.strftime('%Y-%m-%d')
    except:
        return val

def main():
    input_file = r"d:\ProjectAI\Sistem-Rusunawa\local_data\Data_Penghuni_Cigugur.csv"
    output_file = r"d:\ProjectAI\Sistem-Rusunawa\local_data\Import_Penghuni_Cigugur.xlsx"
    
    print(f"Reading {input_file}...")
    # Read semicolon separated CSV
    df = pd.read_csv(input_file, sep=';', dtype={'nik': str})
    
    # Process tgl_mulai
    print("Normalizing tgl_mulai...")
    df['tgl_mulai'] = df['tgl_mulai'].apply(clean_date_str)
    
    # Process tgl_selesai
    print("Updating tgl_selesai to 2028-01-01...")
    df['tgl_selesai'] = "2028-01-01"
    
    # Save as Excel
    print(f"Saving to {output_file}...")
    df.to_excel(output_file, index=False)
    print("Done!")

if __name__ == "__main__":
    main()
