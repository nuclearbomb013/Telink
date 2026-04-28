"""
System Information API
Provides database version for cache synchronization and admin tools.
"""

import os
import json
import re
from typing import Any, Dict, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.post import Post, PostTag
from app.models.comment import Comment
from app.schemas import ServiceResponse

router = APIRouter(prefix="/system", tags=["System"])

# Version file path (stored in backend directory)
VERSION_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data_version.json")


class SystemInfoResponse(BaseModel):
    """System information response."""
    version: str
    db_version: str
    db_timestamp: str
    app_name: str


def get_db_version() -> dict:
    """
    Get database version from file.
    Returns default if file doesn't exist.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        if os.path.exists(VERSION_FILE):
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.debug("Could not read version file: %s", e)

    # Return default version (app startup time)
    return {
        "version": "v1",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/info", response_model=SystemInfoResponse)
async def get_system_info():
    """
    Get system information including database version.

    Frontend should check db_version periodically and clear localStorage
    cache when version changes (e.g., after database reset).
    """
    from app.config import settings

    db_info = get_db_version()

    return SystemInfoResponse(
        version=settings.APP_VERSION,
        db_version=db_info.get("version", "v1"),
        db_timestamp=db_info.get("timestamp", ""),
        app_name=settings.APP_NAME
    )


class SyncReplyCountResponse(BaseModel):
    """Response for reply_count sync operation."""
    total_posts: int
    updated_posts: int
    mismatches: list


@router.post("/sync-reply-counts", response_model=ServiceResponse[SyncReplyCountResponse])
async def sync_reply_counts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sync reply_count values for all posts.
    Recalculates based on actual non-deleted comments.

    Requires admin privileges.
    """
    # Check admin permission
    if current_user.role.value != UserRole.ADMIN.value:
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "Admin privileges required"}
        )

    return await _do_sync_reply_counts(db)


@router.post("/sync-reply-counts-public", response_model=ServiceResponse[SyncReplyCountResponse])
async def sync_reply_counts_public(
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint for sync reply_count values (development only).
    Recalculates based on actual non-deleted comments.
    """
    return await _do_sync_reply_counts(db)


async def _do_sync_reply_counts(db: AsyncSession) -> ServiceResponse[SyncReplyCountResponse]:
    """Internal function to sync reply counts."""
    # Get all posts with their actual comment count (excluding deleted)
    result = await db.execute(
        select(
            Post.id,
            Post.reply_count,
            func.count(Comment.id).label('actual_count')
        )
        .outerjoin(Comment, (Comment.post_id == Post.id) & (Comment.is_deleted == 0))
        .group_by(Post.id)
        .order_by(Post.id)
    )

    posts = result.all()
    updated_count = 0
    mismatches = []

    for post_id, current_count, actual_count in posts:
        if current_count != actual_count:
            mismatches.append({
                "post_id": post_id,
                "old_count": current_count,
                "new_count": actual_count
            })

            # Update the reply_count
            await db.execute(
                update(Post)
                .where(Post.id == post_id)
                .values(reply_count=actual_count)
            )
            updated_count += 1

    await db.commit()

    return ServiceResponse(
        success=True,
        data=SyncReplyCountResponse(
            total_posts=len(posts),
            updated_posts=updated_count,
            mismatches=mismatches
        )
    )


class SeedDemoDataResponse(BaseModel):
    """Response for demo data seeding."""
    posts_created: int
    comments_created: int
    message: str


@router.post("/seed-demo-data", response_model=ServiceResponse[SeedDemoDataResponse])
async def seed_demo_data(
    db: AsyncSession = Depends(get_db)
):
    """
    Create demo posts with comments for testing.
    Only creates data if there are fewer than 5 posts.
    """
    # Check if we need to create demo data
    result = await db.execute(select(func.count(Post.id)))
    post_count = result.scalar()

    if post_count is not None and post_count >= 5:
        return ServiceResponse(
            success=True,
            data=SeedDemoDataResponse(
                posts_created=0,
                comments_created=0,
                message=f"Already has {post_count} posts, skipping demo data creation"
            )
        )

    # Get users for demo data
    result = await db.execute(select(User).limit(2))
    users: List[User] = list(result.scalars().all())

    if len(users) < 2:
        return ServiceResponse(
            success=False,
            error={"code": "NO_USERS", "message": "Need at least 2 users for demo data"}
        )

    admin_user = users[0]
    test_user = users[1] if len(users) > 1 else users[0]

    # Demo posts data
    demo_posts: List[Dict[str, Any]] = [
        {
            "title": "React 19 新特性讨论",
            "content": "# React 19 新特性\n\nReact 19 带来了许多令人兴奋的新特性：\n\n## 1. 自动批处理\n状态更新现在会自动批处理，减少不必要的重新渲染。\n\n## 2. 服务端组件\n支持服务端组件，可以显著提升首屏加载速度。\n\n## 3. 新的 Hook API\n引入了 `useOptimistic` 和 `useFormStatus` 等新 Hook。\n\n大家对这些新特性有什么看法？",
            "excerpt": "React 19 带来了许多令人兴奋的新特性，包括自动批处理、服务端组件等。",
            "category": "general",
            "tags": ["React", "前端", "技术讨论"],
            "views": 50,
            "likes": 5,
        },
        {
            "title": "求助：Tailwind CSS 配置问题",
            "content": "# Tailwind CSS 配置问题求助\n\n大家好，我在配置 Tailwind CSS 时遇到了一些问题。\n\n## 问题描述\n我想自定义品牌颜色，但在 `tailwind.config.js` 中配置后不起作用。\n\n```javascript\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n          primary: '#1a1a1a',\n          secondary: '#f5f5f5',\n        }\n      }\n    }\n  }\n}\n```\n\n## 尝试的方法\n1. 重启开发服务器\n2. 清除缓存\n3. 检查 CSS 文件导入顺序\n\n都没有解决问题。请问大家有遇到类似的情况吗？",
            "excerpt": "在配置 Tailwind CSS 自定义颜色时遇到问题，配置后不起作用。",
            "category": "help",
            "tags": ["Tailwind", "CSS", "求助"],
            "views": 30,
            "likes": 2,
        },
        {
            "title": "分享我的新项目：墨水屏风格博客",
            "content": "# 分享我的新项目\n\n最近完成了一个墨水屏风格的博客项目，采用黑白极简设计。\n\n## 技术栈\n- React 19\n- TypeScript\n- Tailwind CSS\n- Vite\n\n## 特点\n1. **黑白墨水屏风格** - 模拟墨水屏的视觉效果\n2. **GSAP 动画** - 流畅的滚动和过渡动画\n3. **响应式设计** - 完美适配各种设备\n\n## 截图\n![首页截图](https://example.com/screenshot.png)\n\n欢迎大家访问体验！",
            "excerpt": "分享一个墨水屏风格的博客项目，采用黑白极简设计和 React 19 技术栈。",
            "category": "showcase",
            "tags": ["项目分享", "React", "设计"],
            "views": 80,
            "likes": 15,
        },
        {
            "title": "前端开发工程师招聘",
            "content": "# 前端开发工程师招聘\n\n## 公司介绍\n我们是一家专注于教育科技的创业公司，正在寻找优秀的前端开发工程师加入。\n\n## 岗位要求\n- 3年以上前端开发经验\n- 熟悉 React/Vue 等现代前端框架\n- 了解 TypeScript\n- 有良好的代码习惯和团队协作能力\n\n## 工作地点\n北京/远程\n\n## 薪资范围\n20-35K\n\n有意者请私信联系！",
            "excerpt": "招聘前端开发工程师，要求3年以上经验，熟悉 React/Vue，薪资 20-35K。",
            "category": "jobs",
            "tags": ["招聘", "前端", "北京"],
            "views": 45,
            "likes": 8,
        },
    ]

    posts_created = 0
    comments_created = 0

    for i, post_data in enumerate(demo_posts):
        # Create unique slug (simple slugify)
        base_slug = re.sub(r'[^\w\s-]', '', post_data["title"].lower())
        base_slug = re.sub(r'[\s_-]+', '-', base_slug)
        base_slug = re.sub(r'^-+|-+$', '', base_slug)
        slug = f"{base_slug}-{i+1}"

        # Create post
        post = Post(
            title=post_data["title"],
            slug=slug,
            content=post_data["content"],
            excerpt=post_data["excerpt"],
            author_id=admin_user.id,
            author_name=admin_user.username,
            category=post_data["category"],
            views=post_data["views"],
            likes=post_data["likes"],
            reply_count=0,
            created_at=datetime.utcnow() - timedelta(days=i+1),
        )
        db.add(post)
        await db.flush()
        posts_created += 1

        # Add tags
        for tag in post_data["tags"]:
            post_tag = PostTag(post_id=post.id, tag=tag)
            db.add(post_tag)

        # Create comments for each post
        demo_comments = [
            {
                "content": "感谢分享！这个帖子很有帮助。",
                "author": test_user,
            },
            {
                "content": "我也遇到了类似的问题，后来发现是配置文件格式的问题。",
                "author": admin_user if post_data["category"] == "help" else test_user,
            },
        ]

        for j, comment_data in enumerate(demo_comments):
            author: User = comment_data["author"]  # type: ignore[assignment]
            comment = Comment(
                post_id=post.id,
                author_id=author.id,
                author_name=author.username,
                content=comment_data["content"],
                likes=j,
                created_at=datetime.utcnow() - timedelta(days=i+1, hours=j),
            )
            db.add(comment)
            comments_created += 1

        # Update reply count
        post.reply_count = len(demo_comments)

    await db.commit()

    return ServiceResponse(
        success=True,
        data=SeedDemoDataResponse(
            posts_created=posts_created,
            comments_created=comments_created,
            message=f"Created {posts_created} posts with {comments_created} comments"
        )
    )