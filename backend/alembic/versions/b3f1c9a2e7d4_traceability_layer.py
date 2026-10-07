"""Traceability layer: trace_links, change_events, freshness/req_key columns

Revision ID: b3f1c9a2e7d4
Revises: 69014434ce06
Create Date: 2026-10-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3f1c9a2e7d4"
down_revision: Union[str, Sequence[str], None] = "69014434ce06"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Additive columns (nullable/server-defaulted: safe on existing rows) ---
    op.add_column("requirements", sa.Column("req_key", sa.String(32), nullable=True))
    op.create_unique_constraint("uq_requirements_req_key", "requirements", ["req_key"])
    op.create_index("ix_requirements_req_key", "requirements", ["req_key"])

    op.add_column(
        "risk_assessments",
        sa.Column("freshness", sa.String(12), nullable=False, server_default="fresh"),
    )
    op.create_index("ix_risk_assessments_freshness", "risk_assessments", ["freshness"])

    op.add_column(
        "assurance_decisions",
        sa.Column("freshness", sa.String(12), nullable=False, server_default="fresh"),
    )
    op.create_index("ix_assurance_decisions_freshness", "assurance_decisions", ["freshness"])

    op.add_column(
        "test_scripts",
        sa.Column("freshness", sa.String(12), nullable=False, server_default="fresh"),
    )
    op.add_column(
        "test_scripts",
        sa.Column("origin", sa.String(12), nullable=False, server_default="generated"),
    )
    op.add_column("test_scripts", sa.Column("title", sa.Text(), nullable=True))
    op.add_column("test_scripts", sa.Column("external_code", sa.String(64), nullable=True))
    op.create_index("ix_test_scripts_freshness", "test_scripts", ["freshness"])
    op.create_index("ix_test_scripts_origin", "test_scripts", ["origin"])
    op.create_index("ix_test_scripts_external_code", "test_scripts", ["external_code"])

    # --- trace_links ---
    op.create_table(
        "trace_links",
        sa.Column("src_type", sa.String(16), nullable=False),
        sa.Column("src_id", sa.String(64), nullable=False),
        sa.Column("dst_type", sa.String(16), nullable=False),
        sa.Column("dst_id", sa.String(64), nullable=False),
        sa.Column("link_type", sa.String(16), nullable=False),
        sa.Column("origin", sa.String(12), nullable=False, server_default="system"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("suppressed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("stale", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_by", sa.String(255), nullable=False, server_default="system"),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "src_type", "src_id", "dst_type", "dst_id", "link_type",
            name="uq_trace_links_endpoints_type",
        ),
        sa.CheckConstraint(
            "(link_type = 'has_risk' AND src_type = 'requirement' AND dst_type = 'risk') OR "
            "(link_type = 'assessed_as' AND src_type = 'risk' AND dst_type = 'assurance') OR "
            "(link_type = 'mitigated_by' AND src_type = 'assurance' AND dst_type = 'test') OR "
            "(link_type = 'verifies' AND src_type = 'test' AND dst_type = 'requirement')",
            name="ck_trace_links_type_endpoints",
        ),
        sa.CheckConstraint("NOT (suppressed AND active)", name="ck_trace_links_suppressed_inactive"),
        sa.CheckConstraint("origin = 'system' OR NOT suppressed", name="ck_trace_links_suppressed_system_only"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trace_links_src", "trace_links", ["src_type", "src_id"])
    op.create_index("ix_trace_links_dst", "trace_links", ["dst_type", "dst_id"])
    op.create_index("ix_trace_links_type", "trace_links", ["link_type"])
    op.create_index("ix_trace_links_origin", "trace_links", ["origin"])

    # --- change_events ---
    op.create_table(
        "change_events",
        sa.Column("requirement_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(12), nullable=False),
        sa.Column("status", sa.String(12), nullable=False, server_default="open"),
        sa.Column("impact", sa.JSON(), nullable=False),
        sa.Column("diff", sa.JSON(), nullable=True),
        sa.Column("baseline_assessment_id", sa.String(64), nullable=True),
        sa.Column("carried_from_event_id", sa.Uuid(), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["carried_from_event_id"], ["change_events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_change_events_requirement_id", "change_events", ["requirement_id"])
    op.create_index("ix_change_events_status", "change_events", ["status"])
    op.create_index("ix_change_events_created_at", "change_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("change_events")
    op.drop_table("trace_links")
    op.drop_index("ix_test_scripts_external_code", table_name="test_scripts")
    op.drop_index("ix_test_scripts_origin", table_name="test_scripts")
    op.drop_index("ix_test_scripts_freshness", table_name="test_scripts")
    op.drop_column("test_scripts", "external_code")
    op.drop_column("test_scripts", "title")
    op.drop_column("test_scripts", "origin")
    op.drop_column("test_scripts", "freshness")
    op.drop_index("ix_assurance_decisions_freshness", table_name="assurance_decisions")
    op.drop_column("assurance_decisions", "freshness")
    op.drop_index("ix_risk_assessments_freshness", table_name="risk_assessments")
    op.drop_column("risk_assessments", "freshness")
    op.drop_index("ix_requirements_req_key", table_name="requirements")
    op.drop_constraint("uq_requirements_req_key", "requirements", type_="unique")
    op.drop_column("requirements", "req_key")
