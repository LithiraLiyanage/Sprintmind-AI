from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ApiEnvelope(BaseModel):
    data: Any
    meta: dict[str, Any] = {}


class Timestamped(BaseModel):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

