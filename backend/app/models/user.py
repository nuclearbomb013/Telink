"""
User Model
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, Enum as SQLEnum, BigInteger
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    """User role enum."""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"


class User(BaseModel):
    """User model."""

    __tablename__ = "users"

    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)  # type: ignore[var-annotated]
    post_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to dictionary, excluding sensitive fields."""
        data = super().to_dict()
        data.pop("password_hash", None)
        return data

    def to_public_dict(self) -> dict:
        """Convert to public dictionary for display."""
        return {
            "id": self.id,
            "username": self.username,
            "avatar": self.avatar,
            "bio": self.bio,
            "role": self.role.value if self.role else "user",
            "post_count": self.post_count,
            "comment_count": self.comment_count,
            "like_count": self.like_count,
            "created_at": int(self.created_at.timestamp() * 1000) if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.username}>"


class RefreshToken(BaseModel):
    """Refresh token for JWT authentication."""

    __tablename__ = "refresh_tokens"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(BigInteger, nullable=False)  # Unix timestamp in milliseconds
    revoked = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken user_id={self.user_id}>"


class PasswordResetToken(BaseModel):
    """Password reset token."""

    __tablename__ = "password_reset_tokens"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(BigInteger, nullable=False)  # Unix timestamp in milliseconds
    used = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="password_reset_tokens")

    def __repr__(self):
        return f"<PasswordResetToken user_id={self.user_id}>"