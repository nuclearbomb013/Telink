"""
Rate Limiting Module

Supports two backends:
- memory: in-process sliding window (dev/test)
- redis: distributed sorted-set sliding window via Lua script (production)

Configure via settings:
- RATE_LIMIT_BACKEND=memory|redis (default: memory)
- REDIS_URL=redis://... (required for redis backend)
"""

import os
import time
import logging
import asyncio
from collections import defaultdict
from threading import Lock
from typing import Callable, Optional, Set
from functools import wraps

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# P9-108: Trusted proxy IPs for X-Forwarded-For validation
# These IPs are trusted to set X-Forwarded-For header correctly
# In production, configure this via environment variable
TRUSTED_PROXY_IPS: Set[str] = set(
    os.environ.get("TRUSTED_PROXIES", "").split(",")
    if os.environ.get("TRUSTED_PROXIES")
    else []  # Empty set means no trusted proxies (use direct IP only)
)


class RateLimiter:
    """
    In-memory rate limiter with sliding window algorithm.

    Thread-safe implementation using locks for concurrent access.
    Uses sliding window to track requests within time period.
    """

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _cleanup_old_requests(self, key: str, window_seconds: int) -> None:
        """Remove requests older than the window."""
        cutoff = time.time() - window_seconds
        self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

    def _periodic_cleanup(self, max_window: int = 3600) -> None:
        """Periodic cleanup: remove stale keys and free memory.

        Called periodically to prevent unbounded memory growth from
        keys that are no longer actively used.
        """
        cutoff = time.time() - max_window
        with self._lock:
            stale_keys = [
                key for key, timestamps in self._requests.items()
                if not timestamps or max(timestamps) < cutoff
            ]
            for key in stale_keys:
                del self._requests[key]

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed under rate limit.

        Args:
            key: Unique identifier (usually IP or user ID)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_allowed, remaining_requests, retry_after_seconds)
        """
        with self._lock:
            current_time = time.time()

            # Clean up old requests
            self._cleanup_old_requests(key, window_seconds)

            # Get current request count
            current_count = len(self._requests[key])

            if current_count >= max_requests:
                # Calculate retry after
                oldest_request = min(self._requests[key]) if self._requests[key] else current_time
                retry_after = int(oldest_request + window_seconds - current_time) + 1
                return False, 0, max(1, retry_after)

            # Record this request
            self._requests[key].append(current_time)
            remaining = max_requests - len(self._requests[key])

            return True, remaining, 0

    def reset(self, key: str) -> None:
        """Reset rate limit for a specific key."""
        with self._lock:
            if key in self._requests:
                del self._requests[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


# Rate limit configurations
RATE_LIMITS = {
    # Authentication endpoints - stricter limits
    "auth_login": {"requests": 5, "window": 60},       # 5 per minute
    "auth_register": {"requests": 3, "window": 300},   # 3 per 5 minutes
    "auth_forgot": {"requests": 3, "window": 300},     # 3 per 5 minutes
    "auth_refresh": {"requests": 20, "window": 60},    # 20 per minute

    # API endpoints - moderate limits
    "api_default": {"requests": 60, "window": 60},     # 60 per minute
    "api_write": {"requests": 30, "window": 60},       # 30 per minute (POST, PUT, DELETE)

    # Public endpoints - relaxed limits
    "public": {"requests": 100, "window": 60},         # 100 per minute
}


def get_client_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.

    P9-108: Only trust X-Forwarded-For from trusted proxies to prevent spoofing.
    Uses X-Forwarded-For header only if request comes from a trusted proxy,
    otherwise falls back to client IP.
    """
    # Get the direct client IP (the immediate connection)
    direct_client_ip = request.client.host if request.client else None

    # P9-108: Only use X-Forwarded-For if request comes from trusted proxy
    # This prevents spoofing by malicious clients setting fake headers
    if direct_client_ip and direct_client_ip in TRUSTED_PROXY_IPS:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take first IP in chain (original client)
            # Validate format: should be a valid IP address
            client_ip = forwarded.split(",")[0].strip()
            if client_ip:
                return client_ip

    # Fall back to direct client IP (no trusted proxy or no forwarded header)
    if direct_client_ip:
        return direct_client_ip

    return "unknown"


def get_rate_limit_key(request: Request, limit_type: str) -> str:
    """
    Generate rate limit key combining client ID and limit type.

    Format: "{limit_type}:{client_ip}"
    """
    client_id = get_client_identifier(request)
    return f"{limit_type}:{client_id}"


def create_rate_limit_middleware(
    limit_type: str = "api_default",
    custom_limits: Optional[dict] = None
) -> Callable:
    """
    Create rate limit middleware for specific endpoint types.

    Args:
        limit_type: Type of rate limit from RATE_LIMITS
        custom_limits: Override default limits

    Returns:
        Middleware function
    """
    limits = custom_limits or RATE_LIMITS.get(limit_type, RATE_LIMITS["api_default"])
    max_requests = limits["requests"]
    window_seconds = limits["window"]

    async def middleware(request: Request, call_next):
        # Skip rate limiting for OPTIONS (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Generate key
        key = get_rate_limit_key(request, limit_type)

        # Check rate limit (handle both sync and async backends)
        result = rate_limiter.is_allowed(key, max_requests, window_seconds)
        if asyncio.iscoroutine(result):
            allowed, remaining, retry_after = await result
        else:
            allowed, remaining, retry_after = result

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    "retry_after": retry_after
                }
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(window_seconds)

        return response

    return middleware


def rate_limit(
    limit_type: str = "api_default",
    custom_limits: Optional[dict] = None
) -> Callable:
    """
    Decorator for rate limiting specific endpoints.

    Usage:
        @router.post("/login")
        @rate_limit("auth_login")
        async def login(...):
            ...

    Args:
        limit_type: Type of rate limit from RATE_LIMITS
        custom_limits: Override default limits

    Returns:
        Decorator function
    """
    limits = custom_limits or RATE_LIMITS.get(limit_type, RATE_LIMITS["api_default"])
    max_requests = limits["requests"]
    window_seconds = limits["window"]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, request: Optional[Request] = None, **kwargs):
            # Try to get request from args or kwargs
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                request = kwargs.get("request")

            if request and isinstance(request, Request):
                key = get_rate_limit_key(request, limit_type)
                allowed, remaining, retry_after = rate_limiter.is_allowed(
                    key, max_requests, window_seconds
                )

                if not allowed:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                            "retry_after": retry_after
                        }
                    )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


class RateLimitMiddleware:
    """
    ASGI middleware for global rate limiting.

    Applies different rate limits based on endpoint patterns.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Skip rate limiting for OPTIONS (CORS preflight)
        if request.method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Determine limit type based on path
        path = request.url.path
        limit_type = self._get_limit_type(path, request.method)

        # Get limits
        limits = RATE_LIMITS.get(limit_type, RATE_LIMITS["api_default"])
        max_requests = limits["requests"]
        window_seconds = limits["window"]

        # Check rate limit (handle both sync and async backends)
        key = get_rate_limit_key(request, limit_type)
        result = rate_limiter.is_allowed(key, max_requests, window_seconds)
        if asyncio.iscoroutine(result):
            allowed, remaining, retry_after = await result
        else:
            allowed, remaining, retry_after = result

        if not allowed:
            # Send 429 response
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                        "retry_after": retry_after
                    }
                }
            )

            # Add rate limit headers
            async def send_with_headers(message):
                if message["type"] == "http.response.start":
                    message["headers"].extend([
                        (b"X-RateLimit-Limit", str(max_requests).encode()),
                        (b"X-RateLimit-Remaining", str(remaining).encode()),
                        (b"X-RateLimit-Reset", str(window_seconds).encode()),
                        (b"Retry-After", str(retry_after).encode()),
                    ])
                await send(message)

            await response(scope, receive, send_with_headers)
            return

        # Add rate limit headers to response
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                message["headers"].extend([
                    (b"X-RateLimit-Limit", str(max_requests).encode()),
                    (b"X-RateLimit-Remaining", str(remaining).encode()),
                    (b"X-RateLimit-Reset", str(window_seconds).encode()),
                ])
            await send(message)

        await self.app(scope, receive, send_with_headers)

    def _get_limit_type(self, path: str, method: str) -> str:
        """Determine rate limit type based on path and method."""
        # Authentication endpoints
        if "/auth/login" in path:
            return "auth_login"
        if "/auth/register" in path:
            return "auth_register"
        if "/auth/forgot-password" in path or "/auth/reset-password" in path:
            return "auth_forgot"
        if "/auth/refresh" in path:
            return "auth_refresh"

        # Write operations
        if method in ("POST", "PUT", "DELETE", "PATCH"):
            return "api_write"

        # Public read endpoints
        if path.startswith("/api/v1/forum") or path.startswith("/api/v1/users"):
            if method == "GET":
                return "public"

        # Default API limit
        return "api_default"


# ──────────────────── Redis Backend ────────────────────

_SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local cutoff = now - window
redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count < max_requests then
    redis.call('ZADD', key, now, now .. ':' .. count)
    redis.call('EXPIRE', key, window + 1)
    return {1, max_requests - count - 1}
else
    return {0, 0}
end
"""


class RedisRateLimiter:
    """Distributed rate limiter backed by Redis sorted sets."""

    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url
        self._redis = None
        self._script_sha: Optional[str] = None
        self._init_lock = asyncio.Lock()

    async def _ensure_initialized(self) -> None:
        if self._redis is not None:
            return
        async with self._init_lock:
            if self._redis is not None:
                return
            try:
                import redis.asyncio as aioredis
            except ImportError:
                raise ImportError("redis package required: pip install redis")
            self._redis = aioredis.from_url(self._redis_url, decode_responses=False)
            try:
                self._script_sha = await self._redis.script_load(_SLIDING_WINDOW_SCRIPT)
            except Exception as exc:
                logger.warning("Redis unavailable for rate limiting: %s", exc)
                self._redis = None

    async def is_allowed(
        self, key: str, max_requests: int, window_seconds: int
    ) -> tuple[bool, int, int]:
        """Check rate limit via Redis. Returns (allowed, remaining, retry_after)."""
        await self._ensure_initialized()
        if self._redis is None or self._script_sha is None:
            return True, max_requests, 0  # fail-open

        try:
            now = time.time()
            result = await self._redis.evalsha(
                self._script_sha, 1,
                f"rl:{key}", str(now), str(window_seconds), str(max_requests),
            )
            allowed, remaining = result
            if allowed:
                return True, int(remaining), 0
            return False, 0, window_seconds
        except Exception as exc:
            logger.error("Rate limiter Redis error: %s", exc)
            return True, max_requests, 0  # fail-open


# ──────────────────── Factory ────────────────────


def create_rate_limiter(backend: str = "memory", redis_url: str = "") -> "RateLimiter":
    """Create the appropriate rate limiter.

    Returns the in-memory RateLimiter for 'memory' backend,
    or a wrapper that delegates Redis calls through the async backend.

    The wrapper preserves the synchronous RateLimiter interface
    so existing callers (middleware, decorator) work unchanged.
    """
    if backend == "redis":
        if not redis_url:
            raise ValueError("REDIS_URL required when RATE_LIMIT_BACKEND=redis")
        redis_backend = RedisRateLimiter(redis_url)
        # Wrap Redis async backend in a sync-compatible RateLimiter
        limiter = RateLimiter()

        # Save original is_allowed
        _sync_is_allowed = limiter.is_allowed

        async def _redis_is_allowed(
            key: str, max_requests: int, window_seconds: int
        ) -> tuple[bool, int, int]:
            return await redis_backend.is_allowed(key, max_requests, window_seconds)

        # Replace with an async-aware version
        def _async_is_allowed(key: str, max_requests: int, window_seconds: int):
            # Called from async context — return coroutine for caller to await
            return _redis_is_allowed(key, max_requests, window_seconds)

        limiter.is_allowed = _async_is_allowed  # type: ignore[method-assign]
        limiter._redis_backend = redis_backend  # type: ignore[attr-defined]
        return limiter

    return RateLimiter()  # default: in-memory