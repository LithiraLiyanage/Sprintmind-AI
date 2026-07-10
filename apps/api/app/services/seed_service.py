from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import SessionLocal, init_db
from app.core.security import hash_password
from app.models import (
    ApprovalRequest,
    AuditLog,
    Conversation,
    JiraIssueCache,
    JiraProject,
    Memory,
    Message,
    Notification,
    Organization,
    OrganizationMember,
    Report,
    User,
    WorkflowRun,
    WorkflowStep,
)


def now() -> datetime:
    return datetime.now(timezone.utc)


async def seed_demo_data(session: AsyncSession) -> None:
    existing = await session.scalar(select(User).where(User.email == "demo@sprintmind.ai"))
    if existing:
        return

    user = User(
        email="demo@sprintmind.ai",
        name="Lithira Liyanage",
        hashed_password=hash_password("SprintMind!2026"),
    )
    org = Organization(name="NovaStack Labs", slug="novastack-labs", plan="demo")
    session.add_all([user, org])
    await session.flush()

    session.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            role="organization_owner",
        )
    )
    project = JiraProject(
        organization_id=org.id,
        key="AIP",
        name="AI Platform Modernization",
        current_sprint_name="Sprint 12 - Intelligent Workflow Release",
        board_id="demo-board-12",
        is_demo=True,
    )
    session.add(project)
    await session.flush()

    people = [
        ("Lithira Liyanage", "AI and Backend Engineer"),
        ("Senithi Rathnayake", "Project Coordinator"),
        ("Nimal Perera", "Frontend Engineer"),
        ("Ayesha Silva", "QA Engineer"),
        ("Kasun Fernando", "DevOps Engineer"),
    ]
    statuses = ["To Do", "In Progress", "In Review", "Blocked", "Done"]
    priorities = ["High", "Medium", "Low", "Critical"]
    issue_summaries = [
        "Build supervisor agent routing for sprint summary requests",
        "Implement approval pause node for Jira write actions",
        "Design streaming chat activity timeline",
        "Add encrypted Jira OAuth token storage",
        "Create meeting transcript parser for action items",
        "Fix payment-page crash in checkout telemetry",
        "Add pgvector-backed memory retrieval",
        "Create sprint risk scoring job",
        "Improve mobile chat composer layout",
        "Add webhook deduplication for Jira issue updates",
        "Prepare stakeholder sprint review report",
        "Create workflow retry policy for partial failures",
        "Add role-based access checks to workflow endpoints",
        "Implement document upload validation",
        "Build workload chart by assignee",
        "Add command palette actions",
        "Create release notes report template",
        "Add offline state for disconnected WebSocket",
        "Validate Jira issue fields before approval",
        "Improve audit log filtering",
    ]
    blockers = {4, 7, 10, 18}
    overdue = {5, 8, 13}
    for index, summary in enumerate(issue_summaries, start=101):
        person = people[index % len(people)]
        status = "Blocked" if index in blockers else statuses[index % len(statuses)]
        due = now() + timedelta(days=(index % 9) - 3)
        if index in overdue:
            due = now() - timedelta(days=index % 4 + 1)
        session.add(
            JiraIssueCache(
                organization_id=org.id,
                project_id=project.id,
                issue_key=f"AIP-{index}",
                issue_type="Bug" if "Fix" in summary or "Validate" in summary else "Task",
                summary=summary,
                description=(
                    "Demo Jira-like issue used for local SprintMind AI workflows. "
                    f"Owner role: {person[1]}."
                ),
                status=status,
                priority=priorities[index % len(priorities)],
                assignee_name=person[0],
                assignee_account_id=f"demo-{index % len(people)}",
                story_points=(index % 8) + 1,
                due_date=due,
                labels=["ai-workflow", "demo"] + (["blocker"] if status == "Blocked" else []),
                risk_score=0.88 if status == "Blocked" else round((index % 7) / 10, 2),
                raw={"demo": True, "teamRole": person[1]},
            )
        )

    conversation = Conversation(
        organization_id=org.id,
        user_id=user.id,
        project_id=project.id,
        title="Sprint 12 risk review",
        mode="supervisor",
    )
    session.add(conversation)
    await session.flush()
    session.add_all(
        [
            Message(
                conversation_id=conversation.id,
                organization_id=org.id,
                user_id=user.id,
                role="user",
                content="Summarize the current sprint and identify blockers.",
            ),
            Message(
                conversation_id=conversation.id,
                organization_id=org.id,
                role="assistant",
                content=(
                    "Sprint 12 is progressing, but 4 blockers and 3 overdue issues need attention. "
                    "The highest risk is delayed Jira OAuth token refresh validation."
                ),
                meta={"stages": ["Searching Jira issues", "Running risk analysis", "Completed"]},
            ),
        ]
    )

    memories = [
        (
            "Team responsibility",
            "Lithira handles AI and backend-related work.",
            "Lithira is the best first reviewer for AI/backend tasks.",
        ),
        (
            "Sprint rule",
            "All Jira write actions require approval from a project manager or owner.",
            "Approval is mandatory before external Jira changes.",
        ),
        (
            "Definition of Done",
            "A feature is done after tests, audit logs, and user-visible error states are complete.",
            "DoD requires tests, audit logs, and error states.",
        ),
    ]
    for title, content, summary in memories:
        session.add(
            Memory(
                organization_id=org.id,
                user_id=user.id,
                project_id=project.id,
                title=title,
                content=content,
                summary=summary,
                is_pinned=title == "Team responsibility",
            )
        )

    workflow_done = WorkflowRun(
        organization_id=org.id,
        user_id=user.id,
        conversation_id=conversation.id,
        name="Daily stand-up summary",
        status="completed",
        summary="Generated stand-up notes from Jira activity.",
        payload={"demo": True, "issuesReviewed": 12},
    )
    workflow_pending = WorkflowRun(
        organization_id=org.id,
        user_id=user.id,
        conversation_id=conversation.id,
        name="Meeting notes to Jira tasks",
        status="waiting_for_approval",
        summary="Prepared 3 task drafts from meeting notes.",
        payload={"demo": True, "drafts": 3},
    )
    session.add_all([workflow_done, workflow_pending])
    await session.flush()
    session.add_all(
        [
            WorkflowStep(
                workflow_run_id=workflow_pending.id,
                name="Extract action items",
                status="completed",
                order_index=1,
                summary="3 action items detected.",
            ),
            WorkflowStep(
                workflow_run_id=workflow_pending.id,
                name="Wait for approval",
                status="waiting",
                order_index=2,
                summary="Jira task creation is paused until approval.",
            ),
            ApprovalRequest(
                organization_id=org.id,
                user_id=user.id,
                workflow_run_id=workflow_pending.id,
                title="Create 3 Jira task drafts",
                risk_level="medium",
                proposed_actions=[
                    {"tool": "jira.create_issue", "summary": "Document webhook validation plan"},
                    {"tool": "jira.create_issue", "summary": "Assign OAuth refresh test owner"},
                    {"tool": "jira.create_issue", "summary": "Prepare sprint review evidence"},
                ],
            ),
        ]
    )

    report_content = (
        "Sprint 12 - Intelligent Workflow Release\n\n"
        "Data range: demo sprint window. Evidence: AIP issue cache.\n\n"
        "Key risks: 4 blockers, 3 overdue issues, and one pending Jira approval workflow."
    )
    session.add_all(
        [
            Report(
                organization_id=org.id,
                project_id=project.id,
                report_type="sprint_health",
                title="Sprint 12 Health Report",
                content=report_content,
                evidence=[{"issue": "AIP-104"}, {"issue": "AIP-107"}, {"issue": "AIP-110"}],
            ),
            Report(
                organization_id=org.id,
                project_id=project.id,
                report_type="stakeholder",
                title="Stakeholder Update",
                content="AI workflows completed: 2. Pending approvals: 1. Tool-call success rate: 96%.",
                evidence=[{"source": "demo workflow runs"}],
            ),
        ]
    )

    notifications = [
        ("workflow_approval_required", "Approval required", "3 Jira task drafts are waiting."),
        ("new_blocker_detected", "New blocker detected", "AIP-104 is blocked in the active sprint."),
        ("overdue_issue_detected", "Overdue issue", "AIP-105 passed its due date."),
        ("jira_sync_completed", "Demo sync completed", "20 demo Jira-like issues are available."),
        ("document_processing_completed", "Document processed", "Sprint planning notes were indexed."),
        ("workflow_completed", "Workflow completed", "Daily stand-up summary is ready."),
        ("new_sprint_started", "Sprint started", "Sprint 12 is active."),
        ("jira_connection_expired", "Demo Jira disconnected", "Connect Jira for live data."),
    ]
    for notification_type, title, body in notifications:
        session.add(
            Notification(
                organization_id=org.id,
                user_id=user.id,
                notification_type=notification_type,
                title=title,
                body=body,
                deep_link="/ai-chat" if "Approval" in title else "/dashboard",
            )
        )

    session.add(
        AuditLog(
            organization_id=org.id,
            user_id=user.id,
            action="demo.seeded",
            resource_type="organization",
            resource_id=org.id,
            details={"issues": 20, "mode": "demo"},
        )
    )
    await session.commit()


async def main() -> None:
    await init_db()
    async with SessionLocal() as session:
        await seed_demo_data(session)


if __name__ == "__main__":
    asyncio.run(main())

