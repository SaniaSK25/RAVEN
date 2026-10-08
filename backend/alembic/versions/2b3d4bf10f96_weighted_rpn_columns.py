"""Weighted RPN columns on risk_assessments.

Revision ID: 2b3d4bf10f96
Revises: bed6b335d539
Create Date: 2026-10-07

rpn becomes Float on the 1.0-5.0 display scale; rpn_points carries the
exact integer basis (20-100) for banding. Batch mode so SQLite (which
cannot ALTER columns) and PostgreSQL share one path. Existing integer
RPNs convert cleanly to float; their rpn_points must be recomputed by
the seed/persistence layer, never guessed here (left NULL-able? No:
non-null with server default 20 so old rows stay valid, recompute
fixes them to exact values).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "2b3d4bf10f96"
down_revision: Union[str, Sequence[str], None] = "bed6b335d539"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("risk_assessments") as batch_op:
        batch_op.add_column(
            sa.Column("rpn_points", sa.Integer(), nullable=False, server_default="20")
        )
        batch_op.alter_column(
            "rpn",
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("risk_assessments") as batch_op:
        batch_op.alter_column(
            "rpn",
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=False,
        )
        batch_op.drop_column("rpn_points")
