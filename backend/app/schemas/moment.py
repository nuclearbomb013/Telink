"""
Moment (动态) Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class CodeSnippet(BaseModel):
    """Code snippet within a moment."""
    filename: str = ""
    language: str = ""
    code: str = ""


class MomentImage(BaseModel):
    """Image within a moment."""
    url: str
    alt: str = ""


class MomentCreate(BaseModel):
    """Schema for creating a moment."""
    content: str = Field(..., min_length=1, max_length=10000)
    content_type: str = Field(default="text")  # text, image, code, mixed
    visibility: str = Field(default="public")  # public, followers, private
    code_snippet: Optional[CodeSnippet] = None
    images: Optional[List[MomentImage]] = None
    location: Optional[str] = None


class MomentUpdate(BaseModel):
    """Schema for updating a moment."""
    content: Optional[str] = Field(None, max_length=10000)
    content_type: Optional[str] = None
    visibility: Optional[str] = None
    code_snippet: Optional[CodeSnippet] = None
    images: Optional[List[MomentImage]] = None
    location: Optional[str] = None


class MomentResponse(BaseModel):
    """Schema for moment response data."""
    id: int
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    content_type: str = "text"
    code_snippet: Optional[CodeSnippet] = None
    images: Optional[List[MomentImage]] = None
    visibility: str = "public"
    location: Optional[str] = None
    likes: int = 0
    comment_count: int = 0
    is_liked: bool = False
    created_at: int  # Unix timestamp ms
    updated_at: Optional[int] = None


class MomentCommentCreate(BaseModel):
    """Schema for creating a moment comment."""
    content: str = Field(..., min_length=1, max_length=5000)
    reply_to_id: Optional[int] = None
    reply_to_name: Optional[str] = None


class MomentCommentResponse(BaseModel):
    """Schema for moment comment response."""
    id: int
    moment_id: int
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    likes: int = 0
    reply_to_id: Optional[int] = None
    reply_to_name: Optional[str] = None
    is_liked: bool = False
    created_at: int


class MomentListResult(BaseModel):
    """Schema for paginated moment list."""
    moments: List[MomentResponse]
    total: int
    page: int
    limit: int
    has_more: bool
