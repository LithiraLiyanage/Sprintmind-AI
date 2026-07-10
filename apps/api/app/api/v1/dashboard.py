from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import ApprovalRequest, Conversation, JiraIssueCache, Notification, WorkflowRun
from app.services.jira_service import dashboard_metrics, get_default_project

router = APIRouter()


@router.get("")
async def get_dashboard(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    project = await get_default_project(session, principal.organization_id)
    metrics = await dashboard_metrics(session, principal.organization_id)
    blockers = list(
        await session.scalars(
            select(JiraIssueCache)
            .where(JiraIssueCache.organization_id == principal.organization_id, JiraIssueCache.status == "Blocked")
            .limit(5)
        )
    )
    workflows = list(
        await session.scalars(
            select(WorkflowRun)
            .where(WorkflowRun.organization_id == principal.organization_id)
            .order_by(WorkflowRun.created_at.desc())
            .limit(5)
        )
    )
    approvals = list(
        await session.scalars(
            select(ApprovalRequest).where(
                ApprovalRequest.organization_id == principal.organization_id,
                ApprovalRequest.status == "pending",
            )
        )
    )
    notifications = list(
        await session.scalars(
            select(Notification)
            .where(Notification.organization_id == principal.organization_id)
            .order_by(Notification.created_at.desc())
            .limit(6)
        )
    )
    conversations = list(
        await session.scalars(
            select(Conversation)
            .where(Conversation.organization_id == principal.organization_id)
            .order_by(Conversation.updated_at.desc())
            .limit(5)
        )
    )
    return envelope(
        {
            "organization": "NovaStack Labs",
            "project": {"id": project.id, "key": project.key, "name": project.name, "sprint": project.current_sprint_name},
            "lastSync": project.updated_at,
            "jiraConnection": "demo_disconnected",
            "metrics": metrics,
            "criticalBlockers": [
                {"key": issue.issue_key, "summary": issue.summary, "assignee": issue.assignee_name, "risk": issue.risk_score}
                for issue in blockers
            ],
            "activeWorkflows": [
                {"id": workflow.id, "name": workflow.name, "status": workflow.status, "summary": workflow.summary}
                for workflow in workflows
            ],
            "pendingApprovals": [
                {"id": approval.id, "workflowId": approval.workflow_run_id, "title": approval.title}
                for approval in approvals
            ],
            "recentNotifications": [
                {"id": item.id, "title": item.title, "body": item.body, "type": item.notification_type}
                for item in notifications
            ],
            "recentConversations": [
                {"id": item.id, "title": item.title, "mode": item.mode, "updatedAt": item.updated_at}
                for item in conversations
            ],
            "insight": "The sprint is viable if blockers are cleared before additional Jira write-heavy work starts.",
        }
    )

