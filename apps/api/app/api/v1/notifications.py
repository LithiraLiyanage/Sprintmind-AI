from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import Notification

router = APIRouter()


@router.get("")
async def list_notifications(
    unread_only: bool = False,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    query = select(Notification).where(Notification.organization_id == principal.organization_id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    rows = list(await session.scalars(query.order_by(Notification.created_at.desc())))
    return envelope(
        [
            {
                "id": item.id,
                "type": item.notification_type,
                "title": item.title,
                "body": item.body,
                "deepLink": item.deep_link,
                "read": item.is_read,
            }
            for item in rows
        ]
    )


@router.post("/mark-all-read")
async def mark_all_read(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(
        await session.scalars(
            select(Notification).where(
                Notification.organization_id == principal.organization_id,
                Notification.is_read.is_(False),
            )
        )
    )
    for row in rows:
        row.is_read = True
    await session.commit()
    return envelope({"updated": len(rows)})

