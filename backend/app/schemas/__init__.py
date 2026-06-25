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
    UserSummaryStats,
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
    NotificationUnreadCountResponse
)
from app.schemas.favorite import (
    FavoriteCreate,
    FavoriteResponse,
    FavoriteCheckResult,
    FavoriteListResult,
)
from app.schemas.follow import (
    FollowStatusResponse,
    FollowUserInfo,
    FollowListResult,
    FollowStatsResponse,
    FollowCheckManyResponse,
)
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    ConversationListResult,
    MessageListResult,
    MessageUnreadCountResponse,
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
    "UserSummaryStats",
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
    # Moment
    "MomentCreate",
    "MomentUpdate",
    "MomentResponse",
    "MomentCommentCreate",
    "MomentCommentResponse",
    "MomentListResult",
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
    "NotificationUnreadCountResponse",
    # Favorite
    "FavoriteCreate",
    "FavoriteResponse",
    "FavoriteCheckResult",
    "FavoriteListResult",
    # Follow
    "FollowStatusResponse",
    "FollowUserInfo",
    "FollowListResult",
    "FollowStatsResponse",
    "FollowCheckManyResponse",
    # Message
    "MessageCreate",
    "MessageResponse",
    "ConversationResponse",
    "ConversationListResult",
    "MessageListResult",
    "MessageUnreadCountResponse",
]