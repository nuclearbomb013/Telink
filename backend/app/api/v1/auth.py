"""
Authentication API Endpoints
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, RefreshToken, PasswordResetToken
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
from app.core.exceptions import UnauthorizedException, ConflictException, ValidationException

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=ServiceResponse[AuthResponse])
async def login(
    credentials: LoginCredentials,
    db: AsyncSession = Depends(get_db)
):
    """
    User login.

    Returns access token and user info on success.
    """
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            (User.username == credentials.username) | (User.email == credentials.username)
        )
    )
    user = result.scalar_one_or_none()

    # Verify user exists and password matches
    if not user or not PasswordManager.verify_password(credentials.password, user.password_hash):
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

    # Store refresh token hash
    token_hash = TokenManager.hash_token(refresh_token)
    expires_at = int((datetime.utcnow() + timedelta(days=30)).timestamp() * 1000)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)

    # Update last active
    user.updated_at = datetime.utcnow()
    await db.commit()

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
                refreshToken=refresh_token,
                expiresIn=604800 if not credentials.remember else 2592000
            )
        )
    )


@router.post("/register", response_model=ServiceResponse[AuthResponse])
async def register(
    credentials: RegisterCredentials,
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

    # Check if username exists
    result = await db.execute(select(User).where(User.username == credentials.username))
    if result.scalar_one_or_none():
        return ServiceResponse(
            success=False,
            error={
                "code": "USERNAME_EXISTS",
                "message": "Username already exists"
            }
        )

    # Check if email exists
    result = await db.execute(select(User).where(User.email == credentials.email))
    if result.scalar_one_or_none():
        return ServiceResponse(
            success=False,
            error={
                "code": "EMAIL_EXISTS",
                "message": "Email already registered"
            }
        )

    # Create user
    user = User(
        username=credentials.username,
        email=credentials.email,
        password_hash=PasswordManager.hash_password(credentials.password),
        bio=credentials.bio,
        role="user"
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = TokenManager.create_access_token(str(user.id), remember=True)
    refresh_token = TokenManager.create_refresh_token(str(user.id))

    # Store refresh token
    token_hash = TokenManager.hash_token(refresh_token)
    expires_at = int((datetime.utcnow() + timedelta(days=30)).timestamp() * 1000)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()

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
                refreshToken=refresh_token,
                expiresIn=2592000  # 30 days (remember=True)
            )
        )
    )


@router.post("/logout", response_model=ServiceResponse)
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    User logout.

    Revokes all refresh tokens for the user.
    """
    # Revoke all refresh tokens
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        )
    )
    tokens = result.scalars().all()

    for token in tokens:
        token.revoked = True

    await db.commit()

    return ServiceResponse(success=True, data={"message": "Logged out successfully"})


@router.post("/refresh", response_model=ServiceResponse[TokenData])
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token.

    Validates refresh token and returns new access token.
    """
    # Verify refresh token
    user_id = TokenManager.verify_token(request.refreshToken, "refresh")
    if not user_id:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired refresh token"
            }
        )

    # Check if token is revoked
    token_hash = TokenManager.hash_token(request.refreshToken)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False
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
    if db_token.expires_at < int(datetime.utcnow().timestamp() * 1000):
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
    expires_at = int((datetime.utcnow() + timedelta(days=30)).timestamp() * 1000)

    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=expires_at
    )
    db.add(new_db_token)
    await db.commit()

    return ServiceResponse(
        success=True,
        data=TokenData(
            accessToken=access_token,
            refreshToken=new_refresh_token,
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
    expires_at = int((datetime.utcnow() + timedelta(minutes=30)).timestamp() * 1000)

    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()

    # In production, send email here
    # For development, return the token
    return ServiceResponse(
        success=True,
        data={
            "message": "Reset token generated",
            "token": reset_token  # Remove in production
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
            PasswordResetToken.used == False
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
    if db_token.expires_at < int(datetime.utcnow().timestamp() * 1000):
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