"""
Post Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class PostCategory:
    """Post categories."""
    ANNOUNCE = "announce"
    GENERAL = "general"
    HELP = "help"
    SHOWCASE = "showcase"
    JOBS = "jobs"

    ALL = [ANNOUNCE, GENERAL, HELP, SHOWCASE, JOBS]


class PostBase(BaseModel):
    """Base post schema."""

    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    category: str = Field(..., description="Post category")
    tags: List[str] = Field(default_factory=list)
    cover_image: Optional[str] = None
    excerpt: Optional[str] = None


class PostCreate(PostBase):
    """Create post schema."""

    pass


class PostUpdate(BaseModel):
    """Update post schema."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    excerpt: Optional[str] = None


class PostResponse(BaseModel):
    """Post response schema."""

    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    category: str
    tags: List[str] = Field(default_factory=list)
    views: int = 0
    likes: int = 0
    reply_count: int = 0
    is_pinned: bool = False
    is_locked: bool = False
    is_featured: bool = False
    is_solved: bool = False
    created_at: int  # Unix timestamp in milliseconds
    updated_at: Optional[int] = None

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """Post list item (simplified)."""

    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    category: str
    tags: List[str] = Field(default_factory=list)
    views: int = 0
    likes: int = 0
    reply_count: int = 0
    is_pinned: bool = False
    created_at: int

    class Config:
        from_attributes = True


class PostListResult(BaseModel):
    """Paginated post list result."""

    posts: List[PostListResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class GetPostsParams(BaseModel):
    """Get posts query parameters."""

    category: Optional[str] = None
    sortBy: Optional[str] = Field(None, description="newest|oldest|popular|liked")
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    search: Optional[str] = None
    tags: Optional[List[str]] = None


class PostStats(BaseModel):
    """Forum statistics."""

    total_posts: int = 0
    total_replies: int = 0
    total_users: int = 0
    posts_by_category: dict = Field(default_factory=dict)