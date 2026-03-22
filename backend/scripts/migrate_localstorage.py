"""
Data Migration Script: localStorage -> PostgreSQL

This script reads exported JSON data from localStorage and imports it into PostgreSQL.

Usage:
    1. Export data from browser console:
       const exportData = {
           users: JSON.parse(localStorage.getItem('techink_auth_users') || '[]'),
           posts: JSON.parse(localStorage.getItem('techink_forum_posts') || '[]'),
           comments: JSON.parse(localStorage.getItem('techink_forum_comments') || '[]'),
           notifications: JSON.parse(localStorage.getItem('techink_notifications') || '[]'),
       };
       console.log(JSON.stringify(exportData, null, 2));

    2. Save the output to exported_data.json

    3. Run migration:
       python scripts/migrate_localstorage.py --input ./exported_data.json
"""

import argparse
import json
import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import async_session_maker, init_db
from app.models.user import User, RefreshToken
from app.models.post import Post, PostTag, PostLike
from app.models.comment import Comment, CommentLike
from app.models.notification import Notification
from app.core.security import TokenManager, PasswordManager


def timestamp_to_datetime(ts):
    """Convert JavaScript timestamp (ms) to Python datetime."""
    if ts is None:
        return datetime.utcnow()
    if isinstance(ts, (int, float)):
        # JavaScript timestamps are in milliseconds
        return datetime.fromtimestamp(ts / 1000)
    return datetime.utcnow()


async def migrate_users(db, users_data: list) -> dict:
    """
    Migrate users and return ID mapping.

    Returns:
        dict: Mapping from old user ID to new user ID
    """
    id_mapping = {}
    migrated = 0

    for user_data in users_data:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.username == user_data.get('username'))
        )
        existing = result.scalar_one_or_none()

        if existing:
            id_mapping[user_data['id']] = existing.id
            print(f"  User '{user_data.get('username')}' already exists, skipping...")
            continue

        # Create user
        user = User(
            id=user_data['id'],
            username=user_data['username'],
            email=user_data.get('email', f"{user_data['username']}@techink.com"),
            password_hash=PasswordManager.hash_password(
                user_data.get('password', 'default123')
            ),
            avatar=user_data.get('avatar'),
            bio=user_data.get('bio'),
            role=user_data.get('role', 'user'),
            post_count=user_data.get('postCount', 0),
            comment_count=user_data.get('commentCount', 0),
            like_count=user_data.get('likeCount', 0),
            created_at=timestamp_to_datetime(user_data.get('joinedAt')),
            is_active=True
        )

        db.add(user)
        id_mapping[user_data['id']] = user.id
        migrated += 1

    await db.commit()
    print(f"  Migrated {migrated} users")
    return id_mapping


async def migrate_posts(db, posts_data: list, user_id_mapping: dict) -> dict:
    """
    Migrate posts and return ID mapping.
    """
    id_mapping = {}
    migrated = 0

    for post_data in posts_data:
        # Get author ID from mapping
        author_id = user_id_mapping.get(post_data.get('authorId'), 1)

        # Get author info
        result = await db.execute(select(User).where(User.id == author_id))
        author = result.scalar_one_or_none()

        # Create post
        post = Post(
            id=post_data['id'],
            title=post_data['title'],
            slug=post_data.get('slug', post_data['title'].lower().replace(' ', '-')),
            content=post_data['content'],
            excerpt=post_data.get('excerpt'),
            cover_image=post_data.get('coverImage'),
            author_id=author_id,
            author_name=author.username if author else post_data.get('authorName', 'Unknown'),
            author_avatar=author.avatar if author else post_data.get('authorAvatar'),
            category=post_data.get('category', 'general'),
            views=post_data.get('views', 0),
            likes=post_data.get('likes', 0),
            reply_count=post_data.get('replyCount', 0),
            is_pinned=post_data.get('isPinned', False),
            is_locked=post_data.get('isLocked', False),
            created_at=timestamp_to_datetime(post_data.get('createdAt')),
            updated_at=timestamp_to_datetime(post_data.get('updatedAt')) if post_data.get('updatedAt') else None
        )

        db.add(post)
        await db.flush()

        # Add tags
        tags = post_data.get('tags', [])
        for tag in tags:
            if tag.strip():
                post_tag = PostTag(
                    post_id=post.id,
                    tag=tag.strip(),
                    created_at=int(datetime.utcnow().timestamp() * 1000)
                )
                db.add(post_tag)

        id_mapping[post_data['id']] = post.id
        migrated += 1

    await db.commit()
    print(f"  Migrated {migrated} posts")
    return id_mapping


async def migrate_comments(db, comments_data: list, user_id_mapping: dict, post_id_mapping: dict):
    """
    Migrate comments.
    """
    migrated = 0

    for comment_data in comments_data:
        # Get IDs from mappings
        author_id = user_id_mapping.get(comment_data.get('authorId'), 1)
        post_id = post_id_mapping.get(comment_data.get('postId'), 1)

        # Get author info
        result = await db.execute(select(User).where(User.id == author_id))
        author = result.scalar_one_or_none()

        # Create comment
        comment = Comment(
            id=comment_data['id'],
            post_id=post_id,
            author_id=author_id,
            author_name=author.username if author else comment_data.get('authorName', 'Unknown'),
            author_avatar=author.avatar if author else comment_data.get('authorAvatar'),
            content=comment_data['content'],
            likes=comment_data.get('likes', 0),
            parent_id=comment_data.get('parentId'),
            reply_to_id=comment_data.get('replyToId'),
            reply_to_name=comment_data.get('replyToName'),
            created_at=timestamp_to_datetime(comment_data.get('createdAt')),
            updated_at=timestamp_to_datetime(comment_data.get('updatedAt')) if comment_data.get('updatedAt') else None
        )

        db.add(comment)
        migrated += 1

    await db.commit()
    print(f"  Migrated {migrated} comments")


async def migrate_notifications(db, notifications_data: list, user_id_mapping: dict):
    """
    Migrate notifications.
    """
    migrated = 0

    for notif_data in notifications_data:
        # Default to first user if not specified
        user_id = user_id_mapping.get(1, 1)

        notification = Notification(
            id=notif_data['id'],
            user_id=user_id,
            type=notif_data.get('type', 'info'),
            title=notif_data['title'],
            message=notif_data['message'],
            link=notif_data.get('actionUrl'),
            is_read=notif_data.get('read', False),
            created_at=timestamp_to_datetime(notif_data.get('createdAt'))
        )

        db.add(notification)
        migrated += 1

    await db.commit()
    print(f"  Migrated {migrated} notifications")


async def run_migration(input_file: str):
    """
    Run the full migration process.
    """
    print(f"\n{'='*50}")
    print("TechInk Data Migration")
    print(f"{'='*50}\n")

    # Load exported data
    print(f"Loading data from: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    users_data = data.get('users', [])
    posts_data = data.get('posts', [])
    comments_data = data.get('comments', [])
    notifications_data = data.get('notifications', [])

    print(f"  Users: {len(users_data)}")
    print(f"  Posts: {len(posts_data)}")
    print(f"  Comments: {len(comments_data)}")
    print(f"  Notifications: {len(notifications_data)}")

    # Initialize database
    print("\nInitializing database...")
    await init_db()

    # Run migration
    async with async_session_maker() as db:
        try:
            print("\nMigrating data...")

            # Migrate in order (respecting foreign keys)
            user_id_mapping = await migrate_users(db, users_data)
            post_id_mapping = await migrate_posts(db, posts_data, user_id_mapping)
            await migrate_comments(db, comments_data, user_id_mapping, post_id_mapping)
            await migrate_notifications(db, notifications_data, user_id_mapping)

            print("\n" + "="*50)
            print("Migration completed successfully!")
            print("="*50 + "\n")

        except Exception as e:
            await db.rollback()
            print(f"\nMigration failed: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(description='Migrate localStorage data to PostgreSQL')
    parser.add_argument(
        '--input',
        required=True,
        help='Path to exported JSON file'
    )
    args = parser.parse_args()

    asyncio.run(run_migration(args.input))


if __name__ == '__main__':
    main()