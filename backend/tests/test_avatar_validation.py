"""
Avatar URL Validation Tests
"""

import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterCredentials
from app.schemas.user import UserUpdate, validate_avatar_url


class TestValidateAvatarUrl:
    """Test the validate_avatar_url function."""

    def test_none_is_valid(self):
        """Test that None is valid (no avatar)."""
        assert validate_avatar_url(None) is None

    def test_valid_github_url(self):
        """Test valid GitHub avatar URL."""
        url = "https://avatars.githubusercontent.com/u/12345?v=4"
        assert validate_avatar_url(url) == url

    def test_valid_gravatar_url(self):
        """Test valid Gravatar URL."""
        url = "https://gravatar.com/avatar/12345abcdef"
        assert validate_avatar_url(url) == url

    def test_valid_imgur_url(self):
        """Test valid Imgur URL."""
        url = "https://i.imgur.com/abc123.png"
        assert validate_avatar_url(url) == url

    def test_valid_localhost_url(self):
        """Test valid localhost URL (for development)."""
        url = "http://localhost:3000/avatar.png"
        assert validate_avatar_url(url) == url

    def test_valid_url_with_port(self):
        """Test valid URL with port."""
        url = "http://localhost:8080/avatar.png"
        assert validate_avatar_url(url) == url

    def test_invalid_scheme(self):
        """Test that non-http(s) schemes are rejected."""
        with pytest.raises(ValueError, match="http or https"):
            validate_avatar_url("ftp://example.com/avatar.png")

    def test_invalid_domain(self):
        """Test that non-whitelisted domains are rejected."""
        with pytest.raises(ValueError, match="domain not allowed"):
            validate_avatar_url("https://evil.com/avatar.png")

    def test_invalid_url_format(self):
        """Test that invalid URL format is rejected."""
        # URL without scheme triggers scheme check first
        with pytest.raises(ValueError, match="http or https"):
            validate_avatar_url("not-a-valid-url")

    def test_url_too_long(self):
        """Test that URLs over 2000 chars are rejected."""
        long_url = "https://avatars.githubusercontent.com/" + "a" * 2000
        with pytest.raises(ValueError, match="less than 2000"):
            validate_avatar_url(long_url)

    def test_missing_domain(self):
        """Test that URLs without domain are rejected."""
        with pytest.raises(ValueError, match="valid domain"):
            validate_avatar_url("https:///avatar.png")


class TestRegisterCredentialsAvatar:
    """Test avatar validation in RegisterCredentials."""

    def test_register_without_avatar(self):
        """Test registration without avatar."""
        creds = RegisterCredentials(
            username="testuser",
            email="test@example.com",
            password="Password123"
        )
        assert creds.avatar is None

    def test_register_with_valid_avatar(self):
        """Test registration with valid avatar."""
        creds = RegisterCredentials(
            username="testuser",
            email="test@example.com",
            password="Password123",
            avatar="https://avatars.githubusercontent.com/u/12345?v=4"
        )
        assert creds.avatar == "https://avatars.githubusercontent.com/u/12345?v=4"

    def test_register_with_invalid_avatar(self):
        """Test registration with invalid avatar."""
        with pytest.raises(ValidationError) as exc_info:
            RegisterCredentials(
                username="testuser",
                email="test@example.com",
                password="Password123",
                avatar="https://evil.com/avatar.png"
            )
        assert "domain not allowed" in str(exc_info.value)


class TestUserUpdateAvatar:
    """Test avatar validation in UserUpdate."""

    def test_update_without_avatar(self):
        """Test update without avatar."""
        update = UserUpdate(bio="New bio")
        assert update.avatar is None

    def test_update_with_valid_avatar(self):
        """Test update with valid avatar."""
        update = UserUpdate(
            avatar="https://gravatar.com/avatar/12345"
        )
        assert update.avatar == "https://gravatar.com/avatar/12345"

    def test_update_with_invalid_avatar(self):
        """Test update with invalid avatar."""
        with pytest.raises(ValidationError) as exc_info:
            UserUpdate(avatar="https://evil.com/avatar.png")
        assert "domain not allowed" in str(exc_info.value)

    def test_update_clear_avatar(self):
        """Test clearing avatar with None."""
        update = UserUpdate(avatar=None)
        assert update.avatar is None