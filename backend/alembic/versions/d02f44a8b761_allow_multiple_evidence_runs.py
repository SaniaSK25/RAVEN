"""Allow one frozen evidence record per analysis run.

Revision ID: d02f44a8b761
Revises: c81e93a0d742
Create Date: 2026-10-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d02f44a8b761"
down_revision: Union[str, Sequence[str], None] = "c81e93a0d742"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    unique_constraints = sa.inspect(bind).get_unique_constraints("evidence")
    if bind.dialect.name == "sqlite":
        if not any(
            constraint["name"] == "uq_evidence_requirement_version_id"
            for constraint in unique_constraints
        ):
            return
        with op.batch_alter_table(
            "evidence",
            naming_convention={"uq": "uq_%(table_name)s_%(column_0_name)s"},
        ) as batch_op:
            batch_op.drop_constraint(
                "uq_evidence_requirement_version_id",
                type_="unique",
            )
    elif bind.dialect.name == "postgresql":
        constraint_name = next(
            (
                constraint["name"]
                for constraint in unique_constraints
                if constraint["name"] == "evidence_requirement_version_id_key"
            ),
            None,
        )
        if constraint_name is not None:
            op.drop_constraint(
                constraint_name,
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
