"""
Comment API Endpoints
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment, CommentLike
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

    # Get replies for each comment
    comment_list = []
    for comment in comments:
        # Get replies
        reply_result = await db.execute(
            select(Comment).where(
                Comment.parent_id == comment.id,
                Comment.is_deleted == 0
            ).order_by(Comment.created_at.asc())
        )
        replies = reply_result.scalars().all()

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

    # If replying, verify parent comment exists
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

    # Create comment
    comment = Comment(
        post_id=comment_data.post_id,
        author_id=current_user.id,
        author_name=current_user.username,
        author_avatar=current_user.avatar,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        reply_to_id=comment_data.reply_to_id,
        reply_to_name=comment_data.reply_to_name
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
    comment.updated_at = datetime.utcnow()

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

    # Soft delete (mark as deleted)
    comment.is_deleted = 1
    comment.content = "[已删除]"
    comment.updated_at = datetime.utcnow()

    # Update user comment count
    if current_user.id == comment.author_id:
        current_user.comment_count = max(0, current_user.comment_count - 1)

    # Update post reply count
    result = await db.execute(select(Post).where(Post.id == comment.post_id))
    post = result.scalar_one_or_none()
    if post:
        post.reply_count = max(0, post.reply_count - 1)

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
        # Unlike
        await db.delete(existing_like)
        comment.likes = max(0, comment.likes - 1)
        liked = False
    else:
        # Like
        like = CommentLike(comment_id=comment_id, user_id=current_user.id)
        db.add(like)
        comment.likes += 1
        liked = True

    await db.commit()

    return ServiceResponse(
        success=True,
        data={"liked": liked, "likes": comment.likes}
    )