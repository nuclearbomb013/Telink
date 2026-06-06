"""
Authentication API Endpoints

Security:
- Refresh tokens stored as HttpOnly + Secure + SameSite cookies
- Access tokens returned in response body (stored in frontend memory only)
- CSRF protected via SameSite cookie attribute
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, RefreshToken, PasswordResetToken, UserRole
from app.models.token_blacklist import TokenBlacklist
from app.models.base import utcnow_naive
from app.schemas import (
    ServiceResponse,
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    AuthUser,
    TokenData,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.core.security import TokenManager, PasswordManager, validate_username
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Cookie configuration for refresh token
REFRESH_TOKEN_COOKIE = "refresh_token"  # nosec B105  # Cookie name, not a credential
REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 days in seconds


def _set_refresh_token_cookie(response: Response, token: str, remember: bool = True):
    """Set refresh token as HttpOnly + Secure + SameSite cookie."""
    max_age = REFRESH_TOKEN_MAX_AGE if remember else 60 * 60 * 24 * 7
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=max_age,
        path="/api/v1/auth",  # Only sent to auth endpoints
    )


def _clear_refresh_token_cookie(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path="/api/v1/auth",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
    )


def _get_refresh_token_from_request(request: Request) -> str | None:
    """Extract refresh token from HttpOnly cookie or request body."""
    # Try cookie first (preferred - HttpOnly)
    cookie_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if cookie_token:
        return cookie_token
    return None


@router.post("/login", response_model=ServiceResponse[AuthResponse])
async def login(
    credentials: LoginCredentials,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    User login.

    Returns access token and user info in response body.
    Sets refresh token as HttpOnly cookie.
    Uses constant-time comparison to prevent timing attacks.
    """
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            (User.username == credentials.username) | (User.email == credentials.username)
        )
    )
    user = result.scalar_one_or_none()

    # Timing attack prevention: always verify password even if user doesn't exist
    dummy_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTt.qW8uM/qnNa"
    password_hash = user.password_hash if user else dummy_hash

    # Verify password (constant-time comparison)
    password_valid = PasswordManager.verify_password(credentials.password, password_hash)

    if not user or not password_valid:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid username or password"
            }
        )

    if not user.is_active:
        return ServiceResponse(
            success=False,
            error={
                "code": "USER_INACTIVE",
                "message": "User account is deactivated"
            }
        )

    # Generate tokens
    access_token = TokenManager.create_access_token(str(user.id), remember=credentials.remember)
    refresh_token = TokenManager.create_refresh_token(str(user.id))

    # Store refresh token hash in DB
    token_hash = TokenManager.hash_token(refresh_token)
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp() * 1000)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)

    # Update last active
    user.updated_at = utcnow_naive()
    await db.commit()

    # Set refresh token as HttpOnly cookie (P0-4: prevent XSS theft)
    _set_refresh_token_cookie(response, refresh_token, remember=credentials.remember)

    # Return access token in body only (stored in frontend memory, not localStorage)
    return ServiceResponse(
        success=True,
        data=AuthResponse(
            user=AuthUser(
                id=user.id,
                username=user.username,
                email=user.email,
                avatar=user.avatar,
                role=user.role
            ),
            token=TokenData(
                accessToken=access_token,
                refreshToken="",  # refresh token is in HttpOnly cookie, not body
                expiresIn=604800 if not credentials.remember else 2592000
            )
        )
    )


@router.post("/register", response_model=ServiceResponse[AuthResponse])
async def register(
    credentials: RegisterCredentials,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    User registration.

    Creates new user and returns access token.
    """
    # Validate username format
    is_valid, error_msg = validate_username(credentials.username)
    if not is_valid:
        return ServiceResponse(
            success=False,
            error={
                "code": "VALIDATION_ERROR",
                "message": error_msg
            }
        )

    # Validate password strength
    is_valid, error_msg = PasswordManager.validate_password_strength(credentials.password)
    if not is_valid:
        return ServiceResponse(
            success=False,
            error={
                "code": "VALIDATION_ERROR",
                "message": error_msg
            }
        )

    # Check if username or email exists (P9-106: use generic message to prevent enumeration)
    result = await db.execute(select(User).where(User.username == credentials.username))
    username_exists = result.scalar_one_or_none() is not None

    result = await db.execute(select(User).where(User.email == credentials.email))
    email_exists = result.scalar_one_or_none() is not None

    # Return generic error to prevent user enumeration (P9-106)
    if username_exists or email_exists:
        return ServiceResponse(
            success=False,
            error={
                "code": "REGISTRATION_FAILED",
                "message": "注册失败，请尝试不同的用户名或邮箱"
            }
        )

    # Create user
    user = User(
        username=credentials.username,
        email=credentials.email,
        password_hash=PasswordManager.hash_password(credentials.password),
        bio=credentials.bio,
        role=UserRole.USER
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = TokenManager.create_access_token(str(user.id), remember=True)
    refresh_token = TokenManager.create_refresh_token(str(user.id))

    # Store refresh token
    token_hash = TokenManager.hash_token(refresh_token)
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp() * 1000)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()

    # Set refresh token as HttpOnly cookie (P0-4)
    _set_refresh_token_cookie(response, refresh_token, remember=True)

    return ServiceResponse(
        success=True,
        data=AuthResponse(
            user=AuthUser(
                id=user.id,
                username=user.username,
                email=user.email,
                avatar=user.avatar,
                role=user.role
            ),
            token=TokenData(
                accessToken=access_token,
                refreshToken="",  # In HttpOnly cookie
                expiresIn=2592000
            )
        )
    )


@router.post("/logout", response_model=ServiceResponse)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    User logout.

    Revokes the current access token and all refresh tokens.
    Clears the refresh token HttpOnly cookie.
    """
    # Get the current access token from headers
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        jti = TokenManager.get_token_jti(token)
        expiry = TokenManager.get_token_expiry(token)

        if jti and expiry:
            # Add access token to blacklist
            blacklist_entry = TokenBlacklist(
                jti=jti,
                user_id=current_user.id,
                token_type="access",  # nosec B106
                reason="logout",
                expires_at=int(expiry.timestamp() * 1000)
            )
            db.add(blacklist_entry)

    # Revoke all refresh tokens
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked.is_(False)
        )
    )
    tokens = result.scalars().all()

    for token in tokens:
        token.revoked = True

    await db.commit()

    # Clear refresh token HttpOnly cookie (P0-4)
    _clear_refresh_token_cookie(response)

    return ServiceResponse(success=True, data={"message": "Logged out successfully"})


@router.post("/refresh", response_model=ServiceResponse[TokenData])
async def refresh_token(
    request: Request,
    response: Response,
    body: RefreshTokenRequest | None = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token.

    Reads refresh token from HttpOnly cookie (preferred) or request body (fallback).
    Returns new access token in response body.
    Sets new refresh token as HttpOnly cookie.
    """
    # Prefer HttpOnly cookie for refresh token (P0-4)
    refresh_token_str = _get_refresh_token_from_request(request)

    # Fallback to request body for backward compatibility
    if not refresh_token_str and body and body.refreshToken:
        refresh_token_str = body.refreshToken

    if not refresh_token_str:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_TOKEN",
                "message": "No refresh token provided"
            }
        )

    # Verify refresh token
    user_id = TokenManager.verify_token(refresh_token_str, "refresh")
    if not user_id:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired refresh token"
            }
        )

    # Check if token is revoked
    token_hash = TokenManager.hash_token(refresh_token_str)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False)
        )
    )
    db_token = result.scalar_one_or_none()

    if not db_token:
        return ServiceResponse(
            success=False,
            error={
                "code": "TOKEN_REVOKED",
                "message": "Token has been revoked"
            }
        )

    # Check expiration
    if db_token.expires_at < int(datetime.now(timezone.utc).timestamp() * 1000):
        return ServiceResponse(
            success=False,
            error={
                "code": "TOKEN_EXPIRED",
                "message": "Token has expired"
            }
        )

    # Get user
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return ServiceResponse(
            success=False,
            error={
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        )

    # Revoke old token
    db_token.revoked = True

    # Generate new tokens
    access_token = TokenManager.create_access_token(str(user.id))
    new_refresh_token = TokenManager.create_refresh_token(str(user.id))

    # Store new refresh token
    new_token_hash = TokenManager.hash_token(new_refresh_token)
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp() * 1000)

    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=expires_at
    )
    db.add(new_db_token)
    await db.commit()

    # Set new refresh token as HttpOnly cookie (P0-4)
    _set_refresh_token_cookie(response, new_refresh_token, remember=True)

    return ServiceResponse(
        success=True,
        data=TokenData(
            accessToken=access_token,
            refreshToken="",  # In HttpOnly cookie
            expiresIn=604800  # 7 days
        )
    )


@router.post("/forgot-password", response_model=ServiceResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset.

    Sends reset token to email (mock implementation returns token).
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists
        return ServiceResponse(
            success=True,
            data={"message": "If the email exists, a reset link has been sent"}
        )

    # Generate reset token
    import secrets
    reset_token = secrets.token_urlsafe(32)

    # Store token hash
    token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    expires_at = int((datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp() * 1000)

    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()

    # In production, send email here
    # Security: Never return the token in the response
    # The token should only be sent via email
    return ServiceResponse(
        success=True,
        data={
            "message": "If the email exists, a reset link has been sent"
        }
    )


@router.post("/reset-password", response_model=ServiceResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password with token.
    """
    # Validate password
    is_valid, error_msg = PasswordManager.validate_password_strength(request.new_password)
    if not is_valid:
        return ServiceResponse(
            success=False,
            error={
                "code": "VALIDATION_ERROR",
                "message": error_msg
            }
        )

    # Find token
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False)
        )
    )
    db_token = result.scalar_one_or_none()

    if not db_token:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_TOKEN",
                "message": "Invalid or used reset token"
            }
        )

    # Check expiration
    if db_token.expires_at < int(datetime.now(timezone.utc).timestamp() * 1000):
        return ServiceResponse(
            success=False,
            error={
                "code": "TOKEN_EXPIRED",
                "message": "Reset token has expired"
            }
        )

    # Get user
    result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = result.scalar_one_or_none()

    if not user:
        return ServiceResponse(
            success=False,
            error={
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        )

    # Update password
    user.password_hash = PasswordManager.hash_password(request.new_password)
    db_token.used = True

    # Revoke all refresh tokens
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id)
    )
    for token in result.scalars().all():
        token.revoked = True

    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Password reset successfully"}
    )


@router.get("/me", response_model=ServiceResponse[AuthUser])
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    return ServiceResponse(
        success=True,
        data=AuthUser(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            avatar=current_user.avatar,
            role=current_user.role
        )
    )