"""add list performance indexes for moments, posts, articles, notifications, favorites

Revision ID: hhhh
Revises: gggg
Create Date: 2026-06-26 11:00:00.000000

Composite indexes covering common list access patterns:
- moments: (is_deleted, visibility, created_at), (is_deleted, author_id, created_at), (is_deleted, likes, created_at)
- posts: (category, is_pinned, created_at), (is_pinned, created_at), (views, created_at), (likes, created_at)
- articles: (status, created_at), (status, category, created_at), (status, views, created_at)
- notifications: (user_id, is_read, created_at), (user_id, created_at)
- favorites: (user_id, content_type, created_at)
"""

from typing import Sequence, Union
from alembic import op


revision: str = 'hhhh'
down_revision: Union[str, None] = 'gggg'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Moments ──
    op.create_index("ix_moments_active_feed", "moments", ["is_deleted", "visibility", "created_at"])
    op.create_index("ix_moments_author_feed", "moments", ["is_deleted", "author_id", "created_at"])
    op.create_index("ix_moments_popular_feed", "moments", ["is_deleted", "likes", "created_at"])

    # ── Posts ──
    op.create_index("ix_posts_category_pinned", "posts", ["category", "is_pinned", "created_at"])
    op.create_index("ix_posts_pinned_created", "posts", ["is_pinned", "created_at"])
    op.create_index("ix_posts_views_created", "posts", ["views", "created_at"])
    op.create_index("ix_posts_likes_created", "posts", ["likes", "created_at"])

    # ── Articles ──
    op.create_index("ix_articles_status_created", "articles", ["status", "created_at"])
    op.create_index("ix_articles_status_category_created", "articles", ["status", "category", "created_at"])
    op.create_index("ix_articles_status_views_created", "articles", ["status", "views", "created_at"])

    # ── Notifications ──
    op.create_index("ix_notifications_user_read_created", "notifications", ["user_id", "is_read", "created_at"])
    op.create_index("ix_notifications_user_created", "notifications", ["user_id", "created_at"])

    # ── Favorites ──
    op.create_index("ix_user_favorites_user_type_created", "user_favorites", ["user_id", "content_type", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_user_favorites_user_type_created", table_name="user_favorites")
    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_index("ix_notifications_user_read_created", table_name="notifications")
    op.drop_index("ix_articles_status_views_created", table_name="articles")
    op.drop_index("ix_articles_status_category_created", table_name="articles")
    op.drop_index("ix_articles_status_created", table_name="articles")
    op.drop_index("ix_posts_likes_created", table_name="posts")
    op.drop_index("ix_posts_views_created", table_name="posts")
    op.drop_index("ix_posts_pinned_created", table_name="posts")
    op.drop_index("ix_posts_category_pinned", table_name="posts")
    op.drop_index("ix_moments_popular_feed", table_name="moments")
    op.drop_index("ix_moments_author_feed", table_name="moments")
    op.drop_index("ix_moments_active_feed", table_name="moments")
