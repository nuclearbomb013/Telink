/**
 * 文章投稿服务
 * 使用后端 API 存储用户投稿的文章，localStorage 仅用于草稿缓存
 */

import type { Article, CreateArticleData } from './articles.types';
import { articleApi, type ArticleApiResponse } from '@/lib/apiClient';

// Storage key for article drafts (offline cache)
const DRAFT_KEY = 'techink_article_draft';

/**
 * 将后端 API 响应转换为前端 Article 类型
 */
function apiToArticle(api: ArticleApiResponse): Article {
  const date = api.published_at ? new Date(api.published_at) : new Date(api.created_at);
  return {
    id: api.id,
    title: api.title,
    subtitle: api.subtitle || '',
    image: api.cover_image || '',
    category: api.category,
    content: api.content,
    excerpt: api.excerpt,
    author: api.author_name,
    publishDate: date.toISOString().split('T')[0],
    tags: api.tags,
    slug: api.slug,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * 获取所有已发布的投稿文章（从后端 API）
 */
export async function getSubmittedArticles(): Promise<Article[]> {
  try {
    const response = await articleApi.getArticles({ limit: 100 });
    if (response.success && response.data) {
      return response.data.articles.map(apiToArticle);
    }
    return [];
  } catch (error) {
    console.error('Error fetching submitted articles:', error);
    return [];
  }
}

/**
 * 根据 slug 或 ID 获取投稿文章（从后端 API）
 */
export async function getSubmittedArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const response = await articleApi.getArticleBySlug(slug);
    if (response.success && response.data) {
      return apiToArticle(response.data);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 提交新文章到后端
 */
export async function submitArticle(data: CreateArticleData): Promise<Article> {
  const response = await articleApi.createArticle({
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    cover_image: data.image || undefined,
    excerpt: data.excerpt || data.subtitle || undefined,
    subtitle: data.subtitle || undefined,
    status: 'published',
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '投稿失败');
  }

  // 清除草稿缓存
  clearDraft();

  return apiToArticle(response.data);
}

/**
 * 保存草稿到后端
 */
export async function saveDraft(data: Partial<CreateArticleData>): Promise<Article | null> {
  if (!data.title || !data.content) return null;

  const response = await articleApi.createArticle({
    title: data.title,
    content: data.content,
    category: data.category || 'frontend',
    tags: data.tags || [],
    cover_image: data.image || undefined,
    excerpt: data.excerpt || data.subtitle || undefined,
    subtitle: data.subtitle || undefined,
    status: 'draft',
  });

  if (!response.success || !response.data) {
    return null;
  }

  return apiToArticle(response.data);
}

/**
 * 更新投稿文章
 */
export async function updateSubmittedArticle(id: number, updates: Partial<CreateArticleData>): Promise<Article | null> {
  const response = await articleApi.updateArticle(id, {
    title: updates.title,
    content: updates.content,
    category: updates.category,
    tags: updates.tags,
    cover_image: updates.image,
    excerpt: updates.excerpt,
    subtitle: updates.subtitle,
  });

  if (!response.success || !response.data) {
    return null;
  }

  return apiToArticle(response.data);
}

/**
 * 删除投稿文章
 */
export async function deleteSubmittedArticle(id: number): Promise<boolean> {
  const response = await articleApi.deleteArticle(id);
  return response.success;
}

/**
 * 获取投稿文章总数
 */
export async function getSubmittedArticleCount(): Promise<number> {
  try {
    const response = await articleApi.getArticles({ limit: 1 });
    if (response.success && response.data) {
      return response.data.total;
    }
    return 0;
  } catch {
    return 0;
  }
}

// ==================== 草稿本地缓存（防丢失） ====================

export interface DraftData {
  title: string;
  subtitle: string;
  author: string;
  category: string;
  content: string;
  tags: string;
  coverImage: string;
  savedAt: number;
}

/**
 * 保存草稿到 localStorage（防丢失缓存）
 */
export function saveDraftToLocal(data: Omit<DraftData, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const draft: DraftData = { ...data, savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Error saving draft:', error);
  }
}

/**
 * 从 localStorage 恢复草稿
 */
export function loadDraftFromLocal(): DraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data) as DraftData;
  } catch {
    return null;
  }
}

/**
 * 清除草稿缓存
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

/**
 * 检查是否有未恢复的草稿
 */
export function hasDraft(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(DRAFT_KEY);
}

// ==================== 向后兼容（同步 API 的旧调用方） ====================
// 以下函数保持同步签名，返回空数组/null，引导调用方迁移到异步版本

/**
 * @deprecated 使用异步版本 getSubmittedArticles()
 */
export function getSubmittedArticlesSync(): Article[] {
  return [];
}
