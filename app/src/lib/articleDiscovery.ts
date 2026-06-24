import type { Article } from '@/services/articles.types';
import type { MarkdownDocument } from '@/services/reader.types';
import { highlightMatch, simpleSearch } from '@/lib/search';

export type ArticleViewMode = 'all' | 'report' | 'article';
export type ArticleSortMode = 'relevance' | 'newest' | 'oldest' | 'readTime' | 'title';

export interface ArticleDiscoveryFilters {
  query: string;
  category: string;
  tag: string;
  mode: ArticleViewMode;
  sort: ArticleSortMode;
}

export interface ArticleDiscoveryStats {
  total: number;
  reportCount: number;
  articleCount: number;
  categories: Array<{ value: string; count: number }>;
  tags: Array<{ value: string; count: number }>;
}

export interface ArticleSearchPresentation {
  titleHtml: string;
  subtitleHtml: string;
  excerptHtml: string;
  matchLabel: string | null;
}

export interface ArticleReaderGuide {
  audience: string;
  outcome: string;
  recommendedSections: string[];
}

export interface RelatedArticleReason {
  article: Article;
  reason: string;
}

const REPORT_KEYWORDS = [
  '报告',
  '白皮书',
  '研究',
  '趋势',
  '洞察',
  '观察',
  '分析',
  '年报',
  '月报',
  '季报',
  'review',
  'report',
  'insight',
  'analysis',
  'trend',
  'research',
  'survey',
];

const MATCH_LABELS: Record<string, string> = {
  title: '标题命中',
  subtitle: '副标题命中',
  excerpt: '摘要命中',
  content: '正文命中',
  author: '作者命中',
  category: '分类命中',
  tags: '标签命中',
};

function normalizeText(value?: string): string {
  return value?.toLowerCase().trim() || '';
}

function getArticleTimestamp(article: Article): number {
  if (article.publishDate) {
    const publishTime = new Date(article.publishDate).getTime();
    if (!Number.isNaN(publishTime)) return publishTime;
  }
  return article.createdAt || 0;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function containsAnyTerm(source: string | undefined, query: string): boolean {
  const normalizedSource = normalizeText(source);
  if (!normalizedSource || !query.trim()) return false;
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some(term => normalizedSource.includes(term));
}

function buildSnippet(source: string, query: string, maxLength = 120): string {
  const normalizedSource = source.replace(/\s+/g, ' ').trim();
  if (!normalizedSource) return '';
  if (!query.trim()) return truncateText(normalizedSource, maxLength);

  const lowerSource = normalizedSource.toLowerCase();
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const firstIndex = searchTerms
    .map(term => lowerSource.indexOf(term))
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstIndex === undefined) {
    return truncateText(normalizedSource, maxLength);
  }

  const start = Math.max(0, firstIndex - 24);
  const end = Math.min(normalizedSource.length, start + maxLength);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalizedSource.length ? '...' : '';
  return `${prefix}${normalizedSource.slice(start, end).trim()}${suffix}`;
}

export function isReportArticle(article: Article): boolean {
  const text = [
    article.title,
    article.subtitle,
    article.category,
    article.excerpt,
    article.content,
    ...(article.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return REPORT_KEYWORDS.some(keyword => text.includes(keyword));
}

export function buildArticleDiscoveryStats(articles: Article[]): ArticleDiscoveryStats {
  const categoryMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  let reportCount = 0;

  articles.forEach(article => {
    if (isReportArticle(article)) {
      reportCount += 1;
    }

    const category = article.category?.trim();
    if (category) {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    article.tags?.forEach(tag => {
      const normalizedTag = tag.trim();
      if (!normalizedTag) return;
      tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
    });
  });

  const byCountThenName = (a: [string, number], b: [string, number]) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], 'zh-CN');
  };

  return {
    total: articles.length,
    reportCount,
    articleCount: articles.length - reportCount,
    categories: Array.from(categoryMap.entries()).sort(byCountThenName).map(([value, count]) => ({ value, count })),
    tags: Array.from(tagMap.entries()).sort(byCountThenName).map(([value, count]) => ({ value, count })),
  };
}

export function discoverArticles(articles: Article[], filters: ArticleDiscoveryFilters): Article[] {
  const query = filters.query.trim();

  let result = query
    ? simpleSearch(
        articles,
        query,
        ['title', 'subtitle', 'category', 'excerpt', 'author', 'tags', 'content'],
        { minMatchScore: 0.2, includeAllMatches: true },
      ).map(entry => entry.item)
    : [...articles];

  if (filters.mode !== 'all') {
    result = result.filter(article => (filters.mode === 'report' ? isReportArticle(article) : !isReportArticle(article)));
  }

  if (filters.category) {
    result = result.filter(article => article.category === filters.category);
  }

  if (filters.tag) {
    result = result.filter(article => article.tags?.includes(filters.tag));
  }

  const sortMode = query && filters.sort === 'relevance'
    ? 'relevance'
    : filters.sort === 'relevance'
      ? 'newest'
      : filters.sort;

  switch (sortMode) {
    case 'oldest':
      result.sort((a, b) => getArticleTimestamp(a) - getArticleTimestamp(b));
      break;
    case 'readTime':
      result.sort((a, b) => (b.readTime || 0) - (a.readTime || 0) || getArticleTimestamp(b) - getArticleTimestamp(a));
      break;
    case 'title':
      result.sort((a, b) => normalizeText(a.title).localeCompare(normalizeText(b.title), 'zh-CN'));
      break;
    case 'relevance':
      break;
    case 'newest':
    default:
      result.sort((a, b) => getArticleTimestamp(b) - getArticleTimestamp(a));
      break;
  }

  return result;
}

export function buildArticleSearchPresentation(article: Article, query: string): ArticleSearchPresentation {
  const trimmedQuery = query.trim();
  const matchResult = trimmedQuery
    ? simpleSearch(
        [article],
        trimmedQuery,
        ['title', 'subtitle', 'category', 'excerpt', 'author', 'tags', 'content'],
        { minMatchScore: 0.2, includeAllMatches: true },
      )[0]
    : undefined;

  const fallbackField =
    containsAnyTerm(article.title, trimmedQuery) ? 'title'
      : containsAnyTerm(article.subtitle, trimmedQuery) ? 'subtitle'
        : containsAnyTerm(article.excerpt, trimmedQuery) ? 'excerpt'
          : containsAnyTerm(article.content, trimmedQuery) ? 'content'
            : containsAnyTerm(article.author, trimmedQuery) ? 'author'
              : containsAnyTerm(article.category, trimmedQuery) ? 'category'
                : article.tags?.some(tag => containsAnyTerm(tag, trimmedQuery)) ? 'tags'
                  : '';

  const matchedField = matchResult?.matches?.[0]?.key || fallbackField;
  const snippetSource =
    matchedField === 'content'
      ? article.content || article.excerpt || article.subtitle || ''
      : matchedField === 'author'
        ? `作者：${article.author || ''}`
        : matchedField === 'tags'
          ? `标签：${(article.tags || []).join(' / ')}`
          : matchedField === 'category'
            ? `分类：${article.category}`
            : article.excerpt || article.subtitle || article.content || '';

  return {
    titleHtml: highlightMatch(article.title, trimmedQuery, 'reader-search-highlight'),
    subtitleHtml: highlightMatch(article.subtitle || '', trimmedQuery, 'reader-search-highlight'),
    excerptHtml: highlightMatch(buildSnippet(snippetSource, trimmedQuery), trimmedQuery, 'reader-search-highlight'),
    matchLabel: matchedField ? MATCH_LABELS[matchedField] || '内容命中' : null,
  };
}

export function buildArticleReaderGuide(article: Article, document?: MarkdownDocument | null): ArticleReaderGuide {
  const reportLike = isReportArticle(article);
  const sections = document?.summary.sectionTitles || [];
  const readTime = document?.readingTime || article.readTime || 5;

  return {
    audience: reportLike
      ? '适合想快速抓住趋势、结论和研究框架的读者。'
      : '适合想系统理解主题、跟着正文逐步展开的读者。',
    outcome: reportLike
      ? `读完后，你应该能带走这篇报告的核心判断，以及 ${readTime} 分钟内最值得吸收的几条结论。`
      : '读完后，你应该能带走这篇文章的主要思路、关键概念和一条可执行的实践线索。',
    recommendedSections: sections.slice(0, reportLike ? 3 : 2),
  };
}

export function buildRelatedArticles(current: Article, allArticles: Article[], limit = 3): RelatedArticleReason[] {
  const currentTags = new Set(current.tags || []);
  const currentIsReport = isReportArticle(current);

  return allArticles
    .filter(article => article.id !== current.id || article.slug !== current.slug)
    .map(article => {
      const sharedTags = (article.tags || []).filter(tag => currentTags.has(tag));
      const sameCategory = article.category === current.category;
      const sameFormat = isReportArticle(article) === currentIsReport;
      const score = sharedTags.length * 3 + (sameCategory ? 2 : 0) + (sameFormat ? 1 : 0);

      let reason = '值得继续阅读';
      if (sharedTags.length > 0) {
        reason = `同标签：${sharedTags.slice(0, 2).join(' / ')}`;
      } else if (sameCategory) {
        reason = `同分类：${article.category}`;
      } else if (sameFormat) {
        reason = currentIsReport ? '同为报告型内容' : '同为文章型内容';
      }

      return { article, reason, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || getArticleTimestamp(b.article) - getArticleTimestamp(a.article))
    .slice(0, limit)
    .map(({ article, reason }) => ({ article, reason }));
}
