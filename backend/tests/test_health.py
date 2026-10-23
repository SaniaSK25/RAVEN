"""Health endpoint contract: cheap, dependency-free liveness probe."""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, make_url

from app.main import app


def test_health_returns_ok_without_dependencies():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"]
    assert body["version"]


def test_development_startup_migrates_a_new_database(monkeypatch, tmp_path):
    from app.core.config import settings

    database_path = tmp_path / "fresh.sqlite"
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite:///{database_path}")

    with TestClient(app) as client:
        assert client.get("/health").status_code == 200

    engine = create_engine(make_url(settings.DATABASE_URL))
    try:
        assert "id_counters" in inspect(engine).get_table_names()
        assert "requirements" in inspect(engine).get_table_names()
    finally:
        engine.dispose()
