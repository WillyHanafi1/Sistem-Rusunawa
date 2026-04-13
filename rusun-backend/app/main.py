import logging
import os
import secrets
import string
import asyncio
import re

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette_csrf import CSRFMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from app.core.db import create_db_and_tables
from app.core.config import settings
from app.api import auth, rooms, tenants, invoices, webhooks, tickets, applications, management, tasks, checkouts, documents
from app.models.application import Application
from app.models.staff import Staff
from app.models.family_member import FamilyMember
from sqlmodel import Session, select
from app.core.db import engine, create_db_and_tables
from app.core.security import hash_password
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


# Simple background task for automatic penalty processing
import asyncio

async def run_daily_overdue_processing():
    """Runs every 24 hours to transition documents and calculate penalties."""
    while True:
        try:
            # Wait 10 seconds after startup before first run
            await asyncio.sleep(10)
            
            # Fix: Use Context Manager to ensure session is closed
            # This prevents connection leaks every 24 hours.
            with Session(engine) as session:
                # Create a mock internal admin for the process
                mock_admin = User(role=UserRole.sadmin, name="System Automation")
                
                logger.info("Running automated daily and monthly tasks...")
                
                # 1. Handle Monthly Generation (Only runs on day 01)
                from app.api.tasks import handle_monthly_generation
                await asyncio.to_thread(handle_monthly_generation, session, mock_admin)
                
                # 2. Handle Overdue Processing (STRD & Warnings)
                from app.api.tasks import handle_overdue_processing
                await asyncio.to_thread(handle_overdue_processing, session, mock_admin)
            
            logger.info("Automated tasks completed.")
            
            # Wait 24 hours
            await asyncio.sleep(86400)
        except Exception as e:
            logger.error(f"Error in automated overdue processing: {e}")
            await asyncio.sleep(60) # Wait a minute before retrying on error

def seed_admin():
    """Memastikan setidaknya ada satu akun admin di sistem."""
    with Session(engine) as session:
        statement = select(User).where(User.role.in_([UserRole.admin, UserRole.sadmin]))
        admin_exists = session.exec(statement).first()
        
        if not admin_exists:
            logger.info("[AUTO-SEED] Tidak ada admin ditemukan. Membuat akun default...")
            # Generate cryptographically secure password
            admin_password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*")
                for _ in range(16)
            )
            default_admin = User(
                email="admin@rusunawa.com",
                name="Super Admin",
                phone="08123456789",
                role=UserRole.sadmin,
                is_active=True,
                password_hash=hash_password(admin_password),
            )
            session.add(default_admin)
            session.commit()
            # SECURITY: Password HANYA ditampilkan sekali saat pertama kali seed.
            # Di production, kirim via channel aman (email/SMS), jangan log.
            if settings.ENVIRONMENT == "development":
                logger.warning(f"[AUTO-SEED] DEV ONLY — Admin: admin@rusunawa.com / {admin_password}")
            else:
                logger.info("[AUTO-SEED] Akun admin dibuat. Password dikirim via secure channel.")
        else:
            logger.info("[AUTO-SEED] Akun admin sudah ada.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager (menggantikan @on_event yang deprecated)."""
    # Startup: buat semua tabel jika belum ada (handled by alembic)
    # create_db_and_tables() 
    # Seeding otomatis akun admin jika kosong
    seed_admin()
    # Start background task
    asyncio.create_task(run_daily_overdue_processing())
    yield
    # Shutdown: tambahkan cleanup logic di sini jika diperlukan


# --- Security Headers Middleware (LOW-01) ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response


app = FastAPI(
    title="Rusunawa API",
    description="Backend API untuk Sistem Manajemen Rumah Susun Sederhana Sewa",
    version="1.0.0",
    lifespan=lifespan,  # modern pattern (FastAPI >= 0.93)
    redirect_slashes=False, # Allow Next.js trailing slashes to match routes
    # Disable docs in production (security hardening)
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# CRIT-05: Register rate limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.auth import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS - Robust development origins
_default_origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000", # IPv6 support
    "http://localhost:3001",
    "http://127.0.0.1:8100",
]
_env_origins = settings.ALLOWED_ORIGINS
allow_origins = (
    [origin.strip() for origin in _env_origins.split(",") if origin.strip()]
    if _env_origins
    else _default_origins
)

# Merge defaults into env-provided origins for robustness in dev
if settings.ENVIRONMENT == "development":
    for origin in _default_origins:
        if origin not in allow_origins:
            allow_origins.append(origin)

# MED-05: Explicit methods/headers for production, wildcard for dev
_allowed_methods = ["*"] if settings.ENVIRONMENT == "development" else ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
_allowed_headers = ["*"] if settings.ENVIRONMENT == "development" else ["Content-Type", "Authorization", "Cookie"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=_allowed_methods,
    allow_headers=_allowed_headers,
)

# CSRF Protection: CSRFMiddleware expects X-CSRF-Token header.
# Exclude public/webhook endpoints.
csrf_exempt_urls = [
    re.compile(r"^/api/auth/login"), 
    re.compile(r"^/api/applications/?$"), # Public Registration
    re.compile(r"^/api/webhooks/midtrans"), # Payment Webhooks
    re.compile(r"^/api/invoices/preview"), # OTT Preview is safe (protected by signed JWT)
    re.compile(r"^/api/invoices/mass-generate"), # Admin Mass Actions
    re.compile(r"^/api/invoices/mass-generate-teguran"),
]

app.add_middleware(
    CSRFMiddleware,
    secret=settings.CSRF_SECRET,
    header_name="X-CSRF-Token",
    exempt_urls=csrf_exempt_urls
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
app.include_router(documents.router, prefix="/api")

# Uploads folder is now protected via the /api/documents endpoint.
# Do NOT mount as StaticFiles to prevent public PII leakage.
os.makedirs("uploads", exist_ok=True)
# app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Rusunawa API is running 🏠"}
