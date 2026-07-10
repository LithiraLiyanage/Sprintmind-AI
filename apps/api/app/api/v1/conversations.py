from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import APIError, envelope
from app.models import Conversation, Message
from app.schemas.domain import SendMessageRequest
from app.services.agent_service import run_supervisor_agent
from app.services.jira_service import get_default_project

router = APIRouter()


@router.post("")
async def create_conversation(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    project = await get_default_project(session, principal.organization_id)
    conversation = Conversation(
        organization_id=principal.organization_id,
        user_id=principal.user.id,
        project_id=project.id,
        title="New SprintMind conversation",
    )
    session.add(conversation)
    await session.commit()
    return envelope({"id": conversation.id, "title": conversation.title})


@router.get("")
async def list_conversations(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    conversations = list(
        await session.scalars(
            select(Conversation)
            .where(Conversation.organization_id == principal.organization_id, Conversation.is_archived.is_(False))
            .order_by(Conversation.updated_at.desc())
        )
    )
    return envelope(
        [
            {
                "id": item.id,
                "title": item.title,
                "mode": item.mode,
                "memoryEnabled": item.memory_enabled,
                "updatedAt": item.updated_at,
            }
            for item in conversations
        ]
    )


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    conversation = await _get_conversation(session, principal.organization_id, conversation_id)
    messages = list(
        await session.scalars(
            select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)
        )
    )
    return envelope(
        {
            "id": conversation.id,
            "title": conversation.title,
            "mode": conversation.mode,
            "messages": [
                {
                    "id": message.id,
                    "role": message.role,
                    "type": message.message_type,
                    "content": message.content,
                    "metadata": message.meta,
                    "createdAt": message.created_at,
                }
                for message in messages
            ],
        }
    )


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    title: str = Query(min_length=2, max_length=220),
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    conversation = await _get_conversation(session, principal.organization_id, conversation_id)
    conversation.title = title
    await session.commit()
    return envelope({"id": conversation.id, "title": conversation.title})


@router.delete("/{conversation_id}")
async def archive_conversation(
    conversation_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    conversation = await _get_conversation(session, principal.organization_id, conversation_id)
    conversation.is_archived = True
    await session.commit()
    return envelope({"archived": True})


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    conversation = await _get_conversation(session, principal.organization_id, conversation_id)
    user_message = Message(
        conversation_id=conversation.id,
        organization_id=principal.organization_id,
        user_id=principal.user.id,
        role="user",
        content=payload.content,
    )
    session.add(user_message)
    execution = await run_supervisor_agent(
        session=session,
        conversation=conversation,
        user_id=principal.user.id,
        content=payload.content,
    )
    assistant_message = Message(
        conversation_id=conversation.id,
        organization_id=principal.organization_id,
        role="assistant",
        message_type="approval_request" if execution.approval_id else "text",
        content=execution.response,
        meta={
            "intent": execution.intent,
            "stages": execution.stages,
            "agents": execution.selected_agents,
            "toolCalls": execution.tool_calls,
            "workflowId": execution.workflow_id,
            "approvalId": execution.approval_id,
            "demoMode": execution.demo_mode,
        },
    )
    session.add(assistant_message)
    await session.commit()
    return envelope(
        {
            "userMessageId": user_message.id,
            "assistantMessageId": assistant_message.id,
            "response": assistant_message.content,
            "metadata": assistant_message.meta,
        }
    )


@router.get("/{conversation_id}/stream")
async def stream_message(
    conversation_id: str,
    prompt: str = Query(min_length=1, max_length=12000),
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    conversation = await _get_conversation(session, principal.organization_id, conversation_id)
    execution = await run_supervisor_agent(
        session=session,
        conversation=conversation,
        user_id=principal.user.id,
        content=prompt,
    )

    async def events():
        for stage in execution.stages:
            yield f"event: stage\ndata: {json.dumps({'stage': stage})}\n\n"
            await asyncio.sleep(0.08)
        yield f"event: message\ndata: {json.dumps({'content': execution.response, 'metadata': execution.__dict__})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


async def _get_conversation(session: AsyncSession, organization_id: str, conversation_id: str) -> Conversation:
    conversation = await session.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.organization_id == organization_id,
            Conversation.is_archived.is_(False),
        )
    )
    if not conversation:
        raise APIError("CONVERSATION_NOT_FOUND", "Conversation was not found.", 404)
    return conversation

