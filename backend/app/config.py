"""
Application Configuration
"""

import os
import secrets
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


# Module-level cached secret key for development
_cached_secret_key: str = ""


def get_secret_key() -> str:
    """
    Get SECRET_KEY from environment or generate a secure random key.

    In production, SECRET_KEY MUST be set via environment variable.
    In development, a random key is generated once and cached.
    """
    global _cached_secret_key

    # Check environment variable first
    key = os.environ.get("SECRET_KEY")
    if key:
        return key

    # Return cached key if available
    if _cached_secret_key:
        return _cached_secret_key

    # Development fallback: generate random key once
    if os.environ.get("ENVIRONMENT", "development") == "production":
        raise ValueError(
            "SECRET_KEY environment variable must be set in production. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )

    _cached_secret_key = secrets.token_urlsafe(32)
    return _cached_secret_key


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "TechInk API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/techink"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Security
    SECRET_KEY: str = ""  # Set via property to use get_secret_key()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"]'
    CORS_METHODS: str = '["*"]'
    CORS_HEADERS: str = '["*"]'

    @property
    def secret_key(self) -> str:
        """Get the secret key (cached at module level)."""
        return get_secret_key()

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string to list."""
        import json
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://10.29.138.55:5173",
            ]

    @property
    def cors_methods_list(self) -> List[str]:
        """Parse CORS_METHODS string to list."""
        import json
        try:
            return json.loads(self.CORS_METHODS)
        except Exception:
            return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

    @property
    def cors_headers_list(self) -> List[str]:
        """Parse CORS_HEADERS string to list."""
        import json
        try:
            return json.loads(self.CORS_HEADERS)
        except Exception:
            return ["Content-Type", "Authorization"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()