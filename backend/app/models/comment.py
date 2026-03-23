"""
Comment Model
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Comment(BaseModel):
    """Comment model."""

    __tablename__ = "comments"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(50), nullable=False)
    author_avatar = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_to_id = Column(Integer, ForeignKey("comments.id", ondelete="SET NULL"), nullable=True)
    reply_to_name = Column(String(50), nullable=True)
    is_deleted = Column(Integer, default=0, nullable=False)  # 0 = not deleted, 1 = deleted

    # Relationships
    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")
    replies = relationship(
        "Comment",
        backref="parent",
        remote_side="Comment.id",
        foreign_keys=[parent_id],
    )
    reply_to = relationship(
        "Comment",
        foreign_keys=[reply_to_id],
    )
    comment_likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = super().to_dict()
        data.pop("is_deleted", None)
        return data

    def __repr__(self):
        return f"<Comment id={self.id} post_id={self.post_id}>"


class CommentLike(BaseModel):
    """Comment like model."""

    __tablename__ = "comment_likes"

    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Unique constraint: one like per user per comment
    __table_args__ = (
        UniqueConstraint('user_id', 'comment_id', name='uq_comment_likes_user_comment'),
    )

    # Relationships
    comment = relationship("Comment", back_populates="comment_likes")

    def __repr__(self):
        return f"<CommentLike comment_id={self.comment_id} user_id={self.user_id}>"