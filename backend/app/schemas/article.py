"""
Article Schemas - User-submitted articles with draft/review/publish workflow
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


ArticleStatusValue = Literal["draft", "pending", "published", "rejected"]

ArticleCategoryValue = Literal[
    "frontend",
    "backend",
    "ai",
    "opensource",
    "career",
    "language",
    "system",
    "tools",
]


class ArticleBase(BaseModel):
    """Base article schema."""

    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=50000)
    category: ArticleCategoryValue = Field(..., description="Article category")
    tags: List[str] = Field(default_factory=list)
    cover_image: Optional[str] = None
    excerpt: Optional[str] = None
    subtitle: Optional[str] = Field(None, max_length=500)


class ArticleCreate(ArticleBase):
    """Create article schema. Status defaults to 'pending' for submission, 'draft' for save."""

    status: ArticleStatusValue = Field("pending", description="Article status")


class ArticleUpdate(BaseModel):
    """Update article schema."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1, max_length=50000)
    category: Optional[ArticleCategoryValue] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    excerpt: Optional[str] = None
    subtitle: Optional[str] = Field(None, max_length=500)
    status: Optional[ArticleStatusValue] = None


class ArticleResponse(BaseModel):
    """Full article response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    subtitle: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    category: str
    status: str
    tags: List[str] = Field(default_factory=list)
    views: int = 0
    likes: int = 0
    is_featured: bool = False
    published_at: Optional[int] = None
    created_at: int
    updated_at: Optional[int] = None


class ArticleListResponse(BaseModel):
    """Simplified article list item."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    subtitle: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    category: str
    status: str
    tags: List[str] = Field(default_factory=list)
    views: int = 0
    likes: int = 0
    is_featured: bool = False
    published_at: Optional[int] = None
    created_at: int


class ArticleListResult(BaseModel):
    """Paginated article list result."""

    articles: List[ArticleListResponse]
    total: int
    page: int
    limit: int
    total_pages: int
