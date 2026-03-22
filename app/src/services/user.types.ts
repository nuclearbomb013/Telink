/**
 * User Types - 用户功能类型定义
 */

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'moderator' | 'user';

/**
 * 用户接口
 */
export interface User {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  postCount: number;
  commentCount: number;
  likeCount: number;
  joinedAt: number;
  role?: UserRole;
  lastActiveAt?: number;
}

/**
 * 创建用户数据
 */
export interface CreateUserData {
  username: string;
  avatar?: string;
  bio?: string;
}

/**
 * 更新用户数据
 */
export interface UpdateUserData extends Partial<CreateUserData> {
  id: number;
}

/**
 * 用户统计信息
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  topContributors: User[];
}

/**
 * 用户帖子统计
 */
export interface UserPostStats {
  userId: number;
  username: string;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  posts: Array<{
    id: number;
    title: string;
    category: string;
    likes: number;
    views: number;
    replyCount: number;
    createdAt: number;
  }>;
}

/**
 * 服务响应类型（与 forum.types.ts 保持一致）
 */
export interface UserServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: UserServiceError;
  timestamp: number;
}

/**
 * 服务错误类型
 */
export interface UserServiceError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 当前登录用户信息（存储在 localStorage）
 */
export interface CurrentUser {
  id: number;
  username: string;
  avatar?: string;
  role?: 'admin' | 'moderator' | 'user';
}

/**
 * 默认当前用户
 */
export const DEFAULT_CURRENT_USER: CurrentUser = {
  id: 1,
  username: 'TechInk 用户',
  avatar: undefined,
};
