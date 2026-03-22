"""
User Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""

    username: str = Field(..., min_length=3, max_length=20)
    email: str = Field(..., max_length=255)
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    """Create user schema."""

    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Update user schema."""

    username: Optional[str] = Field(None, min_length=3, max_length=20)
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


class UserResponse(BaseModel):
    """User response schema."""

    id: int
    username: str
    email: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    post_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    created_at: int  # Unix timestamp in milliseconds

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user info (no sensitive data)."""

    id: int
    username: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    post_count: int = 0
    comment_count: int = 0
    created_at: int

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics."""

    post_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    following_count: int = 0
    follower_count: int = 0