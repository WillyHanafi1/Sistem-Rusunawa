from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from app.core.db import create_db_and_tables
from app.api import auth, rooms, tenants, invoices, webhooks, tickets, applications, management
from app.models.application import Application
from app.models.staff import Staff


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager (menggantikan @on_event yang deprecated)."""
    # Startup: buat semua tabel jika belum ada
    create_db_and_tables()
    yield
    # Shutdown: tambahkan cleanup logic di sini jika diperlukan


app = FastAPI(
    title="Rusunawa API",
    description="Backend API untuk Sistem Manajemen Rumah Susun Sederhana Sewa",
    version="1.0.0",
    lifespan=lifespan,  # modern pattern (FastAPI >= 0.93)
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(tickets.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(management.router, prefix="/api")

# Mount folder uploads untuk membaca foto KTP / dokumen
os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Rusunawa API is running 🏠"}
