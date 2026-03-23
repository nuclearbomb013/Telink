"""
Notification Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NotificationType:
    """Notification types."""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

    ALL = [INFO, SUCCESS, WARNING, ERROR]


class NotificationBase(BaseModel):
    """Base notification schema."""

    type: str = Field(default="info")
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    link: Optional[str] = None


class NotificationCreate(NotificationBase):
    """Create notification schema."""

    user_id: int
    expires_at: Optional[int] = None  # Unix timestamp


class NotificationResponse(NotificationBase):
    """Notification response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_read: bool = False
    created_at: int  # Unix timestamp in milliseconds


class NotificationListResult(BaseModel):
    """Notification list result."""

    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Unread notification count."""

    count: int