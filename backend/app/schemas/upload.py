"""
Upload Schemas
"""

from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Upload response schema."""

    url: str
    filename: str
    size: int
    content_type: str