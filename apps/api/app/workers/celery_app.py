from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery("sprintmind", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_routes = {
    "app.workers.celery_app.reconcile_jira": {"queue": "jira"},
    "app.workers.celery_app.process_document": {"queue": "documents"},
}


@celery_app.task
def reconcile_jira() -> dict:
    return {"status": "queued", "message": "Jira reconciliation task registered."}


@celery_app.task
def process_document(document_id: str) -> dict:
    return {"status": "queued", "document_id": document_id}
