"""
Favorite API Endpoints
"""

from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.schemas import (
    ServiceResponse,
    FavoriteCreate,
    FavoriteResponse,
    FavoriteCheckResult,
    FavoriteListResult,
)

router = APIRouter(prefix="/favorites", tags=["Favorites"])


def _fav_to_response(fav: Favorite) -> FavoriteResponse:
    return FavoriteResponse(
        id=fav.id,
        user_id=fav.user_id,
        content_type=fav.content_type,
        content_id=fav.content_id,
        title=fav.title,
        created_at=int(fav.created_at.timestamp() * 1000),
        updated_at=int(fav.updated_at.timestamp() * 1000) if fav.updated_at else None,
    )


@router.get("", response_model=ServiceResponse[FavoriteListResult])
async def list_favorites(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    content_type: str = Query(default="", max_length=20),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's favorites with pagination."""
    base_query = select(Favorite).where(Favorite.user_id == current_user.id)
    count_query = select(func.count(Favorite.id)).where(Favorite.user_id == current_user.id)

    if content_type:
        base_query = base_query.where(Favorite.content_type == content_type)
        count_query = count_query.where(Favorite.content_type == content_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = max(1, (total + limit - 1) // limit)

    offset = (page - 1) * limit
    result = await db.execute(
        base_query.order_by(Favorite.created_at.desc()).offset(offset).limit(limit)
    )
    items = result.scalars().all()

    return ServiceResponse(
        success=True,
        data=FavoriteListResult(
            items=[_fav_to_response(f) for f in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=ServiceResponse[FavoriteResponse])
async def add_favorite(
    payload: FavoriteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a content item to favorites."""
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.content_type == payload.content_type,
            Favorite.content_id == payload.content_id,
        )
    )
    if existing.scalar_one_or_none():
        return ServiceResponse(
            success=False,
            error={"code": "DUPLICATE", "message": "Already favorited"},
        )

    fav = Favorite(
        user_id=current_user.id,
        content_type=payload.content_type,
        content_id=payload.content_id,
        title=payload.title,
        created_at=datetime.now(),
    )
    db.add(fav)
    await db.commit()
    await db.refresh(fav)

    return ServiceResponse(
        success=True,
        data=_fav_to_response(fav),
    )


@router.delete("/{favorite_id}", response_model=ServiceResponse[dict])
async def remove_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a favorite by ID."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.id == favorite_id,
            Favorite.user_id == current_user.id,
        )
    )
    fav = result.scalar_one_or_none()

    if not fav:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Favorite not found"},
        )

    content_type = fav.content_type
    content_id = fav.content_id
    await db.delete(fav)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"removed": True, "content_type": content_type, "content_id": content_id},
    )


@router.delete("/by-content", response_model=ServiceResponse[dict])
async def remove_favorite_by_content(
    content_type: str = Query(min_length=1, max_length=20),
    content_id: int = Query(ge=1),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a favorite by content type and ID."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.content_type == content_type,
            Favorite.content_id == content_id,
        )
    )
    fav = result.scalar_one_or_none()

    if not fav:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Favorite not found"},
        )

    await db.delete(fav)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"removed": True, "content_type": content_type, "content_id": content_id},
    )


@router.get("/check", response_model=ServiceResponse[FavoriteCheckResult])
async def check_favorite(
    content_type: str = Query(min_length=1, max_length=20),
    content_id: int = Query(ge=1),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if a content item is favorited by the current user."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.content_type == content_type,
            Favorite.content_id == content_id,
        )
    )
    fav = result.scalar_one_or_none()

    return ServiceResponse(
        success=True,
        data=FavoriteCheckResult(
            favorited=fav is not None,
            favorite_id=fav.id if fav else None,
        ),
    )
