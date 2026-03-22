"""
Comment Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class CommentBase(BaseModel):
    """Base comment schema."""

    content: str = Field(..., min_length=1, max_length=10000)


class CommentCreate(CommentBase):
    """Create comment schema."""

    post_id: int
    parent_id: Optional[int] = None
    reply_to_id: Optional[int] = None
    reply_to_name: Optional[str] = None


class CommentUpdate(BaseModel):
    """Update comment schema."""

    content: str = Field(..., min_length=1, max_length=10000)


class CommentResponse(BaseModel):
    """Comment response schema."""

    id: int
    post_id: int
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    likes: int = 0
    parent_id: Optional[int] = None
    reply_to_id: Optional[int] = None
    reply_to_name: Optional[str] = None
    created_at: int  # Unix timestamp in milliseconds
    updated_at: Optional[int] = None

    class Config:
        from_attributes = True


class CommentWithReplies(CommentResponse):
    """Comment with replies."""

    replies: List["CommentResponse"] = Field(default_factory=list)


class CommentListResult(BaseModel):
    """Paginated comment list result."""

    comments: List[CommentWithReplies]
    total: int
    page: int
    limit: int
    total_pages: int


class GetCommentsParams(BaseModel):
    """Get comments query parameters."""

    post_id: int
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=100)
    sortBy: Optional[str] = Field(None, description="newest|oldest|popular")