from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import Report

router = APIRouter()


@router.get("")
async def list_reports(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(
        await session.scalars(
            select(Report).where(Report.organization_id == principal.organization_id).order_by(Report.created_at.desc())
        )
    )
    return envelope(
        [
            {
                "id": report.id,
                "type": report.report_type,
                "title": report.title,
                "content": report.content,
                "evidence": report.evidence,
                "createdAt": report.created_at,
            }
            for report in rows
        ]
    )

