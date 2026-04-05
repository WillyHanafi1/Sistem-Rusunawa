import sqlite3
import os

db_path = "rusun-backend/rusunawa.db"
if not os.path.exists(db_path):
    print(f"File {db_path} not found in {os.getcwd()}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
        # Check users
        if ('users',) in tables:
            cursor.execute("SELECT id, email, name, role, is_active FROM users;")
            users = cursor.fetchall()
            print(f"Users (id, email, name, role, active): {users}")
        else:
            print("Table 'users' not found.")
            
        # Check tenants columns
        if ('tenants',) in tables:
            cursor.execute("PRAGMA table_info(tenants);")
            columns = cursor.fetchall()
            print(f"Tenants columns: {[c[1] for c in columns]}")
        else:
            print("Table 'tenants' not found.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
