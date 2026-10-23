"""Track exact batch extraction usage and per-requirement allocations.

Revision ID: e48c2a7b901d
Revises: d02f44a8b761
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e48c2a7b901d"
down_revision: str | Sequence[str] | None = "d02f44a8b761"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "batch_token_usage" not in tables:
        op.create_table(
            "batch_token_usage",
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("requested_count", sa.Integer(), nullable=False),
            sa.Column("succeeded_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("error", sa.Text(), nullable=True),
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.CheckConstraint(
                "total_tokens = input_tokens + output_tokens",
                name="ck_batch_token_usage_total",
            ),
            sa.CheckConstraint(
                "input_tokens >= 0 AND output_tokens >= 0",
                name="ck_batch_token_usage_nonnegative",
            ),
            sa.CheckConstraint(
                "requested_count >= 1 AND succeeded_count >= 0 AND failed_count >= 0",
                name="ck_batch_token_usage_counts",
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    token_usage_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("token_usage")
    }
    foreign_keys = sa.inspect(bind).get_foreign_keys("token_usage")
    has_batch_foreign_key = any(
        foreign_key.get("referred_table") == "batch_token_usage"
        and foreign_key.get("constrained_columns") == ["batch_run_id"]
        for foreign_key in foreign_keys
    )
    indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("token_usage")
    }
    if (
        {"batch_run_id", "usage_basis"} - token_usage_columns
        or not has_batch_foreign_key
        or "ix_token_usage_batch_run_id" not in indexes
    ):
        with op.batch_alter_table("token_usage") as batch_op:
            if "batch_run_id" not in token_usage_columns:
                batch_op.add_column(
                    sa.Column("batch_run_id", sa.Uuid(), nullable=True)
                )
            if "usage_basis" not in token_usage_columns:
                batch_op.add_column(
                    sa.Column(
                        "usage_basis",
                        sa.String(length=30),
                        nullable=False,
                        server_default="actual",
                    )
                )
            if not has_batch_foreign_key:
                batch_op.create_foreign_key(
                    "fk_token_usage_batch_run_id",
                    "batch_token_usage",
                    ["batch_run_id"],
                    ["id"],
                    ondelete="SET NULL",
                )
            if "ix_token_usage_batch_run_id" not in indexes:
                batch_op.create_index(
                    "ix_token_usage_batch_run_id",
                    ["batch_run_id"],
                )


def downgrade() -> None:
    bind = op.get_bind()
    foreign_keys = [
        foreign_key
        for foreign_key in sa.inspect(bind).get_foreign_keys("token_usage")
        if foreign_key.get("referred_table") == "batch_token_usage"
        and foreign_key.get("constrained_columns") == ["batch_run_id"]
    ]
    indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("token_usage")
    }
    with op.batch_alter_table(
        "token_usage",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        if "ix_token_usage_batch_run_id" in indexes:
            batch_op.drop_index("ix_token_usage_batch_run_id")
        for foreign_key in foreign_keys:
            batch_op.drop_constraint(
                foreign_key.get("name")
                or "fk_token_usage_batch_run_id_batch_token_usage",
                type_="foreignkey",
            )
        batch_op.drop_column("usage_basis")
        batch_op.drop_column("batch_run_id")
    op.drop_table("batch_token_usage")
