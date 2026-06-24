/**
 * 文章数据服务
 *
 * NOW BACKED BY REAL BACKEND API (no more localStorage).
 * All article CRUD goes through the backend via articleApi.
 * Client-side aggregation (stats, related) computed from API responses.
 */

import { articleApi, type ArticleApiResponse, type ArticleApiData } from '@/lib/apiClient';
import type {
  Article,
  CreateArticleData,
  UpdateArticleData,
  SearchArticlesParams,
  SearchArticlesResult,
  ArticleServiceResponse,
  ArticleStats,
  CategoryStats,
  AuthorStats,
} from './articles.types';

// ==================== Data Transformation ====================

/**
 * Convert backend ArticleApiResponse (snake_case) to frontend Article (camelCase).
 */
function apiToArticle(api: ArticleApiResponse): Article {
  const date = api.published_at
    ? new Date(api.published_at)
    : new Date(api.created_at);

  const content = api.content || '';

  return {
    id: api.id,
    title: api.title,
    subtitle: api.subtitle || '',
    image: api.cover_image || '',
    category: api.category,
    content,
    excerpt: api.excerpt,
    author: api.author_name,
    publishDate: date.toISOString().split('T')[0],
    readTime: Math.ceil(content.length / 500), // ~500 chars/min
    tags: api.tags,
    slug: api.slug,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Convert frontend CreateArticleData (camelCase) to backend format.
 */
function toApiData(data: CreateArticleData | UpdateArticleData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if ('title' in data && data.title !== undefined) result.title = data.title;
  if ('subtitle' in data && data.subtitle !== undefined) result.subtitle = data.subtitle;
  if ('content' in data && data.content !== undefined) result.content = data.content;
  if ('category' in data && data.category !== undefined) result.category = data.category;
  if ('tags' in data && data.tags !== undefined) result.tags = data.tags;
  if ('image' in data && data.image !== undefined) result.cover_image = data.image;
  if ('excerpt' in data && data.excerpt !== undefined) result.excerpt = data.excerpt;
  return result;
}

// ==================== Response Helpers ====================

function successResponse<T>(data: T): ArticleServiceResponse<T> {
  return { success: true, data, timestamp: Date.now() };
}

function errorResponse(code: string, message: string, details?: unknown): ArticleServiceResponse<never> {
  return { success: false, error: { code, message, details }, timestamp: Date.now() };
}

// ==================== In-memory Cache (single page lifetime) ====================

let _cachedArticles: Article[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

async function fetchAllArticles(force = false): Promise<Article[]> {
  if (!force && _cachedArticles && Date.now() - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedArticles;
  }

  // Fetch all pages to ensure client-side filters see the full dataset
  const allArticles: Article[] = [];
  const pageSize = 100;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await articleApi.getArticles({ limit: pageSize, page });
    if (response.success && response.data) {
      allArticles.push(...response.data.articles.map(apiToArticle));
      hasMore = page < response.data.total_pages;
      page++;
    } else {
      break;
    }
  }

  _cachedArticles = allArticles;
  _cacheTimestamp = Date.now();
  return _cachedArticles;
}

// ==================== Public API ====================

/**
 * 获取所有文章
 */
async function getAllArticles(): Promise<ArticleServiceResponse<Article[]>> {
  try {
    const articles = await fetchAllArticles();
    return successResponse([...articles]);
  } catch (error) {
    return errorResponse('GET_ALL_ERROR', '获取文章列表失败', error);
  }
}

/**
 * 根据ID获取文章
 */
async function getArticleById(id: number): Promise<ArticleServiceResponse<Article>> {
  try {
    const response = await articleApi.getArticleById(id);
    if (response.success && response.data) {
      return successResponse(apiToArticle(response.data));
    }
    return errorResponse('NOT_FOUND', `ID为 ${id} 的文章不存在`);
  } catch (error) {
    return errorResponse('GET_BY_ID_ERROR', '获取文章失败', error);
  }
}

/**
 * 根据slug获取文章
 */
async function getArticleBySlug(slug: string): Promise<ArticleServiceResponse<Article>> {
  try {
    // Try slug first
    const response = await articleApi.getArticleBySlug(slug);
    if (response.success && response.data) {
      return successResponse(apiToArticle(response.data));
    }
    // Fallback: try as numeric ID
    const id = parseInt(slug, 10);
    if (!isNaN(id)) {
      return getArticleById(id);
    }
    return errorResponse('NOT_FOUND', `slug为 "${slug}" 的文章不存在`);
  } catch (error) {
    return errorResponse('GET_BY_SLUG_ERROR', '获取文章失败', error);
  }
}

/**
 * 搜索文章 (uses backend search + client-side filters)
 *
 * When client-side filters (author, tags, title/readTime sort) are needed,
 * fetches the full dataset first to get accurate totals and pagination.
 * Otherwise delegates directly to backend pagination.
 */
async function searchArticles(params: SearchArticlesParams): Promise<ArticleServiceResponse<SearchArticlesResult>> {
  try {
    const {
      query = '',
      category,
      author,
      tags,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = params;

    // Determine if we need client-side filtering/sorting
    const needsClientSide = !!author || (tags && tags.length > 0)
      || sortBy === 'title' || sortBy === 'readTime';

    let allResults: Article[];

    if (needsClientSide) {
      // Fetch full dataset for accurate client-side filter/sort/pagination
      allResults = await fetchAllArticles(true);

      // Apply text search (server-side did this before, we replicate)
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        allResults = allResults.filter(a =>
          a.title.toLowerCase().includes(q)
          || (a.excerpt && a.excerpt.toLowerCase().includes(q))
          || (a.content && a.content.toLowerCase().includes(q))
          || a.category.toLowerCase().includes(q)
          || (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
        );
      }

      // Category filter
      if (category) {
        allResults = allResults.filter(a =>
          a.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Author filter
      if (author) {
        allResults = allResults.filter(a =>
          a.author?.toLowerCase().includes(author.toLowerCase())
        );
      }

      // Tags filter
      if (tags && tags.length > 0) {
        allResults = allResults.filter(a =>
          tags.every(tag => a.tags?.includes(tag))
        );
      }

      // Client-side sorts
      if (sortBy === 'title') {
        allResults.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'readTime') {
        allResults.sort((a, b) => (a.readTime || 0) - (b.readTime || 0));
      } else if (sortBy === 'oldest') {
        allResults.sort((a, b) => (a.publishDate || '').localeCompare(b.publishDate || ''));
      } else {
        // newest (default)
        allResults.sort((a, b) => {
          const dateA = a.publishDate ? new Date(a.publishDate).getTime() : a.createdAt || 0;
          const dateB = b.publishDate ? new Date(b.publishDate).getTime() : b.createdAt || 0;
          return dateB - dateA;
        });
      }

      // Paginate from full dataset
      const total = allResults.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedResults = allResults.slice(startIndex, startIndex + limit);

      return successResponse({
        articles: paginatedResults,
        total,
        page,
        limit,
        totalPages,
      });
    }

    // Server-side only path: delegate to backend pagination
    const sortByStr = sortBy as string;
    const backendSortBy =
      sortByStr === 'oldest' ? 'oldest' :
      sortByStr === 'popular' ? 'popular' :
      'newest';

    const response = await articleApi.getArticles({
      search: query.trim() || undefined,
      category: category || undefined,
      sortBy: backendSortBy,
      page,
      limit,
    });

    if (!response.success || !response.data) {
      return errorResponse('SEARCH_ERROR', '搜索文章失败');
    }

    const results = response.data.articles.map(apiToArticle);

    return successResponse({
      articles: results,
      total: response.data.total,
      page,
      limit,
      totalPages: response.data.total_pages,
    });
  } catch (error) {
    return errorResponse('SEARCH_ERROR', '搜索文章失败', error);
  }
}

/**
 * 创建新文章
 */
async function createArticle(data: CreateArticleData): Promise<ArticleServiceResponse<Article>> {
  try {
    if (!data.title?.trim()) return errorResponse('VALIDATION_ERROR', '文章标题不能为空');
    if (!data.content?.trim()) return errorResponse('VALIDATION_ERROR', '文章内容不能为空');
    if (!data.category?.trim()) return errorResponse('VALIDATION_ERROR', '文章分类不能为空');

    const response = await articleApi.createArticle({
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category.trim(),
      tags: data.tags || [],
      cover_image: data.image || undefined,
      excerpt: data.excerpt || data.subtitle || undefined,
      subtitle: data.subtitle || undefined,
      status: 'published',
    });

    if (!response.success || !response.data) {
      return errorResponse('CREATE_ERROR', response.error?.message || '创建文章失败');
    }

    // Invalidate cache
    _cachedArticles = null;

    return successResponse(apiToArticle(response.data));
  } catch (error) {
    return errorResponse('CREATE_ERROR', '创建文章失败', error);
  }
}

/**
 * 更新文章
 */
async function updateArticle(data: UpdateArticleData): Promise<ArticleServiceResponse<Article>> {
  try {
    if (!data.id) return errorResponse('VALIDATION_ERROR', '文章ID不能为空');

    const updates = toApiData(data);

    const response = await articleApi.updateArticle(data.id, updates as Partial<ArticleApiData>);

    if (!response.success || !response.data) {
      return errorResponse('UPDATE_ERROR', response.error?.message || '更新文章失败');
    }

    // Invalidate cache
    _cachedArticles = null;

    return successResponse(apiToArticle(response.data));
  } catch (error) {
    return errorResponse('UPDATE_ERROR', '更新文章失败', error);
  }
}

/**
 * 删除文章
 */
async function deleteArticle(id: number): Promise<ArticleServiceResponse<void>> {
  try {
    const response = await articleApi.deleteArticle(id);
    if (!response.success) {
      return errorResponse('DELETE_ERROR', response.error?.message || '删除文章失败');
    }

    // Invalidate cache
    _cachedArticles = null;

    return successResponse(undefined);
  } catch (error) {
    return errorResponse('DELETE_ERROR', '删除文章失败', error);
  }
}

/**
 * 获取文章统计信息 (computed from API data)
 */
async function getStats(): Promise<ArticleServiceResponse<ArticleStats>> {
  try {
    const articles = await fetchAllArticles();

    const categoriesMap = new Map<string, number>();
    const authorsMap = new Map<string, number>();
    let latestDate = 0;

    articles.forEach(article => {
      const categoryCount = categoriesMap.get(article.category) || 0;
      categoriesMap.set(article.category, categoryCount + 1);

      if (article.author) {
        const authorCount = authorsMap.get(article.author) || 0;
        authorsMap.set(article.author, authorCount + 1);
      }

      const articleDate = article.publishDate
        ? new Date(article.publishDate).getTime()
        : article.createdAt || 0;
      latestDate = Math.max(latestDate, articleDate);
    });

    const categories: CategoryStats[] = Array.from(categoriesMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const authors: AuthorStats[] = Array.from(authorsMap.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count);

    return successResponse({
      totalArticles: articles.length,
      totalCategories: categoriesMap.size,
      totalAuthors: authorsMap.size,
      categories,
      authors,
      latestArticleDate: latestDate ? new Date(latestDate).toISOString().split('T')[0] : undefined,
    });
  } catch (error) {
    return errorResponse('STATS_ERROR', '获取统计信息失败', error);
  }
}

/**
 * 获取所有分类
 */
async function getCategories(): Promise<ArticleServiceResponse<string[]>> {
  try {
    const articles = await fetchAllArticles();
    const categories = [...new Set(articles.map(a => a.category))];
    return successResponse(categories);
  } catch (error) {
    return errorResponse('CATEGORIES_ERROR', '获取分类列表失败', error);
  }
}

/**
 * 获取所有标签
 */
async function getTags(): Promise<ArticleServiceResponse<string[]>> {
  try {
    const articles = await fetchAllArticles();
    const allTags = articles.flatMap(a => a.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return successResponse(uniqueTags);
  } catch (error) {
    return errorResponse('TAGS_ERROR', '获取标签列表失败', error);
  }
}

/**
 * 获取相关文章（基于标签 Jaccard 相似度）
 */
async function getRelatedArticles(articleId: number, limit = 3): Promise<ArticleServiceResponse<Article[]>> {
  try {
    const articles = await fetchAllArticles();
    const article = articles.find(a => a.id === articleId);
    if (!article) {
      return errorResponse('NOT_FOUND', `ID为 ${articleId} 的文章不存在`);
    }

    const articleTags = new Set(article.tags || []);

    const scoredArticles = articles
      .filter(a => a.id !== articleId)
      .map(otherArticle => {
        const otherTags = new Set(otherArticle.tags || []);
        const intersection = [...articleTags].filter(tag => otherTags.has(tag)).length;
        const union = articleTags.size + otherTags.size - intersection;
        const similarity = union === 0 ? 0 : intersection / union;
        return { article: otherArticle, similarity };
      })
      .filter(item => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.article);

    return successResponse(scoredArticles);
  } catch (error) {
    return errorResponse('RELATED_ERROR', '获取相关文章失败', error);
  }
}

// ==================== Singleton-compatible Export ====================

/**
 * Article service object — maintains backward compatibility with old class-based API.
 * All methods are async wrappers around the real backend API.
 */
export const articleService = {
  getAllArticles,
  getArticleById,
  getArticleBySlug,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getStats,
  getCategories,
  getTags,
  getRelatedArticles,
};
