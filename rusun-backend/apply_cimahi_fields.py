import sqlite3
import os

db_path = "rusunawa.db"
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get current columns
cursor.execute("PRAGMA table_info(applications)")
columns = [row[1] for row in cursor.fetchall()]

new_columns = [
    ("is_address_cimahi", "BOOLEAN DEFAULT 0"),
    ("is_job_cimahi", "BOOLEAN DEFAULT 0")
]

for col_name, col_type in new_columns:
    if col_name not in columns:
        print(f"Adding column {col_name}...")
        try:
            cursor.execute(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}")
            conn.commit()
            print(f"Column {col_name} added successfully.")
        except Exception as e:
            print(f"Error adding column {col_name}: {e}")
    else:
        print(f"Column {col_name} already exists.")

conn.close()
