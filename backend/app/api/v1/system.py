"""
System Information API
Provides database version for cache synchronization.
"""

import os
import json
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/system", tags=["System"])

# Version file path (stored in backend directory)
VERSION_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data_version.json")


class SystemInfoResponse(BaseModel):
    """System information response."""
    version: str
    db_version: str
    db_timestamp: str
    app_name: str


def get_db_version() -> dict:
    """
    Get database version from file.
    Returns default if file doesn't exist.
    """
    try:
        if os.path.exists(VERSION_FILE):
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass

    # Return default version (app startup time)
    return {
        "version": "v1",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/info", response_model=SystemInfoResponse)
async def get_system_info():
    """
    Get system information including database version.

    Frontend should check db_version periodically and clear localStorage
    cache when version changes (e.g., after database reset).
    """
    from app.config import settings

    db_info = get_db_version()

    return SystemInfoResponse(
        version=settings.APP_VERSION,
        db_version=db_info.get("version", "v1"),
        db_timestamp=db_info.get("timestamp", ""),
        app_name=settings.APP_NAME
    )