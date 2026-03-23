"""
Core Logging Module
Structured logging configuration for the application.
"""

import logging
import sys
from datetime import datetime, timezone
from typing import Optional

import structlog
from structlog.types import Processor

from app.config import settings


def get_log_level() -> str:
    """Get log level from settings."""
    if settings.DEBUG:
        return "DEBUG"
    return "INFO"


def get_log_format() -> str:
    """Get log format based on environment."""
    if settings.ENVIRONMENT == "development":
        return "console"
    return "json"


def add_app_context(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict
) -> dict:
    """Add application context to log entries."""
    event_dict["app"] = settings.APP_NAME
    event_dict["env"] = settings.ENVIRONMENT
    return event_dict


def get_processors(format_type: str) -> list[Processor]:
    """Get logging processors based on format type."""
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        add_app_context,
    ]

    if format_type == "console":
        return shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        return shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ]


def setup_logging(
    log_level: Optional[str] = None,
    log_format: Optional[str] = None
) -> None:
    """
    Configure structured logging for the application.

    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Output format ('console' or 'json')
    """
    level = log_level or get_log_level()
    format_type = log_format or get_log_format()

    # Configure structlog
    structlog.configure(
        processors=get_processors(format_type),
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level),
    )

    # Set uvicorn access log level
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # Set sqlalchemy log level
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.WARNING if not settings.DEBUG else logging.INFO
    )


def get_logger(name: Optional[str] = None) -> structlog.stdlib.BoundLogger:
    """
    Get a configured logger instance.

    Args:
        name: Logger name (defaults to calling module)

    Returns:
        Configured structlog logger instance
    """
    return structlog.get_logger(name)


class RequestLogger:
    """Context manager for request logging."""

    def __init__(self, request_id: str, method: str, path: str):
        self.request_id = request_id
        self.method = method
        self.path = path
        self.logger = get_logger("request")
        self.start_time: Optional[datetime] = None

    def __enter__(self):
        self.start_time = datetime.now(timezone.utc)
        self.logger.info(
            "request_started",
            request_id=self.request_id,
            method=self.method,
            path=self.path
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (datetime.now(timezone.utc) - self.start_time).total_seconds() * 1000
        if exc_type:
            self.logger.error(
                "request_failed",
                request_id=self.request_id,
                method=self.method,
                path=self.path,
                duration_ms=duration_ms,
                error=str(exc_val)
            )
        else:
            self.logger.info(
                "request_completed",
                request_id=self.request_id,
                method=self.method,
                path=self.path,
                duration_ms=duration_ms
            )
        return False  # Don't suppress exceptions


# Module-level logger for general use
logger = get_logger(__name__)