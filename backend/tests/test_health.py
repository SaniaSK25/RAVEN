"""Health endpoint contract: cheap, dependency-free liveness probe."""

from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok_without_dependencies():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"]
    assert body["version"]
