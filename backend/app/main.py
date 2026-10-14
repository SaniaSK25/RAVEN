"""
Application entry point.

This module creates the FastAPI application and registers the
API routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Local dev: allow the Next.js frontend (default http://localhost:3000)
# to call the API directly. Browser traffic normally goes through the
# Next proxy, so this is permissive by design for development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    return {
        "message": f"{settings.APP_NAME} is running!"
    }