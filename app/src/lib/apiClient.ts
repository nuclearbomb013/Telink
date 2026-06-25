/**
 * API Client - 统一的后端 API 客户端
 *
 * 用于与后端 FastAPI 服务通信
 *
 * Security (P0-4):
 * - Access token stored in module-level memory only (NOT localStorage)
 * - Refresh token stored in HttpOnly cookie (set by backend)
 * - CSRF protection via SameSite cookie + Authorization header
 */

// API 基础 URL
// In production, VITE_API_URL must be set via environment variable.
// Fallback to relative path (uses Vite dev server proxy) when VITE_API_URL is not set.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * 统一的服务响应格式
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

/**
 * API 客户端类
 * P0-4: Access token stored in memory only, never in localStorage.
 * Refresh token is handled via HttpOnly cookies by the backend.
 */
class ApiClient {
  private baseUrl: string;
  /** P0-4: Access token stored in module-level variable (memory only) */
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 设置访问 Token (memory only, no localStorage)
   */
  setToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * 清除 Token (memory only)
   */
  clearToken(): void {
    this.accessToken = null;
  }

  /**
   * 尝试刷新 Token（Promise 锁防止并发刷新）
   * P0-4: Refresh token is in HttpOnly cookie, sent automatically via credentials: 'include'
   */
  async tryRefreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        // P0-4: Refresh token is in HttpOnly cookie, no need to send in body
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',  // Send HttpOnly cookie
          body: JSON.stringify({}),  // Empty body, token comes from cookie
        });

        if (!response.ok) {
          this.clearToken();
          // Clear user data on refresh failure
          localStorage.removeItem('techink_current_user');
          return null;
        }

        const data = await response.json();
        if (data.success && data.data?.accessToken) {
          // Store new access token in memory only (P0-4)
          this.setToken(data.data.accessToken);
          return data.data.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * 发起 HTTP 请求
   * P0-4: Uses credentials: 'include' to send HttpOnly refresh token cookie
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',  // P0-4: Send HttpOnly cookies
      });

      const data = await response.json();

      if (!response.ok) {
        // Auto-refresh token on 401 (exclude auth endpoints to prevent loops)
        if (response.status === 401 && !endpoint.startsWith('/auth/')) {
          const newToken = await this.tryRefreshToken();
          if (newToken) {
            const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
            const retryRsp = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
            if (retryRsp.ok) return retryRsp.json();
            const retryData = await retryRsp.json();
            return {
              success: false,
              error: retryData.error || {
                code: 'HTTP_ERROR',
                message: `HTTP Error: ${retryRsp.status}`,
              },
              timestamp: Date.now(),
            };
          }
          this.clearToken();
          localStorage.removeItem('techink_current_user');
        }

        return {
          success: false,
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `HTTP Error: ${response.status}`,
          },
          timestamp: Date.now(),
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
          details: error,
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ServiceResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * 上传文件 (multipart/form-data)
   * P0-4: Uses credentials: 'include' for HttpOnly cookie.
   * Includes 401 auto-refresh with FormData re-creation.
   */
  async uploadFile<T>(endpoint: string, file: File, fieldName = 'file'): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const buildHeaders = (): Record<string, string> => {
      const h: Record<string, string> = {};
      if (this.accessToken) {
        h['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return h;
    };

    const buildFormData = (): FormData => {
      const fd = new FormData();
      fd.append(fieldName, file);
      return fd;
    };

    // Note: Don't set Content-Type for FormData - browser will set it automatically

    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: buildFormData(),
        credentials: 'include',  // P0-4: Send HttpOnly cookie
      });

      // P0-4: Auto-refresh on 401 (re-create FormData since it's consumed)
      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        const newToken = await this.tryRefreshToken();
        if (newToken) {
          this.setToken(newToken);
          const retryRsp = await fetch(url, {
            method: 'POST',
            headers: buildHeaders(),
            body: buildFormData(),  // Re-create FormData from original File
            credentials: 'include',
          });
          if (retryRsp.ok) return retryRsp.json();
          response = retryRsp;
        } else {
          this.clearToken();
          localStorage.removeItem('techink_current_user');
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `HTTP Error: ${response.status}`,
          },
          timestamp: Date.now(),
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
        timestamp: Date.now(),
      };
    }
  }
}

// 导出单例实例
export const apiClient = new ApiClient(API_BASE_URL);

// ==================== 认证 API ====================

export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: TokenData;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<AuthResponse>('/auth/register', credentials),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: (refreshToken?: string) =>
    apiClient.post<TokenData>('/auth/refresh', { refreshToken: refreshToken || '' }),

  getMe: () =>
    apiClient.get<AuthUser>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, new_password: newPassword }),
};

// ==================== 用户 API ====================

/**
 * 后端返回的用户数据（snake_case）
 */
export interface UserPublicRaw {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  role: string;
  post_count: number;
  comment_count: number;
  like_count: number;
  created_at: number;
}

/**
 * 前端使用的用户数据（camelCase）
 */
export interface UserPublic {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  role: string;
  postCount: number;
  commentCount: number;
  likeCount: number;
  joinedAt: number;
  lastActiveAt?: number;
}

/**
 * 将后端 snake_case 用户数据转换为前端 camelCase
 */
function transformUserPublic(raw: UserPublicRaw): UserPublic {
  return {
    id: raw.id,
    username: raw.username,
    avatar: raw.avatar,
    bio: raw.bio,
    role: raw.role,
    postCount: raw.post_count,
    commentCount: raw.comment_count,
    likeCount: raw.like_count,
    joinedAt: raw.created_at,
  };
}

export interface UserStats {
  postCount: number;
  commentCount: number;
  likeCount: number;
  followingCount: number;
  followerCount: number;
  totalPostLikes: number;
  totalPostViews: number;
}

function mapResponse<TInput, TOutput>(
  response: ServiceResponse<TInput>,
  mapper: (data: TInput) => TOutput
): ServiceResponse<TOutput> {
  if (response.success && response.data !== undefined) {
    return { ...response, data: mapper(response.data) };
  }
  return {
    success: response.success,
    error: response.error,
    timestamp: response.timestamp,
  };
}

/**
 * 后端返回的用户统计数据（snake_case）
 */
interface UserStatsRaw {
  post_count: number;
  comment_count: number;
  like_count: number;
  following_count: number;
  follower_count: number;
  total_post_likes: number;
  total_post_views: number;
}

/**
 * 后端返回的用户列表数据（snake_case）
 */
interface UserListResultRaw {
  users: UserPublicRaw[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * 前端使用的用户列表数据（camelCase）
 */
export interface UserListResult {
  users: UserPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 转换用户列表数据
 */
function transformUserList(raw: UserListResultRaw): UserListResult {
  return {
    users: raw.users.map(transformUserPublic),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.total_pages,
  };
}

/**
 * 将后端 snake_case 用户统计数据转换为前端 camelCase
 */
function transformUserStats(raw: UserStatsRaw): UserStats {
  return {
    postCount: raw.post_count,
    commentCount: raw.comment_count,
    likeCount: raw.like_count,
    followingCount: raw.following_count,
    followerCount: raw.follower_count,
    totalPostLikes: raw.total_post_likes ?? 0,
    totalPostViews: raw.total_post_views ?? 0,
  };
}

export const userApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<ServiceResponse<UserListResult>> => {
    const query: Record<string, string | number | boolean> = {};
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    const response = await apiClient.get<UserListResultRaw>('/users/list', query);
    return mapResponse(response, transformUserList);
  },

  getById: async (userId: number): Promise<ServiceResponse<UserPublic>> => {
    const response = await apiClient.get<UserPublicRaw>(`/users/${userId}`);
    return mapResponse(response, transformUserPublic);
  },

  getByUsername: async (username: string): Promise<ServiceResponse<UserPublic>> => {
    const response = await apiClient.get<UserPublicRaw>(`/users/username/${encodeURIComponent(username)}`);
    return mapResponse(response, transformUserPublic);
  },

  checkUsername: async (username: string): Promise<ServiceResponse<{ available: boolean; message: string }>> => {
    return apiClient.get<{ available: boolean; message: string }>('/users/check-username', { username });
  },

  update: async (userId: number, data: Partial<UserPublic>): Promise<ServiceResponse<UserPublic>> => {
    // Convert camelCase to snake_case for backend
    const backendData: Record<string, unknown> = {};
    if (data.username !== undefined) backendData.username = data.username;
    if (data.avatar !== undefined) backendData.avatar = data.avatar;
    if (data.bio !== undefined) backendData.bio = data.bio;

    const response = await apiClient.put<UserPublicRaw>(`/users/${userId}`, backendData);
    return mapResponse(response, transformUserPublic);
  },

  getStats: async (userId: number): Promise<ServiceResponse<UserStats>> => {
    const response = await apiClient.get<UserStatsRaw>(`/users/${userId}/stats`);
    return mapResponse(response, transformUserStats);
  },

  getSummaryStats: async (): Promise<ServiceResponse<{ totalUsers: number; newUsersThisWeek: number; newUsersThisMonth: number }>> => {
    const response = await apiClient.get<{ total_users: number; new_users_this_week: number; new_users_this_month: number }>('/users/stats/summary');
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          totalUsers: response.data.total_users,
          newUsersThisWeek: response.data.new_users_this_week,
          newUsersThisMonth: response.data.new_users_this_month,
        },
      };
    }
    return { success: false, error: response.error, timestamp: response.timestamp };
  },
};

// ==================== 论坛 API ====================

export interface PostListParams {
  category?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'liked';
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
}

/**
 * 后端返回的帖子数据（snake_case）
 */
interface PostRaw {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked?: boolean;
  is_featured?: boolean;
  is_solved?: boolean;
  created_at: number;
  updated_at?: number;
}

/**
 * 前端使用的帖子数据（camelCase）
 */
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  replyCount: number;
  isPinned: boolean;
  isLocked?: boolean;
  isFeatured?: boolean;
  isSolved?: boolean;
  createdAt: number;
  updatedAt?: number;
}

/**
 * 将后端 snake_case 帖子数据转换为前端 camelCase
 */
function transformPost(raw: PostRaw): Post {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content,
    excerpt: raw.excerpt,
    coverImage: raw.cover_image,
    authorId: raw.author_id,
    authorName: raw.author_name,
    authorAvatar: raw.author_avatar,
    category: raw.category,
    tags: raw.tags,
    views: raw.views,
    likes: raw.likes,
    replyCount: raw.reply_count,
    isPinned: raw.is_pinned,
    isLocked: raw.is_locked,
    isFeatured: raw.is_featured,
    isSolved: raw.is_solved,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface PostListResult {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 后端返回的帖子列表结果（snake_case）
 */
interface PostListResultRaw {
  posts: PostRaw[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * 将后端 snake_case 帖子列表结果转换为前端 camelCase
 */
function transformPostListResult(raw: PostListResultRaw): PostListResult {
  return {
    posts: raw.posts.map(transformPost),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.total_pages,
  };
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  coverImage?: string;
  excerpt?: string;
}

interface ForumStatsRaw {
  total_posts: number;
  total_replies: number;
  total_users: number;
  posts_by_category: Record<string, number>;
}

export interface ForumStatsData {
  totalPosts: number;
  totalReplies: number;
  totalUsers: number;
  postsByCategory: Record<string, number>;
}

function transformForumStats(raw: ForumStatsRaw): ForumStatsData {
  return {
    totalPosts: raw.total_posts,
    totalReplies: raw.total_replies,
    totalUsers: raw.total_users,
    postsByCategory: raw.posts_by_category ?? {},
  };
}

export const forumApi = {
  getPosts: async (params?: PostListParams): Promise<ServiceResponse<PostListResult>> => {
    const response = await apiClient.get<PostListResultRaw>('/forum/posts', params as Record<string, string | number>);
    return mapResponse(response, transformPostListResult);
  },

  getPostById: async (postId: number): Promise<ServiceResponse<Post>> => {
    const response = await apiClient.get<PostRaw>(`/forum/posts/${postId}`);
    return mapResponse(response, transformPost);
  },

  getPostBySlug: async (slug: string): Promise<ServiceResponse<Post>> => {
    const response = await apiClient.get<PostRaw>(`/forum/posts/slug/${slug}`);
    return mapResponse(response, transformPost);
  },

  createPost: async (data: CreatePostData): Promise<ServiceResponse<Post>> => {
    // Convert camelCase to snake_case for backend
    const backendData = {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      cover_image: data.coverImage,
      excerpt: data.excerpt,
    };
    const response = await apiClient.post<PostRaw>('/forum/posts', backendData);
    return mapResponse(response, transformPost);
  },

  updatePost: async (postId: number, data: Partial<CreatePostData>): Promise<ServiceResponse<Post>> => {
    // Convert camelCase to snake_case for backend
    const backendData: Record<string, unknown> = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.content !== undefined) backendData.content = data.content;
    if (data.category !== undefined) backendData.category = data.category;
    if (data.tags !== undefined) backendData.tags = data.tags;
    if (data.coverImage !== undefined) backendData.cover_image = data.coverImage;
    if (data.excerpt !== undefined) backendData.excerpt = data.excerpt;

    const response = await apiClient.put<PostRaw>(`/forum/posts/${postId}`, backendData);
    return mapResponse(response, transformPost);
  },

  deletePost: (postId: number) =>
    apiClient.delete(`/forum/posts/${postId}`),

  toggleLike: (postId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/forum/posts/${postId}/like`),

  togglePin: (postId: number) =>
    apiClient.post<{ isPinned: boolean }>(`/forum/posts/${postId}/pin`),

  toggleLock: (postId: number) =>
    apiClient.post<{ isLocked: boolean }>(`/forum/posts/${postId}/lock`),

  getStats: async (): Promise<ServiceResponse<ForumStatsData>> => {
    const response = await apiClient.get<ForumStatsRaw>('/forum/stats');
    return mapResponse(response, transformForumStats);
  },
};

// ==================== 评论 API ====================

/**
 * 后端返回的评论数据（snake_case）
 */
interface CommentRaw {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  content: string;
  likes: number;
  parent_id?: number;
  reply_to_id?: number;
  reply_to_name?: string;
  created_at: number;
  updated_at?: number;
  replies?: CommentRaw[];
}

/**
 * 前端使用的评论数据（camelCase）
 */
export interface Comment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  parentId?: number;
  replyToId?: number;
  replyToName?: string;
  createdAt: number;
  updatedAt?: number;
  replies?: Comment[];
}

/**
 * 将后端 snake_case 评论数据转换为前端 camelCase
 */
function transformComment(raw: CommentRaw): Comment {
  return {
    id: raw.id,
    postId: raw.post_id,
    authorId: raw.author_id,
    authorName: raw.author_name,
    authorAvatar: raw.author_avatar,
    content: raw.content,
    likes: raw.likes,
    parentId: raw.parent_id,
    replyToId: raw.reply_to_id,
    replyToName: raw.reply_to_name,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    replies: raw.replies?.map(transformComment),
  };
}

export interface CommentListResult {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 后端返回的评论列表结果（snake_case）
 */
interface CommentListResultRaw {
  comments: CommentRaw[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateCommentData {
  postId: number;
  content: string;
  parentId?: number;
  replyToId?: number;
  replyToName?: string;
}

export const commentApi = {
  getComments: async (postId: number, params?: { page?: number; limit?: number; sortBy?: string }): Promise<ServiceResponse<CommentListResult>> => {
    const response = await apiClient.get<CommentListResultRaw>('/comments', { postId, ...params } as Record<string, string | number>);
    return mapResponse(response, (data) => ({
      comments: data.comments.map(transformComment),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.total_pages,
    }));
  },

  createComment: async (data: CreateCommentData): Promise<ServiceResponse<Comment>> => {
    const backendData = {
      post_id: data.postId,
      content: data.content,
      parent_id: data.parentId,
      reply_to_id: data.replyToId,
      reply_to_name: data.replyToName,
    };
    const response = await apiClient.post<CommentRaw>('/comments', backendData);
    return mapResponse(response, transformComment);
  },

  updateComment: async (commentId: number, content: string): Promise<ServiceResponse<Comment>> => {
    const response = await apiClient.put<CommentRaw>(`/comments/${commentId}`, { content });
    return mapResponse(response, transformComment);
  },

  deleteComment: (commentId: number) =>
    apiClient.delete(`/comments/${commentId}`),

  toggleLike: (commentId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/comments/${commentId}/like`),
};

// ==================== 通知 API ====================

/**
 * 后端返回的通知数据（snake_case）
 */
interface NotificationRaw {
  id: number;
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: number;
}

/**
 * 前端使用的通知数据（camelCase）
 */
export interface Notification {
  id: number;
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: number;
}

/**
 * 将后端 snake_case 通知数据转换为前端 camelCase
 */
function transformNotification(raw: NotificationRaw): Notification {
  return {
    id: raw.id,
    userId: raw.user_id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    link: raw.link,
    isRead: raw.is_read,
    createdAt: raw.created_at,
  };
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * 后端返回的通知列表结果（snake_case）
 */
interface NotificationListResultRaw {
  notifications: NotificationRaw[];
  total: number;
  unread_count: number;
}

export const notificationApi = {
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<ServiceResponse<NotificationListResult>> => {
    const response = await apiClient.get<NotificationListResultRaw>('/notifications', params as Record<string, string | number>);
    return mapResponse(response, (data) => ({
      notifications: data.notifications.map(transformNotification),
      total: data.total,
      unreadCount: data.unread_count,
    }));
  },

  markAsRead: (notificationId: number) =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),

  deleteNotification: (notificationId: number) =>
    apiClient.delete(`/notifications/${notificationId}`),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),
};

// ==================== 上传 API ====================

/**
 * 上传响应数据
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

/**
 * 后端返回的上传响应（snake_case）
 */
interface UploadResponseRaw {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

export const uploadApi = {
  /**
   * 上传图片
   */
  uploadImage: async (file: File): Promise<ServiceResponse<UploadResponse>> => {
    // Use authenticated endpoint (requires valid JWT token)
    const response = await apiClient.uploadFile<UploadResponseRaw>('/upload/image', file);
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          url: response.data.url,
          filename: response.data.filename,
          size: response.data.size,
          contentType: response.data.content_type,
        },
        timestamp: response.timestamp,
      };
    }
    // Return error response with proper typing
    return {
      success: false,
      error: response.error,
      timestamp: response.timestamp,
    };
  },
};

// ==================== 动态 (Moments) API ====================

export interface CreateMomentData {
  content: string;
  contentType?: string;
  visibility?: string;
  codeSnippet?: { filename: string; language: string; code: string };
  images?: Array<{ url: string; alt?: string }>;
  location?: string;
}

export interface MomentData {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  content: string;
  content_type: string;
  code_snippet?: { filename: string; language: string; code: string } | null;
  images?: Array<{ url: string; alt: string }> | null;
  visibility: string;
  location?: string | null;
  likes: number;
  comment_count: number;
  is_liked: boolean;
  created_at: number;
  updated_at?: number | null;
}

export interface MomentListResult {
  moments: MomentData[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export const momentApi = {
  getMoments: (params?: { page?: number; limit?: number; sort_by?: string; user_id?: number; following_only?: boolean }) =>
    apiClient.get<MomentListResult>('/moments', params as Record<string, string | number>),

  getMomentById: (id: number) =>
    apiClient.get<MomentData>(`/moments/${id}`),

  createMoment: (data: CreateMomentData) =>
    apiClient.post<MomentData>('/moments', data),

  updateMoment: (id: number, data: Partial<CreateMomentData>) =>
    apiClient.put<MomentData>(`/moments/${id}`, data),

  deleteMoment: (id: number) =>
    apiClient.delete(`/moments/${id}`),

  like: (momentId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/moments/${momentId}/like`),

  unlike: (momentId: number) =>
    apiClient.delete<{ liked: boolean; likes: number }>(`/moments/${momentId}/like`),

  // Comment endpoints
  getComments: (momentId: number) =>
    apiClient.get<Record<string, unknown>[]>(`/moments/${momentId}/comments`),

  createComment: (momentId: number, data: { content: string; reply_to_id?: number; reply_to_name?: string }) =>
    apiClient.post<Record<string, unknown>>(`/moments/${momentId}/comments`, data),

  deleteComment: (momentId: number, commentId: number) =>
    apiClient.delete(`/moments/${momentId}/comments/${commentId}`),
};

// ==================== 收藏 API ====================

// ==================== 文章 (Articles) API ====================

export interface ArticleApiData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  excerpt?: string;
  subtitle?: string;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
}

export interface ArticleApiResponse {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  subtitle?: string;
  cover_image?: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  category: string;
  status: string;
  tags: string[];
  views: number;
  likes: number;
  is_featured: boolean;
  published_at?: number;
  created_at: number;
  updated_at?: number;
}

export interface ArticleListResultApi {
  articles: ArticleApiResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const articleApi = {
  getArticles: (params?: { category?: string; sortBy?: string; page?: number; limit?: number; search?: string }) =>
    apiClient.get<ArticleListResultApi>('/articles', params as Record<string, string | number>),

  getArticleBySlug: (slug: string) =>
    apiClient.get<ArticleApiResponse>(`/articles/slug/${slug}`),

  getArticleById: (id: number) =>
    apiClient.get<ArticleApiResponse>(`/articles/${id}`),

  getMyArticles: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<ArticleListResultApi>('/articles/me', params as Record<string, string | number>),

  createArticle: (data: ArticleApiData) =>
    apiClient.post<ArticleApiResponse>('/articles', data),

  updateArticle: (id: number, data: Partial<ArticleApiData>) =>
    apiClient.put<ArticleApiResponse>(`/articles/${id}`, data),

  deleteArticle: (id: number) =>
    apiClient.delete<{ message: string; id: number }>(`/articles/${id}`),

  publishArticle: (id: number) =>
    apiClient.post<ArticleApiResponse>(`/articles/${id}/publish`, {}),
};

// ==================== 关注 (Follow) API ====================

export interface FollowStatusData {
  user_id: number;
  username: string;
  avatar?: string;
  bio?: string;
  is_following: boolean;
  is_mutual: boolean;
  follower_count: number;
  following_count: number;
}

export interface FollowUserInfoData {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  is_following: boolean;
  is_mutual: boolean;
  follower_count: number;
  following_count: number;
  moment_count: number;
}

export interface FollowListResultData {
  users: FollowUserInfoData[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface FollowStatsData {
  user_id: number;
  follower_count: number;
  following_count: number;
  friend_count: number;
}

export const followApi = {
  follow: (targetUserId: number) =>
    apiClient.post<{ message: string }>(`/follow/${targetUserId}`),

  unfollow: (targetUserId: number) =>
    apiClient.delete<{ message: string; removed: boolean }>(`/follow/${targetUserId}`),

  getStatus: (targetUserId: number) =>
    apiClient.get<FollowStatusData>(`/follow/${targetUserId}/status`),

  getFollowing: (userId: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<FollowListResultData>(`/follow/${userId}/following`, params as Record<string, string | number>),

  getFollowers: (userId: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<FollowListResultData>(`/follow/${userId}/followers`, params as Record<string, string | number>),

  getFriends: (userId: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<FollowListResultData>(`/follow/${userId}/friends`, params as Record<string, string | number>),

  getStats: (userId: number) =>
    apiClient.get<FollowStatsData>(`/follow/${userId}/stats`),
};

// ==================== 收藏 (Favorites) API ====================

export interface FavoritesCreateInput {
  content_type: string;
  content_id: number;
  title?: string;
}

export interface FavoriteItem {
  id: number;
  user_id: number;
  content_type: string;
  content_id: number;
  title: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface FavoriteCheckResult {
  favorited: boolean;
  favorite_id: number | null;
}

export interface FavoriteListResult {
  items: FavoriteItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const favoritesApi = {
  list: (params?: { page?: number; limit?: number; content_type?: string }) =>
    apiClient.get<FavoriteListResult>('/favorites', params as Record<string, string | number>),

  add: (data: FavoritesCreateInput) =>
    apiClient.post<FavoriteItem>('/favorites', data),

  remove: (favoriteId: number) =>
    apiClient.delete<{ removed: boolean; content_type: string; content_id: number }>(`/favorites/${favoriteId}`),

  removeByContent: (contentType: string, contentId: number) =>
    apiClient.delete<{ removed: boolean; content_type: string; content_id: number }>(
      `/favorites/by-content?content_type=${encodeURIComponent(contentType)}&content_id=${contentId}`
    ),

  check: (contentType: string, contentId: number) =>
    apiClient.get<FavoriteCheckResult>(
      `/favorites/check?content_type=${encodeURIComponent(contentType)}&content_id=${contentId}`
    ),
};

// ==================== 私信 (Messages) API ====================

export interface MessageApiResponse {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  status: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: number;
}

export interface ConversationApiResponse {
  user_id: number;
  username: string;
  avatar?: string;
  last_message: string;
  last_message_at: number;
  unread_count: number;
}

export interface ConversationListApiResponse {
  conversations: ConversationApiResponse[];
  total: number;
}

export interface MessageListApiResponse {
  messages: MessageApiResponse[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface UnreadCountApiResponse {
  total_unread: number;
  conversation_unreads: Array<{ user_id: number; unread_count: number }>;
}

export const messageApi = {
  getConversations: () =>
    apiClient.get<ConversationListApiResponse>('/messages/conversations'),

  getConversationMessages: (userId: number, params?: { page?: number; limit?: number; before_id?: number }) =>
    apiClient.get<MessageListApiResponse>(
      `/messages/conversations/${userId}`,
      params as Record<string, string | number>
    ),

  send: (receiverId: number, content: string) =>
    apiClient.post<MessageApiResponse>('/messages', { receiver_id: receiverId, content }),

  markRead: (messageId: number) =>
    apiClient.put(`/messages/${messageId}/read`),

  markConversationRead: (userId: number) =>
    apiClient.put(`/messages/conversations/${userId}/read`),

  getUnreadCount: () =>
    apiClient.get<UnreadCountApiResponse>('/messages/unread-count'),

  deleteMessage: (messageId: number) =>
    apiClient.delete(`/messages/${messageId}`),
};

// ==================== 资讯 (News) API ====================

export interface NewsItemApi {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category: string;
  tags: string[];
  hot_score: number;
  views: number;
  created_at: number;
  updated_at: number;
}

export const newsApi = {
  getTimeline: (params?: { page?: number; limit?: number; category?: string }) =>
    apiClient.get<{ items: NewsItemApi[]; total: number; page: number; limit: number; has_more: boolean }>(
      '/news',
      params as Record<string, string | number>,
    ),

  getHot: (limit?: number) =>
    apiClient.get<{ items: NewsItemApi[]; keywords: string[] }>(
      '/news/hot',
      limit !== undefined ? { limit } as Record<string, string | number> : undefined,
    ),

  getById: (id: string) =>
    apiClient.get<NewsItemApi>(`/news/${id}`),
};

export default apiClient;
