"""
Database connectivity test endpoints.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.db.dependencies import DBSession
from app.schemas.responses import DatabaseStatusResponse

router = APIRouter(
    prefix="/test-db",
    tags=["Database"],
)


@router.get("", response_model=DatabaseStatusResponse)
def test_database(
    db: DBSession,
):
    """
    Verify database connectivity.
    """

    result = db.execute(text("SELECT 1")).scalar()

    return {
        "database": "connected",
        "result": result,
    }