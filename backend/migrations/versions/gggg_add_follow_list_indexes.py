"""add follow list indexes for batch queries

Revision ID: gggg
Revises: ffff
Create Date: 2026-06-26 10:00:00.000000

Replace simple follower_id/following_id indexes with composite
(follower_id, created_at) and (following_id, created_at) to cover
the list endpoint access patterns (ORDER BY created_at DESC).
"""

from typing import Sequence, Union
from alembic import op


revision: str = 'gggg'
down_revision: Union[str, None] = 'ffff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_follows_follower", table_name="follows")
    op.drop_index("ix_follows_following", table_name="follows")
    op.create_index(
        "ix_follows_follower_created_at",
        "follows",
        ["follower_id", "created_at"],
    )
    op.create_index(
        "ix_follows_following_created_at",
        "follows",
        ["following_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_follows_following_created_at", table_name="follows")
    op.drop_index("ix_follows_follower_created_at", table_name="follows")
    op.create_index("ix_follows_follower", "follows", ["follower_id"])
    op.create_index("ix_follows_following", "follows", ["following_id"])
