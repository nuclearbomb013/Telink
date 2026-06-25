"""
API Router Aggregation
"""

from fastapi import APIRouter
from app.api.v1 import auth, users, forum, comments, notifications, system, upload, moments, favorites, articles, follow, messages, news

api_router = APIRouter()

# Include all API v1 routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(forum.router)
api_router.include_router(articles.router)
api_router.include_router(comments.router)
api_router.include_router(moments.router)  # Moments (动态) social feed
api_router.include_router(follow.router)   # Follow system
api_router.include_router(messages.router)  # Private messages
api_router.include_router(notifications.router)
api_router.include_router(system.router)  # System info for cache sync
api_router.include_router(upload.router)  # File upload
api_router.include_router(favorites.router)  # User favorites/bookmarks
api_router.include_router(news.router)      # News timeline (stub — data model pending)