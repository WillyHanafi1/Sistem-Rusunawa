import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.db import get_session
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_refresh_token, hash_password,
    get_current_user, require_admin
)
from app.models.user import User, UserCreate, UserRead
from app.core.config import settings

logger = logging.getLogger(__name__)

# CRIT-05: Rate limiter instance (shared with main.py via app.state)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/csrf")
def get_csrf_token(request: Request):
    """
    Explicitly fetch a CSRF token.
    The CSRFMiddleware will automatically set the 'csrftoken' cookie.
    """
    return {"csrftoken": getattr(request.state, "csrftoken", None)}


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Helper: set both access and refresh token cookies."""
    is_prod = settings.ENVIRONMENT == "production"
    
    # Access token — short-lived (30 min)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    # Refresh token — long-lived (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/api/auth",  # Only sent to auth endpoints (minimize exposure)
    )


@router.post("/login")
@limiter.limit("5/minute")  # CRIT-05: Max 5 login attempts per minute per IP
def login(
    request: Request,  # Required by slowapi
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun tidak aktif")

    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    _set_auth_cookies(response, access_token, refresh_token)

    return {
        "token_type": "bearer", 
        "role": user.role, 
        "name": user.name
    }


@router.post("/refresh")
def refresh_access_token(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    """
    Exchange a valid refresh token for a new access token.
    Called automatically by the frontend when the access token expires.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token tidak ditemukan")
    
    # Decode and validate the refresh token
    payload = decode_refresh_token(refresh_token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    # Verify user still exists and is active
    user = session.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User tidak ditemukan atau tidak aktif")
    
    # Issue new access token (keep same refresh token until it expires)
    token_data = {"sub": str(user.id), "role": user.role}
    new_access_token = create_access_token(token_data)
    
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
    }


@router.post("/logout")
async def logout(response: Response):
    """Clear both access and refresh token cookies."""
    is_prod = settings.ENVIRONMENT == "production"
    
    response.delete_cookie(key="access_token", path="/", httponly=True, samesite="lax", secure=is_prod)
    response.delete_cookie(key="refresh_token", path="/api/auth", httponly=True, samesite="lax", secure=is_prod)
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/users", response_model=UserRead)
def create_user(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Admin can create new users (including tenants and other admins)"""
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        email=user_in.email,
        name=user_in.name,
        phone=user_in.phone,
        role=user_in.role,
        is_active=user_in.is_active,
        password_hash=hash_password(user_in.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
