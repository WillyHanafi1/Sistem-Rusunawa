from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load DATABASE_URL from .env or docker env
# Use localhost:54320 if running from host, or db:5432 if running inside docker
# Since I'll run this inside docker, I'll use the environment variable.

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rusun_user:rusun_pass@db:5432/rusunawa")
engine = create_engine(DATABASE_URL)

sql_statements = [
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(12,2) DEFAULT 0;",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type VARCHAR DEFAULT 'skrd';",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_status_updated_at TIMESTAMP;"
]

with engine.connect() as conn:
    for sql in sql_statements:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"Executed: {sql}")
        except Exception as e:
            print(f"Error executing {sql}: {e}")

print("Migration completed.")
