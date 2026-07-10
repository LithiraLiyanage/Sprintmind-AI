from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_env: str = "local"
    app_name: str = "SprintMind AI"
    web_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"

    database_url: str = "sqlite+aiosqlite:///./sprintmind.db"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "dev-only-change-me"
    jwt_access_token_minutes: int = 20
    jwt_refresh_token_days: int = 14
    encryption_key: str = "dev-only-encryption-key"

    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    openai_embedding_model: str = "text-embedding-3-large"

    atlassian_client_id: str | None = None
    atlassian_client_secret: str | None = None
    atlassian_redirect_uri: str = "http://localhost:8000/api/v1/jira/callback"
    atlassian_scopes: str = "read:jira-work write:jira-work read:jira-user offline_access"

    cookie_secure: bool = False
    cookie_domain: str | None = None
    cors_origins: str = "http://localhost:3000"

    max_upload_size_mb: int = 15
    allowed_upload_types: str = (
        "application/pdf,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "text/plain,text/markdown,text/csv"
    )

    sentry_dsn: str | None = None
    log_level: str = Field(default="INFO")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_upload_type_set(self) -> set[str]:
        return {item.strip() for item in self.allowed_upload_types.split(",") if item.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

