from __future__ import annotations

import re

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import APIError
from app.models import Document, DocumentChunk


def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", filename).strip(".-")
    return cleaned or "upload.txt"


async def create_document_from_upload(
    *,
    session: AsyncSession,
    organization_id: str,
    user_id: str,
    upload: UploadFile,
    project_id: str | None = None,
) -> Document:
    if upload.content_type not in settings.allowed_upload_type_set:
        raise APIError("UNSUPPORTED_FILE_TYPE", "This file type is not supported.", 422)
    content = await upload.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if not content:
        raise APIError("EMPTY_FILE", "The uploaded file is empty.", 422)
    if len(content) > max_bytes:
        raise APIError("FILE_TOO_LARGE", "The uploaded file exceeds the configured size limit.", 413)

    document = Document(
        organization_id=organization_id,
        user_id=user_id,
        project_id=project_id,
        filename=sanitize_filename(upload.filename or "upload.txt"),
        content_type=upload.content_type or "application/octet-stream",
        size_bytes=len(content),
        status="processed",
    )
    session.add(document)
    await session.flush()
    text = content.decode("utf-8", errors="ignore")
    chunks = [text[index : index + 1200] for index in range(0, min(len(text), 6000), 1200)] or ["Binary document indexed by metadata only."]
    for index, chunk in enumerate(chunks):
        session.add(
            DocumentChunk(
                organization_id=organization_id,
                document_id=document.id,
                chunk_index=index,
                content=chunk,
                chunk_metadata={"source": document.filename},
            )
        )
    await session.commit()
    return document

