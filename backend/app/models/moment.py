"""
Moment (Dynamic Posts / 动态) Model

Similar to a social feed / WeChat Moments.
Supports text, images, code snippets, and mixed content types.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON

from app.models.base import BaseModel


class Moment(BaseModel):
    """Moment/dynamic post model (like WeChat Moments / social feed)."""

    __tablename__ = "moments"

    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(50), nullable=False)
    author_avatar = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    content_type = Column(String(20), default="text", nullable=False)  # text, image, code, mixed
    code_snippet = Column(JSON, nullable=True)  # {filename, language, code}
    images = Column(JSON, nullable=True)  # [{url, alt}]
    visibility = Column(String(20), default="public", nullable=False)  # public, followers, private
    location = Column(String(255), nullable=True)
    likes = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    author = relationship("User", back_populates="moments")

    def to_dict(self) -> dict:
        data = super().to_dict()
        data.pop("is_deleted", None)
        return data

    def __repr__(self):
        return f"<Moment id={self.id} author={self.author_name}>"


class MomentLike(BaseModel):
    """Moment like tracking."""

    __tablename__ = "moment_likes"

    moment_id = Column(Integer, ForeignKey("moments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "moment_id", name="uq_moment_likes_user_moment"),
    )

    def __repr__(self):
        return f"<MomentLike moment_id={self.moment_id} user_id={self.user_id}>"


class MomentComment(BaseModel):
    """Moment comment model."""

    __tablename__ = "moment_comments"

    moment_id = Column(Integer, ForeignKey("moments.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(50), nullable=False)
    author_avatar = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    reply_to_id = Column(Integer, ForeignKey("moment_comments.id", ondelete="SET NULL"), nullable=True)
    reply_to_name = Column(String(50), nullable=True)

    # Relationships
    moment = relationship("Moment")

    def __repr__(self):
        return f"<MomentComment id={self.id} moment_id={self.moment_id}>"
