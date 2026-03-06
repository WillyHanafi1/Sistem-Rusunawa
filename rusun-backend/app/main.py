from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import create_db_and_tables
from app.api import auth, rooms, tenants, invoices, webhooks, tickets


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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(tenants.router)
app.include_router(invoices.router)
app.include_router(webhooks.router)
app.include_router(tickets.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Rusunawa API is running 🏠"}
