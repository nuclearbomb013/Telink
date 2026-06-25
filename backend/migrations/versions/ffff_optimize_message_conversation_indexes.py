"""optimize message conversation indexes

Revision ID: ffff
Revises: eeee
Create Date: 2026-06-26 08:00:00.000000

Add composite indexes to cover the conversation list access pattern:
- Latest visible message per partner (window function)
- Unread count per sender (group by)
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'ffff'
down_revision: Union[str, None] = 'eeee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_messages_sender_visible_latest",
        "messages",
        ["sender_id", "is_deleted", "deleted_by_sender", "receiver_id", "created_at", "id"],
    )
    op.create_index(
        "ix_messages_receiver_visible_latest",
        "messages",
        ["receiver_id", "is_deleted", "deleted_by_receiver", "sender_id", "created_at", "id"],
    )
    op.create_index(
        "ix_messages_unread_receiver_sender",
        "messages",
        ["receiver_id", "is_read", "is_deleted", "deleted_by_receiver", "sender_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_messages_unread_receiver_sender", table_name="messages")
    op.drop_index("ix_messages_receiver_visible_latest", table_name="messages")
    op.drop_index("ix_messages_sender_visible_latest", table_name="messages")
