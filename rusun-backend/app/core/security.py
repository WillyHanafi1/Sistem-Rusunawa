import bcrypt
import logging
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.core.config import settings
from app.core.db import get_session
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token (7 days by default)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token. Returns payload or raises HTTPException."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token bukan refresh token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token tidak valid atau sudah kadaluarsa")


def _decode_token(request: Request, token: Optional[str], session: Session) -> Optional[User]:
    """Internal helper: decodes JWT and returns User or None."""
    actual_token = request.cookies.get("access_token") or token

    if not actual_token:
        return None

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(actual_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("JWT payload missing 'sub' claim")
            raise credentials_exception
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.get(User, int(user_id))
    if not user or not user.is_active:
        logger.warning(f"User not found or inactive: {user_id}")
        raise credentials_exception
    return user


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """REQUIRED authentication — raises 401 if no token or invalid token.
    Use this for ALL protected endpoints."""
    actual_token = request.cookies.get("access_token") or token
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Silakan login terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = _decode_token(request, token, session)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Silakan login terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Optional[User]:
    """OPTIONAL authentication — returns None if no token (for public endpoints).
    Only use for endpoints that genuinely support both authenticated and anonymous access."""
    actual_token = request.cookies.get("access_token") or token
    if not actual_token:
        return None
    try:
        return _decode_token(request, token, session)
    except HTTPException:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.admin, UserRole.sadmin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini.",
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.sadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Fitur ini hanya tersedia untuk Super Admin.",
        )
    return current_user

