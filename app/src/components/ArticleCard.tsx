import { Link } from 'react-router-dom';
import type { Article } from '@/services/articles.types';

export interface ArticleCardProps {
  article: Article;
  size?: 'small' | 'medium' | 'large';
  showExcerpt?: boolean;
  showTags?: boolean;
  showMeta?: boolean;
  hoverable?: boolean;
  className?: string;
  onClick?: (article: Article) => void;
  titleHtml?: string;
  subtitleHtml?: string;
  excerptHtml?: string;
  contextLabel?: string | null;
}

const ArticleCard = ({
  article,
  size = 'medium',
  showExcerpt = true,
  showTags = true,
  showMeta = true,
  hoverable = true,
  className = '',
  onClick,
  titleHtml,
  subtitleHtml,
  excerptHtml,
  contextLabel,
}: ArticleCardProps) => {
  const displayExcerpt = showExcerpt && (article.excerpt || excerptHtml);
  const displayTags = showTags && article.tags && article.tags.length > 0;
  const displayMeta = showMeta && (article.author || article.publishDate || article.readTime);

  const sizeClasses = {
    small: {
      container: 'aspect-[3/4]',
      title: 'text-lg',
      excerpt: 'text-sm line-clamp-2',
    },
    medium: {
      container: 'aspect-[4/3]',
      title: 'text-xl lg:text-2xl',
      excerpt: 'text-sm line-clamp-3',
    },
    large: {
      container: 'aspect-[16/9]',
      title: 'text-2xl lg:text-3xl',
      excerpt: 'text-base line-clamp-4',
    },
  };

  const currentSize = sizeClasses[size];

  const handleClick = (event: React.MouseEvent) => {
    if (!onClick) return;
    event.preventDefault();
    onClick(article);
  };

  const cardContent = (
    <div
      className={`group relative overflow-hidden rounded-[26px] border border-[var(--reader-line,#CFCEC4)] bg-[rgba(255,255,255,0.82)] shadow-[0_12px_32px_rgb(36_39_34_/_0.06)] backdrop-blur-sm transition-all duration-200
        ${hoverable ? 'hover:-translate-y-1 hover:border-[rgba(49,91,72,0.32)] hover:shadow-[0_18px_40px_rgb(36_39_34_/_0.1)]' : ''} ${className}`}
    >
      <div className={`relative overflow-hidden bg-brand-text ${currentSize.container}`}>
        {article.image && article.image.trim() !== '' ? (
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            width={400}
            height={300}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              const parent = event.currentTarget.parentElement;
              if (!parent) return;

              const placeholder = document.createElement('div');
              placeholder.className = 'flex h-full w-full items-center justify-center bg-brand-dark-gray/10';
              placeholder.innerHTML = '<span class="text-sm uppercase tracking-[0.2em] text-brand-dark-gray/30" aria-hidden="true">IMG</span>';
              parent.appendChild(placeholder);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-dark-gray/10">
            <span className="text-sm uppercase tracking-[0.2em] text-brand-dark-gray/30" aria-hidden="true">IMG</span>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span className="inline-block rounded-full border border-white/60 bg-white/85 px-3 py-1 font-roboto text-xs uppercase tracking-[0.16em] text-brand-dark-gray shadow-sm backdrop-blur-sm">
            {article.category}
          </span>
        </div>
      </div>

      <div className="p-5 lg:p-6">
        {contextLabel ? (
          <div className="mb-3 inline-flex rounded-full border border-[var(--reader-line)] bg-[rgba(247,245,238,0.88)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--reader-ink-secondary)]">
            {contextLabel}
          </div>
        ) : null}

        <h3
          className={`mb-2 font-oswald font-light leading-tight text-brand-text ${currentSize.title}`}
          dangerouslySetInnerHTML={{ __html: titleHtml || article.title }}
        />

        {article.subtitle ? (
          <p
            className="mb-3 line-clamp-2 font-roboto text-sm text-brand-dark-gray"
            dangerouslySetInnerHTML={{ __html: subtitleHtml || article.subtitle }}
          />
        ) : null}

        {displayExcerpt ? (
          <p
            className={`mb-4 font-roboto leading-7 text-brand-dark-gray/75 ${currentSize.excerpt}`}
            dangerouslySetInnerHTML={{ __html: excerptHtml || article.excerpt || '' }}
          />
        ) : null}

        {displayMeta ? (
          <div className="flex items-center justify-between gap-3 border-t border-brand-border/30 pt-4 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              {article.author ? (
                <span className="max-w-[100px] truncate font-roboto text-brand-dark-gray">{article.author}</span>
              ) : null}
              {article.publishDate ? (
                <span className="hidden font-roboto text-brand-dark-gray/70 sm:inline">{article.publishDate}</span>
              ) : null}
            </div>

            {article.readTime ? (
              <span className="whitespace-nowrap font-roboto text-brand-dark-gray/70">{article.readTime} 分钟阅读</span>
            ) : null}
          </div>
        ) : null}

        {displayTags ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags?.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="rounded-full bg-brand-linen/40 px-2.5 py-1 font-roboto text-xs text-brand-dark-gray/70"
              >
                #{tag}
              </span>
            ))}
            {article.tags && article.tags.length > 3 ? (
              <span className="px-2 py-1 font-roboto text-xs text-brand-dark-gray/70">+{article.tags.length - 3}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {hoverable ? (
        <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-brand-text/0 transition-all duration-500 group-hover:border-brand-text/10" />
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <div
        onClick={handleClick}
        className="block cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`查看文章：${article.title}`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleClick(event as unknown as React.MouseEvent<HTMLElement>);
          }
        }}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/articles/${article.slug || article.id}`} className="block" aria-label={`阅读文章：${article.title}`}>
      {cardContent}
    </Link>
  );
};

export default ArticleCard;
