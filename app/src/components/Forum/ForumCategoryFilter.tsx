/**
 * ForumCategoryFilter - 论坛分类筛选器组件
 *
 * 用于选择和过滤论坛帖子分类
 */

import { cn } from '@/lib/utils';
import type { ForumCategory } from '@/services/forum.types';

export interface ForumCategoryFilterProps {
  /** 当前选中的分类 */
  value?: ForumCategory | 'all';
  /** 分类变化回调 */
  onChange?: (category: ForumCategory | 'all') => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 分类选项
 */
const categories: Array<{ value: ForumCategory | 'all'; label: string; icon: string; description: string }> = [
  { value: 'all', label: '全部', icon: '📋', description: '所有分类' },
  { value: 'announce', label: '公告', icon: '📢', description: '官方公告' },
  { value: 'general', label: '综合讨论', icon: '💬', description: '技术讨论' },
  { value: 'help', label: '求助', icon: '❓', description: '求助提问' },
  { value: 'showcase', label: '作品展示', icon: '✨', description: '项目分享' },
  { value: 'jobs', label: '招聘求职', icon: '💼', description: '工作机会' },
];

/**
 * ForumCategoryFilter 组件
 */
const ForumCategoryFilter = ({
  value = 'all',
  onChange,
  className,
}: ForumCategoryFilterProps) => {
  const handleClick = (category: ForumCategory | 'all') => {
    if (onChange) {
      onChange(category);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: ForumCategory | 'all') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(category);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="论坛分类筛选"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {categories.map((category) => {
        const isActive = value === category.value;

        return (
          <button
            key={category.value}
            role="tab"
            aria-selected={isActive}
            aria-label={category.description}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-roboto',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text/50',
              isActive
                ? 'bg-brand-text text-white shadow-md'
                : 'bg-brand-linen/50 text-brand-dark-gray border border-brand-border/30 hover:border-brand-text/30 hover:bg-brand-linen',
            )}
            onClick={() => handleClick(category.value)}
            onKeyDown={(e) => handleKeyDown(e, category.value)}
          >
            <span aria-hidden="true">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ForumCategoryFilter;
