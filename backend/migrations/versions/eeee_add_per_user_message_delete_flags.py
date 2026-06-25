"""add per-user message delete flags

Revision ID: eeee
Revises: dddd
Create Date: 2026-06-25 20:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'eeee'
down_revision: Union[str, None] = 'dddd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'messages',
        sa.Column('deleted_by_sender', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column(
        'messages',
        sa.Column('deleted_by_receiver', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('messages', 'deleted_by_receiver')
    op.drop_column('messages', 'deleted_by_sender')
