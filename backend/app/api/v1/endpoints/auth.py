"""Database-backed JWT authentication for the RAVEN workspace."""

from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import secrets

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import settings
from app.db.dependencies import DBSession
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
PASSWORD_ITERATIONS = 310_000


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.urlsafe_b64encode(salt).decode(),
        base64.urlsafe_b64encode(digest).decode(),
    )


def _verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            base64.urlsafe_b64decode(salt.encode()),
            int(iterations),
        )
        return hmac.compare_digest(
            base64.urlsafe_b64encode(digest).decode(), expected
        )
    except (ValueError, TypeError):
        return False


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    display_name: str
    password: str


def _token(user: User) -> dict:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": str(user.id), "username": user.username, "iat": now, "exp": expires},
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"username": user.username, "display_name": user.display_name},
        "expires_at": expires.isoformat(),
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DBSession):
    username = payload.username.strip().lower()
    display_name = payload.display_name.strip()
    if len(username) < 3 or len(display_name) < 2 or len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Use a username and display name with at least 2 characters, and a password with at least 8 characters.")
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status_code=409, detail="That username is already registered.")
    user = User(username=username, display_name=display_name, password_hash=_hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token(user)


@router.post("/login")
def login(payload: LoginRequest, db: DBSession):
    user = db.scalar(select(User).where(User.username == payload.username.strip().lower()))
    if user is None or not user.is_active or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Those credentials could not be verified.")
    return _token(user)
