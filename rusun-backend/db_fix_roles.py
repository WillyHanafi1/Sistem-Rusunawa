import psycopg2
from app.core.config import settings

def inspect_and_fix():
    print(f"Connecting to {settings.DATABASE_URL}...")
    # Parse the URL manually because psycopg2 needs params
    # Or just use the URL if psycopg2 supports it (it does)
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        # Check if it's a custom type (Enum)
        cursor.execute("SELECT n.nspname as schema, t.typname as type FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'userrole';")
        enum_type = cursor.fetchone()
        if enum_type:
            print(f"Found enum type: {enum_type}")
            try:
                cursor.execute("ALTER TYPE userrole ADD VALUE 'sadmin';")
                print("Added 'sadmin' to userrole enum type.")
            except Exception as e:
                print("Note:", e)
        
        # Check for constraints on users table
        cursor.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass AND contype = 'c';
        """)
        constraints = cursor.fetchall()
        print("Found check constraints:", constraints)
        
        for con in constraints:
            con_name = con[0]
            if 'role' in con_name.lower():
                print(f"Dropping constraint {con_name}...")
                cursor.execute(f"ALTER TABLE users DROP CONSTRAINT {con_name};")
                print(f"Adding new constraint for role...")
                cursor.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('sadmin', 'admin', 'penghuni'));")
                print("Successfully updated role constraint.")

    except Exception as e:
        print("Error during fix:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    inspect_and_fix()
