"""
Database dependencies.

This module defines reusable FastAPI dependencies for accessing the
database. Endpoints should import `DBSession` instead of using
`Depends(get_db)` directly.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

# ==========================================================
# Database Session Dependency
# ==========================================================

DBSession = Annotated[
    Session,
    Depends(get_db),
]