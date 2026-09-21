import csv
import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import RequirementStatus
from app.database.session import get_db
from app.repositories.requirement_repository import RequirementRepository
from app.schemas.requirement import (
    PaginatedRequirements,
    RequirementCreate,
    RequirementResponse,
    RequirementUpdate,
)
from app.utils.logging import RequestTimer, generate_request_id, logger

router = APIRouter(prefix="/requirements", tags=["Requirements"])


@router.post(
    "",
    response_model=RequirementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new requirement",
    description="Creates a new safety requirement with a unique requirement code.",
    responses={
        409: {"description": "Requirement with this code already exists"},
        422: {"description": "Validation error"},
    },
)
async def create_requirement(
    data: RequirementCreate,
    db: AsyncSession = Depends(get_db),
) -> RequirementResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id):
        repo = RequirementRepository(db)

        existing = await repo.get_by_code(data.requirement_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Requirement with code '{data.requirement_code}' already exists",
            )

        requirement = await repo.create(data)
        logger.info(
            "requirement_created",
            request_id=request_id,
            requirement_id=str(requirement.id),
        )
        return RequirementResponse.model_validate(requirement)


@router.post(
    "/upload",
    response_model=list[RequirementResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload requirements via CSV",
    description="Upload multiple requirements from a CSV file. Expected columns: requirement_code, title, description, source_document, status.",
    responses={
        400: {"description": "Invalid CSV format"},
        422: {"description": "Validation error"},
    },
)
async def upload_requirements_csv(
    file: UploadFile = File(..., description="CSV file with requirements"),
    db: AsyncSession = Depends(get_db),
) -> list[RequirementResponse]:
    request_id = generate_request_id()
    with RequestTimer(request_id):
        if not file.filename or not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a CSV file",
            )

        content = await file.read()
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be UTF-8 encoded",
            )

        reader = csv.DictReader(io.StringIO(text))
        required_columns = {"requirement_code", "title", "description"}
        if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV must contain columns: {', '.join(sorted(required_columns))}",
            )

        repo = RequirementRepository(db)
        created_requirements: list[RequirementResponse] = []

        for row_num, row in enumerate(reader, start=2):
            try:
                create_data = RequirementCreate(
                    requirement_code=row["requirement_code"].strip(),
                    title=row["title"].strip(),
                    description=row["description"].strip(),
                    source_document=row.get("source_document", "").strip() or None,
                    status=RequirementStatus(row.get("status", "DRAFT").strip()),
                )
                requirement = await repo.create(create_data)
                created_requirements.append(RequirementResponse.model_validate(requirement))
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Error at row {row_num}: {str(e)}",
                )

        logger.info(
            "requirements_uploaded",
            request_id=request_id,
            count=len(created_requirements),
        )
        return created_requirements


@router.get(
    "",
    response_model=PaginatedRequirements,
    summary="List all requirements",
    description="Returns a paginated list of all requirements.",
)
async def list_requirements(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedRequirements:
    request_id = generate_request_id()
    with RequestTimer(request_id):
        repo = RequirementRepository(db)
        items, total = await repo.list_paginated(page=page, page_size=page_size)
        total_pages = (total + page_size - 1) // page_size

        return PaginatedRequirements(
            items=[RequirementResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


@router.get(
    "/{requirement_id}",
    response_model=RequirementResponse,
    summary="Get a requirement by ID",
    description="Returns a single requirement by its UUID.",
    responses={404: {"description": "Requirement not found"}},
)
async def get_requirement(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RequirementResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        repo = RequirementRepository(db)
        requirement = await repo.get_by_id(requirement_id)
        if not requirement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement {requirement_id} not found",
            )
        return RequirementResponse.model_validate(requirement)


@router.put(
    "/{requirement_id}",
    response_model=RequirementResponse,
    summary="Update a requirement",
    description="Updates an existing requirement. Only provided fields are updated.",
    responses={404: {"description": "Requirement not found"}},
)
async def update_requirement(
    requirement_id: uuid.UUID,
    data: RequirementUpdate,
    db: AsyncSession = Depends(get_db),
) -> RequirementResponse:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        repo = RequirementRepository(db)
        requirement = await repo.get_by_id(requirement_id)
        if not requirement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement {requirement_id} not found",
            )
        updated = await repo.update(requirement, data)
        return RequirementResponse.model_validate(updated)


@router.delete(
    "/{requirement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a requirement",
    description="Deletes a requirement by its UUID.",
    responses={404: {"description": "Requirement not found"}},
)
async def delete_requirement(
    requirement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    request_id = generate_request_id()
    with RequestTimer(request_id, str(requirement_id)):
        repo = RequirementRepository(db)
        deleted = await repo.delete(requirement_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement {requirement_id} not found",
            )
