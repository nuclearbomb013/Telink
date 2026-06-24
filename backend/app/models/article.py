"""
Article Model - User-submitted articles with draft/review/publish workflow
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.models.base import BaseModel


class ArticleStatus(PyEnum):
    """Article lifecycle status."""
    DRAFT = "draft"
    PENDING = "pending"
    PUBLISHED = "published"
    REJECTED = "rejected"


class Article(BaseModel):
    """User-submitted article model with review workflow."""

    __tablename__ = "articles"

    title = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    subtitle = Column(String(500), nullable=True)
    cover_image = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(50), nullable=False)
    author_avatar = Column(Text, nullable=True)
    category = Column(String(30), index=True, nullable=False)
    status = Column(String(20), default=ArticleStatus.DRAFT.value, nullable=False, index=True)
    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    published_at = Column(BigInteger, nullable=True)

    # Relationships
    author = relationship("User", backref="articles")
    tags = relationship("ArticleTag", back_populates="article", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to dictionary. Tags are queried separately in async contexts."""
        data = super().to_dict()
        data["tags"] = []
        return data

    def __repr__(self):
        return f"<Article {self.title} [{self.status}]>"


class ArticleTag(BaseModel):
    """Article tag association model."""

    __tablename__ = "article_tags"

    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    tag = Column(String(50), nullable=False)
    created_at = Column(BigInteger, nullable=False)  # Unix timestamp in milliseconds

    article = relationship("Article", back_populates="tags")

    def __repr__(self):
        return f"<ArticleTag {self.tag}>"
