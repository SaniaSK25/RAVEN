import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assurance import CSAAssurance


class RiskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_assurance(
        self,
        requirement_id: uuid.UUID,
        assurance_level: str,
        generate_test_script: bool,
        reason: str,
    ) -> CSAAssurance:
        result = await self.db.execute(
            select(CSAAssurance).where(CSAAssurance.requirement_id == requirement_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.assurance_level = assurance_level
            existing.generate_test_script = generate_test_script
            existing.reason = reason
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        assurance = CSAAssurance(
            requirement_id=requirement_id,
            assurance_level=assurance_level,
            generate_test_script=generate_test_script,
            reason=reason,
        )
        self.db.add(assurance)
        await self.db.flush()
        await self.db.refresh(assurance)
        return assurance

    async def get_assurance(self, requirement_id: uuid.UUID) -> CSAAssurance | None:
        result = await self.db.execute(
            select(CSAAssurance).where(CSAAssurance.requirement_id == requirement_id)
        )
        return result.scalar_one_or_none()
