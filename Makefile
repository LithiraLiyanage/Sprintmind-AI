.PHONY: setup dev migrate seed test lint format build api web docker-up docker-down

setup:
	npm run install:all

dev:
	docker compose up postgres redis

api:
	python -m uvicorn app.main:app --reload --app-dir apps/api

web:
	npm run dev --workspace @sprintmind/web

migrate:
	cd apps/api && alembic upgrade head

seed:
	python -m app.services.seed_service --app-dir apps/api

test:
	npm run test --workspace @sprintmind/web
	python -m pytest apps/api/tests

lint:
	npm run lint --workspace @sprintmind/web
	python -m ruff check apps/api/app apps/api/tests

format:
	npm run format --workspace @sprintmind/web
	python -m ruff format apps/api/app apps/api/tests

build:
	npm run build --workspace @sprintmind/web

docker-up:
	docker compose up --build

docker-down:
	docker compose down

