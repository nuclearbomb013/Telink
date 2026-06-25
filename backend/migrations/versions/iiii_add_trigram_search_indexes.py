"""add pg_trgm indexes for full-text search on articles, posts, users

Revision ID: iiii
Revises: hhhh
Create Date: 2026-06-26 13:00:00.000000

Uses PostgreSQL pg_trgm extension for efficient LIKE/ILIKE '%term%' queries.
Creates GIN indexes on title, excerpt, content, username, bio columns.
"""

from typing import Sequence, Union
from alembic import op


revision: str = 'iiii'
down_revision: Union[str, None] = 'hhhh'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pg_trgm extension
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Articles: search on title + excerpt
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_title_trgm "
        "ON articles USING gin (title gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_excerpt_trgm "
        "ON articles USING gin (excerpt gin_trgm_ops)"
    )

    # Posts: search on title + content excerpt
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_posts_title_trgm "
        "ON posts USING gin (title gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_posts_content_trgm "
        "ON posts USING gin (content gin_trgm_ops)"
    )

    # Users: search on username + bio
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_users_username_trgm "
        "ON users USING gin (username gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_users_bio_trgm "
        "ON users USING gin (bio gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_bio_trgm")
    op.execute("DROP INDEX IF EXISTS ix_users_username_trgm")
    op.execute("DROP INDEX IF EXISTS ix_posts_content_trgm")
    op.execute("DROP INDEX IF EXISTS ix_posts_title_trgm")
    op.execute("DROP INDEX IF EXISTS ix_articles_excerpt_trgm")
    op.execute("DROP INDEX IF EXISTS ix_articles_title_trgm")
