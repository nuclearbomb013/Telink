"""
API Router Aggregation
"""

from fastapi import APIRouter
from app.api.v1 import auth, users, forum, comments, notifications, system, upload

api_router = APIRouter()

# Include all API v1 routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(forum.router)
api_router.include_router(comments.router)
api_router.include_router(notifications.router)
api_router.include_router(system.router)  # System info for cache sync
api_router.include_router(upload.router)  # File upload