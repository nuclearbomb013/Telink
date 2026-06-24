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
    UserStats,
    UserListResult
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
from app.schemas.article import (
    ArticleBase,
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListResponse,
    ArticleListResult,
)
from app.schemas.moment import (  # noqa: F401
    MomentCreate,
    MomentUpdate,
    MomentResponse,
    MomentCommentCreate,
    MomentCommentResponse,
    MomentListResult,
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
from app.schemas.favorite import (
    FavoriteCreate,
    FavoriteResponse,
    FavoriteCheckResult,
    FavoriteListResult,
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
    "UserListResult",
    # Post
    "PostBase",
    "PostCreate",
    "PostUpdate",
    "PostResponse",
    "PostListResponse",
    "PostListResult",
    "GetPostsParams",
    "PostStats",
    # Article
    "ArticleBase",
    "ArticleCreate",
    "ArticleUpdate",
    "ArticleResponse",
    "ArticleListResponse",
    "ArticleListResult",
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
    # Favorite
    "FavoriteCreate",
    "FavoriteResponse",
    "FavoriteCheckResult",
    "FavoriteListResult",
]