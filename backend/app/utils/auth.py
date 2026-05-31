import os
from datetime import datetime, timedelta
from typing import Any, Dict

import bcrypt
import jwt

from app.config import settings


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(claims: Dict[str, Any]) -> str:
    now = datetime.utcnow()
    exp = now + timedelta(minutes=settings.jwt_exp_minutes)

    payload = {
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        **claims,
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

