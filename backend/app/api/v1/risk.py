import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.requirement_repository import RequirementRepository
from app.schemas.assurance import CSAAssuranceResponse
from app.schemas.risk import (
    AssessmentStoredResult,
    DetectabilityResult,
    ProbabilityResult,
    RiskAssessmentResponse,
    RiskOverview,
    SeverityResult,
)
from app.services.assurance_engine import AssuranceEngine
from app.services.detectability_engine import DetectabilityEngine
from app.services.probability_engine import ProbabilityEngine
from app.services.risk_engine import RiskEngine
from app.services.severity_engine import SeverityEngine
from app.utils.logging import RequestTimer, generate_request_id, logger

router = APIRouter(prefix="/risk", tags=["Decision Engines"])


async def _get_analysis_or_404(
    requirement_id: uuid.UUID, db: AsyncSession
) -> dict:
    req_repo = RequirementRepository(db)
    requirement = await req_repo.get_by_id(requirement_id)
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Requirement {requirement_id} not found",
        )

    analysis_repo = AnalysisRepository(db)
    analysis = await analysis_repo.get_ai_analysis(requirement_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI analysis found for requirement {requirement_id}. Submit analysis first via POST /api/v1/analysis/{requirement_id}",
        )
    return {"analysis": analysis, "analysis_repo": analysis_repo}


@router.post(
    "/{requirement_id}/severity",
    response_model=AssessmentStoredResult,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate Severity",
    description=(
        "Reads the stored severity_analysis JSON and runs the deterministic severity engine. "
        "Stores and returns the result."
    ),
    responses={
        404: {"description": "Requirement or AI analysis not found"},
    },
)
async def calculate_severity(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AssessmentStoredResult:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        context = await _get_analysis_or_404(requirement_id, db)
        analysis = context["analysis"]
        analysis_repo = context["analysis_repo"]

        engine = SeverityEngine()
        if not engine.validate(analysis.severity_analysis):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Severity analysis JSON missing required fields: safety_impact, system_function",
            )

        result = engine.calculate(analysis.severity_analysis)
        stored = await analysis_repo.upsert_severity(
            requirement_id, result.score, result.decision_path, result.justification
        )

        logger.info(
            "severity_calculated",
            request_id=request_id,
            requirement_id=str(requirement_id),
            score=result.score,
        )
        return AssessmentStoredResult.model_validate(stored)


@router.post(
    "/{requirement_id}/probability",
    response_model=AssessmentStoredResult,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate Probability",
    description=(
        "Reads the stored probability_analysis JSON and runs the deterministic probability engine. "
        "Stores and returns the result."
    ),
    responses={
        404: {"description": "Requirement or AI analysis not found"},
    },
)
async def calculate_probability(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AssessmentStoredResult:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        context = await _get_analysis_or_404(requirement_id, db)
        analysis = context["analysis"]
        analysis_repo = context["analysis_repo"]

        engine = ProbabilityEngine()
        if not engine.validate(analysis.probability_analysis):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Probability analysis JSON missing required fields: failure_rate, operational_exposure",
            )

        result = engine.calculate(analysis.probability_analysis)
        stored = await analysis_repo.upsert_probability(
            requirement_id, result.score, result.decision_path, result.justification
        )

        logger.info(
            "probability_calculated",
            request_id=request_id,
            requirement_id=str(requirement_id),
            score=result.score,
        )
        return AssessmentStoredResult.model_validate(stored)


@router.post(
    "/{requirement_id}/detectability",
    response_model=AssessmentStoredResult,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate Detectability",
    description=(
        "Reads the stored detectability_analysis JSON and runs the deterministic detectability engine. "
        "Stores and returns the result."
    ),
    responses={
        404: {"description": "Requirement or AI analysis not found"},
    },
)
async def calculate_detectability(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AssessmentStoredResult:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        context = await _get_analysis_or_404(requirement_id, db)
        analysis = context["analysis"]
        analysis_repo = context["analysis_repo"]

        engine = DetectabilityEngine()
        if not engine.validate(analysis.detectability_analysis):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Detectability analysis JSON missing required fields: detection_method, detection_coverage",
            )

        result = engine.calculate(analysis.detectability_analysis)
        stored = await analysis_repo.upsert_detectability(
            requirement_id, result.score, result.decision_path, result.justification
        )

        logger.info(
            "detectability_calculated",
            request_id=request_id,
            requirement_id=str(requirement_id),
            score=result.score,
        )
        return AssessmentStoredResult.model_validate(stored)


@router.post(
    "/{requirement_id}/calculate",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate Overall Risk",
    description=(
        "Reads Severity, Probability, and Detectability scores. "
        "Calculates RPN = S x P x D. Determines Risk Band. "
        "Stores and returns the complete risk assessment."
    ),
    responses={
        404: {"description": "Requirement or assessments not found"},
        409: {"description": "Individual assessments must be calculated first"},
    },
)
async def calculate_risk(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RiskAssessmentResponse:
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
        severity = await analysis_repo.get_severity(requirement_id)
        probability = await analysis_repo.get_probability(requirement_id)
        detectability = await analysis_repo.get_detectability(requirement_id)

        missing = []
        if not severity:
            missing.append("severity")
        if not probability:
            missing.append("probability")
        if not detectability:
            missing.append("detectability")
        if missing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Missing assessments: {', '.join(missing)}. Calculate them first.",
            )

        risk_engine = RiskEngine()
        rpn, risk_band, decision_path = risk_engine.calculate(
            severity.score, probability.score, detectability.score
        )

        stored = await analysis_repo.upsert_risk_assessment(
            requirement_id=requirement_id,
            severity_score=severity.score,
            probability_score=probability.score,
            detectability_score=detectability.score,
            risk_priority_number=rpn,
            risk_band=risk_band,
            decision_path=decision_path,
        )

        logger.info(
            "risk_calculated",
            request_id=request_id,
            requirement_id=str(requirement_id),
            rpn=rpn,
            risk_band=risk_band,
        )
        return RiskAssessmentResponse.model_validate(stored)


@router.get(
    "/{requirement_id}",
    response_model=RiskOverview,
    summary="Get Risk Overview",
    description="Returns the complete risk overview including severity, probability, detectability, and overall risk assessment.",
    responses={404: {"description": "Requirement not found"}},
)
async def get_risk_overview(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RiskOverview:
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
        severity = await analysis_repo.get_severity(requirement_id)
        probability = await analysis_repo.get_probability(requirement_id)
        detectability = await analysis_repo.get_detectability(requirement_id)
        risk_assessment = await analysis_repo.get_risk_assessment(requirement_id)

        return RiskOverview(
            severity=SeverityResult.model_validate(severity) if severity else None,
            probability=ProbabilityResult.model_validate(probability) if probability else None,
            detectability=DetectabilityResult.model_validate(detectability) if detectability else None,
            risk_assessment=(
                RiskAssessmentResponse.model_validate(risk_assessment) if risk_assessment else None
            ),
        )


@router.post(
    "/{requirement_id}/assurance",
    response_model=CSAAssuranceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate CSA Assurance Level",
    description=(
        "Uses the Risk Band to deterministically map to a CSA Assurance Level. "
        "Stores and returns the assurance result."
    ),
    responses={
        404: {"description": "Requirement not found"},
        409: {"description": "Risk assessment must be calculated first"},
    },
)
async def calculate_assurance(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CSAAssuranceResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        analysis_repo = AnalysisRepository(db)
        risk_assessment = await analysis_repo.get_risk_assessment(requirement_id)
        if not risk_assessment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Risk assessment for requirement {requirement_id} must be calculated first via POST /api/v1/risk/{requirement_id}/calculate",
            )

        engine = AssuranceEngine()
        if not engine.validate(risk_assessment.risk_band):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid risk band: {risk_assessment.risk_band}",
            )

        result = engine.calculate(risk_assessment.risk_band)

        req_repo = RequirementRepository(db)
        from app.repositories.risk_repository import RiskRepository

        risk_repo = RiskRepository(db)
        stored = await risk_repo.upsert_assurance(
            requirement_id=requirement_id,
            assurance_level=result.level,
            generate_test_script=result.generate_test_script,
            reason=result.reason,
        )

        logger.info(
            "assurance_calculated",
            request_id=request_id,
            requirement_id=str(requirement_id),
            level=result.level,
        )
        return CSAAssuranceResponse.model_validate(stored)


@router.get(
    "/{requirement_id}/assurance",
    response_model=CSAAssuranceResponse,
    summary="Get CSA Assurance",
    description="Returns the stored CSA assurance for a requirement.",
    responses={404: {"description": "Assurance not found"}},
)
async def get_assurance(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CSAAssuranceResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        from app.repositories.risk_repository import RiskRepository

        risk_repo = RiskRepository(db)
        assurance = await risk_repo.get_assurance(requirement_id)
        if not assurance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No CSA assurance found for requirement {requirement_id}",
            )
        return CSAAssuranceResponse.model_validate(assurance)
