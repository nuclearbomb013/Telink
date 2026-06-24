import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  FileText,
  Sparkles,
  ArrowRight,
  PenLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { latestArticlesConfig } from '@/config/articles.config';
import { getSubmittedArticles } from '@/services/submission.service';
import type { Article } from '@/services/articles.types';
import ArticleCard from '@/components/ArticleCard';
import {
  buildArticleDiscoveryStats,
  buildArticleSearchPresentation,
  discoverArticles,
  isReportArticle,
  type ArticleSortMode,
  type ArticleViewMode,
} from '@/lib/articleDiscovery';
import { cn } from '@/lib/utils';

const FILTER_SHARD_COLUMNS = 6;
const FILTER_SHARD_ROWS = 4;
const FILTER_SHARDS = Array.from({ length: FILTER_SHARD_COLUMNS * FILTER_SHARD_ROWS }, (_, index) => {
  const row = Math.floor(index / FILTER_SHARD_COLUMNS);
  const col = index % FILTER_SHARD_COLUMNS;
  const diagonal = row + col;
  const maxDiagonal = FILTER_SHARD_COLUMNS + FILTER_SHARD_ROWS - 2;

  return {
    index,
    diagonal,
    reverseDiagonal: maxDiagonal - diagonal,
    flipped: (row + col) % 2 === 0,
  };
});

const SORT_OPTIONS: Array<{ value: ArticleSortMode; label: string }> = [
  { value: 'relevance', label: '相关度优先' },
  { value: 'newest', label: '最新发布' },
  { value: 'oldest', label: '最早发布' },
  { value: 'readTime', label: '长文优先' },
  { value: 'title', label: '标题排序' },
];

const MODE_OPTIONS: Array<{ value: ArticleViewMode; label: string; description: string }> = [
  { value: 'all', label: '全部内容', description: '文章和报告一起看' },
  { value: 'report', label: '只看报告', description: '优先筛出研究、白皮书和趋势洞察' },
  { value: 'article', label: '只看文章', description: '保留教程、实战和经验总结' },
];

function ResultGrid({
  title,
  description,
  articles,
  query,
}: {
  title: string;
  description?: string;
  articles: Article[];
  query: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-oswald text-2xl font-light text-[var(--reader-ink)]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[var(--reader-ink-secondary)]">{description}</p> : null}
        </div>
        <div className="rounded-full border border-[var(--reader-line)] bg-white/70 px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
          {articles.length} 篇
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map(article => {
          const presentation = buildArticleSearchPresentation(article, query);
          return (
            <div key={`${article.id}-${article.slug}`}>
              <div className="mb-3 flex flex-wrap gap-2">
                {isReportArticle(article) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                    <FileText size={12} />
                    报告型内容
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                    <Sparkles size={12} />
                    文章
                  </span>
                )}
              </div>

              <ArticleCard
                article={article}
                size="medium"
                titleHtml={presentation.titleHtml}
                subtitleHtml={presentation.subtitleHtml}
                excerptHtml={presentation.excerptHtml}
                contextLabel={query ? presentation.matchLabel : null}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

const ArticlesListPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [mode, setMode] = useState<ArticleViewMode>('all');
  const [sort, setSort] = useState<ArticleSortMode>('newest');
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadArticles = async () => {
      setIsLoading(true);

      const presetArticles: Article[] = latestArticlesConfig.articles.map(article => ({
        ...article,
        readTime: article.readTime || 5,
      }));

      const submittedArticles = await getSubmittedArticles();
      if (cancelled) return;

      setAllArticles([...submittedArticles, ...presetArticles]);
      setIsLoading(false);
    };

    loadArticles();
    const handleStorageChange = () => loadArticles();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const stats = useMemo(() => buildArticleDiscoveryStats(allArticles), [allArticles]);

  const filteredArticles = useMemo(() => discoverArticles(allArticles, {
    query,
    category,
    tag,
    mode,
    sort,
  }), [allArticles, category, mode, query, sort, tag]);

  const featuredReport = useMemo(
    () => filteredArticles.find(article => isReportArticle(article)),
    [filteredArticles],
  );

  const groupedResults = useMemo(() => {
    if (!query.trim() || mode !== 'all') {
      return {
        reportResults: filteredArticles,
        articleResults: [] as Article[],
      };
    }

    return {
      reportResults: filteredArticles.filter(article => isReportArticle(article)),
      articleResults: filteredArticles.filter(article => !isReportArticle(article)),
    };
  }, [filteredArticles, mode, query]);

  const topCategories = stats.categories.slice(0, 6);
  const topTags = stats.tags.slice(0, 8);
  const activeFilterCount = [category, tag, mode !== 'all' ? mode : ''].filter(Boolean).length;
  const shouldGroupSearchResults = query.trim().length > 0 && mode === 'all';
  const shouldShowFeaturedReport = !isLoading && !query.trim() && activeFilterCount === 0 && mode !== 'article' && Boolean(featuredReport);

  const applyMode = (next: ArticleViewMode) => { setMode(next); setShowFilters(true); };
  const applyCategory = (next: string) => { setCategory(next); setShowFilters(true); };
  const applyTag = (next: string) => { setTag(next); setShowFilters(true); };

  const clearAllFilters = () => {
    setQuery('');
    setCategory('');
    setTag('');
    setMode('all');
    setSort('newest');
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-brand-linen pb-20 pt-28">
      <div className="mx-auto max-w-[1480px] px-5 lg:px-10">
        <header className="mb-8 lg:mb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[var(--reader-ink-secondary)]">
                Article Library
              </p>
              <h1 className="mb-4 font-oswald text-4xl font-light text-brand-text lg:text-5xl">
                文章与报告
              </h1>
              <p className="max-w-3xl text-base leading-8 text-brand-dark-gray lg:text-lg">
                先把要读的内容找准，再决定深入哪一篇。默认只露出搜索和排序，筛选项按一下再展开。
              </p>
              <Link
                to="/submit-article"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-text px-5 py-3 text-sm text-white no-underline shadow-[0_12px_26px_rgba(36,39,34,0.18)] transition hover:bg-brand-dark-gray"
              >
                <PenLine size={16} />
                投稿文章
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-[var(--reader-line)] bg-white/80 p-4 shadow-[0_10px_30px_rgba(36,39,34,0.05)] backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">总内容</div>
                <div className="mt-2 text-3xl font-oswald font-light text-[var(--reader-ink)]">{stats.total}</div>
              </div>
              <div className="rounded-3xl border border-[var(--reader-line)] bg-white/80 p-4 shadow-[0_10px_30px_rgba(36,39,34,0.05)] backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">报告</div>
                <div className="mt-2 text-3xl font-oswald font-light text-[var(--reader-ink)]">{stats.reportCount}</div>
              </div>
              <div className="rounded-3xl border border-[var(--reader-line)] bg-white/80 p-4 shadow-[0_10px_30px_rgba(36,39,34,0.05)] backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">分类</div>
                <div className="mt-2 text-3xl font-oswald font-light text-[var(--reader-ink)]">{stats.categories.length}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-[32px] border border-[var(--reader-line)] bg-white/75 p-4 shadow-[0_16px_50px_rgba(36,39,34,0.06)] backdrop-blur-sm lg:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--reader-ink-secondary)]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要、标签、作者或正文关键词"
                className="w-full rounded-2xl border border-[var(--reader-line)] bg-[rgba(255,255,255,0.88)] py-4 pl-12 pr-12 text-[var(--reader-ink)] outline-none transition focus:border-[var(--reader-green)] focus:bg-white"
                aria-label="搜索文章和报告"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--reader-ink-secondary)] transition hover:text-[var(--reader-ink)]"
                  aria-label="清空搜索"
                >
                  <X size={18} />
                </button>
              ) : null}
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(current => !current)}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm transition',
                  showFilters || activeFilterCount
                    ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_12px_24px_rgba(36,39,34,0.18)]'
                    : 'border-[var(--reader-line)] bg-[rgba(255,255,255,0.82)] text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                )}
                aria-expanded={showFilters}
                aria-controls="articles-filter-panel"
              >
                <SlidersHorizontal size={16} />
                筛选
                {activeFilterCount > 0 ? (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[11px]',
                    showFilters || activeFilterCount ? 'bg-white text-[var(--reader-ink)]' : 'bg-[var(--reader-green)] text-white',
                  )}
                  >
                    {activeFilterCount}
                  </span>
                ) : null}
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <label className="min-w-[160px]">
                <span className="sr-only">排序</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as ArticleSortMode)}
                  className="w-full rounded-2xl border border-[var(--reader-line)] bg-[rgba(255,255,255,0.82)] px-4 py-4 text-sm text-[var(--reader-ink)] outline-none transition focus:border-[var(--reader-green)]"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">当前视图</span>
            {query ? (
              <span className="rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                搜索：{query}
              </span>
            ) : null}
            {mode !== 'all' ? (
              <span className="rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                {MODE_OPTIONS.find(option => option.value === mode)?.label}
              </span>
            ) : null}
            {category ? (
              <span className="rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                分类：{category}
              </span>
            ) : null}
            {tag ? (
              <span className="rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                标签：#{tag}
              </span>
            ) : null}
            {activeFilterCount > 0 || query ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)] transition hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]"
              >
                <X size={12} />
                清空
              </button>
            ) : null}
          </div>

          <div
            id="articles-filter-panel"
            data-state={showFilters ? 'open' : 'closed'}
            className="filter-panel mt-5"
            aria-hidden={!showFilters}
          >
            <div className="filter-panel-inner">
              <div className="filter-panel-shards" aria-hidden="true">
                {FILTER_SHARDS.map(shard => (
                  <span
                    key={shard.index}
                    className={cn('filter-panel-shard', shard.flipped ? 'is-flipped' : 'is-straight')}
                    style={{
                      ['--filter-delay' as string]: `${shard.diagonal * 28 + (shard.index % 2) * 10}ms`,
                      ['--filter-delay-reverse' as string]: `${shard.reverseDiagonal * 20}ms`,
                    }}
                  />
                ))}
              </div>

              <div className={cn('filter-panel-content', !showFilters && 'pointer-events-none')}>
                <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">内容模式</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {MODE_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => applyMode(option.value)}
                          className={cn(
                            'rounded-2xl border px-4 py-3 text-left transition',
                            mode === option.value
                              ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_12px_24px_rgba(36,39,34,0.18)]'
                              : 'border-[var(--reader-line)] bg-white/90 text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                          )}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className={cn('mt-1 text-xs leading-5', mode === option.value ? 'text-white/75' : '')}>
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">主题分类</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm transition',
                          !category
                            ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_8px_18px_rgba(36,39,34,0.14)]'
                            : 'border-[var(--reader-line)] bg-white/90 text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                        )}
                      >
                        全部分类
                      </button>
                      {topCategories.map(item => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => applyCategory(item.value)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm transition',
                            category === item.value
                              ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_8px_18px_rgba(36,39,34,0.14)]'
                              : 'border-[var(--reader-line)] bg-white/90 text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                          )}
                        >
                          {item.value} · {item.count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {topTags.length > 0 ? (
                  <div className="mt-5">
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--reader-ink-secondary)]">高频标签</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTag('')}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition',
                          !tag
                            ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_8px_18px_rgba(36,39,34,0.14)]'
                            : 'border-[var(--reader-line)] bg-white/90 text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                        )}
                      >
                        全部标签
                      </button>
                      {topTags.map(item => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => applyTag(item.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs transition',
                            tag === item.value
                              ? 'border-[var(--reader-ink)] bg-[var(--reader-ink)] text-white shadow-[0_8px_18px_rgba(36,39,34,0.14)]'
                              : 'border-[var(--reader-line)] bg-white/90 text-[var(--reader-ink-secondary)] hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]',
                          )}
                        >
                          #{item.value} · {item.count}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {shouldShowFeaturedReport ? (
          <section className="mb-10 rounded-[32px] border border-[var(--reader-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,247,242,0.92))] p-6 shadow-[0_18px_48px_rgba(36,39,34,0.06)] lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-700">
                  <FileText size={12} />
                  推荐报告
                </div>
                <h2 className="mt-4 font-oswald text-3xl font-light text-[var(--reader-ink)]">先看这篇</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--reader-ink-secondary)]">
                  如果你现在的目标是先抓重点，再决定要不要深读，这篇会是更高效的入口。
                </p>
              </div>
              <Link
                to={`/articles/${featuredReport?.slug}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
              >
                直接阅读
                <ArrowRight size={16} />
              </Link>
            </div>
            {featuredReport ? <ArticleCard article={featuredReport} size="large" /> : null}
          </section>
        ) : null}

        <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[var(--reader-ink-secondary)]">
            {isLoading
              ? '正在整理内容...'
              : `找到 ${filteredArticles.length} 篇内容${activeFilterCount ? `，已启用 ${activeFilterCount} 个筛选条件` : ''}`}
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--reader-line)] border-t-[var(--reader-green)]" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <section className="rounded-[32px] border border-[var(--reader-line)] bg-white/80 p-10 text-center shadow-[0_16px_40px_rgba(36,39,34,0.05)]">
            <h2 className="font-oswald text-3xl font-light text-[var(--reader-ink)]">没有找到匹配内容</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--reader-ink-secondary)]">
              可以先清空搜索词，或者放宽分类、标签和内容模式。
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--reader-line)] bg-white px-4 py-3 text-sm text-[var(--reader-ink)] transition hover:border-[var(--reader-ink)]"
            >
              <SlidersHorizontal size={16} />
              重置后重看
            </button>
          </section>
        ) : shouldGroupSearchResults ? (
          <>
            <ResultGrid
              title="优先查看报告"
              description="这些结果更适合先抓结论、框架和趋势判断。"
              articles={groupedResults.reportResults}
              query={query}
            />
            <ResultGrid
              title="其他相关文章"
              description="这些内容更偏经验、教程或主题延伸。"
              articles={groupedResults.articleResults}
              query={query}
            />
          </>
        ) : (
          <ResultGrid
            title={mode === 'report' ? '报告列表' : mode === 'article' ? '文章列表' : '全部内容'}
            description={query ? '结果已按当前搜索与筛选条件整理。' : '从这里开始找你要读的内容。'}
            articles={filteredArticles}
            query={query}
          />
        )}
      </div>
    </div>
  );
};

export default ArticlesListPage;
