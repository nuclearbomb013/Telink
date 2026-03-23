/**
 * AuthLoginPage - 用户登录页面
 *
 * 提供用户登录功能，支持用户名密码登录、记住登录状态
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 表单验证状态
 */
interface FormErrors {
  username?: string;
  password?: string;
}

/**
 * AuthLoginPage 组件
 */
const AuthLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 获取认证 Hook
  const { user, isAuthenticated, login, error, clearError } = useAuth();

  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // 从 URL 获取登录后的跳转路径
  const from = (location.state as { from?: Location })?.from?.pathname || '/forum';

  /**
   * 如果已登录，直接跳转
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少 3 个字符';
    }

    if (!password) {
      newErrors.password = '密码不能为空';
    } else if (password.length < 1) {
      newErrors.password = '密码不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError?.();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const result = await login({
      username: username.trim(),
      password,
      remember,
    });

    if (result.success) {
      navigate(from, { replace: true });
    }

    setIsSubmitting(false);
  };

  /**
   * 填充测试账号
   * 注意：密码需满足后端要求：至少8字符，至少2种字符类型
   */
  const fillTestAccount = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setUsername('管理员');
      setPassword('Admin123');  // 8字符，包含大写字母和数字
    } else {
      setUsername('React爱好者');  // 移除空格，符合后端用户名规则
      setPassword('User1234');  // 8字符，包含大写字母和数字
    }
    setErrors({});
    clearError?.();
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-linen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-oswald text-brand-text mb-4">正在跳转...</div>
          <Link to="/forum" className="text-brand-dark-gray hover:text-brand-text underline">
            返回论坛
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回论坛</span>
        </Link>

        {/* 登录卡片 */}
        <Card className="border-brand-border/30 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-text rounded-lg">
                <LogIn size={24} className="text-white" />
              </div>
            </div>
            <CardTitle className="font-oswald text-2xl font-light text-brand-text">
              登录 TechInk
            </CardTitle>
            <CardDescription className="font-roboto text-sm">
              欢迎回来！请登录您的账号
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 测试账号提示 */}
            <div className="mb-4 p-3 bg-brand-linen/50 rounded-lg border border-brand-border/30">
              <p className="text-xs text-brand-dark-gray/60 mb-2">测试账号：</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillTestAccount('admin')}
                  className="px-2 py-1 bg-white border border-brand-border/30 rounded text-xs hover:border-brand-text/50 transition-colors"
                >
                  管理员
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('user')}
                  className="px-2 py-1 bg-white border border-brand-border/30 rounded text-xs hover:border-brand-text/50 transition-colors"
                >
                  普通用户
                </button>
              </div>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名 */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  用户名
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearError?.();
                    }}
                    className={cn(
                      'pl-10 bg-white/50 border-brand-border/50',
                      errors.username && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-500">{errors.username}</p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  密码
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError?.();
                    }}
                    className={cn(
                      'pl-10 pr-10 bg-white/50 border-brand-border/50',
                      errors.password && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light-gray hover:text-brand-dark-gray"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border/50 text-brand-text focus:ring-brand-text/20"
                    disabled={isSubmitting}
                  />
                  <span className="font-roboto text-sm text-brand-dark-gray/70">
                    记住我
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-roboto text-sm text-brand-text hover:underline"
                >
                  忘记密码？
                </Link>
              </div>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full bg-brand-text text-white hover:bg-brand-dark-gray transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center">
              <p className="font-roboto text-sm text-brand-dark-gray/70">
                还没有账号？{' '}
                <Link
                  to="/register"
                  className="text-brand-text hover:underline font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <p className="mt-6 text-center font-roboto text-xs text-brand-dark-gray/50">
          登录即表示您同意我们的{' '}
          <Link to="/terms" className="hover:underline">
            服务条款
          </Link>{' '}
          和{' '}
          <Link to="/privacy" className="hover:underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthLoginPage;
