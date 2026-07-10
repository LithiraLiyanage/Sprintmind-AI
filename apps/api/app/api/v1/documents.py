from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import Principal, get_current_principal
from app.core.errors import envelope
from app.models import Document
from app.services.document_service import create_document_from_upload

router = APIRouter()


@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    document = await create_document_from_upload(
        session=session,
        organization_id=principal.organization_id,
        user_id=principal.user.id,
        upload=file,
    )
    return envelope({"id": document.id, "filename": document.filename, "status": document.status})


@router.get("")
async def list_documents(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    rows = list(await session.scalars(select(Document).where(Document.organization_id == principal.organization_id)))
    return envelope(
        [
            {
                "id": doc.id,
                "filename": doc.filename,
                "contentType": doc.content_type,
                "sizeBytes": doc.size_bytes,
                "status": doc.status,
            }
            for doc in rows
        ]
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    document = await session.get(Document, document_id)
    if document and document.organization_id == principal.organization_id:
        await session.delete(document)
        await session.commit()
    return envelope({"deleted": True})

