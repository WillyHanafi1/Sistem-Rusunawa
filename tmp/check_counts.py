import sqlite3
import os

db_path = "rusun-backend/rusunawa.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM tenants WHERE is_active = 1;")
    count = cur.fetchone()[0]
    print(f"Active tenants: {count}")
    
    cur.execute("SELECT count(*) FROM invoices;")
    inv_count = cur.fetchone()[0]
    print(f"Total invoices: {inv_count}")
    
    conn.close()
else:
    print(f"DB not found at {db_path}")
