/**
 * Auth Types - 用户认证功能类型定义
 */

/**
 * 用户角色（与 user.types.ts 保持一致）
 */
export type UserRole = 'admin' | 'moderator' | 'user';

/**
 * 登录凭证
 */
export interface LoginCredentials {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 是否记住登录状态（7 天） */
  remember?: boolean;
}

/**
 * 注册凭证
 */
export interface RegisterCredentials {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 个人简介 */
  bio?: string;
}

/**
 * 密码重置凭证
 */
export interface ResetPasswordCredentials {
  /** 重置令牌 */
  token: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 当前登录用户信息
 */
export interface CurrentUser {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email?: string;
  /** 头像 URL */
  avatar?: string;
  /** 角色 */
  role?: UserRole;
}

/**
 * 认证令牌
 */
export interface AuthToken {
  /** 访问令牌 */
  token: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 过期时间戳 */
  expiresAt: number;
}

/**
 * 认证响应
 */
export interface AuthResponse {
  /** 用户信息 */
  user: CurrentUser;
  /** 认证令牌 */
  token: AuthToken;
}

/**
 * 认证状态
 */
export interface AuthState {
  /** 当前用户 */
  user: CurrentUser | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 服务响应类型（与其他服务保持一致）
 */
export interface AuthServiceResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: AuthError;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 认证错误类型
 */
export interface AuthError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 详细信息 */
  details?: unknown;
}

/**
 * 密码强度等级
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * 密码验证结果
 */
export interface PasswordValidation {
  /** 是否有效 */
  isValid: boolean;
  /** 强度等级 */
  strength: PasswordStrength;
  /** 错误信息 */
  errors: string[];
}
