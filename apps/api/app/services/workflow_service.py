from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.models import ApprovalRequest, AuditLog, ToolCall, WorkflowRun, WorkflowStep


async def approve_workflow(
    session: AsyncSession,
    organization_id: str,
    user_id: str,
    workflow_id: str,
) -> WorkflowRun:
    workflow = await session.scalar(
        select(WorkflowRun).where(
            WorkflowRun.id == workflow_id,
            WorkflowRun.organization_id == organization_id,
        )
    )
    if not workflow:
        raise APIError("WORKFLOW_NOT_FOUND", "Workflow run was not found.", 404)
    approval = await session.scalar(
        select(ApprovalRequest).where(
            ApprovalRequest.workflow_run_id == workflow_id,
            ApprovalRequest.organization_id == organization_id,
            ApprovalRequest.status == "pending",
        )
    )
    if not approval:
        raise APIError("APPROVAL_NOT_FOUND", "No pending approval exists for this workflow.", 404)

    approval.status = "approved"
    approval.decided_at = datetime.now(timezone.utc)
    workflow.status = "completed"
    workflow.summary = workflow.summary + " Approved in demo mode; no real Jira write was executed."

    tool_calls = await session.scalars(select(ToolCall).where(ToolCall.workflow_run_id == workflow_id))
    for tool_call in tool_calls:
        tool_call.approval_state = "approved"
        tool_call.status = "completed_demo"

    session.add(
        WorkflowStep(
            workflow_run_id=workflow_id,
            name="Execute approved actions",
            status="completed",
            order_index=3,
            summary="Demo execution completed. Configure Jira credentials for live writes.",
        )
    )
    session.add(
        AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action="workflow.approved",
            resource_type="workflow_run",
            resource_id=workflow_id,
            details={"demo_mode": True},
        )
    )
    await session.commit()
    return workflow


async def reject_workflow(
    session: AsyncSession,
    organization_id: str,
    user_id: str,
    workflow_id: str,
) -> WorkflowRun:
    workflow = await session.scalar(
        select(WorkflowRun).where(
            WorkflowRun.id == workflow_id,
            WorkflowRun.organization_id == organization_id,
        )
    )
    if not workflow:
        raise APIError("WORKFLOW_NOT_FOUND", "Workflow run was not found.", 404)
    workflow.status = "rejected"
    approvals = await session.scalars(
        select(ApprovalRequest).where(
            ApprovalRequest.workflow_run_id == workflow_id,
            ApprovalRequest.organization_id == organization_id,
        )
    )
    for approval in approvals:
        if approval.status == "pending":
            approval.status = "rejected"
            approval.decided_at = datetime.now(timezone.utc)
    session.add(
        AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action="workflow.rejected",
            resource_type="workflow_run",
            resource_id=workflow_id,
            details={},
        )
    )
    await session.commit()
    return workflow

