/**
 * ProtectedRoute - 受保护路由组件
 *
 * 用于需要登录才能访问的页面，未登录时自动重定向到登录页
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export interface ProtectedRouteProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 未登录时重定向的页面，默认为 /login */
  redirectTo?: string;
}

/**
 * ProtectedRoute 组件
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <ForumCreatePage />
 * </ProtectedRoute>
 * ```
 */
const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 重定向到登录页，并记录来源路径
      navigate(redirectTo, {
        state: { from: location },
        replace: false,
      });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location]);

  // 加载中的时候显示加载提示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-linen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-text/30 border-t-brand-text rounded-full animate-spin mx-auto mb-4" />
          <p className="font-roboto text-sm text-brand-dark-gray/70">加载中...</p>
        </div>
      </div>
    );
  }

  // 已登录则渲染子组件
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
