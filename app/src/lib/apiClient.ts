/**
 * API Client - 统一的后端 API 客户端
 *
 * 用于与后端 FastAPI 服务通信
 */

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  /**
   * 从 localStorage 加载 Token
   */
  private loadToken(): void {
    const stored = localStorage.getItem('techink_auth_token');
    if (stored) {
      try {
        const tokenData = JSON.parse(stored);
        this.accessToken = tokenData.accessToken || tokenData;
      } catch {
        this.accessToken = stored;
      }
    }
  }

  /**
   * 设置访问 Token
   */
  setToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('techink_auth_token', token);
    } else {
      localStorage.removeItem('techink_auth_token');
    }
  }

  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * 清除 Token
   */
  clearToken(): void {
    this.accessToken = null;
    localStorage.removeItem('techink_auth_token');
  }

  /**
   * 发起 HTTP 请求
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
      });

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

  refresh: (refreshToken: string) =>
    apiClient.post<TokenData>('/auth/refresh', { refreshToken }),

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
  };
}

export const userApi = {
  getById: async (userId: number): Promise<ServiceResponse<UserPublic>> => {
    const response = await apiClient.get<UserPublicRaw>(`/users/${userId}`);
    if (response.success && response.data) {
      return { ...response, data: transformUserPublic(response.data) };
    }
    return response as ServiceResponse<UserPublic>;
  },

  getByUsername: async (username: string): Promise<ServiceResponse<UserPublic>> => {
    const response = await apiClient.get<UserPublicRaw>(`/users/username/${encodeURIComponent(username)}`);
    if (response.success && response.data) {
      return { ...response, data: transformUserPublic(response.data) };
    }
    return response as ServiceResponse<UserPublic>;
  },

  update: async (userId: number, data: Partial<UserPublic>): Promise<ServiceResponse<UserPublic>> => {
    // Convert camelCase to snake_case for backend
    const backendData: Record<string, unknown> = {};
    if (data.username !== undefined) backendData.username = data.username;
    if (data.avatar !== undefined) backendData.avatar = data.avatar;
    if (data.bio !== undefined) backendData.bio = data.bio;

    const response = await apiClient.put<UserPublicRaw>(`/users/${userId}`, backendData);
    if (response.success && response.data) {
      return { ...response, data: transformUserPublic(response.data) };
    }
    return response as ServiceResponse<UserPublic>;
  },

  getStats: async (userId: number): Promise<ServiceResponse<UserStats>> => {
    const response = await apiClient.get<UserStatsRaw>(`/users/${userId}/stats`);
    if (response.success && response.data) {
      return { ...response, data: transformUserStats(response.data) };
    }
    return response as ServiceResponse<UserStats>;
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

export const forumApi = {
  getPosts: async (params?: PostListParams): Promise<ServiceResponse<PostListResult>> => {
    const response = await apiClient.get<PostListResultRaw>('/forum/posts', params as Record<string, string | number>);
    if (response.success && response.data) {
      return { ...response, data: transformPostListResult(response.data) };
    }
    return response as ServiceResponse<PostListResult>;
  },

  getPostById: async (postId: number): Promise<ServiceResponse<Post>> => {
    const response = await apiClient.get<PostRaw>(`/forum/posts/${postId}`);
    if (response.success && response.data) {
      return { ...response, data: transformPost(response.data) };
    }
    return response as ServiceResponse<Post>;
  },

  getPostBySlug: async (slug: string): Promise<ServiceResponse<Post>> => {
    const response = await apiClient.get<PostRaw>(`/forum/posts/slug/${slug}`);
    if (response.success && response.data) {
      return { ...response, data: transformPost(response.data) };
    }
    return response as ServiceResponse<Post>;
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
    if (response.success && response.data) {
      return { ...response, data: transformPost(response.data) };
    }
    return response as ServiceResponse<Post>;
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
    if (response.success && response.data) {
      return { ...response, data: transformPost(response.data) };
    }
    return response as ServiceResponse<Post>;
  },

  deletePost: (postId: number) =>
    apiClient.delete(`/forum/posts/${postId}`),

  toggleLike: (postId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/forum/posts/${postId}/like`),

  togglePin: (postId: number) =>
    apiClient.post<{ isPinned: boolean }>(`/forum/posts/${postId}/pin`),

  toggleLock: (postId: number) =>
    apiClient.post<{ isLocked: boolean }>(`/forum/posts/${postId}/lock`),

  getStats: () =>
    apiClient.get<{
      totalPosts: number;
      totalReplies: number;
      totalUsers: number;
      postsByCategory: Record<string, number>;
    }>('/forum/stats'),
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
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          comments: response.data.comments.map(transformComment),
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.total_pages,
        },
      };
    }
    return response as ServiceResponse<CommentListResult>;
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
    if (response.success && response.data) {
      return { ...response, data: transformComment(response.data) };
    }
    return response as ServiceResponse<Comment>;
  },

  updateComment: async (commentId: number, content: string): Promise<ServiceResponse<Comment>> => {
    const response = await apiClient.put<CommentRaw>(`/comments/${commentId}`, { content });
    if (response.success && response.data) {
      return { ...response, data: transformComment(response.data) };
    }
    return response as ServiceResponse<Comment>;
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
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          notifications: response.data.notifications.map(transformNotification),
          total: response.data.total,
          unreadCount: response.data.unread_count,
        },
      };
    }
    return response as ServiceResponse<NotificationListResult>;
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

export default apiClient;