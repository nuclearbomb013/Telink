/**
 * useAuth - 认证状态管理 Hook
 *
 * 提供用户认证状态、登录、登出等功能的统一接口
 * 注意：此 hook 是 AuthContext 的便捷封装，确保全局状态一致性
 */

import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  CurrentUser,
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
 * 统一使用 AuthContext 作为唯一状态来源
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
  // 从 AuthContext 获取状态，确保全局一致
  const { currentUser, isAuthenticated, login: contextLogin, logout: contextLogout, refreshAuthStatus } = useAuthContext();

  /**
   * 登录 - 使用 AuthContext 的登录方法
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
      try {
        await contextLogin(credentials);
        return { success: true, message: '登录成功' };
      } catch (error: any) {
        const errorMessage = error.message || '登录失败';
        return { success: false, message: errorMessage };
      }
    },
    [contextLogin]
  );

  /**
   * 注册
   */
  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await authService.register(credentials);
        if (response.success && response.data) {
          // 注册成功后自动登录
          await contextLogin({
            username: credentials.username,
            password: credentials.password,
          });
          return { success: true, message: '注册成功' };
        } else {
          const errorMessage = response.error?.message || '注册失败';
          return { success: false, message: errorMessage };
        }
      } catch (error: any) {
        const errorMessage = error.message || '注册失败';
        return { success: false, message: errorMessage };
      }
    },
    [contextLogin]
  );

  /**
   * 登出 - 使用 AuthContext 的登出方法
   */
  const logout = useCallback(() => {
    contextLogout();
  }, [contextLogout]);

  /**
   * 发送重置密码邮件
   */
  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string }> => {
      const response = await authService.sendPasswordResetEmail(email);
      if (response.success) {
        return { success: true, message: '重置邮件已发送，请检查邮箱' };
      } else {
        const errorMessage = response.error?.message || '发送失败';
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
      const response = await authService.resetPassword(credentials);
      if (response.success) {
        return { success: true, message: '密码重置成功' };
      } else {
        const errorMessage = response.error?.message || '重置失败';
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * 清除错误 - 暂时返回空实现，因为 AuthContext 没有错误状态
   */
  const clearError = useCallback(() => {
    // AuthContext 目前没有暴露错误状态
  }, []);

  /**
   * 重新加载用户
   */
  const reloadUser = useCallback(() => {
    refreshAuthStatus();
  }, [refreshAuthStatus]);

  return {
    // 状态
    user: currentUser,
    isAuthenticated,
    isLoading: false, // AuthContext 已经处理了加载状态
    error: null, // AuthContext 目前没有暴露错误状态

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
