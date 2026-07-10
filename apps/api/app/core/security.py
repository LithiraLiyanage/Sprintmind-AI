from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet

from app.core.config import settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, password)
    except VerifyMismatchError:
        return False


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_token(
    *,
    subject: str,
    token_type: str,
    session_id: str,
    organization_id: str,
    expires_delta: timedelta,
) -> str:
    expires_at = utcnow() + expires_delta
    payload = {
        "sub": subject,
        "typ": token_type,
        "sid": session_id,
        "org": organization_id,
        "iat": int(utcnow().timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _fernet() -> Fernet:
    try:
        return Fernet(settings.encryption_key.encode("utf-8"))
    except Exception:
        digest = hashlib.sha256(settings.encryption_key.encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_secret(value: str | None) -> str | None:
    if not value:
        return None
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str | None) -> str | None:
    if not value:
        return None
    return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")


def password_strength_errors(password: str) -> list[str]:
    errors: list[str] = []
    if len(password) < 12:
        errors.append("Password must be at least 12 characters.")
    if password.lower() == password:
        errors.append("Password must include an uppercase letter.")
    if password.upper() == password:
        errors.append("Password must include a lowercase letter.")
    if not any(char.isdigit() for char in password):
        errors.append("Password must include a number.")
    if not any(not char.isalnum() for char in password):
        errors.append("Password must include a special character.")
    weak_fragments = ["password", "qwerty", "admin", "sprintmind"]
    if any(fragment in password.lower() for fragment in weak_fragments):
        errors.append("Password is too easy to guess.")
    return errors

