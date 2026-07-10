from __future__ import annotations

import uuid
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel


class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any]
    request_id: str


def envelope(data: Any = None, meta: dict | None = None) -> dict[str, Any]:
    return {"data": data, "meta": meta or {}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError) -> ORJSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        return ORJSONResponse(
            status_code=exc.status_code,
            content={
                "error": ErrorBody(
                    code=exc.code,
                    message=exc.message,
                    details=exc.details,
                    request_id=request_id,
                ).model_dump()
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> ORJSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        return ORJSONResponse(
            status_code=500,
            content={
                "error": ErrorBody(
                    code="INTERNAL_SERVER_ERROR",
                    message="Something went wrong. Please retry or contact support with the error ID.",
                    details={"type": exc.__class__.__name__},
                    request_id=request_id,
                ).model_dump()
            },
        )

