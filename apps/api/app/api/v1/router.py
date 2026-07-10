from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    audit,
    auth,
    conversations,
    dashboard,
    documents,
    health,
    jira,
    memories,
    notifications,
    reports,
    workflows,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(jira.router, prefix="/jira", tags=["jira"])
api_router.include_router(memories.router, prefix="/memories", tags=["memories"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])

