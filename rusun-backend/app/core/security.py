import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.core.config import settings
from app.core.db import get_session
from app.models.user import User, UserRole

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
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    # First priority: Cookie (for browser requests)
    # Second priority: Authorization header (for API testing / mobile apps)
    actual_token = request.cookies.get("access_token") or token
    
    # DEBUG: Check if token is received
    print(f"[BACKEND DEBUG] Token received: {actual_token[:10]}...{actual_token[-10:] if actual_token else ''}")

    if not actual_token:
        print("[BACKEND DEBUG] No token found in cookies or header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak ditemukan",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(actual_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print("[BACKEND DEBUG] Payload missing 'sub'")
            raise credentials_exception
    except Exception as e:
        print(f"[BACKEND DEBUG] JWT Decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token tidak valid: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.get(User, int(user_id))
    if not user or not user.is_active:
        print(f"[BACKEND DEBUG] User not found or inactive: {user_id}")
        raise credentials_exception
    return user


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
