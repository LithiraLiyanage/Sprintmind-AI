from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Cookie, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.errors import APIError
from app.core.security import decode_token
from app.models import OrganizationMember, User


@dataclass(frozen=True)
class Principal:
    user: User
    organization_id: str
    session_id: str
    role: str


async def get_current_principal(
    request: Request,
    sprintmind_access: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_session),
) -> Principal:
    token = sprintmind_access
    if not token:
        demo_cookie = request.cookies.get("sprintmind_demo_session")
        if demo_cookie:
            token = demo_cookie
    if not token:
        raise APIError("NOT_AUTHENTICATED", "Please sign in to continue.", status_code=401)
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise APIError("INVALID_TOKEN", "Your session is invalid or expired.", status_code=401) from exc

    user = await session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise APIError("USER_NOT_FOUND", "The signed-in user could not be found.", status_code=401)

    membership = await session.scalar(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == payload["org"],
        )
    )
    if not membership:
        raise APIError("ORG_ACCESS_DENIED", "You do not have access to this organization.", 403)

    return Principal(
        user=user,
        organization_id=payload["org"],
        session_id=payload["sid"],
        role=membership.role,
    )


def require_roles(*roles: str):
    async def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if principal.role not in roles:
            raise APIError("ROLE_DENIED", "You do not have permission for this action.", 403)
        return principal

    return dependency

