"""
Base Model with common fields
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.orm import declared_attr

from app.db.session import Base


def utcnow_naive() -> datetime:
    """
    Return current UTC time as a naive datetime (no timezone info).

    This is required for PostgreSQL TIMESTAMP WITHOUT TIME ZONE columns.
    Using timezone-aware datetime with such columns causes:
    "can't subtract offset-naive and offset-aware datetimes" error.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


class BaseModel(Base):
    """Base model with common fields."""

    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=utcnow_naive, nullable=False)
    updated_at = Column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=True)

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = int(value.timestamp() * 1000)  # Convert to milliseconds
            result[column.name] = value
        return result