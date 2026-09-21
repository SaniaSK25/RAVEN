import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requirement import Requirement
from app.schemas.requirement import RequirementCreate, RequirementUpdate


class RequirementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: RequirementCreate) -> Requirement:
        requirement = Requirement(**data.model_dump())
        self.db.add(requirement)
        await self.db.flush()
        await self.db.refresh(requirement)
        return requirement

    async def get_by_id(self, requirement_id: uuid.UUID) -> Requirement | None:
        result = await self.db.execute(
            select(Requirement).where(Requirement.id == requirement_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Requirement | None:
        result = await self.db.execute(
            select(Requirement).where(Requirement.requirement_code == code)
        )
        return result.scalar_one_or_none()

    async def list_paginated(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[Requirement], int]:
        total_result = await self.db.execute(select(func.count(Requirement.id)))
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Requirement).order_by(Requirement.created_at.desc()).offset(offset).limit(page_size)
        )
        items = list(result.scalars().all())
        return items, total

    async def update(self, requirement: Requirement, data: RequirementUpdate) -> Requirement:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(requirement, field, value)
        await self.db.flush()
        await self.db.refresh(requirement)
        return requirement

    async def delete(self, requirement_id: uuid.UUID) -> bool:
        requirement = await self.get_by_id(requirement_id)
        if not requirement:
            return False
        await self.db.delete(requirement)
        await self.db.flush()
        return True
