"""
Security Headers Middleware for FastAPI.

Provides comprehensive HTTP security headers to protect against common attacks:
- Content-Security-Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Strict-Transport-Security (HSTS)

Reference: https://owasp.org/www-project-secure-headers/
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all HTTP responses.

    Headers are configured based on OWASP recommendations with adjustments
    for the TechInk application's specific requirements (Google Fonts, etc.).
    """

    # P0-5: Production CSP - no localhost entries, strict policies
    # Development CSP includes localhost for Vite dev server & local API
    PRODUCTION_CSP = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self'; "
        "media-src 'self'; "
        "object-src 'none'; "
        "frame-src 'none'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )

    DEVELOPMENT_CSP = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https: http://localhost:8000; "
        "connect-src 'self' http://localhost:* ws://localhost:*; "
        "media-src 'self'; "
        "object-src 'none'; "
        "frame-src 'none'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )

    @property
    def csp_policy(self) -> str:
        if settings.ENVIRONMENT == "production":
            return self.PRODUCTION_CSP
        return self.DEVELOPMENT_CSP

    @property
    def security_headers(self) -> dict:
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": self.csp_policy,
        }

    # HSTS header - only added when app is running in production mode
    HSTS_HEADER = "max-age=31536000; includeSubDomains"

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add security headers to response."""
        response = await call_next(request)

        for header_name, header_value in self.security_headers.items():
            response.headers[header_name] = header_value

        # Add HSTS only in production environment
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = self.HSTS_HEADER

        return response