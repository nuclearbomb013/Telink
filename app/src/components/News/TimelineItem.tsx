/**
 * TimelineItem - 时间线项目组件
 *
 * 单个资讯项目的时间线展示
 */

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';
import { EASING, DURATION } from '@/constants/animation.constants';

interface TimelineItemProps {
  item: {
    id: string;
    title: string;
    summary: string;
    publishDate: string;
    category: string;
    tags: string[];
    isHot: boolean;
    hotScore: number;
    views: number;
    author: string;
    imageUrl?: string;
  };
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  isActive,
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReduceMotion();

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 动态计算热度指示器大小
  const hotIndicatorSize = Math.min(8, 4 + (item.hotScore / 20)); // 4-8px

  // 鼠标悬停效果
  useEffect(() => {
    if (prefersReducedMotion || !itemRef.current) return;

    const el = itemRef.current;

    if (isHovered) {
      gsap.to(el, {
        scale: 1.02,
        duration: DURATION.fast,
        ease: EASING.smooth,
      });
    } else {
      gsap.to(el, {
        scale: 1,
        duration: DURATION.fast,
        ease: EASING.smooth,
      });
    }
  }, [isHovered, prefersReducedMotion]);

  return (
    <div
      ref={itemRef}
      className={cn(
        "group relative p-6 bg-brand-linen border border-brand-border/30 rounded-lg cursor-pointer transition-all duration-300",
        "hover:border-brand-text/50 hover:bg-white/50",
        "transform-gpu will-change-transform",
        isActive && "ring-2 ring-brand-text/30 border-brand-text bg-white",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`资讯：${item.title}`}
      role="listitem"
    >
      {/* 热点指示器 */}
      {item.isHot && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          <div
            className="relative w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
            style={{ width: `${hotIndicatorSize}px`, height: `${hotIndicatorSize}px` }}
            aria-label={`热点资讯，热度评分：${item.hotScore}`}
          >
            <span
              className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75"
              style={{ animationDuration: '2s' }}
            />
            <span className="relative text-xs font-bold text-white">热</span>
          </div>
        </div>
      )}

      {/* 时间轴连接线 */}
      <div className="absolute -left-6 top-0 bottom-0 flex items-center">
        <div className={cn(
          "w-px h-full mx-auto",
          item.isHot
            ? "bg-gradient-to-b from-red-400 to-red-200"
            : "bg-gradient-to-b from-brand-text/30 to-transparent"
        )} />
      </div>

      <div className="ml-2 space-y-3">
        {/* 标题和元信息 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <h3 className={cn(
            "font-oswald font-light text-lg text-brand-text group-hover:text-brand-dark-gray transition-colors",
            item.isHot && "text-red-700"
          )}>
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-brand-dark-gray/70 whitespace-nowrap">
            <span>{formatDate(item.publishDate)}</span>
            <span>•</span>
            <span>{item.author}</span>
            {item.views > 0 && (
              <>
                <span>•</span>
                <span>{item.views.toLocaleString()} 次浏览</span>
              </>
            )}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs bg-brand-border/30 text-brand-dark-gray rounded">
            {item.category}
          </span>
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-brand-text/10 text-brand-text rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 摘要 */}
        <p className="text-sm text-brand-dark-gray/80 leading-relaxed">
          {item.summary}
        </p>

        {/* 活动指示器 */}
        {isActive && (
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-text rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default TimelineItem;