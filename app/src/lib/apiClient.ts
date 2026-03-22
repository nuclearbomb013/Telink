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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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

export interface UserPublic {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  role: string;
  post_count: number;
  comment_count: number;
  created_at: number;
}

export interface UserStats {
  post_count: number;
  comment_count: number;
  like_count: number;
  following_count: number;
  follower_count: number;
}

export const userApi = {
  getById: (userId: number) =>
    apiClient.get<UserPublic>(`/users/${userId}`),

  getByUsername: (username: string) =>
    apiClient.get<UserPublic>(`/users/username/${encodeURIComponent(username)}`),

  update: (userId: number, data: Partial<UserPublic>) =>
    apiClient.put<UserPublic>(`/users/${userId}`, data),

  getStats: (userId: number) =>
    apiClient.get<UserStats>(`/users/${userId}/stats`),
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

export interface Post {
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

export interface PostListResult {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  excerpt?: string;
}

export const forumApi = {
  getPosts: (params?: PostListParams) =>
    apiClient.get<PostListResult>('/forum/posts', params as Record<string, string | number>),

  getPostById: (postId: number) =>
    apiClient.get<Post>(`/forum/posts/${postId}`),

  getPostBySlug: (slug: string) =>
    apiClient.get<Post>(`/forum/posts/slug/${slug}`),

  createPost: (data: CreatePostData) =>
    apiClient.post<Post>('/forum/posts', data),

  updatePost: (postId: number, data: Partial<CreatePostData>) =>
    apiClient.put<Post>(`/forum/posts/${postId}`, data),

  deletePost: (postId: number) =>
    apiClient.delete(`/forum/posts/${postId}`),

  toggleLike: (postId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/forum/posts/${postId}/like`),

  togglePin: (postId: number) =>
    apiClient.post<{ is_pinned: boolean }>(`/forum/posts/${postId}/pin`),

  toggleLock: (postId: number) =>
    apiClient.post<{ is_locked: boolean }>(`/forum/posts/${postId}/lock`),

  getStats: () =>
    apiClient.get<{
      total_posts: number;
      total_replies: number;
      total_users: number;
      posts_by_category: Record<string, number>;
    }>('/forum/stats'),
};

// ==================== 评论 API ====================

export interface Comment {
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
  replies?: Comment[];
}

export interface CommentListResult {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateCommentData {
  post_id: number;
  content: string;
  parent_id?: number;
  reply_to_id?: number;
  reply_to_name?: string;
}

export const commentApi = {
  getComments: (postId: number, params?: { page?: number; limit?: number; sortBy?: string }) =>
    apiClient.get<CommentListResult>('/comments', { postId, ...params } as Record<string, string | number>),

  createComment: (data: CreateCommentData) =>
    apiClient.post<Comment>('/comments', data),

  updateComment: (commentId: number, content: string) =>
    apiClient.put<Comment>(`/comments/${commentId}`, { content }),

  deleteComment: (commentId: number) =>
    apiClient.delete(`/comments/${commentId}`),

  toggleLike: (commentId: number) =>
    apiClient.post<{ liked: boolean; likes: number }>(`/comments/${commentId}/like`),
};

// ==================== 通知 API ====================

export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: number;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<NotificationListResult>('/notifications', params as Record<string, string | number>),

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