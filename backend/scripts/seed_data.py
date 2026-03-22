"""
Seed initial data for development and testing.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session_maker, init_db
from app.models.user import User
from app.models.post import Post, PostTag
from app.core.security import PasswordManager
from datetime import datetime


async def seed_data():
    """
    Seed initial data.
    """
    print("\nSeeding initial data...")

    # Initialize database
    await init_db()

    async with async_session_maker() as db:
        try:
            # Check if data already exists
            from sqlalchemy import select
            result = await db.execute(select(User))
            if result.scalar_one_or_none():
                print("  Database already has data, skipping seed...")
                return

            # Create admin user
            admin = User(
                username="管理员",
                email="admin@techink.com",
                password_hash=PasswordManager.hash_password("admin123"),
                bio="TechInk 论坛管理员",
                role="admin"
            )
            db.add(admin)
            await db.flush()

            # Create test user
            test_user = User(
                username="React 爱好者",
                email="react@example.com",
                password_hash=PasswordManager.hash_password("user123"),
                bio="前端开发，React 重度用户",
                role="user"
            )
            db.add(test_user)
            await db.flush()

            # Create welcome post
            welcome_post = Post(
                title="欢迎来到 TechInk 论坛！",
                slug="welcome-to-techink-forum",
                content="""# 欢迎来到 TechInk 论坛！

大家好，我是 TechInk 的管理员。

## 论坛规则

1. **友善交流** - 请保持礼貌和尊重，不要人身攻击
2. **相关主题** - 请发布与技术、编程、职业发展相关的内容
3. **禁止灌水** - 请发布有质量的内容，避免无意义回复
4. **保护隐私** - 不要泄露自己或他人的个人信息

## 分类说明

- 📢 **公告** - 官方公告和重要通知
- 💬 **综合讨论** - 技术讨论、行业话题
- ❓ **求助** - 遇到问题？来这里提问
- ✨ **作品展示** - 分享你的项目和作品
- 💼 **招聘求职** - 工作机会和求职信息

希望大家在这里度过愉快的时光，共同成长！""",
                excerpt="欢迎来到 TechInk 论坛！请阅读论坛规则，祝大家交流愉快。",
                author_id=admin.id,
                author_name=admin.username,
                category="announce",
                views=100,
                likes=10,
                reply_count=0,
                is_pinned=True
            )
            db.add(welcome_post)
            await db.flush()

            # Add tags to welcome post
            for tag in ["公告", "新手指南"]:
                post_tag = PostTag(
                    post_id=welcome_post.id,
                    tag=tag,
                    created_at=int(datetime.utcnow().timestamp() * 1000)
                )
                db.add(post_tag)

            await db.commit()

            print("  Created admin user: 管理员 / admin123")
            print("  Created test user: React 爱好者 / user123")
            print("  Created welcome post")
            print("\nSeed completed successfully!")

        except Exception as e:
            await db.rollback()
            print(f"\nSeed failed: {e}")
            raise


def main():
    asyncio.run(seed_data())


if __name__ == '__main__':
    main()