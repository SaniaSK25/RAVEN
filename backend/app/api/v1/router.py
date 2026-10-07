from fastapi import APIRouter

from app.api.v1.endpoints import changes, requirements, test_db, tests, traceability

router = APIRouter(
    prefix="/v1",
)

router.include_router(test_db.router)
router.include_router(requirements.router)
router.include_router(traceability.router)
router.include_router(changes.router)
router.include_router(tests.router)