"""
Tests for P0-1: Secret Key Configuration
"""

import os
import pytest
from unittest.mock import patch


class TestSecretKey:
    """Test secret key configuration."""

    def test_secret_key_from_environment(self):
        """Test that SECRET_KEY is read from environment variable."""
        test_key = "test-secret-key-from-env-32-characters-long"

        with patch.dict(os.environ, {"SECRET_KEY": test_key}, clear=False):
            # Re-import to get new settings
            import sys

            # Clear cached module
            if "app.config" in sys.modules:
                del sys.modules["app.config"]

            from app.config import Settings

            settings = Settings()
            assert settings.SECRET_KEY == test_key or settings.secret_key == test_key

    def test_secret_key_production_missing_raises_error(self):
        """Test that missing SECRET_KEY in production raises error."""
        import sys

        # Clear cached modules
        for mod in list(sys.modules.keys()):
            if mod.startswith("app.config"):
                del sys.modules[mod]

        from app.config import Settings

        # Instantiate with empty SECRET_KEY, production env, no .env file
        settings = Settings(
            SECRET_KEY="",
            ENVIRONMENT="production",
            _env_file=None,  # Disable .env auto-load
        )

        with pytest.raises(ValueError, match="SECRET_KEY"):
            _ = settings.secret_key

    def test_secret_key_dev_fallback(self):
        """Test that dev environment generates a fallback key."""
        with patch.dict(os.environ, {"ENVIRONMENT": "development"}, clear=False):
            os.environ.pop("SECRET_KEY", None)

            import sys

            if "app.config" in sys.modules:
                del sys.modules["app.config"]

            from app.config import Settings

            settings = Settings()
            key = settings.secret_key
            assert key is not None
            assert len(key) >= 32  # Should be at least 32 characters