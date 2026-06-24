"""
User API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.base import utcnow_naive
from app.schemas import (
    ServiceResponse,
    UserResponse,
    UserPublic,
    UserUpdate,
    UserStats,
    UserListResult
)
from app.core.security import validate_username

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/list", response_model=ServiceResponse[UserListResult])
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List users with optional search and pagination.

    Search matches against username and bio (case-insensitive).
    """
    conditions = [User.is_active.is_(True)]

    if search:
        search_term = f"%{search}%"
        conditions.append(
            User.username.ilike(search_term) | User.bio.ilike(search_term)
        )

    where_clause = conditions[0] if len(conditions) == 1 else conditions[0]
    if len(conditions) > 1:
        from sqlalchemy import and_
        where_clause = and_(*conditions)

    count_query = select(func.count(User.id)).where(where_clause)
    result = await db.execute(count_query)
    total = result.scalar() or 0

    list_query = select(User).where(where_clause).offset((page - 1) * limit).limit(limit).order_by(User.id.asc())
    result = await db.execute(list_query)
    users = result.scalars().all()

    total_pages = max(1, (total + limit - 1) // limit)

    return ServiceResponse(
        success=True,
        data=UserListResult(
            users=[
                UserPublic(
                    id=u.id,
                    username=u.username,
                    avatar=u.avatar,
                    bio=u.bio,
                    role=str(u.role.value) if hasattr(u.role, 'value') else str(u.role),
                    post_count=u.post_count,
                    comment_count=u.comment_count,
                    like_count=u.like_count,
                    created_at=int(u.created_at.timestamp() * 1000)
                )
                for u in users
            ],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.get("/check-username", response_model=ServiceResponse[dict])
async def check_username_availability(
    username: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if username is available for use.

    Validates format and checks uniqueness (excluding current user).
    """
    # Validate username format
    is_valid, error_msg = validate_username(username)
    if not is_valid:
        return ServiceResponse(
            success=True,
            data={
                "available": False,
                "message": error_msg
            }
        )

    # Check if username is taken (exclude current user)
    result = await db.execute(
        select(User).where(User.username == username)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # If the existing user is the current user, username is available (they can keep it)
        if current_user and existing_user.id == current_user.id:
            return ServiceResponse(
                success=True,
                data={
                    "available": True,
                    "message": "This is your current username"
                }
            )
        return ServiceResponse(
            success=True,
            data={
                "available": False,
                "message": "Username already taken"
            }
        )

    return ServiceResponse(
        success=True,
        data={
            "available": True,
            "message": "Username is available"
        }
    )


@router.get("/{user_id}", response_model=ServiceResponse[UserPublic])
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user by ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "User not found"
            }
        )

    return ServiceResponse(
        success=True,
        data=UserPublic(
            id=user.id,
            username=user.username,
            avatar=user.avatar,
            bio=user.bio,
            role=user.role,
            post_count=user.post_count,
            comment_count=user.comment_count,
            like_count=user.like_count,
            created_at=int(user.created_at.timestamp() * 1000)
        )
    )


@router.get("/username/{username}", response_model=ServiceResponse[UserPublic])
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user by username.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "User not found"
            }
        )

    return ServiceResponse(
        success=True,
        data=UserPublic(
            id=user.id,
            username=user.username,
            avatar=user.avatar,
            bio=user.bio,
            role=user.role,
            post_count=user.post_count,
            comment_count=user.comment_count,
            like_count=user.like_count,
            created_at=int(user.created_at.timestamp() * 1000)
        )
    )


@router.put("/{user_id}", response_model=ServiceResponse[UserResponse])
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile.

    Only the user themselves or admin can update.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Check permission
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
        )

    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "User not found"
            }
        )

    # Update fields
    if update_data.username:
        # Validate username
        is_valid, error_msg = validate_username(update_data.username)
        if not is_valid:
            return ServiceResponse(
                success=False,
                error={
                    "code": "VALIDATION_ERROR",
                    "message": error_msg
                }
            )

        # Check if username is taken
        result = await db.execute(
            select(User).where(User.username == update_data.username, User.id != user_id)
        )
        if result.scalar_one_or_none():
            return ServiceResponse(
                success=False,
                error={
                    "code": "USERNAME_EXISTS",
                    "message": "Username already taken"
                }
            )

        user.username = update_data.username

    if update_data.avatar is not None:
        user.avatar = update_data.avatar

    if update_data.bio is not None:
        user.bio = update_data.bio

    user.updated_at = utcnow_naive()
    await db.commit()
    await db.refresh(user)

    return ServiceResponse(
        success=True,
        data=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            avatar=user.avatar,
            bio=user.bio,
            role=user.role,
            post_count=user.post_count,
            comment_count=user.comment_count,
            like_count=user.like_count,
            created_at=int(user.created_at.timestamp() * 1000)
        )
    )


@router.get("/{user_id}/stats", response_model=ServiceResponse[UserStats])
async def get_user_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics.
    """
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "User not found"
            }
        )

    return ServiceResponse(
        success=True,
        data=UserStats(
            post_count=user.post_count,
            comment_count=user.comment_count,
            like_count=user.like_count,
            following_count=0,  # TODO: Implement follow system
            follower_count=0
        )
    )