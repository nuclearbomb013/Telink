"""
Favorite Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    """Schema for creating a favorite."""
    content_type: str = Field(min_length=1, max_length=20)
    content_id: int = Field(ge=1)
    title: Optional[str] = Field(default=None, max_length=500)


class FavoriteResponse(BaseModel):
    """Schema for favorite response."""
    id: int
    user_id: int
    content_type: str
    content_id: int
    title: Optional[str] = None
    created_at: int
    updated_at: Optional[int] = None


class FavoriteCheckResult(BaseModel):
    """Schema for check-if-favorited response."""
    favorited: bool
    favorite_id: Optional[int] = None


class FavoriteListResult(BaseModel):
    """Schema for paginated favorite list."""
    items: list[FavoriteResponse]
    total: int
    page: int
    limit: int
    total_pages: int
