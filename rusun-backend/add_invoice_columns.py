import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rusun_user:rusun_pass@localhost:54320/rusunawa")
# Replace localhost:54320 to db:5432 if run inside docker
if "localhost:54320" in DATABASE_URL and os.getenv("IN_DOCKER"):
    DATABASE_URL = DATABASE_URL.replace("localhost:54320", "db:5432")

def upgrade():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        columns_to_add = [
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS water_charge NUMERIC(10, 2) DEFAULT 0.0;",
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS electricity_charge NUMERIC(10, 2) DEFAULT 0.0;"
        ]
        
        for query in columns_to_add:
            try:
                cur.execute(query)
                print(f"Executed: {query}")
            except Exception as e:
                print(f"Error executing {query}: {e}")
                
        cur.close()
        conn.close()
        print("Migration successful.")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    upgrade()
