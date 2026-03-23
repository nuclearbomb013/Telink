/**
 * Auth Service - 用户认证服务
 *
 * 提供用户登录、注册、登出、密码重置等功能
 * 连接后端 FastAPI API
 */

import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  CurrentUser,
  AuthToken,
  AuthResponse,
  AuthServiceResponse,
  PasswordValidation,
  PasswordStrength,
} from './auth.types';
import {
  apiClient,
  authApi,
  type AuthUser,
  type TokenData,
} from '@/lib/apiClient';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  CURRENT_USER: 'techink_current_user',
  REFRESH_TOKEN: 'techink_refresh_token',
} as const;

/**
 * 认证服务类
 */
class AuthService {
  private currentUser: CurrentUser | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private initialize(): void {
    this.loadCurrentUser();
  }

  /**
   * 加载当前用户
   */
  private loadCurrentUser(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('加载当前用户失败:', error);
    }
  }

  /**
   * 保存当前用户
   */
  private saveCurrentUser(user: CurrentUser): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.currentUser = user;
  }

  /**
   * 清除当前用户
   */
  private clearCurrentUser(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    this.currentUser = null;
  }

  /**
   * 将 API 用户转换为本地用户格式
   */
  private mapApiUserToCurrentUser(apiUser: AuthUser): CurrentUser {
    return {
      id: apiUser.id,
      username: apiUser.username,
      email: apiUser.email,
      avatar: apiUser.avatar,
      role: apiUser.role as CurrentUser['role'],
    };
  }

  /**
   * 将 API Token 转换为本地 Token 格式
   */
  private mapApiTokenToAuthToken(tokenData: TokenData): AuthToken {
    return {
      token: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: Date.now() + tokenData.expiresIn * 1000,
    };
  }

  /**
   * 验证密码强度
   */
  validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let strength: PasswordStrength = 'weak';

    // 长度检查
    if (password.length < 8) {
      errors.push('密码至少 8 个字符');
    }
    if (password.length >= 12) {
      strength = 'strong';
    } else if (password.length >= 8) {
      strength = 'medium';
    }

    // 字符类型检查
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const typeCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;

    if (typeCount < 2) {
      errors.push('密码需包含至少 2 种字符类型');
      strength = 'weak';
    } else if (typeCount >= 3 && password.length >= 8) {
      strength = 'strong';
    }

    return {
      isValid: errors.length === 0,
      strength,
      errors,
    };
  }

  /**
   * 验证用户名
   */
  validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username.trim()) {
      return { isValid: false, error: '用户名不能为空' };
    }
    if (username.length < 3) {
      return { isValid: false, error: '用户名至少 3 个字符' };
    }
    if (username.length > 20) {
      return { isValid: false, error: '用户名最多 20 个字符' };
    }
    // 支持中文、英文、数字、下划线
    if (!/^[\w\u4e00-\u9fa5]+$/.test(username)) {
      return { isValid: false, error: '用户名只能包含中文、英文、数字和下划线' };
    }
    return { isValid: true };
  }

  /**
   * 验证邮箱
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email.trim()) {
      return { isValid: false, error: '邮箱不能为空' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: '邮箱格式不正确' };
    }
    return { isValid: true };
  }

  // ==================== 公开 API ====================

  /**
   * 获取当前登录用户
   */
  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && apiClient.getToken() !== null;
  }

  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      // 验证输入
      const usernameValidation = this.validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: usernameValidation.error! },
          timestamp: Date.now(),
        };
      }

      if (!credentials.password) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '密码不能为空' },
          timestamp: Date.now(),
        };
      }

      // 调用后端 API
      const response = await authApi.login({
        username: credentials.username,
        password: credentials.password,
        remember: credentials.remember,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LOGIN_ERROR', message: '登录失败' },
          timestamp: Date.now(),
        };
      }

      const { user, token } = response.data;

      // 保存认证状态
      apiClient.setToken(token.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token.refreshToken);
      const currentUser = this.mapApiUserToCurrentUser(user);
      this.saveCurrentUser(currentUser);

      return {
        success: true,
        data: {
          user: currentUser,
          token: this.mapApiTokenToAuthToken(token),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : '登录失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 注册
   */
  async register(credentials: RegisterCredentials): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      // 验证用户名
      const usernameValidation = this.validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: usernameValidation.error! },
          timestamp: Date.now(),
        };
      }

      // 验证邮箱
      const emailValidation = this.validateEmail(credentials.email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: emailValidation.error! },
          timestamp: Date.now(),
        };
      }

      // 验证密码
      const passwordValidation = this.validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `密码强度不足：${passwordValidation.errors.join('，')}`,
          },
          timestamp: Date.now(),
        };
      }

      // 调用后端 API
      const response = await authApi.register({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        bio: credentials.bio,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'REGISTER_ERROR', message: '注册失败' },
          timestamp: Date.now(),
        };
      }

      const { user, token } = response.data;

      // 保存认证状态
      apiClient.setToken(token.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token.refreshToken);
      const currentUser = this.mapApiUserToCurrentUser(user);
      this.saveCurrentUser(currentUser);

      return {
        success: true,
        data: {
          user: currentUser,
          token: this.mapApiTokenToAuthToken(token),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: error instanceof Error ? error.message : '注册失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      // 调用后端 API（忽略错误，确保本地状态被清理）
      await authApi.logout();
    } catch (error) {
      console.warn('登出 API 调用失败:', error);
    } finally {
      // 清理本地状态
      apiClient.clearToken();
      this.clearCurrentUser();

      // 触发全局登出事件
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    email: string
  ): Promise<AuthServiceResponse<{ resetToken: string }>> {
    try {
      // 验证邮箱
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: emailValidation.error! },
          timestamp: Date.now(),
        };
      }

      // 调用后端 API
      const response = await authApi.forgotPassword(email);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'SEND_RESET_ERROR', message: '发送重置邮件失败' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: { resetToken: 'sent' },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEND_RESET_ERROR',
          message: error instanceof Error ? error.message : '发送重置邮件失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(
    credentials: ResetPasswordCredentials
  ): Promise<AuthServiceResponse<{ success: boolean }>> {
    try {
      // 验证新密码
      const passwordValidation = this.validatePassword(credentials.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `密码强度不足：${passwordValidation.errors.join('，')}`,
          },
          timestamp: Date.now(),
        };
      }

      // 调用后端 API
      const response = await authApi.resetPassword(credentials.token, credentials.newPassword);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'RESET_ERROR', message: '重置密码失败' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: { success: true },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: error instanceof Error ? error.message : '重置密码失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 验证 Token 是否有效
   */
  verifyToken(): boolean {
    const token = apiClient.getToken();
    return token !== null;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<AuthServiceResponse<AuthToken>> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return {
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: '未登录' },
          timestamp: Date.now(),
        };
      }

      const response = await authApi.refresh(refreshToken);

      if (!response.success || !response.data) {
        // 刷新失败，清理状态
        this.clearCurrentUser();
        apiClient.clearToken();

        return {
          success: false,
          error: response.error || { code: 'REFRESH_ERROR', message: '刷新令牌失败' },
          timestamp: Date.now(),
        };
      }

      const tokenData = response.data;
      apiClient.setToken(tokenData.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);

      return {
        success: true,
        data: this.mapApiTokenToAuthToken(tokenData),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: error instanceof Error ? error.message : '刷新令牌失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 从服务器获取当前用户信息
   */
  async fetchCurrentUser(): Promise<AuthServiceResponse<CurrentUser>> {
    try {
      const response = await authApi.getMe();

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'FETCH_ERROR', message: '获取用户信息失败' },
          timestamp: Date.now(),
        };
      }

      const currentUser = this.mapApiUserToCurrentUser(response.data);
      this.saveCurrentUser(currentUser);

      return {
        success: true,
        data: currentUser,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取用户信息失败',
        },
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * 导出单例
 */
export const authService = new AuthService();