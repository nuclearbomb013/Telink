"""
Reset database - Clear all data and re-seed initial data.

Usage:
    cd backend
    python scripts/reset_db.py

Options:
    --keep-users    Keep user accounts, only clear posts/comments/notifications
    --no-seed       Clear data only, don't re-seed
    --minimal       Empty forum mode: only admin account, no test data
    -y, --force     Skip confirmation prompt
"""
import json
import asyncio
import sys
import os
import argparse
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, select
from app.db.session import async_session_maker, engine, Base, init_db
from app.models.user import User, UserRole
from app.models.post import Post, PostTag
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.token_blacklist import TokenBlacklist
from app.core.security import PasswordManager

# Version file path (same location as in system.py)
VERSION_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_version.json")


def update_db_version():
    """
    Update the database version file.
    This signals frontend to clear localStorage cache.
    """
    version_data = {
        "version": datetime.now(timezone.utc).strftime("v%Y%m%d%H%M%S"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reset_at": datetime.now(timezone.utc).isoformat()
    }

    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(version_data, f, indent=2)

    print(f"  Updated database version: {version_data['version']}")


async def clear_all_data(keep_users: bool = False):
    """
    Clear all data from database.

    Args:
        keep_users: If True, keep user accounts
    """
    print("\n" + "=" * 50)
    print("  DATABASE RESET TOOL")
    print("=" * 50)
    print("\nClearing database...")

    async with async_session_maker() as db:
        try:
            # Clear in reverse order of dependencies
            # 1. Token blacklist (independent)
            result = await db.execute(text("DELETE FROM token_blacklist"))
            print(f"  Deleted {result.rowcount} tokens from blacklist")

            # 2. Refresh tokens (depends on users)
            result = await db.execute(text("DELETE FROM refresh_tokens"))
            print(f"  Deleted {result.rowcount} refresh tokens")

            # 3. Password reset tokens (depends on users)
            result = await db.execute(text("DELETE FROM password_reset_tokens"))
            print(f"  Deleted {result.rowcount} password reset tokens")

            # 4. Notifications (depends on users)
            result = await db.execute(text("DELETE FROM notifications"))
            print(f"  Deleted {result.rowcount} notifications")

            # 5. Comment likes (depends on comments and users)
            result = await db.execute(text("DELETE FROM comment_likes"))
            print(f"  Deleted {result.rowcount} comment likes")

            # 6. Comments (depends on posts and users)
            result = await db.execute(text("DELETE FROM comments"))
            print(f"  Deleted {result.rowcount} comments")

            # 7. Post likes (depends on posts and users)
            result = await db.execute(text("DELETE FROM post_likes"))
            print(f"  Deleted {result.rowcount} post likes")

            # 8. Post tags (depends on posts) - two separate tables
            # First: post_tags (Table-defined association table)
            result = await db.execute(text("DELETE FROM post_tags"))
            print(f"  Deleted {result.rowcount} post tags (post_tags)")
            # Second: post_tags_table (PostTag model)
            result = await db.execute(text("DELETE FROM post_tags_table"))
            print(f"  Deleted {result.rowcount} post tags (post_tags_table)")

            # 9. Posts (depends on users)
            result = await db.execute(text("DELETE FROM posts"))
            print(f"  Deleted {result.rowcount} posts")

            # 10. Users (optional)
            if not keep_users:
                result = await db.execute(text("DELETE FROM users"))
                print(f"  Deleted {result.rowcount} users")
            else:
                print("  Keeping user accounts")

            await db.commit()
            print("\nDatabase cleared successfully!")

        except Exception as e:
            await db.rollback()
            print(f"\nError clearing database: {e}")
            raise


async def seed_minimal_data():
    """Seed minimal data for empty forum - only admin account."""
    print("\nSeeding minimal data (empty forum mode)...")

    async with async_session_maker() as db:
        try:
            # Only create admin account
            result = await db.execute(select(User).where(User.username == "管理员"))
            admin = result.scalars().first()

            if not admin:
                admin = User(
                    username="管理员",
                    email="admin@techink.com",
                    password_hash=PasswordManager.hash_password("admin123"),
                    bio="TechInk 论坛管理员",
                    role=UserRole.ADMIN
                )
                db.add(admin)
                await db.flush()
                print("  Created admin user: 管理员")
            else:
                print("  Admin user already exists, skipping creation.")

            await db.commit()
            print("\nMinimal seed completed! Forum is now empty.")
            print("  Login: 管理员 / admin123")

        except Exception as e:
            await db.rollback()
            print(f"\nSeed failed: {e}")
            raise


async def seed_fresh_data():
    """Seed initial data after clearing, with idempotency checks."""
    print("\nSeeding fresh data...")

    async with async_session_maker() as db:
        try:
            # 1. 检查并按需创建管理员
            result = await db.execute(select(User).where(User.username == "管理员"))
            admin = result.scalars().first()
            
            if not admin:
                admin = User(
                    username="管理员",
                    email="admin@techink.com",
                    password_hash=PasswordManager.hash_password("admin123"),
                    bio="TechInk 论坛管理员",
                    role=UserRole.ADMIN
                )
                db.add(admin)
                await db.flush()
                print("  Created admin user: 管理员")
            else:
                print("  Admin user already exists, skipping creation.")

            # 2. 检查并按需创建测试用户
            result = await db.execute(select(User).where(User.username == "React 爱好者"))
            test_user = result.scalars().first()
            
            if not test_user:
                test_user = User(
                    username="React 爱好者",
                    email="react@example.com",
                    password_hash=PasswordManager.hash_password("user123"),
                    bio="前端开发，React 重度用户",
                    role=UserRole.USER
                )
                db.add(test_user)
                await db.flush()
                print("  Created test user: React 爱好者")
            else:
                print("  Test user already exists, skipping creation.")

            # 3. 创建初始帖子 (因为前面清空了posts，这里可以安全重建)
            welcome_post = Post(
                title="欢迎来到 TechInk 论坛！",
                slug="welcome-to-techink-forum",
                content="""# 欢迎来到 TechInk 论坛！\n\n大家好，我是 TechInk 的管理员。\n\n## 论坛规则\n\n1. **友善交流** - 请保持礼貌和尊重，不要人身攻击\n2. **相关主题** - 请发布与技术、编程、职业发展相关的内容\n3. **禁止灌水** - 请发布有质量的内容，避免无意义回复\n4. **保护隐私** - 不要泄露自己或他人的个人信息\n\n## 分类说明\n\n- **公告** - 官方公告和重要通知\n- **综合讨论** - 技术讨论、行业话题\n- **求助** - 遇到问题？来这里提问\n- **作品展示** - 分享你的项目和作品\n- **招聘求职** - 工作机会和求职信息\n\n希望大家在这里度过愉快的时光，共同成长！""",
                excerpt="欢迎来到 TechInk 论坛！请阅读论坛规则，祝大家交流愉快。",
                author_id=admin.id,  # 安全引用，无论 admin 是刚建的还是查出来的
                author_name=admin.username,
                category="announce",
                views=100,
                likes=10,
                reply_count=0,
                is_pinned=True
            )
            db.add(welcome_post)
            await db.flush()

            # 4. 添加标签 (created_at 由 BaseModel 默认值自动设置)
            for tag in ["公告", "新手指南"]:
                post_tag = PostTag(
                    post_id=welcome_post.id,
                    tag=tag,
                )
                db.add(post_tag)

            await db.commit()
            print("  Created welcome post and tags")
            print("\nSeed completed successfully!")

        except Exception as e:
            await db.rollback()
            print(f"\nSeed failed: {e}")
            raise


async def main():
    parser = argparse.ArgumentParser(description="Reset database")
    parser.add_argument("--keep-users", action="store_true", help="Keep user accounts")
    parser.add_argument("--no-seed", action="store_true", help="Clear data only, don't re-seed")
    parser.add_argument("--minimal", action="store_true", help="Empty forum mode: only admin, no test data")
    parser.add_argument("-y", "--force", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    # Confirm action (skip if --force)
    if not args.force:
        print("\n" + "!" * 50)
        print("  WARNING: This will DELETE ALL DATA in the database!")
        print("!" * 50)

        if args.keep_users:
            print("  (User accounts will be preserved)")
        if args.minimal:
            print("  (Minimal mode: only admin account will be created)")

        confirm = input("\nAre you sure? Type 'yes' to continue: ")
        if confirm.lower() != "yes":
            print("Cancelled.")
            return

    # Clear data
    await clear_all_data(keep_users=args.keep_users)

    # Re-seed based on mode
    if not args.no_seed:
        if args.minimal:
            await seed_minimal_data()
        else:
            await seed_fresh_data()

    # Update database version (signals frontend to clear cache)
    print("\nUpdating database version...")
    update_db_version()

    print("\n" + "=" * 50)
    print("  RESET COMPLETE")
    print("=" * 50)

    # Close database connection
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())