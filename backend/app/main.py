"""
TechInk Backend - FastAPI Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os

from app.config import settings
from app.db.session import init_db, close_db
from app.api.v1.router import api_router
from app.core.logging import setup_logging, get_logger
from app.core.rate_limit import RateLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware

# Initialize logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("application_starting", version=settings.APP_VERSION)
    try:
        await init_db()
        logger.info("database_initialized")
    except Exception as e:
        logger.error("database_init_failed", error=str(e))
        raise
    yield
    # Shutdown
    await close_db()
    logger.info("application_shutdown")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="TechInk Forum Backend API",
        lifespan=lifespan,
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # Configure CORS
    logger.info(
        "cors_config",
        origins=settings.cors_origins_list,
        methods=settings.cors_methods_list,
        headers=settings.cors_headers_list,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=settings.cors_methods_list,
        allow_headers=settings.cors_headers_list,
    )

    # Add rate limiting middleware (must be after CORS for proper handling)
    app.add_middleware(RateLimitMiddleware)
    logger.info("rate_limit_middleware_enabled")

    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
    logger.info("security_headers_middleware_enabled")

    # Global exception handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions with consistent response format."""
        logger.warning(
            "http_exception",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors with detailed error messages."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"]
            })
        logger.warning(
            "validation_error",
            errors=errors,
            path=request.url.path
        )
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": errors
                }
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle all unhandled exceptions."""
        logger.error(
            "unhandled_exception",
            error_type=type(exc).__name__,
            error_message=str(exc),
            path=request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred" if not settings.DEBUG else str(exc)
                }
            }
        )

    # Request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        # P9-109: Remove custom OPTIONS handler that bypassed CORS whitelist
        # Let CORSMiddleware handle OPTIONS preflight with proper origin validation
        # The CORSMiddleware is already configured with allowed origins above

        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Log request
        logger.info(
            "request_started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None
        )

        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000

            # Log response
            logger.info(
                "request_completed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2)
            )
            return response
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                "request_failed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration_ms=round(duration_ms, 2)
            )
            raise

    # Include API routers
    app.include_router(api_router, prefix="/api/v1")

    # Configure static files for uploads
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    images_dir = os.path.join(upload_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
    logger.info("static_files_configured", upload_dir=upload_dir)

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint with database connectivity check."""
        from sqlalchemy import text

        health_status = {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "checks": {}
        }

        # Check database connectivity
        try:
            from app.db.session import async_engine
            async with async_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            health_status["checks"]["database"] = "connected"
        except Exception as e:
            health_status["status"] = "unhealthy"
            health_status["checks"]["database"] = f"error: {str(e)}"

        return health_status

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # nosec B104  # Development server, bind to all interfaces
        port=8000,
        reload=settings.DEBUG
    )