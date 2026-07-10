from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import JiraIssueCache, JiraProject
from app.services.jira_service import build_oauth_url, get_connection, store_webhook_event

router = APIRouter()


@router.get("/connect")
async def connect_jira() -> dict:
    return envelope({"authorizationUrl": build_oauth_url(), "requiresCredentials": True})


@router.get("/callback")
async def callback(code: str | None = None, state: str | None = None) -> dict:
    return envelope(
        {
            "status": "received",
            "codePresent": bool(code),
            "state": state,
            "message": "OAuth callback endpoint is wired. Configure credentials to exchange code for tokens.",
        }
    )


@router.post("/disconnect")
async def disconnect(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    connection = await get_connection(session, principal.organization_id)
    if connection:
        connection.status = "disconnected"
        connection.encrypted_access_token = None
        connection.encrypted_refresh_token = None
        await session.commit()
    return envelope({"disconnected": True})


@router.post("/sync")
async def sync_jira(principal: Principal = Depends(get_current_principal)) -> dict:
    return envelope(
        {
            "status": "demo_completed",
            "message": "Demo Jira cache is already seeded. Configure OAuth for live Jira synchronization.",
        }
    )


@router.get("/projects")
async def projects(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(await session.scalars(select(JiraProject).where(JiraProject.organization_id == principal.organization_id)))
    return envelope(
        [
            {
                "id": project.id,
                "key": project.key,
                "name": project.name,
                "currentSprint": project.current_sprint_name,
                "isDemo": project.is_demo,
            }
            for project in rows
        ]
    )


@router.get("/issues")
async def issues(
    status: str | None = None,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    query = select(JiraIssueCache).where(JiraIssueCache.organization_id == principal.organization_id)
    if status:
        query = query.where(JiraIssueCache.status == status)
    rows = list(await session.scalars(query.order_by(JiraIssueCache.issue_key)))
    return envelope(
        [
            {
                "id": issue.id,
                "key": issue.issue_key,
                "type": issue.issue_type,
                "summary": issue.summary,
                "status": issue.status,
                "priority": issue.priority,
                "assignee": issue.assignee_name,
                "storyPoints": issue.story_points,
                "dueDate": issue.due_date,
                "labels": issue.labels,
                "riskScore": issue.risk_score,
            }
            for issue in rows
        ]
    )


@router.get("/sprints/current")
async def current_sprint(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    project = await session.scalar(select(JiraProject).where(JiraProject.organization_id == principal.organization_id))
    return envelope(
        {
            "name": project.current_sprint_name if project else "Demo Sprint",
            "state": "active",
            "projectKey": project.key if project else "AIP",
        }
    )


@router.post("/webhooks")
async def webhooks(
    request: Request,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    payload = await request.json()
    dedupe_key = str(payload.get("webhookEvent") or payload.get("timestamp") or request.headers.get("x-atlassian-webhook-identifier") or "")
    event = await store_webhook_event(
        session,
        principal.organization_id,
        payload.get("webhookEvent", "unknown"),
        dedupe_key or "manual-demo-webhook",
        payload,
        principal.user.id,
    )
    return envelope({"id": event.id, "stored": True})

