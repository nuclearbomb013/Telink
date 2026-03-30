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

    # Security headers configuration (P14 fixes applied - unified with frontend)
    SECURITY_HEADERS = {
        # Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",

        # Prevent clickjacking
        "X-Frame-Options": "DENY",

        # Enable XSS filtering (legacy but still useful for older browsers)
        "X-XSS-Protection": "1; mode=block",

        # Control referrer information
        "Referrer-Policy": "strict-origin-when-cross-origin",

        # Content Security Policy - Production-ready (unified with frontend)
        # P14-159: Removed 'unsafe-eval' and 'unsafe-inline' from script-src
        # P14-160: Added object-src 'none'
        # P14-161: Added base-uri 'self'
        # P14-162: Added form-action 'self'
        # P14-164: frame-ancestors 'none' already present
        "Content-Security-Policy": (
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
        ),
    }

    # HSTS header - only added when app is running in production mode
    HSTS_HEADER = "max-age=31536000; includeSubDomains"

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add security headers to response."""
        response = await call_next(request)

        # Add security headers
        for header_name, header_value in self.SECURITY_HEADERS.items():
            response.headers[header_name] = header_value

        # Add HSTS only in production environment
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = self.HSTS_HEADER

        return response