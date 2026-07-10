from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import AuditLog

router = APIRouter()


@router.get("")
async def list_audit_logs(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(
        await session.scalars(
            select(AuditLog)
            .where(AuditLog.organization_id == principal.organization_id)
            .order_by(AuditLog.created_at.desc())
            .limit(100)
        )
    )
    return envelope(
        [
            {
                "id": item.id,
                "action": item.action,
                "resourceType": item.resource_type,
                "resourceId": item.resource_id,
                "details": item.details,
                "createdAt": item.created_at,
            }
            for item in rows
        ]
    )

