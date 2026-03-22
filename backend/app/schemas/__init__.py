"""
Pydantic Schemas
"""

from app.schemas.common import ServiceResponse, PaginationParams, PaginatedResult, ErrorResponse
from app.schemas.auth import (
    LoginCredentials,
    RegisterCredentials,
    TokenData,
    AuthUser,
    AuthResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserPublic,
    UserStats
)
from app.schemas.post import (
    PostBase,
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    PostListResult,
    GetPostsParams,
    PostStats
)
from app.schemas.comment import (
    CommentBase,
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentWithReplies,
    CommentListResult,
    GetCommentsParams
)
from app.schemas.notification import (
    NotificationBase,
    NotificationCreate,
    NotificationResponse,
    NotificationListResult,
    UnreadCountResponse
)

__all__ = [
    # Common
    "ServiceResponse",
    "PaginationParams",
    "PaginatedResult",
    "ErrorResponse",
    # Auth
    "LoginCredentials",
    "RegisterCredentials",
    "TokenData",
    "AuthUser",
    "AuthResponse",
    "RefreshTokenRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserPublic",
    "UserStats",
    # Post
    "PostBase",
    "PostCreate",
    "PostUpdate",
    "PostResponse",
    "PostListResponse",
    "PostListResult",
    "GetPostsParams",
    "PostStats",
    # Comment
    "CommentBase",
    "CommentCreate",
    "CommentUpdate",
    "CommentResponse",
    "CommentWithReplies",
    "CommentListResult",
    "GetCommentsParams",
    # Notification
    "NotificationBase",
    "NotificationCreate",
    "NotificationResponse",
    "NotificationListResult",
    "UnreadCountResponse",
]