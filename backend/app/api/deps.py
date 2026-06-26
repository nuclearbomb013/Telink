"""
API Dependencies
"""

import time
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

# ── Lightweight TTL caches for high-frequency auth queries ──
# Avoids 2 DB round-trips on every authenticated request.
# TTLs are kept short so permission changes propagate quickly.
# Maxsize limits prevent unbounded growth in long-running processes.
# Amortized eviction runs on insert — old entries are cleaned when the
# cache exceeds maxsize, keeping memory bounded.

_MAX_CACHE_SIZE = 10_000

_USER_CACHE: dict[int, tuple[float, User]] = {}
_USER_CACHE_TTL = 10  # seconds — deactivation/role change propagates within 10s

_BLACKLIST_CACHE: dict[str, tuple[float, bool]] = {}
_BLACKLIST_CACHE_TTL = 30  # seconds — JWT lifetime ceiling on blacklist entries


def _maybe_evict(cache: dict, ttl: float, now: float, maxsize: int) -> None:
    """Amortized eviction: if cache exceeds maxsize, drop expired entries."""
    if len(cache) <= maxsize:
        return
    expired = [k for k, (ts, _) in cache.items() if (now - ts) >= ttl]
    for k in expired:
        del cache[k]
    # If still over maxsize after clearing expired, drop oldest entries
    if len(cache) > maxsize:
        excess = len(cache) - maxsize
        oldest = sorted(cache.items(), key=lambda x: x[1][0])[:excess]
        for k, _ in oldest:
            del cache[k]


async def _cached_get_user(db: AsyncSession, user_id: int) -> User | None:
    """Fetch user with short in-process TTL cache (10s)."""
    now = time.monotonic()
    entry = _USER_CACHE.get(user_id)
    if entry and (now - entry[0]) < _USER_CACHE_TTL:
        return entry[1]

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        _maybe_evict(_USER_CACHE, _USER_CACHE_TTL, now, _MAX_CACHE_SIZE)
        _USER_CACHE[user_id] = (now, user)
    return user


async def _cached_is_token_revoked(db: AsyncSession, jti: str) -> bool:
    """Check blacklist with short in-process TTL cache (30s)."""
    now = time.monotonic()
    entry = _BLACKLIST_CACHE.get(jti)
    if entry and (now - entry[0]) < _BLACKLIST_CACHE_TTL:
        return entry[1]

    result = await db.execute(
        select(TokenBlacklist).where(TokenBlacklist.jti == jti)
    )
    revoked = result.scalar_one_or_none() is not None
    _maybe_evict(_BLACKLIST_CACHE, _BLACKLIST_CACHE_TTL, now, _MAX_CACHE_SIZE)
    _BLACKLIST_CACHE[jti] = (now, revoked)
    return revoked


def clear_auth_caches():
    """Clear in-memory user and blacklist caches. Called by test fixtures."""
    _USER_CACHE.clear()
    _BLACKLIST_CACHE.clear()


async def get_db() -> Generator:
    """Get database session dependency.

    Yields a session with no auto-commit. Each route that writes must call
    `await db.commit()` explicitly. On exception, the session is rolled back.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


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

    # Check if token is revoked (cached, TTL 30s)
    if jti and await _cached_is_token_revoked(db, jti):
        raise UnauthorizedException("Token has been revoked")

    user = await _cached_get_user(db, int(user_id))
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


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user from JWT token silently.
    Returns None if no token, invalid token, or revoked token.
    Never raises exceptions - ideal for public endpoints with optional auth.
    """
    if not credentials:
        return None
    try:
        token = credentials.credentials
        jti = TokenManager.get_token_jti(token)
        user_id = TokenManager.verify_token(token, "access")
        if not user_id:
            return None
        if jti and await _cached_is_token_revoked(db, jti):
            return None
        return await _cached_get_user(db, int(user_id))
    except Exception:
        return None


# Common role dependencies
require_admin = require_roles(["admin"])
require_moderator = require_roles(["admin", "moderator"])
require_user = require_roles(["admin", "moderator", "user"])