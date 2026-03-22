/**
 * useAuth - 认证状态管理 Hook
 *
 * 提供用户认证状态、登录、登出等功能的统一接口
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  CurrentUser,
  AuthState,
} from '@/services/auth.types';

/**
 * useAuth Hook 返回值
 */
interface UseAuthReturn {
  // 状态
  /** 当前用户 */
  user: CurrentUser | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;

  // 方法
  /** 登录 */
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  /** 注册 */
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message?: string }>;
  /** 登出 */
  logout: () => void;
  /** 发送重置密码邮件 */
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  /** 重置密码 */
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<{ success: boolean; message?: string }>;
  /** 清除错误 */
  clearError: () => void;
  /** 重新加载用户 */
  reloadUser: () => void;
}

/**
 * useAuth Hook
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * // 登录
 * await login({ username: 'test', password: '123456' });
 *
 * // 登出
 * logout();
 * ```
 */
export function useAuth(): UseAuthReturn {
  // 状态
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * 初始化时加载用户
   */
  useEffect(() => {
    // 初始加载
    const user = authService.getCurrentUser();
    setState({
      user,
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      error: null,
    });

    // 监听存储变化（多标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'techink_current_user' || e.key === 'techink_auth_token') {
        const currentUser = authService.getCurrentUser();
        setState((prev) => ({
          ...prev,
          user: currentUser,
          isAuthenticated: authService.isAuthenticated(),
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * 登录
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const loginResponse = await authService.login(credentials);
        if (loginResponse.success && loginResponse.data) {
          setState({
            user: loginResponse.data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true, message: '登录成功' };
        } else {
          const errorMessage = loginResponse.error?.message || '登录失败';
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          return { success: false, message: errorMessage };
        }
      } catch (error: any) {
        const errorMessage = error.message || '登录失败';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * 注册
   */
  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<{ success: boolean; message?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.register(credentials);

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, message: '注册成功' };
      } else {
        const errorMessage = response.error?.message || '注册失败';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * 登出
   */
  const logout = useCallback(() => {
    authService.logout(); // This will now trigger the complete logout sequence through the service
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * 发送重置密码邮件
   */
  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.sendPasswordResetEmail(email);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, message: '重置邮件已发送，请检查邮箱' };
      } else {
        const errorMessage = response.error?.message || '发送失败';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * 重置密码
   */
  const resetPassword = useCallback(
    async (
      credentials: ResetPasswordCredentials
    ): Promise<{ success: boolean; message?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.resetPassword(credentials);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, message: '密码重置成功' };
      } else {
        const errorMessage = response.error?.message || '重置失败';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * 重新加载用户
   */
  const reloadUser = useCallback(() => {
    const user = authService.getCurrentUser();
    setState({
      user,
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    // 状态
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // 方法
    login,
    register,
    logout,
    sendPasswordReset,
    resetPassword,
    clearError,
    reloadUser,
  };
}

/**
 * 获取当前用户（同步版本，用于非组件场景）
 */
export const getCurrentUser = (): CurrentUser | null => {
  return authService.getCurrentUser();
};

/**
 * 检查是否已登录（同步版本，用于非组件场景）
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

export default useAuth;
