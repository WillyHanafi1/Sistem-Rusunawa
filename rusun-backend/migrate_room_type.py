import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Check if room_type exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='rooms' AND column_name='room_type';
        """)
        
        if not cur.fetchone():
            print("Adding 'room_type' column to 'rooms' table...")
            cur.execute("ALTER TABLE rooms ADD COLUMN room_type INTEGER DEFAULT 21;")
            conn.commit()
            print("Migration successful: Added 'room_type'.")
        else:
            print("'room_type' column already exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
