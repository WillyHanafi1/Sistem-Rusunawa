from sqlmodel import create_engine, inspect
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
inspector = inspect(engine)

def check_columns():
    for table in ['tenants', 'users', 'rooms']:
        columns = [c['name'] for c in inspector.get_columns(table)]
        print(f"Columns in {table}: {columns}")

if __name__ == "__main__":
    check_columns()
