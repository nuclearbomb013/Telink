"""
Sync reply_count values for all posts.

This script recalculates the reply_count field for all posts
based on the actual number of non-deleted comments in the database.

Run this script when:
- reply_count values are out of sync with actual comment counts
- After database migrations or data imports
- When historical data needs to be corrected
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func, update
from app.db.session import async_session_maker
from app.models.post import Post
from app.models.comment import Comment


async def sync_reply_counts():
    """Recalculate reply_count for all posts based on actual non-deleted comments."""
    print("Starting reply_count sync...")
    print("-" * 50)

    async with async_session_maker() as db:
        # Get all posts with their actual comment count (excluding deleted comments)
        result = await db.execute(
            select(
                Post.id,
                Post.title,
                Post.reply_count,
                func.count(Comment.id).label('actual_count')
            )
            .outerjoin(Comment, (Comment.post_id == Post.id) & (Comment.is_deleted == 0))
            .group_by(Post.id)
            .order_by(Post.id)
        )

        posts = result.all()

        if not posts:
            print("No posts found in database.")
            return

        updated_count = 0
        mismatches = []

        for post_id, title, current_count, actual_count in posts:
            if current_count != actual_count:
                mismatches.append({
                    'id': post_id,
                    'title': title[:50] + '...' if len(title) > 50 else title,
                    'current': current_count,
                    'actual': actual_count,
                    'diff': actual_count - current_count
                })

                # Update the reply_count
                await db.execute(
                    update(Post)
                    .where(Post.id == post_id)
                    .values(reply_count=actual_count)
                )
                updated_count += 1

        await db.commit()

        # Print summary
        print(f"\nTotal posts checked: {len(posts)}")
        print(f"Posts with mismatches: {len(mismatches)}")
        print(f"Posts updated: {updated_count}")
        print("-" * 50)

        if mismatches:
            print("\nMismatch details:")
            print("-" * 50)
            for m in mismatches:
                print(f"Post #{m['id']}: '{m['title']}'")
                print(f"  Current: {m['current']}, Actual: {m['actual']}, Diff: {m['diff']:+d}")
            print("-" * 50)

        print("\nSync completed successfully!")


if __name__ == "__main__":
    asyncio.run(sync_reply_counts())