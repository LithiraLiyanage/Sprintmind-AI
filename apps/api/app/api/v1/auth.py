from __future__ import annotations

from datetime import timedelta

import jwt
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import APIError, envelope
from app.core.security import create_token, decode_token, hash_token, utcnow
from app.models import OrganizationMember, RefreshToken, Session, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import issue_tokens, login_user, register_user

router = APIRouter()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None) -> None:
    cookie_args = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "domain": settings.cookie_domain,
    }
    response.set_cookie(
        "sprintmind_access",
        access_token,
        max_age=settings.jwt_access_token_minutes * 60,
        **cookie_args,
    )
    if refresh_token:
        response.set_cookie(
            "sprintmind_refresh",
            refresh_token,
            max_age=settings.jwt_refresh_token_days * 24 * 60 * 60,
            **cookie_args,
        )


@router.post("/register")
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> dict:
    token_pair, access_token, refresh_token = await register_user(payload, session, request.headers.get("user-agent"))
    set_auth_cookies(response, access_token, refresh_token)
    return envelope(token_pair.model_dump())


@router.post("/login")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> dict:
    token_pair, access_token, refresh_token = await login_user(payload, session, request.headers.get("user-agent"))
    set_auth_cookies(response, access_token, refresh_token)
    return envelope(token_pair.model_dump())


@router.post("/demo")
async def demo_login(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = await session.scalar(select(User).where(User.email == "demo@sprintmind.ai"))
    if not user:
        raise APIError("DEMO_USER_NOT_FOUND", "Demo data has not been seeded yet.", 503)
    membership = await session.scalar(select(OrganizationMember).where(OrganizationMember.user_id == user.id))
    if not membership:
        raise APIError("DEMO_ORG_NOT_FOUND", "Demo organization has not been seeded yet.", 503)
    token_pair, access_token, refresh_token = await issue_tokens(
        user,
        membership.organization_id,
        membership.role,
        session,
        request.headers.get("user-agent"),
    )
    set_auth_cookies(response, access_token, refresh_token)
    response.set_cookie(
        "sprintmind_demo_session",
        access_token,
        max_age=settings.jwt_refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain,
    )
    return envelope(token_pair.model_dump(), {"demo": True})


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> dict:
    token = request.cookies.get("sprintmind_refresh")
    if not token:
        raise APIError("REFRESH_TOKEN_MISSING", "Refresh token is missing.", 401)
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise APIError("INVALID_REFRESH_TOKEN", "Refresh token is invalid.", 401) from exc
    stored = await session.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(token),
            RefreshToken.revoked_at.is_(None),
        )
    )
    if not stored or stored.expires_at < utcnow():
        raise APIError("REFRESH_TOKEN_EXPIRED", "Please sign in again.", 401)
    stored.revoked_at = utcnow()
    user = await session.get(User, payload["sub"])
    membership = await session.scalar(select(OrganizationMember).where(OrganizationMember.user_id == payload["sub"]))
    if not user or not membership:
        raise APIError("INVALID_REFRESH_SESSION", "Session could not be refreshed.", 401)
    db_session = await session.get(Session, payload["sid"])
    if not db_session or db_session.revoked_at:
        raise APIError("SESSION_REVOKED", "This session has been revoked.", 401)
    access_token = create_token(
        subject=user.id,
        token_type="access",
        session_id=db_session.id,
        organization_id=membership.organization_id,
        expires_delta=timedelta(minutes=settings.jwt_access_token_minutes),
    )
    new_refresh = create_token(
        subject=user.id,
        token_type="refresh",
        session_id=db_session.id,
        organization_id=membership.organization_id,
        expires_delta=timedelta(days=settings.jwt_refresh_token_days),
    )
    session.add(
        RefreshToken(
            user_id=user.id,
            session_id=db_session.id,
            token_hash=hash_token(new_refresh),
            expires_at=utcnow() + timedelta(days=settings.jwt_refresh_token_days),
        )
    )
    await session.commit()
    set_auth_cookies(response, access_token, new_refresh)
    return envelope({"refreshed": True})


@router.post("/logout")
async def logout(
    response: Response,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    db_session = await session.get(Session, principal.session_id)
    if db_session:
        db_session.revoked_at = utcnow()
    await session.commit()
    response.delete_cookie("sprintmind_access", domain=settings.cookie_domain)
    response.delete_cookie("sprintmind_refresh", domain=settings.cookie_domain)
    response.delete_cookie("sprintmind_demo_session", domain=settings.cookie_domain)
    return envelope({"logged_out": True})


@router.get("/me")
async def me(principal: Principal = Depends(get_current_principal)) -> dict:
    return envelope(
        {
            "id": principal.user.id,
            "email": principal.user.email,
            "name": principal.user.name,
            "organization_id": principal.organization_id,
            "role": principal.role,
        }
    )

