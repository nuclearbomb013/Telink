"""
Message Model - Private messages between users.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, ForeignKey, Index
from app.models.base import BaseModel


class Message(BaseModel):
    """Private message between two users."""

    __tablename__ = "messages"

    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    receiver_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="sent")  # sent, delivered, read
    is_read = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)  # global/admin delete
    deleted_by_sender = Column(Boolean, nullable=False, default=False)
    deleted_by_receiver = Column(Boolean, nullable=False, default=False)
    read_at = Column(BigInteger, nullable=True)  # Unix ms when receiver read it

    __table_args__ = (
        Index("ix_messages_sender_receiver", "sender_id", "receiver_id"),
        Index("ix_messages_receiver_sender", "receiver_id", "sender_id"),
        Index(
            "ix_messages_sender_visible_latest",
            "sender_id", "is_deleted", "deleted_by_sender",
            "receiver_id", "created_at", "id",
        ),
        Index(
            "ix_messages_receiver_visible_latest",
            "receiver_id", "is_deleted", "deleted_by_receiver",
            "sender_id", "created_at", "id",
        ),
        Index(
            "ix_messages_unread_receiver_sender",
            "receiver_id", "is_read", "is_deleted",
            "deleted_by_receiver", "sender_id",
        ),
    )

    def __repr__(self) -> str:
        return f"<Message {self.id}: {self.sender_id} -> {self.receiver_id}>"
