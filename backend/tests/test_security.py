"""
Tests for P0-4 and P0-10: JWT Token Management
"""

import pytest
from datetime import datetime, timezone, timedelta


class TestTokenManager:
    """Test JWT token management with PyJWT."""

    def test_create_access_token(self):
        """Test creating an access token."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="123")

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test creating a refresh token."""
        from app.core.security import TokenManager

        token = TokenManager.create_refresh_token(subject="123")

        assert token is not None
        assert isinstance(token, str)

    def test_verify_access_token(self):
        """Test verifying a valid access token."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="456")
        user_id = TokenManager.verify_token(token, "access")

        assert user_id == "456"

    def test_verify_refresh_token(self):
        """Test verifying a valid refresh token."""
        from app.core.security import TokenManager

        token = TokenManager.create_refresh_token(subject="789")
        user_id = TokenManager.verify_token(token, "refresh")

        assert user_id == "789"

    def test_verify_wrong_token_type(self):
        """Test that wrong token type fails verification."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="123")
        user_id = TokenManager.verify_token(token, "refresh")

        assert user_id is None

    def test_token_has_jti(self):
        """Test that tokens include JTI for revocation support (P0-4)."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="123")
        jti = TokenManager.get_token_jti(token)

        assert jti is not None
        assert len(jti) > 0

    def test_refresh_token_has_jti(self):
        """Test that refresh tokens also include JTI."""
        from app.core.security import TokenManager

        token = TokenManager.create_refresh_token(subject="123")
        jti = TokenManager.get_token_jti(token)

        assert jti is not None

    def test_decode_token(self):
        """Test decoding token payload."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="123", remember=True)
        payload = TokenManager.decode_token(token)

        assert payload is not None
        assert payload.get("sub") == "123"
        assert payload.get("type") == "access"

    def test_get_token_expiry(self):
        """Test getting token expiry time."""
        from app.core.security import TokenManager

        token = TokenManager.create_access_token(subject="123")
        expiry = TokenManager.get_token_expiry(token)

        assert expiry is not None
        assert expiry > datetime.now(timezone.utc)

    def test_invalid_token_returns_none(self):
        """Test that invalid tokens return None."""
        from app.core.security import TokenManager

        user_id = TokenManager.verify_token("invalid.token.here", "access")
        assert user_id is None

    def test_token_expiry_verification(self):
        """Test that expired tokens fail verification."""
        from app.core.security import TokenManager

        # Create token that expired 1 hour ago
        token = TokenManager.create_access_token(
            subject="123",
            expires_delta=timedelta(hours=-1)
        )

        # Should return None for expired token
        user_id = TokenManager.verify_token(token, "access")
        assert user_id is None

    def test_hash_token(self):
        """Test token hashing for storage."""
        from app.core.security import TokenManager

        token = "test-token-value"
        hash1 = TokenManager.hash_token(token)
        hash2 = TokenManager.hash_token(token)

        # Same token should produce same hash
        assert hash1 == hash2
        # Hash should be SHA256 hex (64 characters)
        assert len(hash1) == 64