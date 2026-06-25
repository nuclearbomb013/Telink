"""
Follow Model - User follow/follower relationships.
"""

from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, CheckConstraint, Index
from app.models.base import BaseModel


class Follow(BaseModel):
    """User follow relationship (follower -> following)."""

    __tablename__ = "follows"

    follower_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    following_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "follower_id", "following_id", name="uq_follows_pair"
        ),
        CheckConstraint(
            "follower_id <> following_id", name="ck_follows_no_self"
        ),
        Index("ix_follows_follower_created_at", "follower_id", "created_at"),
        Index("ix_follows_following_created_at", "following_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Follow {self.follower_id} -> {self.following_id}>"
