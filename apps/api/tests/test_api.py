from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "ok"


def test_demo_login_and_dashboard() -> None:
    with TestClient(app) as client:
        login = client.post("/api/v1/auth/demo")
        assert login.status_code == 200
        dashboard = client.get("/api/v1/dashboard")
        assert dashboard.status_code == 200
        payload = dashboard.json()["data"]
        assert payload["project"]["key"] == "AIP"
        assert payload["metrics"]["blockedIssues"] >= 1


def test_chat_write_action_creates_approval() -> None:
    with TestClient(app) as client:
        assert client.post("/api/v1/auth/demo").status_code == 200
        created = client.post("/api/v1/conversations").json()["data"]
        response = client.post(
            f"/api/v1/conversations/{created['id']}/messages",
            json={"content": "Create a high-priority Jira bug for the payment-page crash."},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["metadata"]["approvalId"]
        assert "did not execute" in data["response"]

