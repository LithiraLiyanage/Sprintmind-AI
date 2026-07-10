from __future__ import annotations

from fastapi import APIRouter

from app.core.errors import envelope

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return envelope({"status": "ok", "service": "SprintMind AI API"})


@router.get("/ready")
async def ready() -> dict:
    return envelope({"status": "ready"})

