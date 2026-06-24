"""
Favorite Model
"""

from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Favorite(BaseModel):
    """User favorite/bookmark model."""

    __tablename__ = "user_favorites"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(20), nullable=False, index=True)
    content_id = Column(Integer, nullable=False, index=True)
    title = Column(String(500), nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'content_type', 'content_id', name='uq_favorites_user_content'),
    )

    user = relationship("User", back_populates="favorites")

    def __repr__(self):
        return f"<Favorite user_id={self.user_id} type={self.content_type} id={self.content_id}>"
