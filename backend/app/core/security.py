"""
Core Security Module
Handles password hashing, JWT token generation and verification
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
import bcrypt
import hashlib
import secrets

from app.config import settings


class TokenManager:
    """JWT Token management utilities."""

    ALGORITHM = settings.ALGORITHM

    @classmethod
    def _get_secret_key(cls) -> str:
        """Get the secret key from settings."""
        return settings.secret_key

    @classmethod
    def create_access_token(
        cls,
        subject: str,
        expires_delta: Optional[timedelta] = None,
        remember: bool = False
    ) -> str:
        """
        Create a new access token.

        Args:
            subject: User ID to encode in token
            expires_delta: Custom expiration time
            remember: If True, token expires in 30 days instead of 7 days

        Returns:
            Encoded JWT token string
        """
        now = datetime.now(timezone.utc)
        if expires_delta:
            expire = now + expires_delta
        elif remember:
            expire = now + timedelta(days=30)
        else:
            expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode: Dict[str, Any] = {
            "exp": expire,
            "sub": str(subject),
            "type": "access",
            "iat": now,
            "jti": secrets.token_urlsafe(16)  # Unique token ID for revocation
        }
        return jwt.encode(to_encode, cls._get_secret_key(), algorithm=cls.ALGORITHM)

    @classmethod
    def create_refresh_token(cls, subject: str) -> str:
        """
        Create a new refresh token.

        Args:
            subject: User ID to encode in token

        Returns:
            Encoded JWT refresh token string
        """
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode: Dict[str, Any] = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh",
            "iat": now,
            "jti": secrets.token_urlsafe(16)  # Unique token ID for revocation
        }
        return jwt.encode(to_encode, cls._get_secret_key(), algorithm=cls.ALGORITHM)

    @classmethod
    def verify_token(cls, token: str, token_type: str = "access") -> Optional[str]:  # nosec B107
        """
        Verify and decode a JWT token.

        Args:
            token: JWT token string
            token_type: Expected token type ('access' or 'refresh')

        Returns:
            User ID (subject) if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, cls._get_secret_key(), algorithms=[cls.ALGORITHM])
            if payload.get("type") != token_type:
                return None
            return payload.get("sub")
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @classmethod
    def decode_token(cls, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode a JWT token without verification (for inspection).

        Args:
            token: JWT token string

        Returns:
            Token payload if valid, None otherwise
        """
        try:
            return jwt.decode(token, cls._get_secret_key(), algorithms=[cls.ALGORITHM])
        except jwt.InvalidTokenError:
            return None

    @classmethod
    def get_token_expiry(cls, token: str) -> Optional[datetime]:
        """Get expiration time of a token."""
        try:
            payload = jwt.decode(token, cls._get_secret_key(), algorithms=[cls.ALGORITHM])
            exp = payload.get("exp")
            if exp:
                return datetime.fromtimestamp(exp, tz=timezone.utc)
            return None
        except jwt.InvalidTokenError:
            return None

    @classmethod
    def get_token_jti(cls, token: str) -> Optional[str]:
        """Get the unique token ID (jti) for revocation support."""
        try:
            payload = jwt.decode(token, cls._get_secret_key(), algorithms=[cls.ALGORITHM])
            return payload.get("jti")
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def hash_token(token: str) -> str:
        """Create a SHA256 hash of a token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()


class PasswordManager:
    """Password hashing and verification utilities."""

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a plain text password.

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        # Truncate to 72 bytes for bcrypt compatibility
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored password hash

        Returns:
            True if password matches, False otherwise
        """
        # Truncate to 72 bytes for bcrypt compatibility
        password_bytes = plain_password.encode('utf-8')[:72]
        try:
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength.

        Requirements:
        - At least 8 characters
        - At least 2 character types (lowercase, uppercase, digit, special)

        Args:
            password: Password to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters"

        import re
        types = sum([
            bool(re.search(r'[a-z]', password)),
            bool(re.search(r'[A-Z]', password)),
            bool(re.search(r'\d', password)),
            bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        ])

        if types < 2:
            return False, "Password must contain at least 2 character types (lowercase, uppercase, digit, special)"

        return True, ""


def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username format.

    Requirements:
    - 3-20 characters
    - Only letters, numbers, underscores, and Chinese characters

    Args:
        username: Username to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    import re

    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 20:
        return False, "Username must be at most 20 characters"

    # Allow Chinese characters, letters, numbers, and underscores
    if not re.match(r'^[\w\u4e00-\u9fa5]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and Chinese characters"

    return True, ""