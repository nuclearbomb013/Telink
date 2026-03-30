"""
Fix Invalid Category Data

This script fixes posts with invalid category values in the database.

Valid categories: announce, general, help, showcase, jobs
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from app.db.session import async_session_maker, init_db
from app.models.post import Post


# Valid categories mapping
VALID_CATEGORIES = {
    'announce': 'announce',
    'general': 'general',
    'help': 'help',
    'showcase': 'showcase',
    'jobs': 'jobs',
    # Map invalid categories to valid ones
    'discussion': 'general',  # discussion -> general (综合讨论)
}


async def fix_invalid_categories():
    """
    Fix posts with invalid category values.
    """
    print("\n" + "=" * 50)
    print("Fix Invalid Category Data")
    print("=" * 50 + "\n")

    # Initialize database
    print("Initializing database...")
    await init_db()

    async with async_session_maker() as db:
        try:
            # Find all posts
            result = await db.execute(select(Post))
            posts = result.scalars().all()

            print(f"Total posts: {len(posts)}")

            # Find invalid categories
            invalid_posts = []
            for post in posts:
                if post.category not in VALID_CATEGORIES or post.category not in ['announce', 'general', 'help', 'showcase', 'jobs']:
                    invalid_posts.append(post)
                    print(f"  Found invalid category: post_id={post.id}, category='{post.category}'")

            if not invalid_posts:
                print("\nNo invalid categories found. Database is clean!")
                return

            print(f"\nFound {len(invalid_posts)} posts with invalid categories")

            # Fix invalid categories
            fixed_count = 0
            for post in invalid_posts:
                new_category = VALID_CATEGORIES.get(post.category, 'general')  # default to 'general'
                print(f"  Fixing post_id={post.id}: '{post.category}' -> '{new_category}'")

                await db.execute(
                    update(Post).where(Post.id == post.id).values(category=new_category)
                )
                fixed_count += 1

            await db.commit()

            print("\n" + "=" * 50)
            print(f"Fixed {fixed_count} posts successfully!")
            print("=" * 50 + "\n")

        except Exception as e:
            await db.rollback()
            print(f"\nFix failed: {e}")
            raise


def main():
    asyncio.run(fix_invalid_categories())


if __name__ == '__main__':
    main()