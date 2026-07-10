from __future__ import annotations

from app.core.config import settings


def openai_configured() -> bool:
    return bool(settings.openai_api_key)


async def generate_response_with_openai(prompt: str) -> str:
    if not settings.openai_api_key:
        return ""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.responses.create(
        model=settings.openai_model,
        input=prompt,
    )
    return response.output_text

