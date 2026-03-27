"""
Auth Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from urllib.parse import urlparse
import re


# Allowed avatar URL domains (whitelist)
ALLOWED_AVATAR_DOMAINS = [
    # Common avatar services
    "avatars.githubusercontent.com",
    "github.com",
    "gitlab.com",
    "gravatar.com",
    "cdn.discordapp.com",
    # Common cloud storage
    "cloudinary.com",
    "res.cloudinary.com",
    "s3.amazonaws.com",
    "storage.googleapis.com",
    # Common CDN
    "cdn.jsdelivr.net",
    "imgur.com",
    "i.imgur.com",
    # Local development
    "localhost",
    "127.0.0.1",
]


class LoginCredentials(BaseModel):
    """Login request."""

    username: str = Field(..., min_length=1, description="Username or email")
    password: str = Field(..., min_length=1)
    remember: bool = Field(default=False)


class RegisterCredentials(BaseModel):
    """Register request."""

    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=8)
    avatar: Optional[str] = Field(None, description="Avatar URL")
    bio: Optional[str] = Field(None, max_length=500)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not re.match(r'^[\w\u4e00-\u9fa5]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and Chinese characters')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        # P2-25: Use centralized password validation
        from app.core.security import PasswordManager
        is_valid, error_msg = PasswordManager.validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

    @field_validator('avatar')
    @classmethod
    def validate_avatar_url(cls, v):
        if v is None:
            return v

        # Check URL length
        if len(v) > 2000:
            raise ValueError('Avatar URL must be less than 2000 characters')

        # Parse URL
        try:
            parsed = urlparse(v)
        except Exception:
            raise ValueError('Invalid avatar URL format')

        # Check scheme
        if parsed.scheme not in ('http', 'https'):
            raise ValueError('Avatar URL must use http or https protocol')

        # Check for valid network location
        if not parsed.netloc:
            raise ValueError('Avatar URL must have a valid domain')

        # Check domain against whitelist
        domain = parsed.netloc.lower()
        # Remove port if present
        if ':' in domain:
            domain = domain.split(':')[0]

        # Check if domain is in whitelist or is a subdomain of whitelisted domain
        is_allowed = False
        for allowed_domain in ALLOWED_AVATAR_DOMAINS:
            if domain == allowed_domain or domain.endswith('.' + allowed_domain):
                is_allowed = True
                break

        if not is_allowed:
            raise ValueError(
                f'Avatar URL domain not allowed. Allowed domains: {", ".join(ALLOWED_AVATAR_DOMAINS[:5])}...'
            )

        return v


class TokenData(BaseModel):
    """Token response data."""

    accessToken: str
    refreshToken: str
    expiresIn: int  # Seconds until expiration


class AuthUser(BaseModel):
    """Authenticated user data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    avatar: Optional[str] = None
    role: str = "user"


class AuthResponse(BaseModel):
    """Login/Register response."""

    user: AuthUser
    token: TokenData


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refreshToken: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request."""

    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        types = sum([
            bool(re.search(r'[a-z]', v)),
            bool(re.search(r'[A-Z]', v)),
            bool(re.search(r'\d', v)),
            bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', v))
        ])
        if types < 2:
            raise ValueError('Password must contain at least 2 character types')
        return v