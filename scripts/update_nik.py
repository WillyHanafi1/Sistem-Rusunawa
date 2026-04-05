import sqlite3

def fix_null_nik():
    db_path = "rusun-backend/rusunawa.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update NULL nik with a default valid value
    # The Pydantic model requires 16 characters
    default_nik = "0000000000000000"
    
    try:
        cursor.execute("UPDATE tenants SET nik = ? WHERE nik IS NULL OR nik = ''", (default_nik,))
        updated = cursor.rowcount
        conn.commit()
        print(f"Successfully updated {updated} rows where NIK was NULL.")
    except Exception as e:
        print(f"Error updating NIK: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_null_nik()
