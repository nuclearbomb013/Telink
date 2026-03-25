"""
Forum Post API Endpoints
"""

import re
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.post import Post, PostTag, PostLike
from app.schemas import (
    ServiceResponse,
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    PostListResult,
    PostStats
)

router = APIRouter(prefix="/forum", tags=["Forum"])


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    # Convert to lowercase
    slug = title.lower()
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove special characters
    slug = re.sub(r'[^\w\-\u4e00-\u9fa5]', '', slug)
    # Remove consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Trim hyphens from ends
    slug = slug.strip('-')
    return slug[:100] or 'post'


async def get_unique_slug(db: AsyncSession, title: str, max_attempts: int = 10) -> str:
    """
    Generate unique slug for post.

    Uses database-level unique constraint and retry mechanism to handle race conditions.
    If a race condition occurs, the caller should retry with a new slug.
    """
    base_slug = generate_slug(title)
    # Add random suffix to reduce collision probability in concurrent scenarios
    slug = base_slug
    counter = 1

    for attempt in range(max_attempts):
        result = await db.execute(select(Post).where(Post.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        counter += 1
        # Add random component to reduce collision in concurrent creates
        if attempt > 0:
            slug = f"{base_slug}-{counter}-{secrets.randbelow(900) + 100}"
        else:
            slug = f"{base_slug}-{counter}"

    # Fallback: use timestamp-based unique slug
    return f"{base_slug}-{int(datetime.now(timezone.utc).timestamp())}"


async def get_unique_slug_for_update(
    db: AsyncSession, title: str, exclude_post_id: int, max_attempts: int = 10
) -> str:
    """
    Generate unique slug for post update, excluding the current post.

    This prevents self-collision when editing a post's title.
    """
    base_slug = generate_slug(title)
    slug = base_slug
    counter = 1

    for attempt in range(max_attempts):
        # Exclude current post from the check
        result = await db.execute(
            select(Post).where(Post.slug == slug, Post.id != exclude_post_id)
        )
        if not result.scalar_one_or_none():
            return slug
        counter += 1
        if attempt > 0:
            slug = f"{base_slug}-{counter}-{secrets.randbelow(900) + 100}"
        else:
            slug = f"{base_slug}-{counter}"

    return f"{base_slug}-{int(datetime.now(timezone.utc).timestamp())}"


@router.get("/posts", response_model=ServiceResponse[PostListResult])
async def get_posts(
    category: Optional[str] = Query(None),
    sortBy: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of posts.

    Supports filtering by category, searching, and sorting.
    """
    # Base query
    query = select(Post)

    # Filter by category
    if category and category != "all":
        query = query.where(Post.category == category)

    # Search
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Post.title.ilike(search_term),
                Post.content.ilike(search_term)
            )
        )

    # Filter by tags
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            # Join with post_tags
            from sqlalchemy import exists
            for tag in tag_list:
                query = query.where(
                    exists().where(
                        PostTag.post_id == Post.id,
                        PostTag.tag == tag
                    )
                )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    if sortBy == "oldest":
        query = query.order_by(Post.created_at.asc())
    elif sortBy == "popular":
        query = query.order_by(Post.views.desc())
    elif sortBy == "liked":
        query = query.order_by(Post.likes.desc())
    else:
        # Default: newest first, pinned at top
        query = query.order_by(Post.is_pinned.desc(), Post.created_at.desc())

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    posts = result.scalars().all()

    # Get tags for each post
    post_list = []
    for post in posts:
        # Get tags
        tag_result = await db.execute(select(PostTag).where(PostTag.post_id == post.id))
        post_tags = tag_result.scalars().all()

        post_list.append(PostListResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            cover_image=post.cover_image,
            author_id=post.author_id,
            author_name=post.author_name,
            author_avatar=post.author_avatar,
            category=post.category,
            tags=[t.tag for t in post_tags],
            views=post.views,
            likes=post.likes,
            reply_count=post.reply_count,
            is_pinned=post.is_pinned,
            created_at=int(post.created_at.timestamp() * 1000)
        ))

    total_pages = (total + limit - 1) // limit

    return ServiceResponse(
        success=True,
        data=PostListResult(
            posts=post_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.get("/posts/slug/{slug}", response_model=ServiceResponse[PostResponse])
async def get_post_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get post by slug.
    """
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Increment view count atomically to avoid race conditions
    await db.execute(
        update(Post).where(Post.id == post.id).values(views=Post.views + 1)
    )
    await db.commit()
    # Refresh to get updated view count
    await db.refresh(post)

    # Get tags
    tag_result = await db.execute(select(PostTag).where(PostTag.post_id == post.id))
    post_tags = tag_result.scalars().all()

    return ServiceResponse(
        success=True,
        data=PostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            content=post.content,
            excerpt=post.excerpt,
            cover_image=post.cover_image,
            author_id=post.author_id,
            author_name=post.author_name,
            author_avatar=post.author_avatar,
            category=post.category,
            tags=[t.tag for t in post_tags],
            views=post.views,
            likes=post.likes,
            reply_count=post.reply_count,
            is_pinned=post.is_pinned,
            is_locked=post.is_locked,
            is_featured=post.is_featured,
            is_solved=post.is_solved,
            created_at=int(post.created_at.timestamp() * 1000),
            updated_at=int(post.updated_at.timestamp() * 1000) if post.updated_at else None
        )
    )


@router.get("/posts/{post_id}", response_model=ServiceResponse[PostResponse])
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get post by ID.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Increment view count atomically to avoid race conditions
    await db.execute(
        update(Post).where(Post.id == post_id).values(views=Post.views + 1)
    )
    await db.commit()
    # Refresh to get updated view count
    await db.refresh(post)

    # Get tags
    tag_result = await db.execute(select(PostTag).where(PostTag.post_id == post.id))
    post_tags = tag_result.scalars().all()

    return ServiceResponse(
        success=True,
        data=PostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            content=post.content,
            excerpt=post.excerpt,
            cover_image=post.cover_image,
            author_id=post.author_id,
            author_name=post.author_name,
            author_avatar=post.author_avatar,
            category=post.category,
            tags=[t.tag for t in post_tags],
            views=post.views,
            likes=post.likes,
            reply_count=post.reply_count,
            is_pinned=post.is_pinned,
            is_locked=post.is_locked,
            is_featured=post.is_featured,
            is_solved=post.is_solved,
            created_at=int(post.created_at.timestamp() * 1000),
            updated_at=int(post.updated_at.timestamp() * 1000) if post.updated_at else None
        )
    )


@router.post("/posts", response_model=ServiceResponse[PostResponse])
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new post.

    Requires authentication.
    Uses retry mechanism to handle slug race conditions.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Retry mechanism for slug race condition
    max_retries = 3

    for attempt in range(max_retries):
        try:
            # Generate unique slug
            slug = await get_unique_slug(db, post_data.title)

            # Create post
            post = Post(
                title=post_data.title,
                slug=slug,
                content=post_data.content,
                excerpt=post_data.excerpt,
                cover_image=post_data.cover_image,
                author_id=current_user.id,
                author_name=current_user.username,
                author_avatar=current_user.avatar,
                category=post_data.category
            )
            db.add(post)
            await db.flush()

            # Add tags
            if post_data.tags:
                for tag in post_data.tags:
                    if tag.strip():
                        post_tag = PostTag(
                            post_id=post.id,
                            tag=tag.strip()
                        )
                        db.add(post_tag)

            # Update user post count
            current_user.post_count += 1

            await db.commit()
            await db.refresh(post)

            return ServiceResponse(
                success=True,
                data=PostResponse(
                    id=post.id,
                    title=post.title,
                    slug=post.slug,
                    content=post.content,
                    excerpt=post.excerpt,
                    cover_image=post.cover_image,
                    author_id=post.author_id,
                    author_name=post.author_name,
                    author_avatar=post.author_avatar,
                    category=post.category,
                    tags=post_data.tags or [],
                    views=post.views,
                    likes=post.likes,
                    reply_count=post.reply_count,
                    is_pinned=post.is_pinned,
                    is_locked=post.is_locked,
                    is_featured=post.is_featured,
                    is_solved=post.is_solved,
                    created_at=int(post.created_at.timestamp() * 1000)
                )
            )
        except IntegrityError:
            # Slug conflict - rollback and retry
            await db.rollback()
            if attempt < max_retries - 1:
                continue
            # Max retries reached
            return ServiceResponse(
                success=False,
                error={
                    "code": "SLUG_CONFLICT",
                    "message": "Failed to generate unique slug after multiple attempts"
                }
            )


@router.put("/posts/{post_id}", response_model=ServiceResponse[PostResponse])
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a post.

    Only author or admin can update.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Check permission
    if post.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
        )

    # Update fields
    if post_data.title:
        post.title = post_data.title
        # Generate normalized slug from new title
        new_slug = generate_slug(post_data.title)
        # Only update slug if the normalized form differs from current slug
        if new_slug != post.slug:
            # Check if there's a conflict with another post
            result = await db.execute(
                select(Post).where(Post.slug == new_slug, Post.id != post.id)
            )
            if result.scalar_one_or_none():
                # Conflict with another post, need unique slug
                post.slug = await get_unique_slug_for_update(
                    db, post_data.title, post.id
                )
            else:
                # No conflict, use the new slug
                post.slug = new_slug

    if post_data.content:
        post.content = post_data.content

    if post_data.excerpt is not None:
        post.excerpt = post_data.excerpt

    if post_data.cover_image is not None:
        post.cover_image = post_data.cover_image

    if post_data.category:
        post.category = post_data.category

    post.updated_at = datetime.now(timezone.utc)

    # Update tags
    if post_data.tags is not None:
        # Remove existing tags
        await db.execute(select(PostTag).where(PostTag.post_id == post.id))
        existing_tags = (await db.execute(
            select(PostTag).where(PostTag.post_id == post.id)
        )).scalars().all()

        for tag in existing_tags:
            await db.delete(tag)

        # Add new tags
        for tag in post_data.tags:
            if tag.strip():
                post_tag = PostTag(
                    post_id=post.id,
                    tag=tag.strip()
                )
                db.add(post_tag)

    await db.commit()
    await db.refresh(post)

    # Get tags
    tag_result = await db.execute(select(PostTag).where(PostTag.post_id == post.id))
    post_tags = tag_result.scalars().all()

    return ServiceResponse(
        success=True,
        data=PostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            content=post.content,
            excerpt=post.excerpt,
            cover_image=post.cover_image,
            author_id=post.author_id,
            author_name=post.author_name,
            author_avatar=post.author_avatar,
            category=post.category,
            tags=[t.tag for t in post_tags],
            views=post.views,
            likes=post.likes,
            reply_count=post.reply_count,
            is_pinned=post.is_pinned,
            is_locked=post.is_locked,
            is_featured=post.is_featured,
            is_solved=post.is_solved,
            created_at=int(post.created_at.timestamp() * 1000),
            updated_at=int(post.updated_at.timestamp() * 1000) if post.updated_at else None
        )
    )


@router.delete("/posts/{post_id}", response_model=ServiceResponse)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a post.

    Only author or admin can delete.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Check permission
    if post.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
        )

    # Update post author's post count (P8-96: always update the owner)
    result = await db.execute(select(User).where(User.id == post.author_id))
    post_author = result.scalar_one_or_none()
    if post_author:
        post_author.post_count = max(0, post_author.post_count - 1)

    # Delete post (cascade will delete tags and likes)
    await db.delete(post)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Post deleted successfully"}
    )


@router.post("/posts/{post_id}/like", response_model=ServiceResponse)
async def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle like on a post.
    Uses atomic counter updates and handles race conditions (P8-92).
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Check if already liked
    result = await db.execute(
        select(PostLike).where(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id
        )
    )
    existing_like = result.scalar_one_or_none()

    if existing_like:
        # Unlike - atomic counter update
        await db.delete(existing_like)
        await db.execute(
            update(Post).where(Post.id == post_id).values(likes=Post.likes - 1)
        )
        liked = False
    else:
        # Like - use try/except to handle race condition
        like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(like)
        try:
            await db.flush()
            # Atomic counter update
            await db.execute(
                update(Post).where(Post.id == post_id).values(likes=Post.likes + 1)
            )
            liked = True
        except IntegrityError:
            # Race condition: like already exists, treat as idempotent success
            await db.rollback()
            result = await db.execute(
                select(PostLike).where(
                    PostLike.post_id == post_id,
                    PostLike.user_id == current_user.id
                )
            )
            existing_like = result.scalar_one_or_none()
            if existing_like:
                # Already liked, return current state
                liked = True
            else:
                # Unknown error, re-raise
                raise

    await db.commit()

    # Refresh to get actual count
    await db.refresh(post)

    return ServiceResponse(
        success=True,
        data={"liked": liked, "likes": post.likes}
    )


@router.post("/posts/{post_id}/pin", response_model=ServiceResponse)
async def toggle_pin(
    post_id: int,
    current_user: User = Depends(require_roles(["admin", "moderator"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle pin status on a post. Admin/Moderator only.
    """
    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    post.is_pinned = not post.is_pinned
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"is_pinned": post.is_pinned}
    )


@router.post("/posts/{post_id}/lock", response_model=ServiceResponse)
async def toggle_lock(
    post_id: int,
    current_user: User = Depends(require_roles(["admin", "moderator"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle lock status on a post. Admin/Moderator only.
    """
    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    post.is_locked = not post.is_locked
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"is_locked": post.is_locked}
    )


@router.get("/stats", response_model=ServiceResponse[PostStats])
async def get_forum_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get forum statistics.
    """
    # Total posts
    result = await db.execute(select(func.count()).select_from(Post))
    total_posts = result.scalar() or 0

    # Total replies
    result = await db.execute(select(func.sum(Post.reply_count)))
    total_replies = result.scalar() or 0

    # Total users
    result = await db.execute(select(func.count()).select_from(User))
    total_users = result.scalar() or 0

    # Posts by category
    result = await db.execute(
        select(Post.category, func.count().label("count")).group_by(Post.category)
    )
    posts_by_category = {row.category: row.count for row in result.all()}

    return ServiceResponse(
        success=True,
        data=PostStats(
            total_posts=total_posts,
            total_replies=total_replies,
            total_users=total_users,
            posts_by_category=posts_by_category
        )
    )
