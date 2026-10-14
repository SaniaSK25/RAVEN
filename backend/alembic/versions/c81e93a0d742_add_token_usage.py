"""Record token usage per requirement-version analysis.

Revision ID: c81e93a0d742
Revises: 2b3d4bf10f96
Create Date: 2026-10-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c81e93a0d742"
down_revision: Union[str, Sequence[str], None] = "2b3d4bf10f96"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if "token_usage" in sa.inspect(op.get_bind()).get_table_names():
        return

    op.create_table(
        "token_usage",
        sa.Column("requirement_version_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("extraction_input_tokens", sa.Integer(), nullable=False),
        sa.Column("extraction_output_tokens", sa.Integer(), nullable=False),
        sa.Column("script_input_tokens", sa.Integer(), nullable=False),
        sa.Column("script_output_tokens", sa.Integer(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "total_tokens = input_tokens + output_tokens",
            name="ck_token_usage_total",
        ),
        sa.CheckConstraint(
            "input_tokens >= 0 AND output_tokens >= 0",
            name="ck_token_usage_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["requirement_version_id"],
            ["requirement_versions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_token_usage_requirement_version_id",
        "token_usage",
        ["requirement_version_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_token_usage_requirement_version_id",
        table_name="token_usage",
    )
    op.drop_table("token_usage")
