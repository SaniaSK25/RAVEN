from fastapi import APIRouter

from app.api.v1.endpoints import test_db

router = APIRouter(
    prefix="/v1",
)

router.include_router(test_db.router)