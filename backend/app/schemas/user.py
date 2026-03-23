"""
User Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from urllib.parse import urlparse


# Allowed avatar URL domains (whitelist) - same as auth.py
ALLOWED_AVATAR_DOMAINS = [
    "avatars.githubusercontent.com",
    "github.com",
    "gitlab.com",
    "gravatar.com",
    "cdn.discordapp.com",
    "cloudinary.com",
    "res.cloudinary.com",
    "s3.amazonaws.com",
    "storage.googleapis.com",
    "cdn.jsdelivr.net",
    "imgur.com",
    "i.imgur.com",
    "localhost",
    "127.0.0.1",
]


def validate_avatar_url(v: Optional[str]) -> Optional[str]:
    """Validate avatar URL against whitelist."""
    if v is None:
        return v

    if len(v) > 2000:
        raise ValueError('Avatar URL must be less than 2000 characters')

    try:
        parsed = urlparse(v)
    except Exception:
        raise ValueError('Invalid avatar URL format')

    if parsed.scheme not in ('http', 'https'):
        raise ValueError('Avatar URL must use http or https protocol')

    if not parsed.netloc:
        raise ValueError('Avatar URL must have a valid domain')

    domain = parsed.netloc.lower()
    if ':' in domain:
        domain = domain.split(':')[0]

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


class UserBase(BaseModel):
    """Base user schema."""

    username: str = Field(..., min_length=3, max_length=20)
    email: str = Field(..., max_length=255)
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    """Create user schema."""

    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Update user schema."""

    username: Optional[str] = Field(None, min_length=3, max_length=20)
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)

    @field_validator('avatar')
    @classmethod
    def validate_avatar(cls, v):
        return validate_avatar_url(v)


class UserResponse(BaseModel):
    """User response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    post_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    created_at: int  # Unix timestamp in milliseconds


class UserPublic(BaseModel):
    """Public user info (no sensitive data)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    post_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    created_at: int


class UserStats(BaseModel):
    """User statistics."""

    post_count: int = 0
    comment_count: int = 0
    like_count: int = 0
    following_count: int = 0
    follower_count: int = 0