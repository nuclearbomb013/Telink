/**
 * VoteButton - 点赞/投票按钮组件
 *
 * 用于帖子和评论的点赞功能
 */

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoteButtonProps {
  /** 当前点赞数 */
  votes: number;
  /** 当前用户是否已点赞 */
  hasVoted?: boolean;
  /** 是否已禁用（如帖子被锁定） */
  disabled?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 样式变体 */
  variant?: 'default' | 'outline';
  /** 点赞变化回调 */
  onVoteChange?: (newVoteState: boolean) => void;
  /** 自定义类名 */
  className?: string;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 尺寸映射
 */
const sizeMap = {
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
  lg: 'gap-2 text-base',
};

const iconSizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
};

/**
 * VoteButton 组件
 */
const VoteButton = ({
  votes,
  hasVoted = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  onVoteChange,
  className,
  loading = false,
}: VoteButtonProps) => {
  const [isVoted, setIsVoted] = useState(hasVoted);
  const [voteCount, setVoteCount] = useState(votes);
  const [isProcessing, setIsProcessing] = useState(false);

  // 同步 props 到内部状态
  useEffect(() => {
    setIsVoted(hasVoted);
  }, [hasVoted]);

  useEffect(() => {
    setVoteCount(votes);
  }, [votes]);

  const handleClick = async () => {
    if (disabled || isProcessing || loading) return;

    setIsProcessing(true);

    // 切换状态
    const newVotedState = !isVoted;
    setIsVoted(newVotedState);
    setVoteCount(prev => newVotedState ? prev + 1 : prev - 1);

    // 调用回调
    if (onVoteChange) {
      onVoteChange(newVotedState);
    }

    // 模拟短暂延迟
    setTimeout(() => setIsProcessing(false), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const iconSize = iconSizeMap[size];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text/50',
        disabled && 'opacity-50 cursor-not-allowed',
        variant === 'default'
          ? cn(
              'px-3 py-1.5',
              isVoted
                ? 'bg-brand-text text-white'
                : 'bg-brand-linen/50 text-brand-dark-gray hover:bg-brand-linen',
            )
          : cn(
              'px-3 py-1.5 border',
              isVoted
                ? 'border-brand-text text-brand-text'
                : 'border-brand-border text-brand-dark-gray hover:border-brand-text hover:text-brand-text',
            ),
        sizeMap[size],
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={isVoted ? '取消点赞' : '点赞'}
      aria-pressed={isVoted}
    >
      <Heart
        size={iconSize}
        className={cn(
          'shrink-0 transition-all',
          isVoted && 'fill-current scale-110'
        )}
        strokeWidth={2}
      />
      <span className={cn('font-roboto tabular-nums', isVoted && 'font-medium')}>
        {loading ? '-' : voteCount}
      </span>
    </button>
  );
};

export default VoteButton;
