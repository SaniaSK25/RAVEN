"""Allow one frozen evidence record per analysis run.

Revision ID: d02f44a8b761
Revises: c81e93a0d742
Create Date: 2026-10-09
"""

from typing import Sequence, Union

from alembic import op


revision: str = "d02f44a8b761"
down_revision: Union[str, Sequence[str], None] = "c81e93a0d742"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table(
            "evidence",
            naming_convention={"uq": "uq_%(table_name)s_%(column_0_name)s"},
        ) as batch_op:
            batch_op.drop_constraint(
                "uq_evidence_requirement_version_id",
                type_="unique",
            )
    elif bind.dialect.name == "postgresql":
        op.drop_constraint(
            "evidence_requirement_version_id_key",
            "evidence",
            type_="unique",
        )
    else:
        raise RuntimeError(f"Unsupported database dialect: {bind.dialect.name}")


def downgrade() -> None:
    with op.batch_alter_table(
        "evidence",
        naming_convention={"uq": "uq_%(table_name)s_%(column_0_name)s"},
    ) as batch_op:
        batch_op.create_unique_constraint(
            "uq_evidence_requirement_version_id",
            ["requirement_version_id"],
        )
