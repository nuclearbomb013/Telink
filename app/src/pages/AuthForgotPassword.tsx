/**
 * AuthForgotPassword - 忘记密码页面
 *
 * 提供密码重置功能，包括发送邮件和重置密码两个步骤
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 重置步骤
 */
type ResetStep = 'email' | 'verify' | 'success';

/**
 * 表单验证状态
 */
interface FormErrors {
  email?: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * AuthForgotPassword 组件
 */
const AuthForgotPassword = () => {
  // 获取认证 Hook
  const { sendPasswordReset, resetPassword, error, clearError } = useAuth();

  // 当前步骤
  const [step, setStep] = useState<ResetStep>('email');

  // 表单状态
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI 状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mockResetToken, setMockResetToken] = useState<string | null>(null);

  /**
   * 验证邮箱
   */
  const validateEmail = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 验证重置令牌和新密码
   */
  const validateReset = (): boolean => {
    const newErrors: FormErrors = {};

    if (!token.trim()) {
      newErrors.token = '请输入重置令牌';
    }

    if (!newPassword) {
      newErrors.newPassword = '新密码不能为空';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = '新密码至少 8 个字符';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 步骤 1: 发送重置邮件
   */
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError?.();

    if (!validateEmail()) return;

    setIsSubmitting(true);

    const result = await sendPasswordReset(email.trim());

    if (result.success) {
      // Mock: 显示重置令牌（实际应该通过邮件发送）
      const mockToken = `reset_${Date.now().toString().slice(-6)}`;
      setMockResetToken(mockToken);
      setStep('verify');
    }

    setIsSubmitting(false);
  };

  /**
   * 步骤 2: 重置密码
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError?.();

    if (!validateReset()) return;

    setIsSubmitting(true);

    const result = await resetPassword({
      token: token.trim(),
      newPassword,
    });

    if (result.success) {
      setStep('success');
    }

    setIsSubmitting(false);
  };

  /**
   * 填充 Mock Token
   */
  const fillMockToken = () => {
    if (mockResetToken) {
      setToken(mockResetToken);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回登录</span>
        </Link>

        {/* 卡片 */}
        <Card className="border-brand-border/30 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-text rounded-lg">
                {step === 'email' && <Mail size={24} className="text-white" />}
                {step === 'verify' && <KeyRound size={24} className="text-white" />}
                {step === 'success' && <CheckCircle size={24} className="text-white" />}
              </div>
            </div>
            <CardTitle className="font-oswald text-2xl font-light text-brand-text">
              {step === 'email' && '忘记密码'}
              {step === 'verify' && '重置密码'}
              {step === 'success' && '重置成功'}
            </CardTitle>
            <CardDescription className="font-roboto text-sm">
              {step === 'email' && '请输入您的邮箱地址，我们将发送重置链接'}
              {step === 'verify' && '请输入重置令牌和新密码'}
              {step === 'success' && '密码已成功重置，现在可以登录了'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 步骤 1: 输入邮箱 */}
            {step === 'email' && (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="font-roboto text-sm font-medium text-brand-text"
                  >
                    邮箱地址
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入注册时的邮箱"
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
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-text text-white hover:bg-brand-dark-gray transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      发送中...
                    </span>
                  ) : (
                    '发送重置邮件'
                  )}
                </Button>
              </form>
            )}

            {/* 步骤 2: 输入令牌和新密码 */}
            {step === 'verify' && (
              <>
                {/* Mock Token 提示 */}
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 mb-2">
                    📧 Mock 模式：重置令牌已生成
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-white rounded text-sm font-mono">
                      {mockResetToken}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillMockToken}
                      className="text-xs"
                    >
                      填充
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* 重置令牌 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="token"
                      className="font-roboto text-sm font-medium text-brand-text"
                    >
                      重置令牌
                    </label>
                    <div className="relative">
                      <KeyRound
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                      />
                      <Input
                        id="token"
                        type="text"
                        placeholder="请输入邮件中的重置令牌"
                        value={token}
                        onChange={(e) => {
                          setToken(e.target.value);
                          clearError?.();
                        }}
                        className={cn(
                          'pl-10 bg-white/50 border-brand-border/50',
                          errors.token && 'border-red-500'
                        )}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.token && (
                      <p className="text-xs text-red-500">{errors.token}</p>
                    )}
                  </div>

                  {/* 新密码 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="newPassword"
                      className="font-roboto text-sm font-medium text-brand-text"
                    >
                      新密码
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                      />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入新密码（至少 8 位）"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          clearError?.();
                        }}
                        className={cn(
                          'pl-10 pr-10 bg-white/50 border-brand-border/50',
                          errors.newPassword && 'border-red-500'
                        )}
                        disabled={isSubmitting}
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
                    {errors.newPassword && (
                      <p className="text-xs text-red-500">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* 确认新密码 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="font-roboto text-sm font-medium text-brand-text"
                    >
                      确认新密码
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                      />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="请再次输入新密码"
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

                  <Button
                    type="submit"
                    className="w-full bg-brand-text text-white hover:bg-brand-dark-gray transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        重置中...
                      </span>
                    ) : (
                      '重置密码'
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* 步骤 3: 成功 */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-oswald text-lg font-light text-brand-text mb-2">
                  密码重置成功
                </h3>
                <p className="font-roboto text-sm text-brand-dark-gray/70 mb-6">
                  现在您可以使用新密码登录了
                </p>
                <Link to="/login">
                  <Button className="bg-brand-text text-white hover:bg-brand-dark-gray">
                    前往登录
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForgotPassword;
