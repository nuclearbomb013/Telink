"""
Comment API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment, CommentLike
from app.models.base import utcnow_naive
from app.schemas import (
    ServiceResponse,
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentWithReplies,
    CommentListResult
)

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("", response_model=ServiceResponse[CommentListResult])
async def get_comments(
    postId: int = Query(..., description="Post ID to get comments for"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    sortBy: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comments for a post.
    """
    # Verify post exists
    result = await db.execute(select(Post).where(Post.id == postId))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    # Get top-level comments (no parent)
    query = select(Comment).where(
        Comment.post_id == postId,
        Comment.parent_id.is_(None),
        Comment.is_deleted == 0
    )

    # Sort
    if sortBy == "newest":
        query = query.order_by(Comment.created_at.desc())
    elif sortBy == "popular":
        query = query.order_by(Comment.likes.desc())
    else:
        query = query.order_by(Comment.created_at.asc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    comments = result.scalars().all()

    # Batch load replies for all comments (P8-99: avoid N+1 queries)
    comment_ids = [c.id for c in comments]
    replies_by_parent: dict = {}
    if comment_ids:
        reply_result = await db.execute(
            select(Comment).where(
                Comment.parent_id.in_(comment_ids),
                Comment.is_deleted == 0
            ).order_by(Comment.created_at.asc())
        )
        all_replies = reply_result.scalars().all()
        # Group replies by parent_id
        for reply in all_replies:
            if reply.parent_id not in replies_by_parent:
                replies_by_parent[reply.parent_id] = []
            replies_by_parent[reply.parent_id].append(reply)

    # Get replies for each comment
    comment_list = []
    for comment in comments:
        replies = replies_by_parent.get(comment.id, [])
        comment_list.append(CommentWithReplies(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            author_avatar=comment.author_avatar,
            content=comment.content,
            likes=comment.likes,
            parent_id=comment.parent_id,
            reply_to_id=comment.reply_to_id,
            reply_to_name=comment.reply_to_name,
            created_at=int(comment.created_at.timestamp() * 1000),
            updated_at=int(comment.updated_at.timestamp() * 1000) if comment.updated_at else None,
            replies=[
                CommentResponse(
                    id=r.id,
                    post_id=r.post_id,
                    author_id=r.author_id,
                    author_name=r.author_name,
                    author_avatar=r.author_avatar,
                    content=r.content,
                    likes=r.likes,
                    parent_id=r.parent_id,
                    reply_to_id=r.reply_to_id,
                    reply_to_name=r.reply_to_name,
                    created_at=int(r.created_at.timestamp() * 1000),
                    updated_at=int(r.updated_at.timestamp() * 1000) if r.updated_at else None
                ) for r in replies
            ]
        ))

    total_pages = (total + limit - 1) // limit

    return ServiceResponse(
        success=True,
        data=CommentListResult(
            comments=comment_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.post("", response_model=ServiceResponse[CommentResponse])
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new comment.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Verify post exists and is not locked
    result = await db.execute(select(Post).where(Post.id == comment_data.post_id))
    post = result.scalar_one_or_none()

    if not post:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Post not found"
            }
        )

    if post.is_locked:
        return ServiceResponse(
            success=False,
            error={
                "code": "POST_LOCKED",
                "message": "This post is locked for new comments"
            }
        )

    # Initialize derived_reply_to_name before conditional block (P9-104 fix)
    # This prevents UnboundLocalError when parent_id is None (top-level comment)
    derived_reply_to_name = None

    # P13-151: Validate reply_to_id for both top-level and nested comments
    # Even when parent_id is null (top-level), reply_to_id should be validated
    if comment_data.reply_to_id:
        reply_to_result = await db.execute(
            select(Comment).where(Comment.id == comment_data.reply_to_id)
        )
        reply_to_comment = reply_to_result.scalar_one_or_none()
        # P8-95: reply_to_id must exist and belong to same post
        if not reply_to_comment:
            return ServiceResponse(
                success=False,
                error={
                    "code": "BAD_REQUEST",
                    "message": "Reply target comment not found"
                }
            )
        if reply_to_comment.post_id != comment_data.post_id:
            return ServiceResponse(
                success=False,
                error={
                    "code": "BAD_REQUEST",
                    "message": "Reply target must belong to the same post"
                }
            )
        # Derive reply_to_name from DB to prevent spoofing
        derived_reply_to_name = reply_to_comment.author_name

    # If replying, verify parent comment exists and belongs to same post
    if comment_data.parent_id:
        result = await db.execute(
            select(Comment).where(Comment.id == comment_data.parent_id)
        )
        parent = result.scalar_one_or_none()

        if not parent:
            return ServiceResponse(
                success=False,
                error={
                    "code": "NOT_FOUND",
                    "message": "Parent comment not found"
                }
            )

        # Prevent cross-post parent comment (critical security fix)
        if parent.post_id != comment_data.post_id:
            return ServiceResponse(
                success=False,
                error={
                    "code": "BAD_REQUEST",
                    "message": "Parent comment must belong to the same post"
                }
            )
        # Note: reply_to_id validation moved outside this block (P13-151 fix)

    # Create comment
    comment = Comment(
        post_id=comment_data.post_id,
        author_id=current_user.id,
        author_name=current_user.username,
        author_avatar=current_user.avatar,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        reply_to_id=comment_data.reply_to_id,
        # Use derived name from DB to prevent spoofing (P8-95)
        reply_to_name=derived_reply_to_name
    )
    db.add(comment)

    # Update post reply count
    post.reply_count += 1

    # Update user comment count
    current_user.comment_count += 1

    await db.commit()
    await db.refresh(comment)

    return ServiceResponse(
        success=True,
        data=CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            author_avatar=comment.author_avatar,
            content=comment.content,
            likes=comment.likes,
            parent_id=comment.parent_id,
            reply_to_id=comment.reply_to_id,
            reply_to_name=comment.reply_to_name,
            created_at=int(comment.created_at.timestamp() * 1000),
            updated_at=None
        )
    )


@router.put("/{comment_id}", response_model=ServiceResponse[CommentResponse])
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a comment. Only author can update.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get comment
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Comment not found"
            }
        )

    # Check permission
    if comment.author_id != current_user.id:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
        )

    # Update content
    comment.content = comment_data.content
    comment.updated_at = utcnow_naive()

    await db.commit()
    await db.refresh(comment)

    return ServiceResponse(
        success=True,
        data=CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            author_avatar=comment.author_avatar,
            content=comment.content,
            likes=comment.likes,
            parent_id=comment.parent_id,
            reply_to_id=comment.reply_to_id,
            reply_to_name=comment.reply_to_name,
            created_at=int(comment.created_at.timestamp() * 1000),
            updated_at=int(comment.updated_at.timestamp() * 1000) if comment.updated_at else None
        )
    )


@router.delete("/{comment_id}", response_model=ServiceResponse)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a comment. Only author or admin can delete.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get comment
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Comment not found"
            }
        )

    # Check permission
    if comment.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
        )

    # Count child replies for accurate decrement (P8-91)
    child_replies_count = 0
    child_reply_author_ids: set = set()
    child_replies: list[Comment] = []  # Initialize for type checking
    if comment.parent_id is None:
        # This is a top-level comment, count all its replies and collect author IDs
        result = await db.execute(
            select(Comment).where(
                Comment.parent_id == comment.id,
                Comment.is_deleted == 0
            )
        )
        child_replies = result.scalars().all()
        child_replies_count = len(child_replies)
        # Collect unique author IDs from child replies (P8-96)
        child_reply_author_ids = {reply.author_id for reply in child_replies if reply.author_id != comment.author_id}

    # Get the comment author for counter update (P8-96)
    result = await db.execute(select(User).where(User.id == comment.author_id))
    comment_author = result.scalar_one_or_none()

    # Soft delete (mark as deleted)
    comment.is_deleted = 1
    comment.content = "[已删除]"
    comment.updated_at = utcnow_naive()

    # Soft delete all child replies (P8-91)
    if child_replies_count > 0:
        from sqlalchemy import update as sql_update
        await db.execute(
            sql_update(Comment).where(
                Comment.parent_id == comment.id,
                Comment.is_deleted == 0
            ).values(is_deleted=1, content="[已删除]", updated_at=utcnow_naive())
        )

    # Update comment author's comment count (P9-105 fix: only count own comments)
    # Author loses 1 (top-level) + their own child replies
    if comment_author:
        # Count only the author's own child replies
        author_own_child_count = sum(1 for reply in child_replies if reply.author_id == comment.author_id)
        total_deleted_for_author = 1 + author_own_child_count
        comment_author.comment_count = max(0, comment_author.comment_count - total_deleted_for_author)

    # Update child reply authors' comment counts (P8-96)
    # Each child reply author loses 1 from their comment_count
    if child_reply_author_ids:
        for author_id in child_reply_author_ids:
            result = await db.execute(select(User).where(User.id == author_id))
            child_author = result.scalar_one_or_none()
            if child_author:
                # Count how many of this author's replies are being deleted
                author_replies_count = sum(1 for reply in child_replies if reply.author_id == author_id)
                child_author.comment_count = max(0, child_author.comment_count - author_replies_count)

    # Update post reply count with total deleted (P8-91)
    result = await db.execute(select(Post).where(Post.id == comment.post_id))
    post = result.scalar_one_or_none()
    if post:
        total_deleted = 1 + child_replies_count
        post.reply_count = max(0, post.reply_count - total_deleted)

    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Comment deleted successfully"}
    )


@router.post("/{comment_id}/like", response_model=ServiceResponse)
async def toggle_comment_like(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle like on a comment.
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

    # Get comment
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Comment not found"
            }
        )

    # Check if already liked
    result = await db.execute(
        select(CommentLike).where(
            CommentLike.comment_id == comment_id,
            CommentLike.user_id == current_user.id
        )
    )
    existing_like = result.scalar_one_or_none()

    if existing_like:
        # Unlike - atomic counter update
        await db.delete(existing_like)
        await db.execute(
            update(Comment).where(Comment.id == comment_id).values(likes=Comment.likes - 1)
        )
        liked = False
    else:
        # Like - use try/except to handle race condition
        like = CommentLike(comment_id=comment_id, user_id=current_user.id)
        db.add(like)
        try:
            await db.flush()
            # Atomic counter update
            await db.execute(
                update(Comment).where(Comment.id == comment_id).values(likes=Comment.likes + 1)
            )
            liked = True
        except IntegrityError:
            # Race condition: like already exists, treat as idempotent success
            await db.rollback()
            result = await db.execute(
                select(CommentLike).where(
                    CommentLike.comment_id == comment_id,
                    CommentLike.user_id == current_user.id
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
    await db.refresh(comment)

    return ServiceResponse(
        success=True,
        data={"liked": liked, "likes": comment.likes}
    )