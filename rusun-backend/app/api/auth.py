from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.security import (
    verify_password, create_access_token, hash_password,
    get_current_user, require_admin
)
from app.models.user import User, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun tidak aktif")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"), # Always True in Production
        samesite="lax",
        max_age=60 * 60 * 24 * 7, # 1 minggu
    )

    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.role, 
        "name": user.name
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Berhasil logout"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register-admin", response_model=UserRead)
def register_admin(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Hanya admin yang bisa membuat user baru (termasuk penghuni)"""
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
