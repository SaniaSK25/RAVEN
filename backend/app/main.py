"""
Application entry point.

This module creates the FastAPI application and registers the
API routes.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from alembic import command
from app.api.router import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.ENVIRONMENT == "development":
        backend_root = Path(__file__).resolve().parents[1]
        alembic_config = Config(str(backend_root / "alembic.ini"))
        logger.info("Applying database migrations before starting the API.")
        command.upgrade(alembic_config, "head")
        logger.info("Database migrations are up to date.")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Browser traffic normally goes through the Next.js same-origin proxy
# (now under /raven), so this list only matters for direct API calls.
# Origins come from BACKEND_CORS_ORIGINS env (comma-separated).
allow_origins = [
    origin.strip()
    for origin in settings.BACKEND_CORS_ORIGINS.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

# Register API routes
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    """
    return {"message": f"{settings.APP_NAME} is running!"}


@app.get("/health", tags=["Root"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
