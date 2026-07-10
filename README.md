# SprintMind AI

**Plan. Track. Summarize. Automate.**

SprintMind AI is a premium AI project-management chatbot and workflow platform for Jira-connected teams. The codebase is a production-oriented monorepo with a Next.js frontend, FastAPI backend, async SQLAlchemy persistence, demo data, approval-first workflow execution, and Jira/OpenAI integration points.

## What is included

- Next.js App Router frontend with a dark-first SaaS interface, responsive application shell, command palette, dashboard, chat workspace, sprint board, reports, settings, and generic complete states for all required product pages.
- FastAPI backend with authentication, HttpOnly cookie tokens, organization-aware access control, demo seed data, conversations, streaming events, approvals, memories, documents, notifications, reports, audit logs, and Jira integration architecture.
- PostgreSQL/pgvector, Redis, Celery, Alembic, Docker Compose, GitHub Actions, frontend and backend tests, lint/type-check scripts, and a complete `.env.example`.
- A clearly labelled demo mode that works without Jira credentials and never pretends to be a real Jira connection.

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop for PostgreSQL, Redis, workers, and full-stack local development
- OpenAI API key for real AI responses
- Atlassian OAuth app credentials for real Jira Cloud integration

## Local setup

```bash
cp .env.example .env
npm run install:all
docker compose up postgres redis
python -m uvicorn app.main:app --reload --app-dir apps/api
npm run dev --workspace @sprintmind/web
```

Open:

- Web: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

On Windows PowerShell, if `npm` is blocked by execution policy, use `cmd /c npm run install:all` and `cmd /c npm run dev --workspace @sprintmind/web`.

## Database and migrations

The Docker Compose database uses PostgreSQL 16 with pgvector enabled.

```bash
docker compose up postgres redis
cd apps/api
alembic upgrade head
```

For quick local demos the backend can use SQLite by setting:

```env
DATABASE_URL=sqlite+aiosqlite:///./sprintmind.db
```

## OpenAI setup

Set:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

When no key is configured, SprintMind AI uses deterministic demo agent responses and marks them as demo-mode output.

## Atlassian OAuth setup

Create an Atlassian developer OAuth 2.0 app and set:

```env
ATLASSIAN_CLIENT_ID=...
ATLASSIAN_CLIENT_SECRET=...
ATLASSIAN_REDIRECT_URI=http://localhost:8000/api/v1/jira/callback
ATLASSIAN_SCOPES=read:jira-work write:jira-work read:jira-user offline_access
```

The backend stores Jira tokens encrypted and never exposes them to the browser. Jira write operations always produce approval requests before execution.

## Jira webhooks

Configure Jira webhooks to call:

```text
POST /api/v1/jira/webhooks
```

Webhook events are deduplicated by idempotency key, stored, audited, and queued for cache refresh. Scheduled reconciliation is provided through Celery Beat.

## Common commands

```bash
make setup
make api
make web
make migrate
make test
make lint
make build
make docker-up
```

## Architecture

```text
apps/web      Next.js, Tailwind, shadcn-style UI, React Query, Zustand
apps/api      FastAPI, async SQLAlchemy, Alembic, Celery, Jira/OpenAI services
packages      shared TypeScript types and design tokens
infrastructure Docker/Postgres support
docs          architecture and security notes
```

## Security notes

- Access and refresh tokens are set as HttpOnly cookies.
- Refresh-token rotation and revocation tables are included.
- Passwords are hashed with Argon2.
- Jira tokens are encrypted before storage.
- Organization IDs are enforced on user-owned resources.
- AI tool calls are validated server-side and cannot bypass permissions.
- Sensitive external write actions require explicit approval.
- Uploaded documents and Jira content are treated as untrusted data.

## Troubleshooting

- If the frontend cannot reach the backend, confirm `NEXT_PUBLIC_API_URL` points to `http://localhost:8000`.
- If OAuth fails, confirm the Atlassian redirect URI exactly matches `.env`.
- If migrations fail with pgvector, run Docker Compose so the `pgvector/pgvector:pg16` image is used.
- If PowerShell blocks npm, run commands through `cmd /c npm ...`.

