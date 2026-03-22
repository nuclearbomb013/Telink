/**
 * TimelineSidebar - 时间线侧边栏组件
 *
 * 显示热点资讯和分类过滤器
 */

import React from 'react';
import { TrendingUp, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineSidebarProps {
  hotNews: Array<{
    id: string;
    title: string;
    hotScore: number;
    publishDate: string;
  }>;
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  className?: string;
}

const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  hotNews,
  categories,
  selectedCategories,
  onCategoryToggle,
  className = ''
}) => {
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* 热点资讯 */}
      <div className="bg-white/70 backdrop-blur-sm border border-brand-border/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <h3 className="font-oswald font-light text-brand-text">热点资讯</h3>
        </div>

        <div className="space-y-3">
          {hotNews.slice(0, 5).map((news, index) => (
            <div
              key={news.id}
              className="p-3 bg-brand-linen/50 border border-brand-border/20 rounded hover:border-brand-text/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-roboto text-sm text-brand-text truncate">
                    {news.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-600 font-medium">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-brand-dark-gray/60">
                      {formatDate(news.publishDate)}
                    </span>
                  </div>
                </div>
                <div className="ml-2 text-right">
                  <div className="text-xs font-medium text-red-600">
                    {news.hotScore}
                  </div>
                  <div className="text-xs text-brand-dark-gray/50">热度</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分类过滤 */}
      <div className="bg-white/70 backdrop-blur-sm border border-brand-border/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-brand-text" />
          <h3 className="font-oswald font-light text-brand-text">分类</h3>
        </div>

        <div className="space-y-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryToggle(category)}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                selectedCategories.includes(category)
                  ? "bg-brand-text text-white"
                  : "bg-brand-linen/50 text-brand-text hover:bg-brand-border/20"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 时间过滤 */}
      <div className="bg-white/70 backdrop-blur-sm border border-brand-border/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-brand-text" />
          <h3 className="font-oswald font-light text-brand-text">时间</h3>
        </div>

        <div className="space-y-2">
          {['今日', '本周', '本月', '全部'].map(time => (
            <button
              key={time}
              className="w-full text-left px-3 py-2 rounded text-sm bg-brand-linen/50 text-brand-text hover:bg-brand-border/20 transition-colors"
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineSidebar;