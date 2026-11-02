"""Password hashing and JWT helpers."""

import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

from app.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    PASSWORD_RESET_EXPIRE_MINUTES,
    SECRET_KEY,
)


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        return False


def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    expire_delta = timedelta(minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expire_delta
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except InvalidTokenError as exc:
        raise ValueError("Invalid or expired token.") from exc
    # Special-purpose tokens (e.g. password reset) must never work as a login token.
    if payload.get("purpose"):
        raise ValueError("Invalid or expired token.")
    return payload


# ---- Password reset tokens -------------------------------------------------
# Stateless: the token carries a fingerprint of the CURRENT password hash, so as soon as
# the password changes the old link stops working (single use) - no extra DB table needed.

def _password_fingerprint(hashed_password: str) -> str:
    return hashlib.sha256(hashed_password.encode("utf-8")).hexdigest()[:24]


def create_password_reset_token(user_id: int, hashed_password: str, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or PASSWORD_RESET_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "purpose": "password_reset",
        "pwd": _password_fingerprint(hashed_password),
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_password_reset_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except InvalidTokenError as exc:
        raise ValueError("Invalid or expired reset link.") from exc
    if payload.get("purpose") != "password_reset":
        raise ValueError("Invalid or expired reset link.")
    return payload


def reset_token_matches_password(payload: dict, hashed_password: str) -> bool:
    return hmac.compare_digest(str(payload.get("pwd", "")), _password_fingerprint(hashed_password))
