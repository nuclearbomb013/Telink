"""
Post Model
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


# Many-to-Many relationship table for post tags
post_tags = Table(
    'post_tags',
    BaseModel.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('post_id', Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
    Column('tag', String(50), nullable=False),
    Column('created_at', Integer, nullable=False),  # Unix timestamp
)


class Post(BaseModel):
    """Forum post model."""

    __tablename__ = "posts"

    title = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    cover_image = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(50), nullable=False)
    author_avatar = Column(Text, nullable=True)
    category = Column(String(20), index=True, nullable=False)
    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_solved = Column(Boolean, default=False, nullable=False)

    # Relationships
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    post_likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = super().to_dict()
        # Add tags as list
        data["tags"] = [tag.tag for tag in self.tags] if self.tags else []
        return data

    def __repr__(self):
        return f"<Post {self.title}>"


class PostTag(BaseModel):
    """Post tag model."""

    __tablename__ = "post_tags_table"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    tag = Column(String(50), nullable=False, index=True)

    # Relationships
    post = relationship("Post", back_populates="tags")

    def __repr__(self):
        return f"<PostTag {self.tag}>"


class PostLike(BaseModel):
    """Post like model."""

    __tablename__ = "post_likes"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    post = relationship("Post", back_populates="post_likes")

    def __repr__(self):
        return f"<PostLike post_id={self.post_id} user_id={self.user_id}>"