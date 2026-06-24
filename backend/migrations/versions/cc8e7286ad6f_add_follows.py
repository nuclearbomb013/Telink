"""add follows table

Revision ID: cc8e7286ad6f
Revises: bb7d6275ce5c
Create Date: 2026-06-24 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc8e7286ad6f'
down_revision: Union[str, None] = 'bb7d6275ce5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('follows',
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('following_id', sa.Integer(), nullable=False),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'following_id', name='uq_follows_pair'),
        sa.CheckConstraint('follower_id <> following_id', name='ck_follows_no_self'),
    )
    op.create_index(op.f('ix_follows_id'), 'follows', ['id'], unique=False)
    op.create_index('ix_follows_follower', 'follows', ['follower_id'], unique=False)
    op.create_index('ix_follows_following', 'follows', ['following_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_follows_following', table_name='follows')
    op.drop_index('ix_follows_follower', table_name='follows')
    op.drop_index(op.f('ix_follows_id'), table_name='follows')
    op.drop_table('follows')
