"""
Token Blacklist Model
For JWT token revocation support.
"""

from sqlalchemy import Column, String, Integer, Index
from datetime import datetime, timezone

from app.models.base import BaseModel


class TokenBlacklist(BaseModel):
    """
    Token blacklist for JWT revocation.

    Stores JTI (JWT ID) of revoked tokens to prevent their reuse.
    """

    __tablename__ = "token_blacklist"

    jti = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    token_type = Column(String(20), nullable=False)  # 'access' or 'refresh'
    reason = Column(String(50), nullable=True)  # 'logout', 'password_change', 'security'
    expires_at = Column(Integer, nullable=False)  # Unix timestamp

    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_token_blacklist_user_jti', 'user_id', 'jti'),
    )

    @classmethod
    def is_expired(cls) -> bool:
        """Check if the token has expired (for cleanup)."""
        return datetime.now(timezone.utc).timestamp() > (cls.expires_at / 1000)

    def __repr__(self):
        return f"<TokenBlacklist jti={self.jti[:8]}... user_id={self.user_id}>"