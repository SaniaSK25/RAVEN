"""Bootstrap the current ORM schema after the legacy requirements revisions.

Revision ID: a91c4d7e2f10
Revises: 69014434ce06
"""

from collections.abc import Sequence
from datetime import datetime, timezone
from hashlib import sha256
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from app.db.base import Base
from sqlalchemy import Integer, inspect

revision: str = "a91c4d7e2f10"
down_revision: str | Sequence[str] | None = "69014434ce06"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    legacy_requirements = None

    if "requirements" in inspector.get_table_names():
        id_column = next(
            column
            for column in inspector.get_columns("requirements")
            if column["name"] == "id"
        )
        if isinstance(id_column["type"], Integer):
            dependent_tables = [
                table_name
                for table_name in inspector.get_table_names()
                if table_name != "requirements"
                and any(
                    foreign_key.get("referred_table") == "requirements"
                    for foreign_key in inspector.get_foreign_keys(table_name)
                )
            ]
            if dependent_tables:
                raise RuntimeError(
                    "Cannot migrate the legacy integer requirements table while "
                    f"other tables reference it: {', '.join(dependent_tables)}"
                )

            legacy_requirements = bind.execute(
                sa.text(
                    "SELECT id, title, description, source, created_at, updated_at "
                    "FROM requirements ORDER BY id"
                )
            ).mappings().all()

            version_texts = [row["description"] for row in legacy_requirements]
            if len(version_texts) != len(set(version_texts)):
                raise RuntimeError(
                    "Cannot migrate legacy requirements with duplicate descriptions: "
                    "the current schema requires a unique version hash."
                )

            op.drop_table("requirements")

    Base.metadata.create_all(bind=bind, checkfirst=True)

    if not legacy_requirements:
        return

    requirements = Base.metadata.tables["requirements"]
    versions = Base.metadata.tables["requirement_versions"]
    now = datetime.now(timezone.utc)
    requirement_rows = []
    version_rows = []

    for row in legacy_requirements:
        requirement_id = uuid4()
        version_id = uuid4()
        created_at = _as_datetime(row["created_at"], now)
        updated_at = _as_datetime(row["updated_at"], created_at)
        text = row["description"]
        requirement_rows.append(
            {
                "id": requirement_id,
                "req_key": None,
                "title": row["title"],
                "description": text,
                "status": "DRAFT",
                "created_by": row["source"] or "legacy-migration",
                "current_version_id": None,
                "created_at": created_at,
                "updated_at": updated_at,
            }
        )
        version_rows.append(
            {
                "id": version_id,
                "requirement_id": requirement_id,
                "version_number": 1,
                "text": text,
                "hash_sha256": sha256(text.encode("utf-8")).hexdigest(),
                "is_current": True,
                "created_at": created_at,
            }
        )

    bind.execute(requirements.insert(), requirement_rows)
    bind.execute(versions.insert(), version_rows)
    for requirement_row, version_row in zip(requirement_rows, version_rows):
        bind.execute(
            requirements.update()
            .where(requirements.c.id == requirement_row["id"])
            .values(current_version_id=version_row["id"])
        )


def _as_datetime(value: datetime | str | None, fallback: datetime) -> datetime:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def downgrade() -> None:
    raise RuntimeError(
        "The ORM schema bootstrap is not reversible; restore a database backup "
        "instead of downgrading past this revision."
    )
