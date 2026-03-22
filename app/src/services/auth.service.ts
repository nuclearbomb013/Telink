/**
 * Auth Service - 用户认证服务
 *
 * 提供用户登录、注册、登出、密码重置等功能
 * 当前使用 Mock 数据，预留真实 API 接口
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
import { getInitialUsers } from './mock-data';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  CURRENT_USER: 'techink_current_user',
  AUTH_TOKEN: 'techink_auth_token',
  USERS: 'techink_auth_users', // 修改为独立的认证用户存储键
  RESET_TOKENS: 'techink_reset_tokens',
} as const;

/**
 * Token 有效期（毫秒）
 * - 普通登录：7 天
 * - 记住登录：30 天
 */
const TOKEN_EXPIRY = {
  NORMAL: 7 * 24 * 60 * 60 * 1000,
  REMEMBER: 30 * 24 * 60 * 60 * 1000,
};

/**
 * 认证服务类
 */
class AuthService {
  private currentUser: CurrentUser | null = null;
  private authToken: AuthToken | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private initialize(): void {
    this.loadCurrentUser();
    this.loadAuthToken();
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
   * 加载认证令牌
   */
  private loadAuthToken(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (stored) {
        const token = JSON.parse(stored);
        // 检查是否过期
        if (token.expiresAt > Date.now()) {
          this.authToken = token;
        } else {
          // 已过期，清除
          this.clearAuthToken();
        }
      }
    } catch (error) {
      console.warn('加载认证令牌失败:', error);
      this.clearAuthToken();
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
   * 保存认证令牌
   */
  private saveAuthToken(token: AuthToken): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(token));
    this.authToken = token;
  }

  /**
   * 清除认证令牌
   */
  private clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    this.authToken = null;
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): AuthServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 创建错误响应
   */
  private errorResponse(
    code: string,
    message: string,
    details?: unknown
  ): AuthServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
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

  /**
   * 生成 Token
   */
  private generateToken(remember: boolean = false): AuthToken {
    const expiresAt = remember
      ? Date.now() + TOKEN_EXPIRY.REMEMBER
      : Date.now() + TOKEN_EXPIRY.NORMAL;

    return {
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      expiresAt,
    };
  }

  /**
   * 生成重置令牌
   */
  private generateResetToken(email: string): string {
    const token = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
    tokens[email] = {
      token,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 分钟有效期
    };
    localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));
    return token;
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
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      await this.simulateDelay();

      // 验证输入
      const usernameValidation = this.validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        return this.errorResponse('VALIDATION_ERROR', usernameValidation.error!);
      }

      if (!credentials.password) {
        return this.errorResponse('VALIDATION_ERROR', '密码不能为空');
      }

      // 加载用户列表（添加错误保护）
      let users = getInitialUsers();
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        try {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            users = parsed;
          }
        } catch (parseError) {
          console.warn('解析用户数据失败，使用默认 Mock 数据:', parseError);
          users = getInitialUsers();
        }
      }

      // 查找用户
      const user = users.find(
        (u: { username: string; password: string }) =>
          u.username === credentials.username && u.password === credentials.password
      );

      if (!user) {
        return this.errorResponse('INVALID_CREDENTIALS', '用户名或密码错误');
      }

      // 生成 token
      const token = this.generateToken(credentials.remember);

      // 构建响应
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      };

      // 保存状态
      this.saveCurrentUser(authResponse.user);
      this.saveAuthToken(token);

      return this.successResponse(authResponse);
    } catch (error) {
      return this.errorResponse('LOGIN_ERROR', '登录失败', error);
    }
  }

  /**
   * 注册
   */
  async register(credentials: RegisterCredentials): Promise<AuthServiceResponse<AuthResponse>> {
    try {
      await this.simulateDelay();

      // 验证用户名
      const usernameValidation = this.validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        return this.errorResponse('VALIDATION_ERROR', usernameValidation.error!);
      }

      // 验证邮箱
      const emailValidation = this.validateEmail(credentials.email);
      if (!emailValidation.isValid) {
        return this.errorResponse('VALIDATION_ERROR', emailValidation.error!);
      }

      // 验证密码
      const passwordValidation = this.validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        return this.errorResponse(
          'VALIDATION_ERROR',
          `密码强度不足：${passwordValidation.errors.join('，')}`
        );
      }

      // 加载用户列表（添加错误保护）
      let users = getInitialUsers();
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        try {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            users = parsed;
          }
        } catch (parseError) {
          console.warn('解析用户数据失败，使用默认 Mock 数据:', parseError);
          // 数据损坏，使用默认数据
          users = getInitialUsers();
        }
      }

      // 检查用户名是否已存在
      const usernameExists = users.some(
        (u: { username: string }) =>
          u.username.toLowerCase() === credentials.username.toLowerCase()
      );
      if (usernameExists) {
        return this.errorResponse('USERNAME_EXISTS', '用户名已存在');
      }

      // 检查邮箱是否已存在
      const emailExists = users.some(
        (u: { email: string }) => u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      if (emailExists) {
        return this.errorResponse('EMAIL_EXISTS', '邮箱已被注册');
      }

      // 生成新用户 ID（安全的方式）
      let newId = 1;
      if (users.length > 0) {
        try {
          const maxId = users.reduce((max: number, u: { id: number }) => {
            const id = typeof u.id === 'number' ? u.id : 0;
            return id > max ? id : max;
          }, 0);
          newId = maxId + 1;
        } catch (error) {
          console.warn('生成用户 ID 失败，使用默认 ID:', error);
          newId = 1;
        }
      }

      // 创建新用户
      const newUser = {
        id: newId,
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        avatar: undefined,
        bio: credentials.bio,
        role: 'user' as const,
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // 生成 token
      const token = this.generateToken(true); // 注册后自动登录，默认记住

      // 构建响应
      const authResponse: AuthResponse = {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          role: newUser.role,
        },
        token,
      };

      // 保存状态
      this.saveCurrentUser(authResponse.user);
      this.saveAuthToken(token);

      return this.successResponse(authResponse);
    } catch (error) {
      return this.errorResponse('REGISTER_ERROR', '注册失败', error);
    }
  }

  /**
   * 登出
   */
  logout(): void {
    this.currentUser = null;
    this.authToken = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

    // 触发全局登出事件 to ensure UserService and other services clear their state
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    email: string
  ): Promise<AuthServiceResponse<{ resetToken: string }>> {
    try {
      await this.simulateDelay();

      // 验证邮箱
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return this.errorResponse('VALIDATION_ERROR', emailValidation.error!);
      }

      // 加载用户列表（添加错误保护）
      let users = getInitialUsers();
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        try {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            users = parsed;
          }
        } catch (parseError) {
          console.warn('解析用户数据失败，使用默认 Mock 数据:', parseError);
          users = getInitialUsers();
        }
      }

      // 检查邮箱是否存在
      const user = users.find((u: { email: string }) => u.email === email);
      if (!user) {
        // 为了安全，不暴露邮箱是否存在
        return this.successResponse({ resetToken: 'mock_token_sent' });
      }

      // 生成重置令牌
      const resetToken = this.generateResetToken(email);

      // Mock: 实际应该发送邮件
      console.warn(`[Mock] 密码重置邮件已发送至：${email}`);
      console.warn(`[Mock] 重置令牌：${resetToken}`);

      return this.successResponse({ resetToken });
    } catch (error) {
      return this.errorResponse('SEND_RESET_ERROR', '发送重置邮件失败', error);
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(
    credentials: ResetPasswordCredentials
  ): Promise<AuthServiceResponse<{ success: boolean }>> {
    try {
      await this.simulateDelay();

      // 验证新密码
      const passwordValidation = this.validatePassword(credentials.newPassword);
      if (!passwordValidation.isValid) {
        return this.errorResponse(
          'VALIDATION_ERROR',
          `密码强度不足：${passwordValidation.errors.join('，')}`
        );
      }

      // 验证重置令牌
      let tokens: Record<string, { token: string; expiresAt: number }> = {};
      try {
        tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
      } catch (parseError) {
        console.warn('解析重置令牌失败:', parseError);
        tokens = {};
      }
      const email = Object.keys(tokens).find((e) => tokens[e].token === credentials.token);

      if (!email || tokens[email].expiresAt < Date.now()) {
        return this.errorResponse('INVALID_TOKEN', '重置令牌无效或已过期');
      }

      // 加载用户列表（添加错误保护）
      let users = getInitialUsers();
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        try {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            users = parsed;
          }
        } catch (parseError) {
          console.warn('解析用户数据失败，使用默认 Mock 数据:', parseError);
          users = getInitialUsers();
        }
      }

      // 找到用户并更新密码
      const userIndex = users.findIndex((u: { email: string }) => u.email === email);
      if (userIndex === -1) {
        return this.errorResponse('USER_NOT_FOUND', '用户不存在');
      }

      users[userIndex].password = credentials.newPassword;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // 清除已使用的令牌
      delete tokens[email];
      localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));

      return this.successResponse({ success: true });
    } catch (error) {
      return this.errorResponse('RESET_ERROR', '重置密码失败', error);
    }
  }

  /**
   * 验证 Token 是否有效
   */
  verifyToken(): boolean {
    if (!this.authToken) return false;
    return this.authToken.expiresAt > Date.now();
  }

  /**
   * 刷新 Token
   */
  async refreshToken(remember?: boolean): Promise<AuthServiceResponse<AuthToken>> {
    try {
      if (!this.currentUser) {
        return this.errorResponse('NOT_AUTHENTICATED', '未登录');
      }

      const token = this.generateToken(remember ?? !!this.authToken?.refreshToken);
      this.saveAuthToken(token);

      return this.successResponse(token);
    } catch (error) {
      return this.errorResponse('REFRESH_ERROR', '刷新令牌失败', error);
    }
  }
}

/**
 * 导出单例
 */
export const authService = new AuthService();
