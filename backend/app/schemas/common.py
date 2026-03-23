"""
Common Schemas
"""

from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

T = TypeVar("T")


class ServiceResponse(BaseModel, Generic[T]):
    """Standard API response format matching frontend expectations."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    data: Optional[T] = None
    error: Optional[dict] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


class PaginationParams(BaseModel):
    """Pagination parameters."""

    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)


class PaginatedResult(BaseModel, Generic[T]):
    """Paginated result."""

    items: list[T]
    total: int
    page: int
    limit: int
    total_pages: int


class ErrorResponse(BaseModel):
    """Error response."""

    code: str
    message: str
    details: Optional[Any] = None