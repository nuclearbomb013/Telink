"""
Follow Schemas - Request/Response models for follow API.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class FollowStatusResponse(BaseModel):
    """Follow status between two users."""
    user_id: int
    username: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool
    is_mutual: bool
    follower_count: int = 0
    following_count: int = 0


class FollowUserInfo(BaseModel):
    """User info with follow status (for following/follower lists)."""
    id: int
    username: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool
    is_mutual: bool
    follower_count: int = 0
    following_count: int = 0
    moment_count: int = 0


class FollowListResult(BaseModel):
    """Paginated list of users (following or followers)."""
    users: List[FollowUserInfo]
    total: int
    page: int
    limit: int
    has_more: bool


class FollowStatsResponse(BaseModel):
    """Follow statistics for a user."""
    user_id: int
    follower_count: int
    following_count: int
    friend_count: int


class FollowCheckManyResponse(BaseModel):
    """Batch follow status check."""
    follow_statuses: dict  # { user_id: is_following }
