"""Persist imported requirement batches and analysis progress.

Revision ID: f7a81d2c3b90
revises: e48c2a7b901d, ab12cd34ef56
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "f7a81d2c3b90"
down_revision: str | Sequence[str] | None = ("e48c2a7b901d", "ab12cd34ef56")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "requirement_ingestion_batches" not in set(inspector.get_table_names()):
        op.create_table(
            "requirement_ingestion_batches",
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("requested_count", sa.Integer(), nullable=False),
            sa.Column("requirement_snapshot", sa.Text(), nullable=False),
            sa.Column(
                "analysis_results",
                sa.Text(),
                nullable=False,
                server_default="[]",
            ),
            sa.Column("token_totals", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("error", sa.Text(), nullable=True),
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
    index_names = {
        index["name"]
        for index in sa.inspect(bind).get_indexes("requirement_ingestion_batches")
    }
    if "ix_requirement_ingestion_batches_status" not in index_names:
        op.create_index(
            "ix_requirement_ingestion_batches_status",
            "requirement_ingestion_batches",
            ["status"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    if "requirement_ingestion_batches" in set(sa.inspect(bind).get_table_names()):
        op.drop_index(
            "ix_requirement_ingestion_batches_status",
            table_name="requirement_ingestion_batches",
        )
        op.drop_table("requirement_ingestion_batches")
