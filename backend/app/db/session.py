"""
Database session configuration.

This module creates the SQLAlchemy engine and session factory used
throughout the application. It supports SQLite for local development
and PostgreSQL for production without requiring code changes.
"""

from collections.abc import Generator
import logging

from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# ==========================================================
# Engine Configuration
# ==========================================================

engine_kwargs = {}

if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {
        "check_same_thread": False,
    }

    if ":memory:" in settings.DATABASE_URL:
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

logger.info(
    "Database engine created (sqlite=%s, memory=%s)",
    "sqlite" in settings.DATABASE_URL,
    ":memory:" in settings.DATABASE_URL,
)

# ==========================================================
# Session Factory
# ==========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ==========================================================
# Database Dependency
# ==========================================================

def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session for each request.
    """

    db = SessionLocal()

    logger.info("Opened database session.")

    try:
        yield db

    except Exception:
        logger.exception("Database session failed.")
        raise

    finally:
        db.close()
        logger.info("Closed database session.")