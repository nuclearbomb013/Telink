/**
 * 文章卡片组件
 *
 * 统一展示文章信息的卡片组件，支持多种尺寸和交互模式。
 * 用于文章列表、最新文章展示等场景。
 */

import { Link } from 'react-router-dom';
import type { Article } from '@/services/articles.types';

export interface ArticleCardProps {
  /** 文章数据 */
  article: Article;
  /** 卡片尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否显示摘要 */
  showExcerpt?: boolean;
  /** 是否显示标签 */
  showTags?: boolean;
  /** 是否显示元信息（作者、日期、阅读时间） */
  showMeta?: boolean;
  /** 是否启用悬停效果 */
  hoverable?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击回调 */
  onClick?: (article: Article) => void;
}

/**
 * 文章卡片组件
 */
const ArticleCard = ({
  article,
  size = 'medium',
  showExcerpt = true,
  showTags = true,
  showMeta = true,
  hoverable = true,
  className = '',
  onClick,
}: ArticleCardProps) => {
  // 根据尺寸决定显示内容
  const displayExcerpt = showExcerpt && article.excerpt;
  const displayTags = showTags && article.tags && article.tags.length > 0;
  const displayMeta = showMeta && (article.author || article.publishDate || article.readTime);

  // 尺寸相关样式
  const sizeClasses = {
    small: {
      container: 'aspect-[3/4]',
      title: 'text-lg',
      excerpt: 'text-sm line-clamp-2',
      meta: 'text-xs',
    },
    medium: {
      container: 'aspect-[4/3]',
      title: 'text-xl lg:text-2xl',
      excerpt: 'text-sm line-clamp-3',
      meta: 'text-xs',
    },
    large: {
      container: 'aspect-[16/9]',
      title: 'text-2xl lg:text-3xl',
      excerpt: 'text-base line-clamp-4',
      meta: 'text-sm',
    },
  };

  const currentSize = sizeClasses[size];

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(article);
    }
  };

  // 构建卡片内容
  const cardContent = (
    <div
      className={`group relative bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-lg overflow-hidden transition-all duration-500 ${
        hoverable ? 'hover:shadow-xl hover:-translate-y-1' : ''
      } ${className}`}
    >
      {/* 图片区域 */}
      <div className={`relative overflow-hidden bg-brand-text ${currentSize.container}`}>
        {article.image && article.image.trim() !== '' ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            width={400}
            height={300}
            onError={(e) => {
              // 图片加载失败时显示占位符
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-full flex items-center justify-center bg-brand-dark-gray/10';
                placeholder.innerHTML = '<span class="text-brand-dark-gray/30 text-4xl" aria-hidden="true">📄</span>';
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-dark-gray/10">
            <span className="text-brand-dark-gray/30 text-4xl" aria-hidden="true">📄</span>
          </div>
        )}

        {/* 分类标签 */}
        <div className="absolute top-4 left-4">
          <span className="inline-block px-3 py-1 font-roboto text-xs uppercase tracking-wider text-brand-dark-gray bg-brand-linen/90 backdrop-blur-sm rounded-full">
            {article.category}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4 lg:p-6">
        {/* 标题 */}
        <h3 className={`font-oswald font-light text-brand-text mb-2 leading-tight ${currentSize.title}`}>
          {article.title}
        </h3>

        {/* 副标题 */}
        {article.subtitle && (
          <p className="font-roboto text-sm text-brand-dark-gray mb-3">
            {article.subtitle}
          </p>
        )}

        {/* 摘要 */}
        {displayExcerpt && (
          <p className={`font-roboto text-brand-dark-gray/70 mb-4 ${currentSize.excerpt}`}>
            {article.excerpt}
          </p>
        )}

        {/* 元信息 */}
        {displayMeta && (
          <div className="flex items-center justify-between pt-4 border-t border-brand-border/30">
            <div className="flex items-center gap-3">
              {article.author && (
                <span className="font-roboto text-brand-dark-gray truncate max-w-[100px]">
                  {article.author}
                </span>
              )}
              {article.publishDate && (
                <span className="font-roboto text-brand-dark-gray/50 hidden sm:inline">
                  {article.publishDate}
                </span>
              )}
            </div>

            {article.readTime && (
              <span className="font-roboto text-brand-dark-gray/50 whitespace-nowrap">
                {article.readTime} 分钟阅读
              </span>
            )}
          </div>
        )}

        {/* 标签 */}
        {displayTags && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 font-roboto text-xs text-brand-dark-gray/70 bg-brand-linen/30 rounded"
              >
                #{tag}
              </span>
            ))}
            {article.tags && article.tags.length > 3 && (
              <span className="px-2 py-1 font-roboto text-xs text-brand-dark-gray/50">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 悬停指示器 */}
      {hoverable && (
        <div className="absolute inset-0 border-2 border-brand-text/0 group-hover:border-brand-text/20 transition-all duration-500 pointer-events-none rounded-lg" />
      )}
    </div>
  );

  // 如果有onClick回调，使用div包装，否则使用Link
  if (onClick) {
    return (
      <div
        onClick={handleClick}
        className="cursor-pointer block"
        role="button"
        tabIndex={0}
        aria-label={`查看文章：${article.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
          }
        }}
      >
        {cardContent}
      </div>
    );
  }

  // 默认使用Link导航到文章详情页
  return (
    <Link
      to={`/articles/${article.slug || article.id}`}
      className="block"
      aria-label={`阅读文章：${article.title}`}
    >
      {cardContent}
    </Link>
  );
};

export default ArticleCard;