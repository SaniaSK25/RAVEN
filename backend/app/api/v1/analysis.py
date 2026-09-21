import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.requirement_repository import RequirementRepository
from app.schemas.ai_analysis import AIAnalysisCreate, AIAnalysisResponse
from app.utils.logging import RequestTimer, generate_request_id, logger

router = APIRouter(prefix="/analysis", tags=["AI Integration"])


@router.post(
    "/{requirement_id}",
    response_model=AIAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit AI Analysis",
    description=(
        "Stores the AI-generated analysis for a requirement. "
        "The AI team calls this endpoint with their analysis results. "
        "The backend stores the JSON exactly as received without any processing."
    ),
    responses={
        404: {"description": "Requirement not found"},
        422: {"description": "Invalid analysis data"},
    },
)
async def submit_ai_analysis(
    requirement_id: uuid.UUID,
    data: AIAnalysisCreate,
    db: AsyncSession = Depends(get_db),
) -> AIAnalysisResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        req_repo = RequirementRepository(db)
        requirement = await req_repo.get_by_id(requirement_id)
        if not requirement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement {requirement_id} not found",
            )

        analysis_repo = AnalysisRepository(db)
        analysis = await analysis_repo.upsert_ai_analysis(requirement_id, data)

        logger.info(
            "ai_analysis_submitted",
            request_id=request_id,
            requirement_id=str(requirement_id),
        )
        return AIAnalysisResponse.model_validate(analysis)


@router.get(
    "/{requirement_id}",
    response_model=AIAnalysisResponse,
    summary="Get AI Analysis",
    description="Returns the stored AI analysis for a requirement.",
    responses={404: {"description": "No analysis found for this requirement"}},
)
async def get_ai_analysis(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AIAnalysisResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        analysis_repo = AnalysisRepository(db)
        analysis = await analysis_repo.get_ai_analysis(requirement_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No AI analysis found for requirement {requirement_id}",
            )
        return AIAnalysisResponse.model_validate(analysis)
