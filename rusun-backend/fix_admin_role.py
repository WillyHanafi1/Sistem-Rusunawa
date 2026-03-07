import sqlite3
import os

def check_and_update():
    db_path = "database.db"
    if not os.path.exists(db_path):
        # Check in common locations
        possible_paths = ["../database.db", "app/database.db", "rusun-backend/database.db"]
        for p in possible_paths:
            if os.path.exists(p):
                db_path = p
                break
    
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current users
        cursor.execute("SELECT email, role FROM user")
        users = cursor.fetchall()
        print("Current users:", users)
        
        # Update admin role
        cursor.execute("UPDATE user SET role = 'super_admin' WHERE email = 'admin@rusunawa.com'")
        conn.commit()
        print("Update successful!")
        
        cursor.execute("SELECT email, role FROM user WHERE email = 'admin@rusunawa.com'")
        print("Updated admin:", cursor.fetchone())
        
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    check_and_update()
