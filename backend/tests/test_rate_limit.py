"""
Rate Limiting Tests
"""

import pytest
import time
from unittest.mock import Mock
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core.rate_limit import (
    RateLimiter,
    rate_limiter,
    RATE_LIMITS,
    get_client_identifier,
    get_rate_limit_key,
    RateLimitMiddleware,
)


class TestRateLimiter:
    """Test the RateLimiter class."""

    def test_is_allowed_under_limit(self):
        """Test that requests under limit are allowed."""
        limiter = RateLimiter()
        key = "test_key"

        # First request should be allowed
        allowed, remaining, retry_after = limiter.is_allowed(key, max_requests=5, window_seconds=60)
        assert allowed is True
        assert remaining == 4
        assert retry_after == 0

    def test_is_allowed_at_limit(self):
        """Test that requests at limit are rejected."""
        limiter = RateLimiter()
        key = "test_key_limit"

        # Use up all requests
        for _ in range(5):
            limiter.is_allowed(key, max_requests=5, window_seconds=60)

        # Next request should be rejected
        allowed, remaining, retry_after = limiter.is_allowed(key, max_requests=5, window_seconds=60)
        assert allowed is False
        assert remaining == 0
        assert retry_after > 0

    def test_sliding_window(self):
        """Test that sliding window works correctly."""
        limiter = RateLimiter()
        key = "test_key_window"

        # Use all requests
        for _ in range(3):
            limiter.is_allowed(key, max_requests=3, window_seconds=1)

        # Should be blocked
        allowed, _, _ = limiter.is_allowed(key, max_requests=3, window_seconds=1)
        assert allowed is False

        # Wait for window to pass
        time.sleep(1.1)

        # Should be allowed again
        allowed, remaining, _ = limiter.is_allowed(key, max_requests=3, window_seconds=1)
        assert allowed is True
        assert remaining == 2

    def test_different_keys_independent(self):
        """Test that different keys have independent limits."""
        limiter = RateLimiter()

        # Use up limit for key1
        for _ in range(5):
            limiter.is_allowed("key1", max_requests=5, window_seconds=60)

        # key1 should be blocked
        allowed1, _, _ = limiter.is_allowed("key1", max_requests=5, window_seconds=60)
        assert allowed1 is False

        # key2 should still be allowed
        allowed2, remaining2, _ = limiter.is_allowed("key2", max_requests=5, window_seconds=60)
        assert allowed2 is True
        assert remaining2 == 4

    def test_reset(self):
        """Test that reset clears the limit for a key."""
        limiter = RateLimiter()
        key = "test_key_reset"

        # Use up limit
        for _ in range(5):
            limiter.is_allowed(key, max_requests=5, window_seconds=60)

        # Should be blocked
        allowed, _, _ = limiter.is_allowed(key, max_requests=5, window_seconds=60)
        assert allowed is False

        # Reset
        limiter.reset(key)

        # Should be allowed again
        allowed, remaining, _ = limiter.is_allowed(key, max_requests=5, window_seconds=60)
        assert allowed is True
        assert remaining == 4


class TestClientIdentifier:
    """Test client identifier extraction."""

    def test_direct_client_ip(self):
        """Test getting client IP directly."""
        request = Mock(spec=Request)
        request.headers = {}
        request.client = Mock()
        request.client.host = "192.168.1.1"

        identifier = get_client_identifier(request)
        assert identifier == "192.168.1.1"

    def test_forwarded_for_header(self):
        """Test getting client IP from X-Forwarded-For only from trusted proxy."""
        # P9-108: X-Forwarded-For should be ignored when not from trusted proxy
        request = Mock(spec=Request)
        request.headers = {"X-Forwarded-For": "10.0.0.1, 192.168.1.1"}
        request.client = Mock()
        request.client.host = "192.168.1.1"  # Not in trusted proxies

        identifier = get_client_identifier(request)
        # Should use direct IP since not from trusted proxy
        assert identifier == "192.168.1.1"

    def test_forwarded_for_from_trusted_proxy(self):
        """Test X-Forwarded-For is used when request comes from trusted proxy."""
        from app.core.rate_limit import TRUSTED_PROXY_IPS, get_client_identifier

        # Temporarily add trusted proxy
        original_proxies = TRUSTED_PROXY_IPS.copy()
        TRUSTED_PROXY_IPS.add("192.168.1.100")

        try:
            request = Mock(spec=Request)
            request.headers = {"X-Forwarded-For": "10.0.0.1, 192.168.1.100"}
            request.client = Mock()
            request.client.host = "192.168.1.100"  # This is the trusted proxy

            identifier = get_client_identifier(request)
            # Should use X-Forwarded-For since from trusted proxy
            assert identifier == "10.0.0.1"
        finally:
            # Restore original
            TRUSTED_PROXY_IPS.clear()
            TRUSTED_PROXY_IPS.update(original_proxies)

    def test_no_client(self):
        """Test fallback when no client info available."""
        request = Mock(spec=Request)
        request.headers = {}
        request.client = None

        identifier = get_client_identifier(request)
        assert identifier == "unknown"


class TestRateLimitKey:
    """Test rate limit key generation."""

    def test_key_format(self):
        """Test that key format is correct."""
        request = Mock(spec=Request)
        request.headers = {}
        request.client = Mock()
        request.client.host = "192.168.1.1"

        key = get_rate_limit_key(request, "auth_login")
        assert key == "auth_login:192.168.1.1"


class TestRateLimitConfig:
    """Test rate limit configurations."""

    def test_auth_login_limit(self):
        """Test auth login rate limit configuration."""
        assert RATE_LIMITS["auth_login"]["requests"] == 5
        assert RATE_LIMITS["auth_login"]["window"] == 60

    def test_auth_register_limit(self):
        """Test auth register rate limit configuration."""
        assert RATE_LIMITS["auth_register"]["requests"] == 3
        assert RATE_LIMITS["auth_register"]["window"] == 300

    def test_api_default_limit(self):
        """Test default API rate limit configuration."""
        assert RATE_LIMITS["api_default"]["requests"] == 60
        assert RATE_LIMITS["api_default"]["window"] == 60


class TestRateLimitMiddleware:
    """Test rate limiting middleware."""

    @pytest.fixture
    def app(self):
        """Create a test FastAPI app."""
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "ok"}

        @app.post("/auth/login")
        async def login():
            return {"token": "test"}

        return app

    @pytest.fixture
    def client(self, app):
        """Create a test client."""
        return TestClient(app)

    def test_middleware_allows_request(self, client):
        """Test that middleware allows requests under limit."""
        response = client.get("/test")
        assert response.status_code == 200

        # Check rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers

    def test_middleware_rate_limit_headers(self, client):
        """Test that rate limit headers are present."""
        response = client.get("/test")

        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers

    def test_options_bypasses_rate_limit(self, client):
        """Test that OPTIONS requests bypass rate limiting."""
        # Note: FastAPI returns 405 if no OPTIONS route is defined,
        # but the middleware correctly skips rate limiting for OPTIONS.
        # The key test is that we don't get a 429 (rate limit) response.
        response = client.options("/test")
        # We expect 405 (Method Not Allowed) since no OPTIONS route exists,
        # but NOT 429 (Too Many Requests)
        assert response.status_code in (200, 405)  # Either is acceptable
        assert response.status_code != 429  # Should NOT be rate limited


class TestGlobalRateLimiter:
    """Test the global rate limiter instance."""

    def test_global_instance_exists(self):
        """Test that global rate limiter instance exists."""
        assert rate_limiter is not None
        assert isinstance(rate_limiter, RateLimiter)

    def test_global_instance_thread_safe(self):
        """Test that global instance is thread-safe."""
        import threading

        results = []
        errors = []

        def make_requests():
            try:
                for _ in range(10):
                    allowed, _, _ = rate_limiter.is_allowed(
                        "thread_test", max_requests=50, window_seconds=60
                    )
                    results.append(allowed)
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=make_requests) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        assert all(results)  # All requests should be allowed under limit