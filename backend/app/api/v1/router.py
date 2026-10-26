from fastapi import APIRouter

from app.api.v1.endpoints import (
    assessments,
    assurance,
    auth,
    compliance,
    changes,
    config,
    requirements,
    test_db,
    tests,
    traceability,
    validation_pack,
)

router = APIRouter(
    prefix="/v1",
)

router.include_router(test_db.router)
router.include_router(auth.router)
router.include_router(requirements.router)
router.include_router(traceability.router)
router.include_router(changes.router)
router.include_router(tests.router)
router.include_router(assessments.router)
router.include_router(assurance.router)
router.include_router(compliance.router)
router.include_router(validation_pack.router)
router.include_router(config.router)
