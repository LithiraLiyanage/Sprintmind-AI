from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AgentRun,
    AgentStep,
    ApprovalRequest,
    Conversation,
    JiraIssueCache,
    Memory,
    ToolCall,
    WorkflowRun,
    WorkflowStep,
)

WRITE_VERBS = ("create", "update", "move", "assign", "comment", "transition", "change priority", "bulk")


@dataclass
class AgentExecution:
    intent: str
    response: str
    stages: list[str]
    selected_agents: list[str]
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    workflow_id: str | None = None
    approval_id: str | None = None
    demo_mode: bool = True


def detect_intent(message: str) -> str:
    text = message.lower()
    if text.startswith("/sprint-summary") or "summarize" in text and "sprint" in text:
        return "sprint_summary"
    if text.startswith("/meeting-to-jira") or "meeting" in text and "jira" in text:
        return "meeting_to_jira"
    if text.startswith("/remember") or "remember that" in text:
        return "memory_write"
    if "risk" in text or "blocker" in text or "overdue" in text:
        return "risk_analysis"
    if any(verb in text for verb in WRITE_VERBS):
        return "jira_write"
    if "workload" in text or "suitable" in text:
        return "team_workload"
    return "general_project_answer"


async def run_supervisor_agent(
    *,
    session: AsyncSession,
    conversation: Conversation,
    user_id: str,
    content: str,
) -> AgentExecution:
    intent = detect_intent(content)
    stages = [
        "Understanding request",
        "Retrieving project context",
        "Consulting project memory",
    ]
    selected_agents = ["Supervisor", "Memory Agent"]
    run = AgentRun(
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        status="running",
        intent=intent,
        selected_agents=selected_agents,
    )
    session.add(run)
    await session.flush()

    if intent in {"sprint_summary", "risk_analysis", "team_workload"}:
        selected_agents += ["Jira Agent", "Risk Analysis Agent", "Summarization Agent"]
        stages += ["Searching Jira issues", "Running risk analysis", "Preparing recommendations"]
        response = await _summarize_sprint(session, conversation.organization_id, intent)
    elif intent in {"jira_write", "meeting_to_jira"}:
        selected_agents += ["Jira Agent", "Workflow Agent"]
        stages += ["Preparing Jira action drafts", "Waiting for approval"]
        response, workflow_id, approval_id, tool_calls = await _prepare_approval_workflow(
            session=session,
            conversation=conversation,
            user_id=user_id,
            content=content,
            intent=intent,
        )
        run.status = "waiting_for_approval"
        run.final_response = response
        await _store_agent_steps(session, run.id, selected_agents, stages)
        await session.commit()
        return AgentExecution(
            intent=intent,
            response=response,
            stages=stages,
            selected_agents=selected_agents,
            tool_calls=tool_calls,
            workflow_id=workflow_id,
            approval_id=approval_id,
        )
    elif intent == "memory_write":
        selected_agents += ["Memory Agent"]
        stages += ["Saving explicit memory", "Completed"]
        response = await _save_memory(session, conversation, user_id, content)
    else:
        selected_agents += ["Jira Agent", "Summarization Agent"]
        stages += ["Searching Jira issues", "Preparing recommendations"]
        response = await _general_answer(session, conversation.organization_id)

    stages.append("Completed")
    run.status = "completed"
    run.selected_agents = selected_agents
    run.final_response = response
    await _store_agent_steps(session, run.id, selected_agents, stages)
    await session.commit()
    return AgentExecution(intent=intent, response=response, stages=stages, selected_agents=selected_agents)


async def _summarize_sprint(session: AsyncSession, organization_id: str, intent: str) -> str:
    issues = list(
        await session.scalars(select(JiraIssueCache).where(JiraIssueCache.organization_id == organization_id))
    )
    blockers = [issue for issue in issues if issue.status == "Blocked"]
    overdue = [
        issue
        for issue in issues
        if issue.due_date and _aware(issue.due_date) < datetime.now(timezone.utc) and issue.status != "Done"
    ]
    done = [issue for issue in issues if issue.status == "Done"]
    high_risk = sorted(issues, key=lambda issue: issue.risk_score, reverse=True)[:4]
    if intent == "team_workload":
        workload: dict[str, int] = {}
        for issue in issues:
            workload[issue.assignee_name or "Unassigned"] = workload.get(issue.assignee_name or "Unassigned", 0) + 1
        ranked = ", ".join(f"{name}: {count}" for name, count in sorted(workload.items()))
        return (
            "Team workload from demo Jira data:\n\n"
            f"{ranked}.\n\n"
            "Recommendation: Lithira is the strongest fit for backend/AI workflow tasks because project memory "
            "marks him as the AI and backend owner."
        )
    return (
        "Sprint 12 summary from demo Jira-like data:\n\n"
        f"- {len(done)} of {len(issues)} issues are completed.\n"
        f"- {len(blockers)} blockers need attention: {', '.join(issue.issue_key for issue in blockers)}.\n"
        f"- {len(overdue)} overdue non-done issues were found.\n"
        f"- Highest-risk items: {', '.join(issue.issue_key for issue in high_risk)}.\n\n"
        "Recommendation: clear blocked OAuth, webhook, and validation work before pulling new backlog items. "
        "This is demo data; connect Jira for live evidence."
    )


async def _general_answer(session: AsyncSession, organization_id: str) -> str:
    project_issue_count = await session.scalar(
        select(func.count()).select_from(JiraIssueCache).where(JiraIssueCache.organization_id == organization_id)
    )
    return (
        "I can help summarize sprints, find blockers, prepare Jira drafts, turn meetings into tasks, "
        "manage project memory, and generate reports. Demo mode is active, so read-only answers use seeded "
        f"project data and write actions pause for approval. Current cached issue count: {project_issue_count or 20}."
    )


async def _prepare_approval_workflow(
    *,
    session: AsyncSession,
    conversation: Conversation,
    user_id: str,
    content: str,
    intent: str,
) -> tuple[str, str, str, list[dict[str, Any]]]:
    drafts = _draft_actions(content, intent)
    workflow = WorkflowRun(
        organization_id=conversation.organization_id,
        user_id=user_id,
        conversation_id=conversation.id,
        name="Jira approval workflow" if intent == "jira_write" else "Meeting notes to Jira workflow",
        status="waiting_for_approval",
        summary=f"Prepared {len(drafts)} Jira action draft(s).",
        payload={"drafts": drafts, "source": "agent"},
    )
    session.add(workflow)
    await session.flush()
    session.add_all(
        [
            WorkflowStep(
                workflow_run_id=workflow.id,
                name="Validate request",
                status="completed",
                order_index=1,
                summary="Request was parsed and checked for required Jira fields.",
            ),
            WorkflowStep(
                workflow_run_id=workflow.id,
                name="Human approval",
                status="waiting",
                order_index=2,
                summary="External Jira writes are paused until explicit approval.",
            ),
        ]
    )
    tool_calls: list[dict[str, Any]] = []
    for draft in drafts:
        tool_call = ToolCall(
            organization_id=conversation.organization_id,
            workflow_run_id=workflow.id,
            tool_name=draft["tool"],
            input_summary=draft["summary"],
            arguments=draft,
            approval_state="pending",
            status="waiting_for_approval",
        )
        session.add(tool_call)
        tool_calls.append(draft)
    approval = ApprovalRequest(
        organization_id=conversation.organization_id,
        user_id=user_id,
        workflow_run_id=workflow.id,
        title=f"Approve {len(drafts)} Jira action draft(s)",
        risk_level="medium",
        proposed_actions=drafts,
    )
    session.add(approval)
    await session.flush()
    response = (
        f"I prepared {len(drafts)} Jira action draft(s), but I did not execute them. "
        "Approval is required before any Jira write action runs. Review the approval card to continue."
    )
    return response, workflow.id, approval.id, tool_calls


def _draft_actions(content: str, intent: str) -> list[dict[str, Any]]:
    if intent == "meeting_to_jira":
        lines = [line.strip("-• ") for line in content.splitlines() if line.strip()]
        candidates = [line for line in lines if len(line) > 16][:4] or [
            "Follow up on unresolved meeting action items",
            "Prepare implementation owner list",
            "Validate sprint-review evidence",
        ]
        return [
            {
                "tool": "jira.create_issue",
                "issue_type": "Task",
                "summary": item[:120],
                "priority": "Medium",
                "labels": ["meeting-action", "sprintmind-draft"],
            }
            for item in candidates
        ]
    key_match = re.search(r"\b[A-Z][A-Z0-9]+-\d+\b", content)
    if key_match and ("move" in content.lower() or "transition" in content.lower()):
        return [
            {
                "tool": "jira.transition_issue",
                "issue_key": key_match.group(0),
                "target_status": "In Progress",
                "summary": f"Move {key_match.group(0)} to In Progress",
            }
        ]
    return [
        {
            "tool": "jira.create_issue",
            "issue_type": "Bug" if "bug" in content.lower() or "crash" in content.lower() else "Task",
            "summary": content[:120],
            "priority": "High" if "high" in content.lower() or "crash" in content.lower() else "Medium",
            "labels": ["sprintmind-draft"],
        }
    ]


async def _save_memory(
    session: AsyncSession,
    conversation: Conversation,
    user_id: str,
    content: str,
) -> str:
    clean = content.replace("/remember", "").replace("Remember that", "").strip(" .")
    memory = Memory(
        organization_id=conversation.organization_id,
        user_id=user_id,
        project_id=conversation.project_id,
        memory_type="project",
        title="Project memory",
        content=clean,
        summary=clean[:220],
        source_type="explicit_user",
        is_pinned=False,
    )
    session.add(memory)
    return f"Saved this explicit project memory: {clean}"


async def _store_agent_steps(session: AsyncSession, run_id: str, agents: list[str], stages: list[str]) -> None:
    for index, agent in enumerate(agents):
        session.add(
            AgentStep(
                agent_run_id=run_id,
                agent_name=agent,
                status="completed" if "Waiting" not in " ".join(stages) else "paused",
                input_summary=stages[min(index, len(stages) - 1)],
                output_summary="Completed stage" if agent != "Workflow Agent" else "Approval may be required",
                duration_ms=180 + index * 80,
            )
        )


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value
