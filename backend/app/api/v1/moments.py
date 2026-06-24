"""
Moments (动态) API Endpoints

Social feed / WeChat Moments style dynamic posts.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.exc import IntegrityError
import logging

from app.api.deps import get_db, get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.moment import Moment, MomentLike, MomentComment
from app.models.follow import Follow
from app.schemas import ServiceResponse
from app.schemas.moment import (
    MomentCreate, MomentUpdate, MomentResponse,
    MomentCommentCreate, MomentCommentResponse,
    MomentListResult,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/moments", tags=["Moments"])


def _moment_to_response(moment: Moment, current_user_id: int | None = None) -> MomentResponse:
    """Convert Moment model to response schema."""
    return MomentResponse(
        id=moment.id,
        author_id=moment.author_id,
        author_name=moment.author_name,
        author_avatar=moment.author_avatar,
        content=moment.content,
        content_type=moment.content_type or "text",
        code_snippet=moment.code_snippet,
        images=moment.images,
        visibility=moment.visibility or "public",
        location=moment.location,
        likes=moment.likes,
        comment_count=moment.comment_count,
        is_liked=False,  # Set separately
        created_at=int(moment.created_at.timestamp() * 1000) if moment.created_at else 0,
        updated_at=int(moment.updated_at.timestamp() * 1000) if moment.updated_at else None,
    )


@router.get("", response_model=ServiceResponse[MomentListResult])
async def get_moments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("newest", pattern="^(newest|popular)$"),
    user_id: int | None = None,
    following_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get paginated list of moments with visibility filtering.

    Visibility rules:
    - public: visible to everyone
    - followers: visible only to the author and users who follow the author
    - private: visible only to the author

    following_only=True requires authentication (returns UNAUTHORIZED if not logged in).
    When active, only shows moments from users the current user follows, plus their own moments,
    respecting the visibility rules above.
    """
    if following_only and not current_user:
        return ServiceResponse(
            success=False,
            error={"code": "UNAUTHORIZED", "message": "Authentication required for following_only"},
        )

    query = select(Moment).where(Moment.is_deleted.is_(False))

    # User filter
    if user_id:
        query = query.where(Moment.author_id == user_id)

    # Build following subquery (reused for both visibility and following_only)
    following_subq = None
    if current_user:
        following_subq = select(Follow.following_id).where(
            Follow.follower_id == current_user.id
        )

    # Visibility rules
    if current_user:
        # Logged-in user can see:
        #   - public moments
        #   - their own moments (any visibility)
        #   - followers-visible moments from users they follow
        visibility_conditions = [
            Moment.visibility == "public",
            Moment.author_id == current_user.id,
        ]
        if following_subq is not None:
            visibility_conditions.append(
                (Moment.visibility == "followers") & Moment.author_id.in_(following_subq)
            )
        query = query.where(or_(*visibility_conditions))
    else:
        # Anonymous users can only see public moments
        query = query.where(Moment.visibility == "public")

    # Following-only filter (only moments from followed users + self)
    if following_only and current_user and following_subq is not None:
        query = query.where(
            (Moment.author_id == current_user.id)
            | Moment.author_id.in_(following_subq)
        )

    # Sorting
    if sort_by == "popular":
        query = query.order_by(Moment.likes.desc(), Moment.created_at.desc())
    else:
        query = query.order_by(Moment.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    moments = result.scalars().all()

    # Check like status for current user
    liked_ids: set[int] = set()
    if current_user:
        moment_ids = [m.id for m in moments]
        if moment_ids:
            like_query = select(MomentLike.moment_id).where(
                and_(
                    MomentLike.moment_id.in_(moment_ids),
                    MomentLike.user_id == current_user.id,
                )
            )
            like_result = await db.execute(like_query)
            liked_ids = {row[0] for row in like_result}

    moment_list = [
        MomentResponse(
            id=m.id,
            author_id=m.author_id,
            author_name=m.author_name,
            author_avatar=m.author_avatar,
            content=m.content,
            content_type=m.content_type or "text",
            code_snippet=m.code_snippet,
            images=m.images,
            visibility=m.visibility or "public",
            location=m.location,
            likes=m.likes,
            comment_count=m.comment_count,
            is_liked=m.id in liked_ids,
            created_at=int(m.created_at.timestamp() * 1000) if m.created_at else 0,
            updated_at=int(m.updated_at.timestamp() * 1000) if m.updated_at else None,
        )
        for m in moments
    ]

    return ServiceResponse(
        success=True,
        data=MomentListResult(
            moments=moment_list,
            total=total,
            page=page,
            limit=limit,
            has_more=(page * limit) < total,
        )
    )


@router.post("", response_model=ServiceResponse[MomentResponse])
async def create_moment(
    data: MomentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new moment. Requires authentication."""
    moment = Moment(
        author_id=current_user.id,
        author_name=current_user.username,
        author_avatar=current_user.avatar,
        content=data.content,
        content_type=data.content_type or "text",
        visibility=data.visibility or "public",
        location=data.location,
    )
    # Only set JSON fields when explicitly provided (avoid JSON null vs SQL NULL issues)
    if data.code_snippet is not None:
        moment.code_snippet = data.code_snippet.model_dump()
    if data.images is not None and len(data.images) > 0:
        moment.images = [img.model_dump() for img in data.images]
    db.add(moment)
    await db.commit()
    await db.refresh(moment)

    logger.info(f"Moment created: id={moment.id} by user={current_user.id}")
    return ServiceResponse(
        success=True,
        data=_moment_to_response(moment, current_user.id)
    )


@router.put("/{moment_id}", response_model=ServiceResponse[MomentResponse])
async def update_moment(
    moment_id: int,
    data: MomentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a moment. Only the author can update."""
    result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    moment = result.scalar_one_or_none()

    if not moment:
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Moment not found"})
    if moment.author_id != current_user.id:
        return ServiceResponse(success=False, error={"code": "FORBIDDEN", "message": "Not your moment"})

    if data.content is not None:
        moment.content = data.content
    if data.visibility is not None:
        moment.visibility = data.visibility
    if data.code_snippet is not None:
        moment.code_snippet = data.code_snippet.model_dump()
    if data.images is not None:
        moment.images = [img.model_dump() for img in data.images]
    if data.location is not None:
        moment.location = data.location

    await db.commit()
    await db.refresh(moment)
    return ServiceResponse(success=True, data=_moment_to_response(moment, current_user.id))


@router.delete("/{moment_id}", response_model=ServiceResponse)
async def delete_moment(
    moment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Soft-delete a moment. Only the author can delete."""
    result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    moment = result.scalar_one_or_none()

    if not moment:
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Moment not found"})
    if moment.author_id != current_user.id:
        return ServiceResponse(success=False, error={"code": "FORBIDDEN", "message": "Not your moment"})

    moment.is_deleted = True
    await db.commit()
    logger.info(f"Moment deleted: id={moment_id} by user={current_user.id}")
    return ServiceResponse(success=True, data={"message": "Moment deleted"})


@router.post("/{moment_id}/like", response_model=ServiceResponse)
async def toggle_moment_like(
    moment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Toggle like on a moment. Uses atomic SQL updates to prevent race conditions.

    - Uses delete() with rowcount to detect whether a like actually existed (avoid
      concurrent double-unlike undercounting).
    - Guards against likes going below 0.
    - On IntegrityError (duplicate like), rolls back and treats as already-liked
      without double-incrementing the counter.
    """
    # Verify moment exists
    result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    if not result.scalar_one_or_none():
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Moment not found"})

    # Try to delete existing like
    del_stmt = delete(MomentLike).where(
        MomentLike.moment_id == moment_id,
        MomentLike.user_id == current_user.id,
    )
    del_result = await db.execute(del_stmt)

    if del_result.rowcount and del_result.rowcount > 0:
        # Unlike: we confirmed a like existed, decrement counter (guard >=0)
        await db.execute(
            update(Moment)
            .where(Moment.id == moment_id, Moment.likes > 0)
            .values(likes=Moment.likes - 1)
        )
        liked = False
    else:
        # Like: insert new row, handle IntegrityError for concurrent duplicate
        db.add(MomentLike(moment_id=moment_id, user_id=current_user.id))
        try:
            await db.flush()
            await db.execute(
                update(Moment)
                .where(Moment.id == moment_id)
                .values(likes=Moment.likes + 1)
            )
            liked = True
        except IntegrityError:
            await db.rollback()
            # Already liked by another concurrent request — idempotent, don't re-increment
            liked = True

    await db.commit()

    # Re-read moment to get the real count after atomic operations
    result = await db.execute(
        select(Moment.likes).where(Moment.id == moment_id)
    )
    real_likes = result.scalar() or 0

    return ServiceResponse(
        success=True,
        data={"liked": liked, "likes": real_likes},
    )


# ==================== Comment endpoints ====================


@router.get("/{moment_id}/comments", response_model=ServiceResponse[list[MomentCommentResponse]])
async def get_moment_comments(
    moment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get comments for a moment, ordered by creation time (oldest first)."""
    result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    moment = result.scalar_one_or_none()
    if not moment:
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Moment not found"})

    comment_result = await db.execute(
        select(MomentComment)
        .where(MomentComment.moment_id == moment_id)
        .order_by(MomentComment.created_at.asc())
    )
    comments = comment_result.scalars().all()

    return ServiceResponse(
        success=True,
        data=[
            MomentCommentResponse(
                id=c.id,
                moment_id=c.moment_id,
                author_id=c.author_id,
                author_name=c.author_name,
                author_avatar=c.author_avatar,
                content=c.content,
                likes=c.likes,
                reply_to_id=c.reply_to_id,
                reply_to_name=c.reply_to_name,
                is_liked=False,
                created_at=int(c.created_at.timestamp() * 1000) if c.created_at else 0,
            )
            for c in comments
        ]
    )


@router.post("/{moment_id}/comments", response_model=ServiceResponse[MomentCommentResponse])
async def create_moment_comment(
    moment_id: int,
    data: MomentCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a comment to a moment. Requires authentication."""
    result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    moment = result.scalar_one_or_none()
    if not moment:
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Moment not found"})

    # Validate reply_to_name from database to prevent spoofing
    validated_reply_to_name: str | None = None
    if data.reply_to_id is not None:
        reply_to_result = await db.execute(
            select(MomentComment).where(MomentComment.id == data.reply_to_id)
        )
        reply_to_comment = reply_to_result.scalar_one_or_none()
        if reply_to_comment:
            validated_reply_to_name = reply_to_comment.author_name
        else:
            return ServiceResponse(
                success=False,
                error={"code": "NOT_FOUND", "message": "Reply target comment not found"}
            )

    comment = MomentComment(
        moment_id=moment_id,
        author_id=current_user.id,
        author_name=current_user.username,
        author_avatar=current_user.avatar,
        content=data.content,
        reply_to_id=data.reply_to_id,
        reply_to_name=validated_reply_to_name,
    )
    db.add(comment)
    await db.flush()  # Get comment.id before commit

    # Atomic comment count increment
    await db.execute(
        update(Moment)
        .where(Moment.id == moment_id)
        .values(comment_count=Moment.comment_count + 1)
    )

    await db.commit()
    await db.refresh(comment)

    logger.info(f"Moment comment created: id={comment.id} moment_id={moment_id} by user={current_user.id}")
    return ServiceResponse(
        success=True,
        data=MomentCommentResponse(
            id=comment.id,
            moment_id=comment.moment_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            author_avatar=comment.author_avatar,
            content=comment.content,
            likes=comment.likes,
            reply_to_id=comment.reply_to_id,
            reply_to_name=comment.reply_to_name,
            is_liked=False,
            created_at=int(comment.created_at.timestamp() * 1000) if comment.created_at else 0,
        )
    )


@router.delete("/{moment_id}/comments/{comment_id}", response_model=ServiceResponse)
async def delete_moment_comment(
    moment_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a comment. Only the comment author can delete."""
    result = await db.execute(
        select(MomentComment).where(
            MomentComment.id == comment_id,
            MomentComment.moment_id == moment_id,
        )
    )
    comment = result.scalar_one_or_none()
    if not comment:
        return ServiceResponse(success=False, error={"code": "NOT_FOUND", "message": "Comment not found"})
    if comment.author_id != current_user.id:
        return ServiceResponse(success=False, error={"code": "FORBIDDEN", "message": "Not your comment"})

    # Verify moment exists (still present, not deleted)
    moment_result = await db.execute(
        select(Moment).where(Moment.id == moment_id, Moment.is_deleted.is_(False))
    )
    moment = moment_result.scalar_one_or_none()

    await db.delete(comment)

    # Atomic comment count decrement — guard against going below 0
    if moment:
        await db.execute(
            update(Moment)
            .where(Moment.id == moment_id, Moment.comment_count > 0)
            .values(comment_count=Moment.comment_count - 1)
        )

    await db.commit()

    logger.info(f"Moment comment deleted: id={comment_id} moment_id={moment_id} by user={current_user.id}")
    return ServiceResponse(success=True, data={"message": "Comment deleted"})
