/**
 * AuthRegisterPage - 用户注册页面
 *
 * 提供用户注册功能，支持用户名、邮箱、密码注册
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { PasswordStrength } from '@/services/auth.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

/**
 * 表单验证状态
 */
interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

/**
 * 密码要求检查项
 */
interface PasswordRequirement {
  label: string;
  met: boolean;
}

/**
 * AuthRegisterPage 组件
 */
const AuthRegisterPage = () => {
  const navigate = useNavigate();

  // 获取认证 Hook
  const { user, isAuthenticated, register, error, clearError } = useAuth();

  // 表单状态
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI 状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  /**
   * 如果已登录，直接跳转
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/forum', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * 计算密码强度（与服务端 validatePassword 保持一致）
   */
  useEffect(() => {
    if (!password) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPasswordStrength('weak');
      return;
    }

    const length = password.length;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const typeCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;

    // 与服务端 validatePassword 逻辑完全一致
    let strength: PasswordStrength = 'weak';

    if (length < 8) {
      strength = 'weak';
    } else if (typeCount < 2) {
      strength = 'weak';
    } else if (typeCount >= 3 && length >= 8) {
      strength = 'strong';
    } else if (length >= 12) {
      strength = 'strong';
    } else if (length >= 8) {
      strength = 'medium';
    }

    setPasswordStrength(strength);
  }, [password]);

  /**
   * 获取密码要求检查项
   */
  const getPasswordRequirements = (): PasswordRequirement[] => {
    return [
      { label: '至少 8 个字符', met: password.length >= 8 },
      { label: '包含小写字母', met: /[a-z]/.test(password) },
      { label: '包含大写字母', met: /[A-Z]/.test(password) },
      { label: '包含数字', met: /\d/.test(password) },
      { label: '包含特殊字符', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 用户名验证
    if (!username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少 3 个字符';
    } else if (username.length > 20) {
      newErrors.username = '用户名最多 20 个字符';
    } else if (!/^[\w\u4e00-\u9fa5]+$/.test(username)) {
      newErrors.username = '用户名只能包含中文、英文、数字和下划线';
    }

    // 邮箱验证
    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    // 密码验证
    if (!password) {
      newErrors.password = '密码不能为空';
    } else if (password.length < 8) {
      newErrors.password = '密码至少 8 个字符';
    } else if (passwordStrength === 'weak') {
      newErrors.password = '密码强度不足';
    }

    // 确认密码验证
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    // 条款验证
    if (!termsAccepted) {
      newErrors.terms = '请阅读并同意用户条款';
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

    const result = await register({
      username: username.trim(),
      email: email.trim(),
      password,
      bio: bio.trim() || undefined,
    });

    if (result.success) {
      // 注册成功，跳转到论坛
      navigate('/forum', { replace: true });
    }

    setIsSubmitting(false);
  };

  const passwordRequirements = getPasswordRequirements();

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

        {/* 注册卡片 */}
        <Card className="border-brand-border/30 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-text rounded-lg">
                <UserPlus size={24} className="text-white" />
              </div>
            </div>
            <CardTitle className="font-oswald text-2xl font-light text-brand-text">
              创建账号
            </CardTitle>
            <CardDescription className="font-roboto text-sm">
              加入我们，开始技术交流之旅
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 注册表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名 */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  用户名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名（3-20 字符）"
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

              {/* 邮箱 */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError?.();
                    }}
                    className={cn(
                      'pl-10 bg-white/50 border-brand-border/50',
                      errors.email && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（至少 8 位）"
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
                    autoComplete="new-password"
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

                {/* 密码强度指示器 */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-brand-border/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            passwordStrength === 'weak' && 'w-1/3 bg-red-500',
                            passwordStrength === 'medium' && 'w-2/3 bg-yellow-500',
                            passwordStrength === 'strong' && 'w-full bg-green-500'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          passwordStrength === 'weak' && 'text-red-500',
                          passwordStrength === 'medium' && 'text-yellow-500',
                          passwordStrength === 'strong' && 'text-green-500'
                        )}
                      >
                        {passwordStrength === 'weak' && '弱'}
                        {passwordStrength === 'medium' && '中'}
                        {passwordStrength === 'strong' && '强'}
                      </span>
                    </div>

                    {/* 密码要求列表 */}
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          {req.met ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <X size={12} className="text-brand-light-gray" />
                          )}
                          <span
                            className={cn(
                              req.met ? 'text-green-600' : 'text-brand-dark-gray/60'
                            )}
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                  />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError?.();
                    }}
                    className={cn(
                      'pl-10 pr-10 bg-white/50 border-brand-border/50',
                      errors.confirmPassword && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light-gray hover:text-brand-dark-gray"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 个人简介（可选） */}
              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="font-roboto text-sm font-medium text-brand-text"
                >
                  个人简介 <span className="text-brand-dark-gray/60">（可选）</span>
                </label>
                <Textarea
                  id="bio"
                  placeholder="介绍一下自己吧～（选填）"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[80px] bg-white/50 border-brand-border/50 resize-none"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              {/* 用户条款 */}
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      clearError?.();
                    }}
                    className={cn(
                      'w-4 h-4 mt-0.5 rounded border-brand-border/50 text-brand-text focus:ring-brand-text/20',
                      errors.terms && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="font-roboto text-sm text-brand-dark-gray/70">
                    我已阅读并同意{' '}
                    <Link to="/terms" className="text-brand-text hover:underline">
                      《用户条款》
                    </Link>{' '}
                    和{' '}
                    <Link to="/privacy" className="text-brand-text hover:underline">
                      《隐私政策》
                    </Link>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}
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
                    注册中...
                  </span>
                ) : (
                  '创建账号'
                )}
              </Button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="font-roboto text-sm text-brand-dark-gray/70">
                已有账号？{' '}
                <Link to="/login" className="text-brand-text hover:underline font-medium">
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthRegisterPage;
