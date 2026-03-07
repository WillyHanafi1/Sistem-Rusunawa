import os
from sqlmodel import text
from app.core.db import engine

with engine.connect() as con:
    con.execute(text('DROP TABLE IF EXISTS rooms CASCADE'))
    con.commit()
    print("Dropped rooms table successfully.")
