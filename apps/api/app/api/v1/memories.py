from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import APIError, envelope
from app.models import Memory

router = APIRouter()


class MemoryCreate(BaseModel):
    title: str = Field(min_length=2, max_length=220)
    content: str = Field(min_length=2, max_length=5000)
    memory_type: str = "project"


@router.get("")
async def list_memories(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(
        await session.scalars(
            select(Memory).where(
                Memory.organization_id == principal.organization_id,
                Memory.is_archived.is_(False),
            )
        )
    )
    return envelope(
        [
            {
                "id": item.id,
                "title": item.title,
                "summary": item.summary,
                "content": item.content,
                "type": item.memory_type,
                "pinned": item.is_pinned,
                "confidence": item.confidence_score,
            }
            for item in rows
        ]
    )


@router.post("")
async def create_memory(
    payload: MemoryCreate,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    memory = Memory(
        organization_id=principal.organization_id,
        user_id=principal.user.id,
        memory_type=payload.memory_type,
        title=payload.title,
        content=payload.content,
        summary=payload.content[:220],
    )
    session.add(memory)
    await session.commit()
    return envelope({"id": memory.id, "title": memory.title})


@router.patch("/{memory_id}")
async def update_memory(
    memory_id: str,
    payload: MemoryCreate,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    memory = await _get_memory(session, principal.organization_id, memory_id)
    memory.title = payload.title
    memory.content = payload.content
    memory.summary = payload.content[:220]
    await session.commit()
    return envelope({"id": memory.id, "title": memory.title})


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    memory = await _get_memory(session, principal.organization_id, memory_id)
    memory.is_archived = True
    await session.commit()
    return envelope({"archived": True})


async def _get_memory(session: AsyncSession, organization_id: str, memory_id: str) -> Memory:
    memory = await session.scalar(
        select(Memory).where(Memory.id == memory_id, Memory.organization_id == organization_id)
    )
    if not memory:
        raise APIError("MEMORY_NOT_FOUND", "Memory was not found.", 404)
    return memory

