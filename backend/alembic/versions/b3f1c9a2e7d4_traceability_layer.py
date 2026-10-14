"""Compatibility marker for the traceability schema bootstrap.

Revision ID: b3f1c9a2e7d4
Revises: a91c4d7e2f10
Create Date: 2026-10-06

The preceding bootstrap creates the current ORM schema, including these
traceability columns and tables. Keep this revision in the chain so existing
revision identifiers remain stable.
"""

from typing import Sequence, Union


revision: str = "b3f1c9a2e7d4"
down_revision: Union[str, Sequence[str], None] = "a91c4d7e2f10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
