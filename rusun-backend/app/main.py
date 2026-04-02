from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from datetime import datetime, timezone
from app.core.db import create_db_and_tables
from app.core.config import settings
from app.api import auth, rooms, tenants, invoices, webhooks, tickets, applications, management, tasks, checkouts
from app.models.application import Application
from app.models.staff import Staff
from app.models.family_member import FamilyMember


# Simple background task for automatic penalty processing
import asyncio

async def run_daily_overdue_processing():
    """Runs every 24 hours to transition documents and calculate penalties."""
    from app.api.tasks import handle_overdue_processing
    from app.core.db import get_session
    from app.models.user import User, UserRole

    while True:
        try:
            # Wait 10 seconds after startup before first run
            await asyncio.sleep(10)
            
            session_generator = get_session()
            session = next(session_generator)
            
            # Create a mock internal admin for the process
            mock_admin = User(role=UserRole.sadmin, name="System Automation")
            
            print(f"[{datetime.now()}] Running automated daily and monthly tasks...")
            
            # 1. Handle Monthly Generation (Only runs on day 01)
            from app.api.tasks import handle_monthly_generation
            await asyncio.to_thread(handle_monthly_generation, session, mock_admin)
            
            # 2. Handle Overdue Processing (STRD & Warnings)
            from app.api.tasks import handle_overdue_processing
            await asyncio.to_thread(handle_overdue_processing, session, mock_admin)
            
            print(f"[{datetime.now()}] Automated tasks completed.")
            
            # Wait 24 hours
            await asyncio.sleep(86400)
        except StopIteration:
            pass
        except Exception as e:
            print(f"Error in automated overdue processing: {e}")
            await asyncio.sleep(60) # Wait a minute before retrying on error

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager (menggantikan @on_event yang deprecated)."""
    # Startup: buat semua tabel jika belum ada
    create_db_and_tables()
    # Start background task
    asyncio.create_task(run_daily_overdue_processing())
    yield
    # Shutdown: tambahkan cleanup logic di sini jika diperlukan


app = FastAPI(
    title="Rusunawa API",
    description="Backend API untuk Sistem Manajemen Rumah Susun Sederhana Sewa",
    version="1.0.0",
    lifespan=lifespan,  # modern pattern (FastAPI >= 0.93)
)

# CORS - Baca dari env var ALLOWED_ORIGINS (comma-separated) atau gunakan default localhost
_default_origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
]
_env_origins = settings.ALLOWED_ORIGINS
allow_origins = (
    [origin.strip() for origin in _env_origins.split(",") if origin.strip()]
    if _env_origins
    else _default_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
app.include_router(tasks.router, prefix="/api")
app.include_router(checkouts.router, prefix="/api")

# Mount folder uploads untuk membaca foto KTP / dokumen
os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Rusunawa API is running 🏠"}
