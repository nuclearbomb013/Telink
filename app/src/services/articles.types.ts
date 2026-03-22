/**
 * 文章相关类型定义
 * 集中管理所有与文章相关的TypeScript类型
 */

/**
 * 文章基础信息
 */
export interface Article {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  /** 文章内容（Markdown格式） */
  content?: string;
  /** 文章摘要，用于列表显示 */
  excerpt?: string;
  /** 作者名称 */
  author?: string;
  /** 发布日期（YYYY-MM-DD格式） */
  publishDate?: string;
  /** 阅读时间（分钟） */
  readTime?: number;
  /** 标签数组 */
  tags?: string[];
  /** URL友好标识符 */
  slug?: string;
  /** 创建时间戳 */
  createdAt?: number;
  /** 更新时间戳 */
  updatedAt?: number;
}

/**
 * 文章创建数据（用于投稿）
 */
export interface CreateArticleData {
  title: string;
  subtitle: string;
  content: string;
  author: string;
  category: string;
  tags?: string[];
  /** 封面图片 URL (base64 或外部链接) */
  image?: string;
  excerpt?: string;
  readTime?: number;
}

/**
 * 文章更新数据
 */
export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: number;
}

/**
 * 文章搜索参数
 */
export interface SearchArticlesParams {
  query?: string;
  category?: string;
  author?: string;
  tags?: string[];
  sortBy?: 'newest' | 'oldest' | 'title' | 'readTime';
  page?: number;
  limit?: number;
}

/**
 * 文章搜索结果
 */
export interface SearchArticlesResult {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 文章服务错误类型
 */
export interface ArticleServiceError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 文章服务响应包装
 */
export interface ArticleServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ArticleServiceError;
  timestamp: number;
}

/**
 * 文章分类统计
 */
export interface CategoryStats {
  category: string;
  count: number;
}

/**
 * 作者统计
 */
export interface AuthorStats {
  author: string;
  count: number;
}

/**
 * 文章服务统计信息
 */
export interface ArticleStats {
  totalArticles: number;
  totalCategories: number;
  totalAuthors: number;
  categories: CategoryStats[];
  authors: AuthorStats[];
  latestArticleDate?: string;
}

/**
 * 搜索高亮结果
 */
export interface SearchHighlight {
  field: string;
  matches: Array<{
    text: string;
    indices: [number, number];
  }>;
}