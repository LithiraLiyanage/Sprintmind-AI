from __future__ import annotations

import secrets
from datetime import datetime, timezone
from urllib.parse import urlencode

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import APIError
from app.models import AuditLog, JiraConnection, JiraIssueCache, JiraProject, JiraWebhookEvent


async def get_default_project(session: AsyncSession, organization_id: str) -> JiraProject:
    project = await session.scalar(
        select(JiraProject).where(JiraProject.organization_id == organization_id).order_by(JiraProject.created_at)
    )
    if not project:
        raise APIError("PROJECT_NOT_FOUND", "No Jira project is available for this organization.", 404)
    return project


async def list_issues(session: AsyncSession, organization_id: str, status: str | None = None) -> list[JiraIssueCache]:
    query = select(JiraIssueCache).where(JiraIssueCache.organization_id == organization_id)
    if status:
        query = query.where(JiraIssueCache.status == status)
    result = await session.scalars(query.order_by(JiraIssueCache.issue_key))
    return list(result)


async def dashboard_metrics(session: AsyncSession, organization_id: str) -> dict:
    issues = await list_issues(session, organization_id)
    total = len(issues) or 1
    blocked = [issue for issue in issues if issue.status.lower() == "blocked"]
    done = [issue for issue in issues if issue.status.lower() == "done"]
    overdue = [
        issue
        for issue in issues
        if issue.due_date and _aware(issue.due_date) < datetime.now(timezone.utc) and issue.status.lower() != "done"
    ]
    by_status: dict[str, int] = {}
    by_assignee: dict[str, int] = {}
    for issue in issues:
        by_status[issue.status] = by_status.get(issue.status, 0) + 1
        assignee = issue.assignee_name or "Unassigned"
        by_assignee[assignee] = by_assignee.get(assignee, 0) + 1

    return {
        "sprintProgress": round(len(done) / total * 100),
        "completedIssues": len(done),
        "inProgressIssues": by_status.get("In Progress", 0),
        "blockedIssues": len(blocked),
        "overdueIssues": len(overdue),
        "openRisks": len([issue for issue in issues if issue.risk_score >= 0.7]),
        "teamUtilization": 82,
        "aiWorkflowsCompleted": 2,
        "statusDistribution": [{"name": key, "value": value} for key, value in by_status.items()],
        "workload": [{"name": key, "issues": value} for key, value in by_assignee.items()],
        "burndown": [
            {"day": "Mon", "remaining": 24, "ideal": 24},
            {"day": "Tue", "remaining": 21, "ideal": 20},
            {"day": "Wed", "remaining": 18, "ideal": 16},
            {"day": "Thu", "remaining": 15, "ideal": 12},
            {"day": "Fri", "remaining": 11, "ideal": 8},
        ],
    }


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def build_oauth_url(state: str | None = None) -> str:
    if not settings.atlassian_client_id:
        raise APIError(
            "JIRA_OAUTH_NOT_CONFIGURED",
            "Atlassian OAuth credentials are not configured. Demo mode is still available.",
            400,
        )
    params = {
        "audience": "api.atlassian.com",
        "client_id": settings.atlassian_client_id,
        "scope": settings.atlassian_scopes,
        "redirect_uri": settings.atlassian_redirect_uri,
        "state": state or secrets.token_urlsafe(24),
        "response_type": "code",
        "prompt": "consent",
    }
    return "https://auth.atlassian.com/authorize?" + urlencode(params)


async def get_connection(session: AsyncSession, organization_id: str) -> JiraConnection | None:
    return await session.scalar(
        select(JiraConnection).where(JiraConnection.organization_id == organization_id).order_by(JiraConnection.created_at)
    )


async def store_webhook_event(
    session: AsyncSession,
    organization_id: str,
    event_type: str,
    dedupe_key: str,
    payload: dict,
    user_id: str | None = None,
) -> JiraWebhookEvent:
    existing = await session.scalar(
        select(JiraWebhookEvent).where(
            JiraWebhookEvent.organization_id == organization_id,
            JiraWebhookEvent.dedupe_key == dedupe_key,
        )
    )
    if existing:
        return existing
    event = JiraWebhookEvent(
        organization_id=organization_id,
        event_type=event_type,
        dedupe_key=dedupe_key,
        payload=payload,
    )
    session.add(event)
    session.add(
        AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action="jira.webhook.received",
            resource_type="jira_webhook_event",
            resource_id=event.id,
            details={"event_type": event_type},
        )
    )
    await session.commit()
    return event
