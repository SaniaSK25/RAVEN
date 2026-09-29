"""
Application entry point.

This module creates the FastAPI application and registers the
API routes.
"""

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Register API routes
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    """
    return {
        "message": f"{settings.APP_NAME} is running!"
    }