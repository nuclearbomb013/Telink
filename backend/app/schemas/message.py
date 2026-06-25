"""
Message Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """Create a new message."""
    receiver_id: int = Field(..., ge=1)
    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    """Message response."""
    id: int
    sender_id: int
    receiver_id: int
    content: str
    status: str = "sent"
    is_read: bool = False
    is_deleted: bool = False
    created_at: int  # Unix ms


class ConversationResponse(BaseModel):
    """A conversation summary (one per user pair)."""
    user_id: int
    username: str
    avatar: Optional[str] = None
    last_message: str
    last_message_at: int
    unread_count: int


class ConversationListResult(BaseModel):
    """List of conversations."""
    conversations: List[ConversationResponse]
    total: int


class MessageListResult(BaseModel):
    """List of messages within a conversation."""
    messages: List[MessageResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class MessageUnreadCountResponse(BaseModel):
    """Total unread message count."""
    total_unread: int
    conversation_unreads: List[dict]  # [{user_id, unread_count}]
