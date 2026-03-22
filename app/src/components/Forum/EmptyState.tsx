/**
 * EmptyState - 空状态组件
 *
 * 当没有数据时显示的友好提示界面
 */

import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * EmptyState 属性
 */
interface EmptyStateProps {
  /** 图标 */
  icon?: LucideIcon;
  /** 自定义图标元素 */
  iconElement?: React.ReactNode;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /** 子内容 */
  children?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * EmptyState 组件
 */
export function EmptyState({
  icon: Icon,
  iconElement,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className || ''}`}
    >
      {/* 图标 */}
      <div className="mb-4 text-brand-light-gray">
        {iconElement || (Icon && <Icon size={48} strokeWidth={1.5} />)}
      </div>

      {/* 标题 */}
      <h3 className="font-roboto text-base font-medium text-brand-text mb-2">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="font-roboto text-sm text-brand-dark-gray/60 mb-6 max-w-md">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className={action.href ? '' : 'bg-brand-text text-white hover:bg-brand-dark-gray'}
          asChild={!!action.href}
        >
          {action.href ? <Link to={action.href}>{action.label}</Link> : action.label}
        </Button>
      )}

      {/* 子内容 */}
      {children}
    </div>
  );
}

/**
 * 帖子列表空状态
 */
export function EmptyPosts() {
  return (
    <EmptyState
      iconElement={
        <div className="w-16 h-16 rounded-full bg-brand-linen flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
      }
      title="暂无帖子"
      description="还没有帖子，快来发布第一篇帖子吧！分享你的想法、问题或作品。"
      action={{
        label: '发布帖子',
        href: '/forum/create',
        variant: 'default',
      }}
    />
  );
}

/**
 * 搜索结果空状态
 */
interface EmptySearchProps {
  query?: string;
}

export function EmptySearch({ query }: EmptySearchProps) {
  return (
    <EmptyState
      iconElement={
        <div className="w-16 h-16 rounded-full bg-brand-linen flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
      }
      title={query ? '未找到相关结果' : '输入搜索关键词'}
      description={
        query
          ? `没有找到与"${query}"相关的内容，尝试更换关键词或使用其他筛选条件。`
          : '在搜索框中输入关键词，搜索论坛中的帖子、评论等内容。'
      }
    />
  );
}

/**
 * 评论列表空状态
 */
export function EmptyComments() {
  return (
    <EmptyState
      iconElement={
        <div className="w-16 h-16 rounded-full bg-brand-linen flex items-center justify-center">
          <span className="text-3xl">💬</span>
        </div>
      }
      title="暂无评论"
      description="还没有评论，快来发表你的看法吧！"
    />
  );
}

/**
 * 通知列表空状态
 */
export function EmptyNotifications() {
  return (
    <EmptyState
      iconElement={
        <div className="w-16 h-16 rounded-full bg-brand-linen flex items-center justify-center">
          <span className="text-3xl">🔔</span>
        </div>
      }
      title="暂无通知"
      description="当你有新的通知时，会在这里显示。"
    />
  );
}

/**
 * 收藏夹空状态
 */
export function EmptyFavorites() {
  return (
    <EmptyState
      iconElement={
        <div className="w-16 h-16 rounded-full bg-brand-linen flex items-center justify-center">
          <span className="text-3xl">⭐</span>
        </div>
      }
      title="暂无收藏"
      description="收藏你感兴趣的帖子，方便日后查看。"
      action={{
        label: '浏览帖子',
        href: '/forum',
        variant: 'outline',
      }}
    />
  );
}

/**
 * 通用空状态配置
 */
export const emptyStates = {
  posts: EmptyPosts,
  search: EmptySearch,
  comments: EmptyComments,
  notifications: EmptyNotifications,
  favorites: EmptyFavorites,
};

export default EmptyState;
