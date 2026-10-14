"""REQ-number counter table + backfill of empty req_key values.

Revision ID: bed6b335d539
Revises: b3f1c9a2e7d4
Create Date: 2026-10-07
"""

from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "bed6b335d539"
down_revision: Union[str, Sequence[str], None] = "b3f1c9a2e7d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "id_counters" not in inspector.get_table_names():
        op.create_table(
            "id_counters",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("name", sa.String(64), nullable=False),
            sa.Column("next_value", sa.Integer(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name", name="uq_id_counters_name"),
        )
    if not any(
        index["name"] == "ix_id_counters_name"
        for index in sa.inspect(conn).get_indexes("id_counters")
    ):
        op.create_index("ix_id_counters_name", "id_counters", ["name"])

    existing = [
        row[0]
        for row in conn.execute(
            sa.text("SELECT req_key FROM requirements WHERE req_key LIKE 'REQ-%'")
        ).fetchall()
    ]
    used = [int(k[4:]) for k in existing if k[4:].isdigit()]
    number = (max(used) if used else 0) + 1
    null_rows = conn.execute(
        sa.text("SELECT id FROM requirements WHERE req_key IS NULL ORDER BY created_at")
    ).fetchall()
    for (row_id,) in null_rows:
        conn.execute(
            sa.text("UPDATE requirements SET req_key = :key WHERE id = :id"),
            {"key": f"REQ-{number:04d}", "id": row_id},
        )
        number += 1
    counter = sa.table(
        "id_counters",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String(64)),
        sa.column("next_value", sa.Integer()),
    )
    current_counter = conn.execute(
        sa.select(counter.c.next_value).where(counter.c.name == "requirement")
    ).scalar_one_or_none()
    if current_counter is None:
        conn.execute(
            counter.insert().values(
                id=uuid4(),
                name="requirement",
                next_value=number,
            )
        )
    elif current_counter < number:
        conn.execute(
            counter.update()
            .where(counter.c.name == "requirement")
            .values(next_value=number)
        )


def downgrade() -> None:
    # Keys are left intact (data-preserving): re-running upgrade would
    # continue the sequence past existing REQ- numbers, never reuse them.
    op.drop_index("ix_id_counters_name", table_name="id_counters")
    op.drop_table("id_counters")
