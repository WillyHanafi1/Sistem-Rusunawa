import sqlite3
import os

db_path = r"d:\ProjectAI\Sistem-Rusunawa\rusun-backend\rusunawa.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(tenants);")
    columns = cursor.fetchall()
    print("Columns in 'tenants' table:")
    for col in columns:
        print(f"ID: {col[0]}, Name: {col[1]}, Type: {col[2]}")
except Exception as e:
    print(f"Error querying database: {e}")
finally:
    conn.close()
