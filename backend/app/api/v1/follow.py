"""
Follows API - Follow/unfollow users, get follow status, lists, and stats.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.follow import Follow
from app.schemas.common import ServiceResponse
from app.schemas.follow import (
    FollowStatusResponse,
    FollowUserInfo,
    FollowListResult,
    FollowStatsResponse,
)

router = APIRouter(prefix="/follow", tags=["Follow"])


# ──────────────────── Helpers ────────────────────

async def _get_follow_counts(db: AsyncSession, user_id: int) -> tuple[int, int]:
    """Get follower_count and following_count for a user."""
    follower_result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    )
    followers = follower_result.scalar() or 0

    following_result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)
    )
    following = following_result.scalar() or 0

    return followers, following


async def _is_following_user(db: AsyncSession, follower_id: int, following_id: int) -> bool:
    """Check if follower_id follows following_id."""
    if not follower_id:
        return False
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def _build_follow_user_info(
    db: AsyncSession,
    user: User,
    current_user_id: int | None,
) -> FollowUserInfo:
    """Build FollowUserInfo for a user, including current user's follow status."""
    followers, following = await _get_follow_counts(db, user.id)

    is_following = False
    is_mutual = False
    if current_user_id and current_user_id != user.id:
        is_following = await _is_following_user(db, current_user_id, user.id)
        if is_following:
            is_mutual = await _is_following_user(db, user.id, current_user_id)

    return FollowUserInfo(
        id=user.id,
        username=user.username,
        avatar=user.avatar,
        bio=user.bio,
        is_following=is_following,
        is_mutual=is_mutual,
        follower_count=followers,
        following_count=following,
        moment_count=user.post_count or 0,
    )


# ──────────────────── Follow / Unfollow ────────────────────


@router.post("/{target_user_id}", response_model=ServiceResponse)
async def follow_user(
    target_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Follow a user. Idempotent — returns success if already following."""
    if target_user_id == current_user.id:
        return ServiceResponse(
            success=False,
            error={"code": "SELF_FOLLOW", "message": "Cannot follow yourself"},
        )

    # Verify target exists and is active
    target = await db.get(User, target_user_id)
    if not target:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )
    if not target.is_active:
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "Cannot follow inactive user"},
        )

    follow = Follow(follower_id=current_user.id, following_id=target_user_id)
    db.add(follow)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # Already following — idempotent success

    return ServiceResponse(success=True, data={"message": "Following"})


@router.delete("/{target_user_id}", response_model=ServiceResponse)
async def unfollow_user(
    target_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Unfollow a user. Idempotent — returns success with removed=false if not following."""
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == target_user_id,
        )
    )
    follow = result.scalar_one_or_none()

    if not follow:
        return ServiceResponse(
            success=True,
            data={"message": "Not following", "removed": False},
        )

    await db.delete(follow)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Unfollowed", "removed": True},
    )


# ──────────────────── Status ────────────────────


@router.get("/{target_user_id}/status", response_model=ServiceResponse[FollowStatusResponse])
async def get_follow_status(
    target_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get follow status between current user and target user. Optional auth."""
    target = await db.get(User, target_user_id)
    if not target:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )

    followers, following = await _get_follow_counts(db, target_user_id)

    is_following = False
    is_mutual = False
    if current_user and current_user.id != target_user_id:
        is_following = await _is_following_user(db, current_user.id, target_user_id)
        if is_following:
            is_mutual = await _is_following_user(db, target_user_id, current_user.id)

    return ServiceResponse(
        success=True,
        data=FollowStatusResponse(
            user_id=target.id,
            username=target.username,
            avatar=target.avatar,
            bio=target.bio,
            is_following=is_following,
            is_mutual=is_mutual,
            follower_count=followers,
            following_count=following,
        ),
    )


# ──────────────────── Lists ────────────────────


@router.get("/{user_id}/following", response_model=ServiceResponse[FollowListResult])
async def get_following(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get paginated list of users that user_id follows."""
    user = await db.get(User, user_id)
    if not user:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )

    # Get following user IDs
    subq = select(Follow.following_id).where(Follow.follower_id == user_id).order_by(Follow.created_at.desc())
    count_subq = select(func.count()).select_from(subq.subquery())
    total_result = await db.execute(count_subq)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    subq = subq.offset(offset).limit(limit)
    result = await db.execute(subq)
    following_ids = [row[0] for row in result.fetchall()]

    # Fetch user info
    users_info: list[FollowUserInfo] = []
    if following_ids:
        result = await db.execute(
            select(User).where(User.id.in_(following_ids))
        )
        db_users = {u.id: u for u in result.scalars().all()}
        for uid in following_ids:
            if uid in db_users:
                users_info.append(
                    await _build_follow_user_info(db, db_users[uid], current_user.id if current_user else None)
                )

    has_more = (page * limit) < total

    return ServiceResponse(
        success=True,
        data=FollowListResult(
            users=users_info,
            total=total,
            page=page,
            limit=limit,
            has_more=has_more,
        ),
    )


@router.get("/{user_id}/followers", response_model=ServiceResponse[FollowListResult])
async def get_followers(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get paginated list of users that follow user_id."""
    user = await db.get(User, user_id)
    if not user:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )

    subq = select(Follow.follower_id).where(Follow.following_id == user_id).order_by(Follow.created_at.desc())
    count_subq = select(func.count()).select_from(subq.subquery())
    total_result = await db.execute(count_subq)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    subq = subq.offset(offset).limit(limit)
    result = await db.execute(subq)
    follower_ids = [row[0] for row in result.fetchall()]

    users_info: list[FollowUserInfo] = []
    if follower_ids:
        result = await db.execute(
            select(User).where(User.id.in_(follower_ids))
        )
        db_users = {u.id: u for u in result.scalars().all()}
        for uid in follower_ids:
            if uid in db_users:
                users_info.append(
                    await _build_follow_user_info(db, db_users[uid], current_user.id if current_user else None)
                )

    has_more = (page * limit) < total

    return ServiceResponse(
        success=True,
        data=FollowListResult(
            users=users_info,
            total=total,
            page=page,
            limit=limit,
            has_more=has_more,
        ),
    )


@router.get("/{user_id}/friends", response_model=ServiceResponse[FollowListResult])
async def get_friends(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get mutual follows (friends) for user_id."""
    user = await db.get(User, user_id)
    if not user:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )

    # Mutual: users that user_id follows AND who follow user_id back
    following_subq = select(Follow.following_id).where(Follow.follower_id == user_id)
    followers_subq = select(Follow.follower_id).where(
        Follow.following_id == user_id,
        Follow.follower_id.in_(following_subq),
    ).order_by(Follow.created_at.desc())

    count_subq = select(func.count()).select_from(followers_subq.subquery())
    total_result = await db.execute(count_subq)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    followers_subq = followers_subq.offset(offset).limit(limit)
    result = await db.execute(followers_subq)
    friend_ids = [row[0] for row in result.fetchall()]

    users_info: list[FollowUserInfo] = []
    if friend_ids:
        result = await db.execute(
            select(User).where(User.id.in_(friend_ids))
        )
        db_users = {u.id: u for u in result.scalars().all()}
        for uid in friend_ids:
            if uid in db_users:
                users_info.append(
                    await _build_follow_user_info(db, db_users[uid], current_user.id if current_user else None)
                )

    has_more = (page * limit) < total

    return ServiceResponse(
        success=True,
        data=FollowListResult(
            users=users_info,
            total=total,
            page=page,
            limit=limit,
            has_more=has_more,
        ),
    )


@router.get("/{user_id}/stats", response_model=ServiceResponse[FollowStatsResponse])
async def get_follow_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get follow statistics for a user."""
    user = await db.get(User, user_id)
    if not user:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "User not found"},
        )

    followers, following = await _get_follow_counts(db, user_id)

    # Friend count (mutual follows)
    following_subq = select(Follow.following_id).where(Follow.follower_id == user_id)
    friend_result = await db.execute(
        select(func.count()).select_from(Follow).where(
            Follow.following_id == user_id,
            Follow.follower_id.in_(following_subq),
        )
    )
    friend_count = friend_result.scalar() or 0

    return ServiceResponse(
        success=True,
        data=FollowStatsResponse(
            user_id=user_id,
            follower_count=followers,
            following_count=following,
            friend_count=friend_count,
        ),
    )
