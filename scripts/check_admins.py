import sqlite3
import os

db_path = r"d:\ProjectAI\Sistem-Rusunawa\rusun-backend\rusunawa.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, email, name, role, is_active FROM users WHERE role IN ('admin', 'sadmin');")
    admins = cursor.fetchall()
    
    if not admins:
        print("No admin users found in the database.")
    else:
        print("Admin users found:")
        for admin in admins:
            print(f"ID: {admin[0]}, Email: {admin[1]}, Name: {admin[2]}, Role: {admin[3]}, Active: {admin[4]}")
except Exception as e:
    print(f"Error querying database: {e}")
finally:
    conn.close()
