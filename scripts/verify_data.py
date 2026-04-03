import pandas as pd
import sqlite3
import os

def main():
    xlsx_file = r"d:\ProjectAI\Sistem-Rusunawa\local_data\Import_Penghuni_Cigugur.xlsx"
    db_file = r"d:\ProjectAI\Sistem-Rusunawa\rusun-backend\rusunawa.db"
    
    if not os.path.exists(xlsx_file):
        print(f"Error: {xlsx_file} not found.")
        return
        
    print(f"Verifying {xlsx_file}...")
    df = pd.read_excel(xlsx_file)
    
    # Check columns
    required_cols = ["nama", "nik", "email", "rusunawa", "gedung", "lantai", "unit", "tgl_mulai", "tgl_selesai"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print(f"Error: Missing columns {missing}")
    else:
        print("Success: All required columns present.")
        
    # Check first few rows tgl_mulai
    print("Sample tgl_mulai:", df['tgl_mulai'].head(3).tolist())
    
    # Verify rooms in DB
    if not os.path.exists(db_file):
        print(f"Error: Database {db_file} not found.")
        return
        
    print(f"Checking rooms in {db_file}...")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Roman mapping as in models/room.py
    ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}
    
    found_rooms = []
    missing_rooms = []
    
    for idx, row in df.iterrows():
        # room_number formula: {rusunawa} - {building} {floor_roman} {unit}
        rusunawa = row['rusunawa']
        building = row['gedung']
        floor = int(row['lantai'])
        unit = int(row['unit'])
        floor_roman = ROMAN.get(floor, str(floor))
        
        room_number = f"{rusunawa} - {building} {floor_roman} {unit}"
        cursor.execute("SELECT id FROM rooms WHERE room_number = ?", (room_number,))
        res = cursor.fetchone()
        if not res:
            missing_rooms.append(room_number)
        else:
            found_rooms.append(room_number)
            
    conn.close()
    
    print(f"Verified {len(df)} rows.")
    if missing_rooms:
        print(f"Error: {len(missing_rooms)} rooms not found in DB! Example: {missing_rooms[0]}")
    else:
        print("Success: All rooms found in DB.")

if __name__ == "__main__":
    main()
