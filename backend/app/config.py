"""
Application Configuration
"""

import os
import secrets
import warnings
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Module-level cache for development fallback key
_dev_secret_key: str = ""


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
    # IMPORTANT: SECRET_KEY must be set in .env file for persistent tokens
    # Pydantic will load this from .env automatically
    SECRET_KEY: str = ""  # Loaded from .env via Pydantic
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: str = '["*"]'  # 开发环境允许所有来源
    CORS_METHODS: str = '["*"]'
    CORS_HEADERS: str = '["*"]'

    @property
    def secret_key(self) -> str:
        """
        Get the secret key for JWT signing.

        Priority:
        1. SECRET_KEY from .env (loaded by Pydantic into self.SECRET_KEY)
        2. os.environ["SECRET_KEY"] (if set externally)
        3. Generate random key for development (cached at module level)

        WARNING: In production, SECRET_KEY MUST be set in .env or environment.
        Without a persistent key, all tokens become invalid on server restart.
        """
        # First check Pydantic-loaded value from .env
        if self.SECRET_KEY:
            return self.SECRET_KEY

        # Check system environment variable (for Docker/K8s deployment)
        key = os.environ.get("SECRET_KEY")
        if key:
            return key

        # Production environment: must have a configured key
        if self.ENVIRONMENT == "production":
            raise ValueError(
                "SECRET_KEY must be set in .env or environment variable in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )

        # Development fallback: use cached random key
        global _dev_secret_key
        if _dev_secret_key:
            return _dev_secret_key

        # Generate random key for development (persists for process lifetime)
        _dev_secret_key = secrets.token_urlsafe(32)
        warnings.warn(
            "SECRET_KEY not set in .env - using random key for development. "
            "Tokens will be invalid after server restart. "
            "Add SECRET_KEY to backend/.env for persistent tokens.",
            UserWarning
        )
        return _dev_secret_key

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string to list."""
        import json
        try:
            origins = json.loads(self.CORS_ORIGINS)
            # 如果是 ["*"]，返回 ["*"] 让所有来源都允许
            return origins
        except Exception:
            return ["*"]  # 默认允许所有来源

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

    # P10-116: Use Pydantic v2 SettingsConfigDict instead of class Config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()