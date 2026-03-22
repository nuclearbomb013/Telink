"""
Auth Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


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
        types = sum([
            bool(re.search(r'[a-z]', v)),
            bool(re.search(r'[A-Z]', v)),
            bool(re.search(r'\d', v)),
            bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', v))
        ])
        if types < 2:
            raise ValueError('Password must contain at least 2 character types')
        return v


class TokenData(BaseModel):
    """Token response data."""

    accessToken: str
    refreshToken: str
    expiresIn: int  # Seconds until expiration


class AuthUser(BaseModel):
    """Authenticated user data."""

    id: int
    username: str
    email: str
    avatar: Optional[str] = None
    role: str = "user"

    class Config:
        from_attributes = True


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