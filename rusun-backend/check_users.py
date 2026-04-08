from sqlmodel import Session, select
from app.core.db import engine
from app.models.user import User

with Session(engine) as session:
    users = session.exec(select(User)).all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
