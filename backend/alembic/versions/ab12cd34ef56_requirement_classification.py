"""Persist manual requirement-classification runs and batch usage."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "ab12cd34ef56"
down_revision: str | Sequence[str] | None = "f1a2b3c4d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    if "compliance_assessment_runs" not in tables:
        op.create_table(
            "compliance_assessment_runs",
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("requested_count", sa.Integer(), nullable=False),
            sa.Column("total_batches", sa.Integer(), nullable=False),
            sa.Column(
                "completed_batches", sa.Integer(), nullable=False, server_default="0"
            ),
            sa.Column("current_batch", sa.Integer(), nullable=True),
            sa.Column(
                "requirements_processed",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("requirement_snapshot", sa.Text(), nullable=False),
            sa.Column("result", sa.Text(), nullable=True),
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
    if "compliance_batch_usages" not in tables:
        op.create_table(
            "compliance_batch_usages",
            sa.Column("assessment_id", sa.Uuid(), nullable=False),
            sa.Column("batch_number", sa.Integer(), nullable=False),
            sa.Column("attempt", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("requirements_processed", sa.Integer(), nullable=False),
            sa.Column("estimated_input_tokens", sa.Integer(), nullable=False),
            sa.Column("actual_input_tokens", sa.Integer(), nullable=True),
            sa.Column("actual_output_tokens", sa.Integer(), nullable=True),
            sa.Column("model_id", sa.String(length=255), nullable=False),
            sa.Column("max_output_tokens", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("error", sa.Text(), nullable=True),
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.ForeignKeyConstraint(
                ["assessment_id"],
                ["compliance_assessment_runs.id"],
                ondelete="CASCADE",
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    indexes = {
        table: {index["name"] for index in sa.inspect(bind).get_indexes(table)}
        for table in ("compliance_assessment_runs", "compliance_batch_usages")
    }
    if (
        "ix_compliance_assessment_runs_status"
        not in indexes["compliance_assessment_runs"]
    ):
        op.create_index(
            "ix_compliance_assessment_runs_status",
            "compliance_assessment_runs",
            ["status"],
        )
    if (
        "ix_compliance_batch_usages_assessment_id"
        not in indexes["compliance_batch_usages"]
    ):
        op.create_index(
            "ix_compliance_batch_usages_assessment_id",
            "compliance_batch_usages",
            ["assessment_id"],
        )


def downgrade() -> None:
    op.drop_index(
        "ix_compliance_batch_usages_assessment_id",
        table_name="compliance_batch_usages",
    )
    op.drop_table("compliance_batch_usages")
    op.drop_index(
        "ix_compliance_assessment_runs_status",
        table_name="compliance_assessment_runs",
    )
    op.drop_table("compliance_assessment_runs")
