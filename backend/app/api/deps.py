"""
API Dependencies
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import async_session_maker
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.core.security import TokenManager
from app.core.exceptions import UnauthorizedException, ForbiddenException

# HTTP Bearer token security
security = HTTPBearer(auto_error=False)


async def get_db() -> Generator:
    """Get database session dependency."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def is_token_revoked(db: AsyncSession, jti: str) -> bool:
    """
    Check if a token's JTI is in the blacklist.

    Args:
        db: Database session
        jti: JWT ID to check

    Returns:
        True if token is revoked, False otherwise
    """
    result = await db.execute(
        select(TokenBlacklist).where(TokenBlacklist.jti == jti)
    )
    return result.scalar_one_or_none() is not None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user from JWT token.
    Returns None if no token provided.
    """
    if not credentials:
        return None

    token = credentials.credentials

    # Get token JTI for blacklist check
    jti = TokenManager.get_token_jti(token)

    # Verify token
    user_id = TokenManager.verify_token(token, "access")

    if not user_id:
        raise UnauthorizedException("Invalid or expired token")

    # Check if token is revoked
    if jti and await is_token_revoked(db, jti):
        raise UnauthorizedException("Token has been revoked")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")

    return user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Get current active user.
    Raises 401 if not authenticated or user is inactive.
    """
    if not current_user:
        raise UnauthorizedException("Authentication required")

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return current_user


def require_roles(roles: list[str]):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.delete("/{id}")
        async def delete_post(
            post_id: int,
            user: User = Depends(require_roles(["admin", "moderator"]))
        ):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenException("Not enough permissions")
        return current_user
    return role_checker


# Common role dependencies
require_admin = require_roles(["admin"])
require_moderator = require_roles(["admin", "moderator"])
require_user = require_roles(["admin", "moderator", "user"])