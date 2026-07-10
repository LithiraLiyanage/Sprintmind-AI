from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class JiraIssueOut(BaseModel):
    id: str
    issue_key: str
    issue_type: str
    summary: str
    status: str
    priority: str
    assignee_name: str | None
    story_points: int | None
    due_date: datetime | None
    labels: list[str]
    risk_score: float


class ConversationOut(BaseModel):
    id: str
    title: str
    mode: str
    memory_enabled: bool
    updated_at: datetime


class MessageOut(BaseModel):
    id: str
    role: str
    message_type: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=12000)
    mode: str = "supervisor"
    project_id: str | None = None
    attachments: list[str] = Field(default_factory=list)


class WorkflowOut(BaseModel):
    id: str
    name: str
    status: str
    summary: str
    payload: dict[str, Any]
    created_at: datetime


class ApprovalOut(BaseModel):
    id: str
    workflow_run_id: str
    title: str
    risk_level: str
    status: str
    proposed_actions: list[dict[str, Any]]
    created_at: datetime

