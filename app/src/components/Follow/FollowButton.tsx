/**
 * FollowButton - 关注按钮组件
 *
 * 用于关注/取消关注用户，支持互关状态显示
 * 遵循水墨/E-ink风格设计
 */

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { followService } from '@/services/follow.service';

export interface FollowButtonProps {
  /** 目标用户 ID */
  targetUserId: number;
  /** 当前用户 ID（未登录时为 null） */
  currentUserId: number | null;
  /** 初始是否已关注 */
  initialIsFollowing?: boolean;
  /** 初始是否互关 */
  initialIsMutual?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 样式变体 */
  variant?: 'default' | 'outline' | 'minimal';
  /** 是否显示文字 */
  showText?: boolean;
  /** 是否显示互关状态 */
  showMutual?: boolean;
  /** 关注变化回调 */
  onFollowChange?: (isFollowing: boolean, isMutual: boolean) => void;
  /** 自定义类名 */
  className?: string;
  /** 禁用状态 */
  disabled?: boolean;
}

/**
 * 尺寸映射
 */
const sizeMap = {
  sm: {
    button: 'px-2.5 py-1 text-xs gap-1',
    icon: 14,
  },
  md: {
    button: 'px-4 py-1.5 text-sm gap-1.5',
    icon: 16,
  },
  lg: {
    button: 'px-5 py-2 text-base gap-2',
    icon: 18,
  },
};

/**
 * FollowButton 组件
 *
 * 设计规范（水墨/E-ink风格）：
 * - 未关注：黑色背景白色文字
 * - 已关注：透明背景黑色边框
 * - 互关：米色背景（brand-linen）
 */
const FollowButton = ({
  targetUserId,
  currentUserId,
  initialIsFollowing = false,
  initialIsMutual = false,
  size = 'md',
  variant = 'default',
  showText = true,
  showMutual = true,
  onFollowChange,
  className,
  disabled = false,
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isMutual, setIsMutual] = useState(initialIsMutual);
  const [isLoading, setIsLoading] = useState(false);

  // 同步 props 到内部状态
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  useEffect(() => {
    setIsMutual(initialIsMutual);
  }, [initialIsMutual]);

  /**
   * 处理点击
   */
  const handleClick = async () => {
    if (!currentUserId || isLoading || disabled) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 取消关注
        const response = await followService.unfollow(currentUserId, targetUserId);
        if (response.success) {
          setIsFollowing(false);
          setIsMutual(false);
          onFollowChange?.(false, false);
        }
      } else {
        // 关注
        const response = await followService.follow(currentUserId, targetUserId);
        if (response.success) {
          setIsFollowing(true);
          // 检查是否变成互关
          const mutual = followService.isMutualSync(currentUserId, targetUserId);
          setIsMutual(mutual);
          onFollowChange?.(true, mutual);
        }
      }
    } catch (error) {
      console.error('关注操作失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const sizeConfig = sizeMap[size];
  const isSelf = currentUserId === targetUserId;

  // 不显示自己的关注按钮
  if (isSelf) {
    return null;
  }

  // 未登录状态
  if (!currentUserId) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'inline-flex items-center justify-center rounded-sm transition-all',
          'bg-brand-text/10 text-brand-dark-gray/50 cursor-not-allowed',
          sizeConfig.button,
          className
        )}
        aria-label="登录后关注"
      >
        <UserPlus size={sizeConfig.icon} className="shrink-0" />
        {showText && <span className="font-roboto">登录后关注</span>}
      </button>
    );
  }

  // 根据状态确定样式
  const getButtonStyle = () => {
    if (isMutual && isFollowing) {
      // 互关状态 - 米色背景
      return cn(
        'bg-brand-linen text-brand-text border-2 border-brand-border/30',
        'hover:bg-brand-linen/80'
      );
    }

    if (isFollowing) {
      // 已关注 - 透明背景
      return cn(
        'bg-transparent text-brand-dark-gray border-2 border-brand-border/30',
        'hover:border-brand-text hover:text-brand-text',
        'active:bg-brand-linen/30'
      );
    }

    // 未关注 - 黑色背景
    return cn(
      'bg-brand-text text-white border-2 border-brand-text',
      'hover:bg-brand-dark-gray',
      'active:bg-brand-text/90'
    );
  };

  // 获取图标
  const getIcon = () => {
    if (isMutual && isFollowing) {
      return <UserCheck size={sizeConfig.icon} className="shrink-0" />;
    }
    if (isFollowing) {
      return <UserMinus size={sizeConfig.icon} className="shrink-0" />;
    }
    return <UserPlus size={sizeConfig.icon} className="shrink-0" />;
  };

  // 获取文字
  const getText = () => {
    if (isLoading) {
      return isFollowing ? '处理中...' : '关注中...';
    }

    if (isMutual && isFollowing && showMutual) {
      return '互相关注';
    }

    if (isFollowing) {
      return '已关注';
    }

    return '关注';
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-sm transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getButtonStyle(),
        variant === 'minimal' && 'border-0 bg-transparent',
        variant === 'outline' && !isFollowing && 'bg-transparent text-brand-text',
        sizeConfig.button,
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={isFollowing ? '取消关注' : '关注'}
      aria-pressed={isFollowing}
    >
      {getIcon()}
      {showText && (
        <span className={cn('font-roboto', isMutual && isFollowing && 'font-medium')}>
          {getText()}
        </span>
      )}
    </button>
  );
};

export default FollowButton;