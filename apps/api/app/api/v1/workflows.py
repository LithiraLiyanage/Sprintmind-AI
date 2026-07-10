from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import APIError, envelope
from app.models import ApprovalRequest, WorkflowRun, WorkflowStep
from app.services.workflow_service import approve_workflow, reject_workflow

router = APIRouter()


@router.get("")
async def list_workflows(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflows = list(
        await session.scalars(
            select(WorkflowRun)
            .where(WorkflowRun.organization_id == principal.organization_id)
            .order_by(WorkflowRun.created_at.desc())
        )
    )
    return envelope(
        [
            {
                "id": item.id,
                "name": item.name,
                "status": item.status,
                "summary": item.summary,
                "payload": item.payload,
                "createdAt": item.created_at,
            }
            for item in workflows
        ]
    )


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflow = await _get_workflow(session, principal.organization_id, workflow_id)
    steps = list(await session.scalars(select(WorkflowStep).where(WorkflowStep.workflow_run_id == workflow.id)))
    approvals = list(
        await session.scalars(select(ApprovalRequest).where(ApprovalRequest.workflow_run_id == workflow.id))
    )
    return envelope(
        {
            "id": workflow.id,
            "name": workflow.name,
            "status": workflow.status,
            "summary": workflow.summary,
            "payload": workflow.payload,
            "steps": [
                {"id": step.id, "name": step.name, "status": step.status, "summary": step.summary}
                for step in steps
            ],
            "approvals": [
                {
                    "id": approval.id,
                    "title": approval.title,
                    "status": approval.status,
                    "riskLevel": approval.risk_level,
                    "proposedActions": approval.proposed_actions,
                }
                for approval in approvals
            ],
        }
    )


@router.post("/{workflow_id}/approve")
async def approve(
    workflow_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflow = await approve_workflow(session, principal.organization_id, principal.user.id, workflow_id)
    return envelope({"id": workflow.id, "status": workflow.status, "summary": workflow.summary})


@router.post("/{workflow_id}/reject")
async def reject(
    workflow_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflow = await reject_workflow(session, principal.organization_id, principal.user.id, workflow_id)
    return envelope({"id": workflow.id, "status": workflow.status})


@router.post("/{workflow_id}/resume")
async def resume(
    workflow_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflow = await _get_workflow(session, principal.organization_id, workflow_id)
    if workflow.status != "waiting_for_approval":
        raise APIError("WORKFLOW_NOT_PAUSED", "Only paused workflows can be resumed.", 409)
    return envelope({"id": workflow.id, "status": workflow.status, "message": "Approve or reject the pending request to resume."})


@router.post("/{workflow_id}/retry")
async def retry(
    workflow_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    workflow = await _get_workflow(session, principal.organization_id, workflow_id)
    workflow.status = "queued"
    await session.commit()
    return envelope({"id": workflow.id, "status": workflow.status})


async def _get_workflow(session: AsyncSession, organization_id: str, workflow_id: str) -> WorkflowRun:
    workflow = await session.scalar(
        select(WorkflowRun).where(
            WorkflowRun.id == workflow_id,
            WorkflowRun.organization_id == organization_id,
        )
    )
    if not workflow:
        raise APIError("WORKFLOW_NOT_FOUND", "Workflow run was not found.", 404)
    return workflow

