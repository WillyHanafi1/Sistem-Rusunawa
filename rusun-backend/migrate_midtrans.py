import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rusun_user:rusun_pass@localhost:5432/rusunawa")

def upgrade():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        columns_to_add = [
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_url TEXT;",
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_id TEXT;",
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT;",
            "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;"
        ]
        
        for query in columns_to_add:
            try:
                cur.execute(query)
                print(f"Executed: {query}")
            except Exception as e:
                print(f"Error executing {query}: {e}")
                
        cur.close()
        conn.close()
        print("Midtrans Migration successful.")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    upgrade()
