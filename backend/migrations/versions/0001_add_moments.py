"""add moments tables

Revision ID: 0001_add_moments
Revises:
Create Date: 2026-05-31

Add moments, moment_likes, moment_comments tables for social feed feature.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0001_add_moments'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create moments tables."""
    # Create moments table
    op.create_table(
        'moments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_name', sa.String(length=50), nullable=False),
        sa.Column('author_avatar', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(length=20), nullable=False, server_default='text'),
        sa.Column('code_snippet', postgresql.JSON(), nullable=True),
        sa.Column('images', postgresql.JSON(), nullable=True),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='public'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_moments_author_id', 'moments', ['author_id'])
    op.create_index('ix_moments_id', 'moments', ['id'])

    # Create moment likes table
    op.create_table(
        'moment_likes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('moment_id', sa.Integer(), sa.ForeignKey('moments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'moment_id', name='uq_moment_likes_user_moment')
    )
    op.create_index('ix_moment_likes_moment_id', 'moment_likes', ['moment_id'])
    op.create_index('ix_moment_likes_user_id', 'moment_likes', ['user_id'])

    # Create moment comments table
    op.create_table(
        'moment_comments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('moment_id', sa.Integer(), sa.ForeignKey('moments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_name', sa.String(length=50), nullable=False),
        sa.Column('author_avatar', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reply_to_id', sa.Integer(), sa.ForeignKey('moment_comments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reply_to_name', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_moment_comments_moment_id', 'moment_comments', ['moment_id'])
    op.create_index('ix_moment_comments_author_id', 'moment_comments', ['author_id'])


def downgrade() -> None:
    """Remove moments tables."""
    op.drop_table('moment_comments')
    op.drop_table('moment_likes')
    op.drop_table('moments')
