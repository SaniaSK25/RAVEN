from fastapi import APIRouter

from app.api.v1.analysis import router as analysis_router
from app.api.v1.requirements import router as requirements_router
from app.api.v1.risk import router as risk_router

api_router = APIRouter()
api_router.include_router(requirements_router)
api_router.include_router(analysis_router)
api_router.include_router(risk_router)
