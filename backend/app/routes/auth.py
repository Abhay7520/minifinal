from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.utils.auth import (
    create_access_token,
    verify_password,
    hash_password,
)
from app.utils.mongo import db_service

router = APIRouter(tags=["Auth"])


class SignupRequest(BaseModel):
    role: str = Field(..., description="user|staff|admin")
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    role: str = Field(..., description="user|staff|admin")
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    role: str
    email: EmailStr
    name: str


@router.post("/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest):
    role = (payload.role or "user").strip().lower()
    if role not in {"user", "staff", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = db_service.get_collection("users")

    existing = db.find_one({"email": payload.email, "role": role})
    if existing:
        raise HTTPException(status_code=409, detail="Account already exists")

    password_hash = hash_password(payload.password)
    doc = {
        "role": role,
        "name": payload.name.strip(),
        "email": payload.email,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
        "status": "active",
    }

    db.insert_one(doc)

    token = create_access_token({"sub": payload.email, "role": role, "name": payload.name.strip()})
    return AuthResponse(token=token, role=role, email=payload.email, name=payload.name.strip())


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    role = (payload.role or "user").strip().lower()
    if role not in {"user", "staff", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = db_service.get_collection("users")
    user = db.find_one({"email": payload.email, "role": role})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account is suspended. Please contact administrator.")

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": payload.email, "role": role, "name": user.get("name", "")})
    return AuthResponse(
        token=token,
        role=role,
        email=payload.email,
        name=user.get("name", ""),
    )

