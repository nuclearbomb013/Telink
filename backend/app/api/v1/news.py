"""
News API - News timeline, hotspots, and article detail.

Currently returns empty results. Backend news data model is a future feature.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api.deps import get_db
from app.schemas.common import ServiceResponse

router = APIRouter(prefix="/news", tags=["News"])


@router.get("", response_model=ServiceResponse[dict])
async def get_news_timeline(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get news timeline. Returns empty — news data model not yet implemented."""
    return ServiceResponse(
        success=True,
        data={
            "items": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "has_more": False,
        },
    )


@router.get("/hot", response_model=ServiceResponse[dict])
async def get_hot_news(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get hot/trending news. Returns empty — news data model not yet implemented."""
    return ServiceResponse(
        success=True,
        data={"items": [], "keywords": [], "limit": limit},
    )


@router.get("/{news_id}", response_model=ServiceResponse[dict])
async def get_news_by_id(
    news_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single news article by ID. Returns 404 — news data model not yet implemented."""
    return ServiceResponse(
        success=False,
        error={"code": "NOT_FOUND", "message": "News data model not yet implemented"},
    )
