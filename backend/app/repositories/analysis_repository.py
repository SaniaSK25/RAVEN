import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_analysis import AIAnalysis
from app.models.detectability import DetectabilityAssessment
from app.models.probability import ProbabilityAssessment
from app.models.risk_assessment import RiskAssessment
from app.models.severity import SeverityAssessment
from app.schemas.ai_analysis import AIAnalysisCreate


class AnalysisRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_ai_analysis(
        self, requirement_id: uuid.UUID, data: AIAnalysisCreate
    ) -> AIAnalysis:
        result = await self.db.execute(
            select(AIAnalysis).where(AIAnalysis.requirement_id == requirement_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.severity_analysis = data.severity_analysis
            existing.probability_analysis = data.probability_analysis
            existing.detectability_analysis = data.detectability_analysis
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        analysis = AIAnalysis(requirement_id=requirement_id, **data.model_dump())
        self.db.add(analysis)
        await self.db.flush()
        await self.db.refresh(analysis)
        return analysis

    async def get_ai_analysis(self, requirement_id: uuid.UUID) -> AIAnalysis | None:
        result = await self.db.execute(
            select(AIAnalysis).where(AIAnalysis.requirement_id == requirement_id)
        )
        return result.scalar_one_or_none()

    async def upsert_severity(
        self, requirement_id: uuid.UUID, score: int, decision_path: dict, justification: str
    ) -> SeverityAssessment:
        result = await self.db.execute(
            select(SeverityAssessment).where(SeverityAssessment.requirement_id == requirement_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.score = score
            existing.decision_path = decision_path
            existing.justification = justification
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        assessment = SeverityAssessment(
            requirement_id=requirement_id,
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
        self.db.add(assessment)
        await self.db.flush()
        await self.db.refresh(assessment)
        return assessment

    async def get_severity(self, requirement_id: uuid.UUID) -> SeverityAssessment | None:
        result = await self.db.execute(
            select(SeverityAssessment).where(SeverityAssessment.requirement_id == requirement_id)
        )
        return result.scalar_one_or_none()

    async def upsert_probability(
        self, requirement_id: uuid.UUID, score: int, decision_path: dict, justification: str
    ) -> ProbabilityAssessment:
        result = await self.db.execute(
            select(ProbabilityAssessment).where(
                ProbabilityAssessment.requirement_id == requirement_id
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.score = score
            existing.decision_path = decision_path
            existing.justification = justification
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        assessment = ProbabilityAssessment(
            requirement_id=requirement_id,
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
        self.db.add(assessment)
        await self.db.flush()
        await self.db.refresh(assessment)
        return assessment

    async def get_probability(self, requirement_id: uuid.UUID) -> ProbabilityAssessment | None:
        result = await self.db.execute(
            select(ProbabilityAssessment).where(
                ProbabilityAssessment.requirement_id == requirement_id
            )
        )
        return result.scalar_one_or_none()

    async def upsert_detectability(
        self, requirement_id: uuid.UUID, score: int, decision_path: dict, justification: str
    ) -> DetectabilityAssessment:
        result = await self.db.execute(
            select(DetectabilityAssessment).where(
                DetectabilityAssessment.requirement_id == requirement_id
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.score = score
            existing.decision_path = decision_path
            existing.justification = justification
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        assessment = DetectabilityAssessment(
            requirement_id=requirement_id,
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
        self.db.add(assessment)
        await self.db.flush()
        await self.db.refresh(assessment)
        return assessment

    async def get_detectability(self, requirement_id: uuid.UUID) -> DetectabilityAssessment | None:
        result = await self.db.execute(
            select(DetectabilityAssessment).where(
                DetectabilityAssessment.requirement_id == requirement_id
            )
        )
        return result.scalar_one_or_none()

    async def upsert_risk_assessment(
        self,
        requirement_id: uuid.UUID,
        severity_score: int,
        probability_score: int,
        detectability_score: int,
        risk_priority_number: int,
        risk_band: str,
        decision_path: dict,
    ) -> RiskAssessment:
        result = await self.db.execute(
            select(RiskAssessment).where(RiskAssessment.requirement_id == requirement_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.severity_score = severity_score
            existing.probability_score = probability_score
            existing.detectability_score = detectability_score
            existing.risk_priority_number = risk_priority_number
            existing.risk_band = risk_band
            existing.decision_path = decision_path
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        assessment = RiskAssessment(
            requirement_id=requirement_id,
            severity_score=severity_score,
            probability_score=probability_score,
            detectability_score=detectability_score,
            risk_priority_number=risk_priority_number,
            risk_band=risk_band,
            decision_path=decision_path,
        )
        self.db.add(assessment)
        await self.db.flush()
        await self.db.refresh(assessment)
        return assessment

    async def get_risk_assessment(self, requirement_id: uuid.UUID) -> RiskAssessment | None:
        result = await self.db.execute(
            select(RiskAssessment).where(RiskAssessment.requirement_id == requirement_id)
        )
        return result.scalar_one_or_none()
