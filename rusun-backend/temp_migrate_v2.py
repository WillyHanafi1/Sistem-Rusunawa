import sys
import os
from sqlalchemy import text
from sqlmodel import create_engine

# Add backend to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rusun-backend"))
sys.path.append(backend_path)

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def run_migrations():
    with engine.connect() as conn:
        print("Menerapkan migrasi sisa...")
        
        # 3. Create Checkouts Table explicitly to avoid FK missing table error
        print("Creating 'checkouts' table...")
        sql = """
        CREATE TABLE IF NOT EXISTS checkouts (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id),
            status TEXT NOT NULL DEFAULT 'requested',
            inspection_notes TEXT,
            final_refund_amount FLOAT DEFAULT 0.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP WITH TIME ZONE
        );
        """
        try:
            conn.execute(text(sql))
            conn.commit()
            print("Checkouts table created/verified.")
        except Exception as e:
            print(f"Error creating checkouts: {e}")

if __name__ == "__main__":
    run_migrations()
