/**
 * ForumPostCard - 论坛帖子卡片组件
 *
 * 展示论坛帖子的摘要信息，用于列表页
 */

import { Link } from 'react-router-dom';
import { MessageSquare, Eye, Pin, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ForumPost } from '@/services/forum.types';
import {
  FORUM_CATEGORY_LABELS,
  FORUM_CATEGORY_ICONS,
} from '@/services/forum.types';
import UserAvatar from './UserAvatar';

export interface ForumPostCardProps {
  /** 帖子数据 */
  post: ForumPost;
  /** 是否显示作者头像 */
  showAvatar?: boolean;
  /** 是否显示浏览量 */
  showViews?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < week) return `${Math.floor(diff / day)} 天前`;
  if (diff < month) return `${Math.floor(diff / week)} 周前`;

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * ForumPostCard 组件
 */
const ForumPostCard = ({
  post,
  showAvatar = true,
  showViews = true,
  className,
}: ForumPostCardProps) => {
  const categoryLabel = FORUM_CATEGORY_LABELS[post.category];
  const categoryIcon = FORUM_CATEGORY_ICONS[post.category];

  return (
    <article
      className={cn(
        'group relative bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-lg p-4',
        'transition-all duration-300 hover:shadow-lg hover:border-brand-text/20',
        'hover:-translate-y-0.5',
        className
      )}
    >
      <Link to={`/forum/${post.slug}`} className="block">
        {/* 置顶标识 */}
        {post.isPinned && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-brand-text text-white text-xs rounded-full">
            <Pin size={10} className="fill-current" />
            <span>置顶</span>
          </div>
        )}

        {/* 锁定标识 */}
        {post.isLocked && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-brand-dark-gray text-white text-xs rounded-full">
            <Lock size={10} className="fill-current" />
            <span>已锁定</span>
          </div>
        )}

        <div className={cn('flex gap-4', showAvatar ? '' : 'items-start')}>
          {/* 作者头像 */}
          {showAvatar && (
            <div className="shrink-0 pt-0.5">
              <UserAvatar
                username={post.authorName}
                avatarUrl={post.authorAvatar}
                size="md"
              />
            </div>
          )}

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            {/* 标题和分类 */}
            <div className="flex items-start gap-2 mb-2">
              {/* 分类标签 */}
              <span
                className={cn(
                  'shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-roboto rounded',
                  'bg-brand-linen/50 text-brand-dark-gray border border-brand-border/30',
                  'group-hover:border-brand-text/30 transition-colors'
                )}
              >
                <span aria-hidden="true">{categoryIcon}</span>
                <span>{categoryLabel}</span>
              </span>

              {/* 标题 */}
              <h3 className="font-oswald font-light text-lg text-brand-text leading-tight group-hover:text-brand-dark-gray transition-colors line-clamp-2">
                {post.title}
              </h3>
            </div>

            {/* 摘要 */}
            {post.excerpt && (
              <p className="font-roboto text-sm text-brand-dark-gray/70 mb-3 line-clamp-2">
                {post.excerpt}
              </p>
            )}

            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 font-roboto text-xs text-brand-dark-gray/60 bg-brand-linen/30 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 元信息 */}
            <div className="flex items-center justify-between">
              {/* 作者和时间 */}
              <div className="flex items-center gap-3">
                <span className="font-roboto text-xs text-brand-dark-gray">
                  {post.authorName}
                </span>
                <span className="font-roboto text-xs text-brand-light-gray">
                  ·
                </span>
                <span className="font-roboto text-xs text-brand-light-gray">
                  {formatTime(post.createdAt)}
                </span>
              </div>

              {/* 统计数据 */}
              <div className="flex items-center gap-4">
                {/* 回复数 */}
                <div className="flex items-center gap-1 text-brand-dark-gray/60">
                  <MessageSquare size={14} />
                  <span className="font-roboto text-xs tabular-nums">
                    {post.replyCount}
                  </span>
                </div>

                {/* 浏览量 */}
                {showViews && (
                  <div className="flex items-center gap-1 text-brand-dark-gray/60">
                    <Eye size={14} />
                    <span className="font-roboto text-xs tabular-nums">
                      {post.views}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ForumPostCard;
