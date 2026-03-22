/**
 * 文章数据服务
 *
 * 提供文章数据的统一管理，包括：
 * - 数据加载和持久化
 * - 高级搜索功能
 * - 文章CRUD操作
 * - 统计信息计算
 */

import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import { latestArticlesConfig } from '@/config';
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

/**
 * 本地存储键名
 */
const STORAGE_KEYS = {
  ARTICLES: 'techink_articles',
  ARTICLE_COUNTER: 'techink_article_counter',
} as const;

/**
 * 默认搜索选项
 */
const DEFAULT_SEARCH_OPTIONS: IFuseOptions<Article> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'subtitle', weight: 1.5 },
    { name: 'content', weight: 1 },
    { name: 'excerpt', weight: 1 },
    { name: 'category', weight: 1 },
    { name: 'author', weight: 0.5 },
    { name: 'tags', weight: 1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
};

/**
 * 文章数据服务类
 */
class ArticleService {
  private articles: Article[] = [];
  private fuse?: Fuse<Article>;
  private nextId = 1;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private initialize(): void {
    this.loadArticles();
    this.initializeSearchIndex();
  }

  /**
   * 加载文章数据
   * 优先从本地存储加载，如果没有则使用配置的初始数据
   */
  private loadArticles(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.articles = parsed;
          console.log(`从本地存储加载 ${this.articles.length} 篇文章`);
          return;
        }
      }
    } catch (error) {
      console.warn('本地存储数据解析失败，使用初始数据', error);
    }

    // 使用配置的初始数据
    this.articles = this.transformConfigArticles(latestArticlesConfig.articles);
    console.log(`使用初始配置数据 ${this.articles.length} 篇文章`);

    // 保存到本地存储
    this.saveArticles();
  }

  /**
   * 转换配置文章为服务文章格式
   */
  private transformConfigArticles(configArticles: any[]): Article[] {
    return configArticles.map(article => ({
      ...article,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  /**
   * 保存文章到本地存储
   */
  private saveArticles(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(this.articles));
    } catch (error) {
      console.error('保存文章到本地存储失败:', error);
    }
  }

  /**
   * 初始化搜索索引
   */
  private initializeSearchIndex(): void {
    this.fuse = new Fuse(this.articles, DEFAULT_SEARCH_OPTIONS);
  }

  /**
   * 获取下一篇文章ID
   */
  private getNextId(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ARTICLE_COUNTER);
      if (stored) {
        this.nextId = parseInt(stored, 10) + 1;
      }
    } catch (error) {
      console.warn('获取文章计数器失败:', error);
    }

    localStorage.setItem(STORAGE_KEYS.ARTICLE_COUNTER, this.nextId.toString());
    return this.nextId++;
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): ArticleServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 创建错误响应
   */
  private errorResponse(code: string, message: string, details?: unknown): ArticleServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  /**
   * 验证文章数据
   */
  private validateArticleData(data: CreateArticleData): string | null {
    if (!data.title?.trim()) {
      return '文章标题不能为空';
    }
    if (!data.subtitle?.trim()) {
      return '文章副标题不能为空';
    }
    if (!data.content?.trim()) {
      return '文章内容不能为空';
    }
    if (!data.author?.trim()) {
      return '作者不能为空';
    }
    if (!data.category?.trim()) {
      return '文章分类不能为空';
    }
    return null;
  }

  // ==================== 公开API ====================

  /**
   * 获取所有文章
   */
  async getAllArticles(): Promise<ArticleServiceResponse<Article[]>> {
    try {
      return this.successResponse([...this.articles]);
    } catch (error) {
      return this.errorResponse('GET_ALL_ERROR', '获取文章列表失败', error);
    }
  }

  /**
   * 根据ID获取文章
   */
  async getArticleById(id: number): Promise<ArticleServiceResponse<Article>> {
    try {
      const article = this.articles.find(a => a.id === id);
      if (!article) {
        return this.errorResponse('NOT_FOUND', `ID为 ${id} 的文章不存在`);
      }
      return this.successResponse(article);
    } catch (error) {
      return this.errorResponse('GET_BY_ID_ERROR', '获取文章失败', error);
    }
  }

  /**
   * 根据slug获取文章
   */
  async getArticleBySlug(slug: string): Promise<ArticleServiceResponse<Article>> {
    try {
      const article = this.articles.find(a => a.slug === slug);
      if (!article) {
        // 尝试将slug解析为ID
        const id = parseInt(slug, 10);
        if (!isNaN(id)) {
          return this.getArticleById(id);
        }
        return this.errorResponse('NOT_FOUND', `slug为 "${slug}" 的文章不存在`);
      }
      return this.successResponse(article);
    } catch (error) {
      return this.errorResponse('GET_BY_SLUG_ERROR', '获取文章失败', error);
    }
  }

  /**
   * 搜索文章
   */
  async searchArticles(params: SearchArticlesParams): Promise<ArticleServiceResponse<SearchArticlesResult>> {
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

      let results = [...this.articles];

      // 文本搜索
      if (query.trim() && this.fuse) {
        const searchResults = this.fuse.search(query.trim());
        results = searchResults.map(result => result.item);
      }

      // 分类筛选
      if (category) {
        results = results.filter(article =>
          article.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      // 作者筛选
      if (author) {
        results = results.filter(article =>
          article.author?.toLowerCase().includes(author.toLowerCase())
        );
      }

      // 标签筛选
      if (tags && tags.length > 0) {
        results = results.filter(article =>
          tags.every(tag => article.tags?.includes(tag))
        );
      }

      // 排序
      switch (sortBy) {
        case 'newest':
          results.sort((a, b) => {
            const dateA = a.publishDate ? new Date(a.publishDate).getTime() : a.createdAt || 0;
            const dateB = b.publishDate ? new Date(b.publishDate).getTime() : b.createdAt || 0;
            return dateB - dateA;
          });
          break;
        case 'oldest':
          results.sort((a, b) => {
            const dateA = a.publishDate ? new Date(a.publishDate).getTime() : a.createdAt || 0;
            const dateB = b.publishDate ? new Date(b.publishDate).getTime() : b.createdAt || 0;
            return dateA - dateB;
          });
          break;
        case 'title':
          results.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'readTime':
          results.sort((a, b) => (a.readTime || 0) - (b.readTime || 0));
          break;
      }

      // 分页
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, total);
      const paginatedResults = results.slice(startIndex, endIndex);

      return this.successResponse({
        articles: paginatedResults,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      return this.errorResponse('SEARCH_ERROR', '搜索文章失败', error);
    }
  }

  /**
   * 创建新文章
   */
  async createArticle(data: CreateArticleData): Promise<ArticleServiceResponse<Article>> {
    try {
      // 验证数据
      const validationError = this.validateArticleData(data);
      if (validationError) {
        return this.errorResponse('VALIDATION_ERROR', validationError);
      }

      // 生成slug
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, '');

      // 检查slug是否已存在并确定最终slug
      let finalSlug = slug;
      const existingSlug = this.articles.find(a => a.slug === slug);
      if (existingSlug) {
        // 如果slug已存在，添加时间戳
        finalSlug = `${slug}-${Date.now()}`;
      }

      // 创建文章对象
      const now = Date.now();
      const article: Article = {
        id: this.getNextId(),
        title: data.title.trim(),
        subtitle: data.subtitle.trim(),
        content: data.content.trim(),
        author: data.author.trim(),
        category: data.category.trim(),
        tags: data.tags || [],
        image: data.image || '/images/article-default.jpg',
        excerpt: data.excerpt || data.content.trim().substring(0, 150) + '...',
        readTime: data.readTime || Math.ceil(data.content.trim().length / 500), // 假设500字/分钟
        publishDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        slug: finalSlug,
        createdAt: now,
        updatedAt: now,
      };

      // 添加到列表
      this.articles.unshift(article); // 新文章放在最前面

      // 更新搜索索引
      this.initializeSearchIndex();

      // 保存到本地存储
      this.saveArticles();

      return this.successResponse(article);
    } catch (error) {
      return this.errorResponse('CREATE_ERROR', '创建文章失败', error);
    }
  }

  /**
   * 更新文章
   */
  async updateArticle(data: UpdateArticleData): Promise<ArticleServiceResponse<Article>> {
    try {
      const index = this.articles.findIndex(a => a.id === data.id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', `ID为 ${data.id} 的文章不存在`);
      }

      // 验证数据
      if (data.title && !data.title.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '文章标题不能为空');
      }
      if (data.subtitle && !data.subtitle.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '文章副标题不能为空');
      }
      if (data.content && !data.content.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '文章内容不能为空');
      }

      // 更新文章
      const updatedArticle = {
        ...this.articles[index],
        ...data,
        updatedAt: Date.now(),
      };

      // 如果标题更新，重新生成slug
      if (data.title && data.title !== this.articles[index].title) {
        const newSlug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-|-$/g, '');

        // 检查slug是否已存在（排除自己）
        const existingSlug = this.articles.find((a, i) => i !== index && a.slug === newSlug);
        if (existingSlug) {
          // 如果slug已存在，添加时间戳
          updatedArticle.slug = `${newSlug}-${Date.now()}`;
        } else {
          updatedArticle.slug = newSlug;
        }
      }

      this.articles[index] = updatedArticle;

      // 更新搜索索引
      this.initializeSearchIndex();

      // 保存到本地存储
      this.saveArticles();

      return this.successResponse(updatedArticle);
    } catch (error) {
      return this.errorResponse('UPDATE_ERROR', '更新文章失败', error);
    }
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: number): Promise<ArticleServiceResponse<void>> {
    try {
      const index = this.articles.findIndex(a => a.id === id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', `ID为 ${id} 的文章不存在`);
      }

      this.articles.splice(index, 1);

      // 更新搜索索引
      this.initializeSearchIndex();

      // 保存到本地存储
      this.saveArticles();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse('DELETE_ERROR', '删除文章失败', error);
    }
  }

  /**
   * 获取文章统计信息
   */
  async getStats(): Promise<ArticleServiceResponse<ArticleStats>> {
    try {
      const categoriesMap = new Map<string, number>();
      const authorsMap = new Map<string, number>();

      let latestDate = 0;

      this.articles.forEach(article => {
        // 统计分类
        const categoryCount = categoriesMap.get(article.category) || 0;
        categoriesMap.set(article.category, categoryCount + 1);

        // 统计作者
        if (article.author) {
          const authorCount = authorsMap.get(article.author) || 0;
          authorsMap.set(article.author, authorCount + 1);
        }

        // 查找最新文章日期
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

      const stats: ArticleStats = {
        totalArticles: this.articles.length,
        totalCategories: categoriesMap.size,
        totalAuthors: authorsMap.size,
        categories,
        authors,
        latestArticleDate: latestDate ? new Date(latestDate).toISOString().split('T')[0] : undefined,
      };

      return this.successResponse(stats);
    } catch (error) {
      return this.errorResponse('STATS_ERROR', '获取统计信息失败', error);
    }
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<ArticleServiceResponse<string[]>> {
    try {
      const categories = [...new Set(this.articles.map(a => a.category))];
      return this.successResponse(categories);
    } catch (error) {
      return this.errorResponse('CATEGORIES_ERROR', '获取分类列表失败', error);
    }
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<ArticleServiceResponse<string[]>> {
    try {
      const allTags = this.articles.flatMap(a => a.tags || []);
      const uniqueTags = [...new Set(allTags)];
      return this.successResponse(uniqueTags);
    } catch (error) {
      return this.errorResponse('TAGS_ERROR', '获取标签列表失败', error);
    }
  }

  /**
   * 获取相关文章（基于标签匹配）
   */
  async getRelatedArticles(articleId: number, limit = 3): Promise<ArticleServiceResponse<Article[]>> {
    try {
      const article = this.articles.find(a => a.id === articleId);
      if (!article) {
        return this.errorResponse('NOT_FOUND', `ID为 ${articleId} 的文章不存在`);
      }

      const articleTags = new Set(article.tags || []);

      // 计算相似度分数
      const scoredArticles = this.articles
        .filter(a => a.id !== articleId) // 排除自己
        .map(otherArticle => {
          const otherTags = new Set(otherArticle.tags || []);

          // 计算Jaccard相似度
          const intersection = [...articleTags].filter(tag => otherTags.has(tag)).length;
          const union = articleTags.size + otherTags.size - intersection;
          const similarity = union === 0 ? 0 : intersection / union;

          return { article: otherArticle, similarity };
        })
        .filter(item => item.similarity > 0) // 只保留有相似标签的
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.article);

      return this.successResponse(scoredArticles);
    } catch (error) {
      return this.errorResponse('RELATED_ERROR', '获取相关文章失败', error);
    }
  }
}

// 创建单例实例
export const articleService = new ArticleService();