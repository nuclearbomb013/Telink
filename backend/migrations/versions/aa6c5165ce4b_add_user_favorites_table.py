"""add user_favorites table

Revision ID: aa6c5165ce4b
Revises: 0001_add_moments
Create Date: 2026-06-13 22:40:03.169628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa6c5165ce4b'
down_revision: Union[str, None] = '0001_add_moments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_favorites',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('content_type', sa.String(length=20), nullable=False),
    sa.Column('content_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=500), nullable=True),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'content_type', 'content_id', name='uq_favorites_user_content')
    )
    op.create_index(op.f('ix_user_favorites_content_id'), 'user_favorites', ['content_id'], unique=False)
    op.create_index(op.f('ix_user_favorites_content_type'), 'user_favorites', ['content_type'], unique=False)
    op.create_index(op.f('ix_user_favorites_id'), 'user_favorites', ['id'], unique=False)
    op.create_index(op.f('ix_user_favorites_user_id'), 'user_favorites', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_favorites_user_id'), table_name='user_favorites')
    op.drop_index(op.f('ix_user_favorites_id'), table_name='user_favorites')
    op.drop_index(op.f('ix_user_favorites_content_type'), table_name='user_favorites')
    op.drop_index(op.f('ix_user_favorites_content_id'), table_name='user_favorites')
    op.drop_table('user_favorites')
