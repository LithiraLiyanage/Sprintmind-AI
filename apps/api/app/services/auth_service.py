from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import APIError
from app.core.security import (
    create_token,
    hash_password,
    hash_token,
    password_strength_errors,
    utcnow,
    verify_password,
)
from app.models import Organization, OrganizationMember, RefreshToken, Session, User
from app.schemas.auth import AuthUser, LoginRequest, RegisterRequest, TokenPair


async def register_user(payload: RegisterRequest, session: AsyncSession, user_agent: str | None) -> tuple[TokenPair, str, str]:
    errors = password_strength_errors(payload.password)
    if errors:
        raise APIError("WEAK_PASSWORD", "Password does not meet security requirements.", 422, {"errors": errors})

    existing = await session.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise APIError("EMAIL_ALREADY_REGISTERED", "An account already exists for this email.", 409)

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
    )
    org_slug = payload.organization_name.lower().replace(" ", "-")
    org = Organization(name=payload.organization_name, slug=f"{org_slug}-{payload.email.split('@')[0]}")
    session.add_all([user, org])
    await session.flush()
    session.add(OrganizationMember(user_id=user.id, organization_id=org.id, role="organization_owner"))
    await session.flush()
    return await issue_tokens(user, org.id, "organization_owner", session, user_agent)


async def login_user(payload: LoginRequest, session: AsyncSession, user_agent: str | None) -> tuple[TokenPair, str, str]:
    user = await session.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise APIError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401)
    membership = await session.scalar(select(OrganizationMember).where(OrganizationMember.user_id == user.id))
    if not membership:
        raise APIError("NO_ORGANIZATION", "This user is not connected to an organization.", 403)
    return await issue_tokens(user, membership.organization_id, membership.role, session, user_agent)


async def issue_tokens(
    user: User,
    organization_id: str,
    role: str,
    session: AsyncSession,
    user_agent: str | None,
) -> tuple[TokenPair, str, str]:
    db_session = Session(user_id=user.id, organization_id=organization_id, user_agent=user_agent)
    session.add(db_session)
    await session.flush()
    access_token = create_token(
        subject=user.id,
        token_type="access",
        session_id=db_session.id,
        organization_id=organization_id,
        expires_delta=timedelta(minutes=settings.jwt_access_token_minutes),
    )
    refresh_token = create_token(
        subject=user.id,
        token_type="refresh",
        session_id=db_session.id,
        organization_id=organization_id,
        expires_delta=timedelta(days=settings.jwt_refresh_token_days),
    )
    session.add(
        RefreshToken(
            user_id=user.id,
            session_id=db_session.id,
            token_hash=hash_token(refresh_token),
            expires_at=utcnow() + timedelta(days=settings.jwt_refresh_token_days),
        )
    )
    await session.commit()
    token_pair = TokenPair(
        access_token_expires_in=settings.jwt_access_token_minutes * 60,
        refresh_token_expires_in=settings.jwt_refresh_token_days * 24 * 60 * 60,
        user=AuthUser(
            id=user.id,
            email=user.email,
            name=user.name,
            organization_id=organization_id,
            role=role,
        ),
    )
    return token_pair, access_token, refresh_token

