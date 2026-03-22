"""
Notification Model
"""

import enum
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class NotificationType(str, enum.Enum):
    """Notification type enum."""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class Notification(BaseModel):
    """Notification model."""

    __tablename__ = "notifications"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), default=NotificationType.INFO, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    expires_at = Column(Integer, nullable=True)  # Unix timestamp in milliseconds

    # Relationships
    user = relationship("User", back_populates="notifications")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = super().to_dict()
        return data

    def __repr__(self):
        return f"<Notification user_id={self.user_id} title={self.title}>"